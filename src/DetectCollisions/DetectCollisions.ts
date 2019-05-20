import {Component} from "../ECS/Component";
import {Log, Util} from "../Common/Util";
import {Observable} from "../Common/Observer";
import {CollisionMatrix} from "../LagomCollisions/CollisionMatrix";
import {Collisions, Polygon, Body, Result, Circle, Point} from "detect-collisions";
import {LagomType} from "../ECS/LifecycleObject";
import {System} from "../ECS/System";
import {Entity} from "../ECS/Entity";

export class DetectCollisionsSystem extends System
{
    readonly detectSystem: Collisions;
    readonly collisionMatrix: CollisionMatrix;

    constructor(collisionMatrix: CollisionMatrix)
    {
        super();
        this.collisionMatrix = collisionMatrix;
        this.detectSystem = new Collisions();
    }

    onAdded(): void
    {
        super.onAdded();
    }

    update(delta: number): void
    {
        // Move all entities to their new positions
        this.runOnEntities((entity: Entity, collider: DetectCollider) => {

            collider.body.x = entity.transform.x;
            collider.body.y = entity.transform.y;

            // Polygons can rotate
            if (collider.body instanceof Polygon)
            {
                collider.body.angle = entity.transform.angle;
            }
        });

        // We don't need a delta, this is a pure collision checking system. No physics.
        // Allow the system to process the changes.
        this.detectSystem.update();
    }

    types(): LagomType<Component>[]
    {
        return [DetectCollider];
    }

    instanceAt(x: number, y: number, ...layers: number[]): boolean
    {
        // TODO this is dumb, please let there be a better way
        const point = new Point(x, y);
        this.detectSystem.insert(point);
        for (let potential of this.detectSystem.potentials(point))
        {
            const otherComp = (<any>potential).lagom_component;
            if (!layers.includes(otherComp.layer)) continue;

            if (point.collides(potential))
            {
                this.detectSystem.remove(point);
                Log.debug(x, y, true);
                return true;
            }
        }
        this.detectSystem.remove(point);
        Log.debug(x, y, false);
        return false;
    }
}


export class DetectActiveCollisionSystem extends System
{
    private engine!: DetectCollisionsSystem;

    onAdded(): void
    {
        super.onAdded();

        const engine = this.getScene().getSystem<DetectCollisionsSystem>(DetectCollisionsSystem);
        if (engine === null)
        {
            Log.error("DetectActiveCollisionSystem must be added to a Scene after a DetectCollisionsSystem.")
        }
        else
        {
            this.engine = engine;
        }
    }

    types(): LagomType<Component>[]
    {
        return [DetectCollider, DetectActive];
    }

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, collider: DetectCollider) => {

            const collidersLastFrame = collider.collidersLastFrame;
            collider.collidersLastFrame = [];

            const potentials = collider.body.potentials();
            for (let potential of potentials)
            {
                const otherComp = (<any>potential).lagom_component;
                const result = new Result();

                // Check layers, then do actual collision check
                if (this.engine.collisionMatrix.canCollide(collider.layer, otherComp.layer)
                    && collider.body.collides(potential, result))
                {
                    // Continuous collision
                    if (collidersLastFrame.includes(otherComp))
                    {
                        collider.onCollision.trigger(collider, {other: otherComp, result: result});
                    }
                    else
                    {
                        // New collision
                        collider.onCollisionEnter.trigger(collider, {other: otherComp, result: result});
                    }
                    Util.remove(collidersLastFrame, otherComp);
                    collider.collidersLastFrame.push(otherComp);
                    this.engine.detectSystem.update();
                }
            }

            // Trigger the exist event for anything that is no longer colliding
            collidersLastFrame.forEach(val => collider.onCollisionExit.trigger(collider, val));
            this.engine.detectSystem.update();
        });
    }
}

export class DetectActive extends Component
{
}

/**
 * Collider types for this collision system.
 */
export abstract class DetectCollider extends Component
{
    private engine: DetectCollisionsSystem | null = null;
    readonly onCollision: Observable<DetectCollider, { other: DetectCollider, result: Result }> = new Observable();
    readonly onCollisionEnter: Observable<DetectCollider, { other: DetectCollider, result: Result }> = new Observable();
    readonly onCollisionExit: Observable<DetectCollider, DetectCollider> = new Observable();

    collidersLastFrame: DetectCollider[] = [];

    protected constructor(readonly body: Body, readonly layer: number)
    {
        super();
        // Add a backref
        (<any>this.body).lagom_component = this;
    }

    onAdded(): void
    {
        super.onAdded();

        this.engine = this.getEntity().getScene().getSystem(DetectCollisionsSystem);

        if (this.engine == null)
        {
            Log.warn("A DetectCollisionsSystem must be added to the Scene before a DetectCollider is added.");
            return;
        }

        this.engine.detectSystem.insert(this.body);
    }

    onRemoved(): void
    {
        super.onRemoved();

        if (this.engine !== null)
        {
            this.engine.detectSystem.remove(this.body);
        }
    }
}

/**
 * Circle collider type.
 */
export class CircleCollider extends DetectCollider
{
    constructor(xOff: number, yOff: number, radius: number, layer: number)
    {
        super(new Circle(xOff, yOff, radius), layer);
    }

}

/**
 * Point collider type.
 */
export class PointCollider extends DetectCollider
{
    constructor(xOff: number, yOff: number, layer: number)
    {
        super(new Point(xOff, yOff), layer);
    }
}

/**
 * Polygon collider. Please only use convex shapes.
 */
export class PolyCollider extends DetectCollider
{
    constructor(xOff: number, yOff: number, points: number[][], layer: number, rotation: number = 0)
    {
        // NOTE: The order of the points matters, the library is bugged, this function ensures they are anticlockwise.
        super(new Polygon(xOff, yOff, PolyCollider.reorderVertices(points), rotation), layer);
    }

    /**
     * Make sure that vertices are ready to use by the collision library by ensuring their rotation is correct.
     *
     * @param vertices Vertices to reorder.
     * @returns Correctly ordered vertices.
     */
    protected static reorderVertices(vertices: number[][])
    {
        const area = PolyCollider.findArea(vertices);
        if (area < 0)
        {
            vertices.reverse();
        }
        return vertices;
    }

    /**
     * Calculate the area of a polygon. The area will be negative if the points are not given in counter-clockwise
     * order.
     *
     * @param vertices The polygon vertices.
     * @returns The area of the polygon.
     */
    private static findArea(vertices: number[][]): number
    {
        // find bottom right point
        let brIndex = 0;
        for (let i = 1; i < vertices.length; ++i)
        {
            const isLower = vertices[i][1] < vertices[brIndex][1];
            const isRight = (vertices[i][1] === vertices[brIndex][1] && vertices[i][0] > vertices[brIndex][0]);
            if (isLower || isRight)
            {
                brIndex = i;
            }
        }

        // calculate area
        let area = 0;
        for (let i = 0; i < vertices.length; ++i)
        {
            const a = vertices[(i + brIndex) % vertices.length];
            const b = vertices[(i + 1 + brIndex) % vertices.length];
            const c = vertices[(i + 2 + brIndex) % vertices.length];
            area += (((b[0] - a[0]) * (c[1] - a[1])) - ((c[0] - a[0]) * (b[1] - a[1])));
        }

        return area / 2;
    }
}

/**
 * Rectangle collider type.
 */
export class RectCollider extends PolyCollider
{
    constructor(xOff: number, yOff: number, width: number, height: number, layer: number, rotation: number = 0)
    {
        super(xOff, yOff, [[0, 0], [width, 0], [width, height], [0, height]], layer, rotation);
    }
}