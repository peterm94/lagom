import {Component} from "../ECS/Component";
import {Log, Util} from "../Common/Util";
import {Observable} from "../Common/Observer";
import {CollisionMatrix} from "../LagomCollisions/CollisionMatrix";
import {Collisions, Polygon, Body, Result, Circle, Point} from "detect-collisions";
import {LagomType} from "../ECS/LifecycleObject";
import {System} from "../ECS/System";
import {Entity} from "../ECS/Entity";
// TODO -- add trigger types, use the events
// TODO -- add a static property to optimise checks? might not need this.
export class DetectActiveCollisionSystem extends System
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

    types(): LagomType<Component>[]
    {
        return [DetectCollider, DetectActive];
    }

    update(delta: number): void
    {
        // TODO we may be able to do this more efficiently?
        // Step 1, move everything in the engine
        this.runOnEntities((entity: Entity, collider: DetectCollider, body: DetectActive) => {

            body.lastX = collider.body.x - collider.xOff;
            body.lastY = collider.body.y - collider.yOff;

            // TODO We may have desynced from the actual entity pos if something else interfered.
            collider.body.x += body.pendingX;
            collider.body.y += body.pendingY;

            // TODO handle angles as above for rotation changes. can circles rotate? i think so.

            body.pendingX = 0;
            body.pendingY = 0;
        });

        // Update positions in the engine.
        this.detectSystem.update();

        // Step 2, detect collisions
        this.runOnEntities((entity: Entity, collider: DetectCollider) => {

            const collidersLastFrame = collider.collidersLastFrame;
            collider.collidersLastFrame = [];

            const potentials = collider.body.potentials();
            for (let potential of potentials)
            {
                const otherComp = (<any>potential).lagom_component;
                const result = new Result();

                // Check layers, then do actual collision check
                if (this.collisionMatrix.canCollide(collider.layer, otherComp.layer)
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
                }
            }

            // Trigger the exist event for anything that is no longer colliding
            collidersLastFrame.forEach(val => collider.onCollisionExit.trigger(collider, val));
        });

        // Step 4, move entities to resolved locations
        this.runOnEntities((entity: Entity, collider: DetectCollider) => {
            entity.transform.x = collider.body.x - collider.xOff;
            entity.transform.y = collider.body.y - collider.yOff;
        });

        // Update again with final positions.
        this.detectSystem.update();
    }

    addBody(body: DetectCollider)
    {
        this.detectSystem.insert(body.body);
        body.onCollision.register(this.resolveCollision);
    }

    removeBody(body: DetectCollider)
    {
        this.detectSystem.remove(body.body);
        body.onCollision.deregister(this.resolveCollision);
    }

    resolveCollision(caller: DetectCollider, data: { other: DetectCollider, result: Result })
    {
        // Step 3, resolve collisions
        caller.body.x -= data.result.overlap_x * data.result.overlap;
        caller.body.y -= data.result.overlap_y * data.result.overlap;
    }
}

export class DetectActive extends Component
{
    pendingX = 0;
    pendingY = 0;

    lastX: number = 0;
    lastY: number = 0;

    move(x: number, y: number)
    {
        this.pendingX += x;
        this.pendingY += y;
    }

    dir()
    {
        const pos = this.getEntity().transform.position;
        return [pos.x - this.lastX, pos.y - this.lastY];
    }
}

/**
 * Collider types for this collision system.
 */
export abstract class DetectCollider extends Component
{
    private engine: DetectActiveCollisionSystem | null = null;
    readonly onCollision: Observable<DetectCollider, { other: DetectCollider, result: Result }> = new Observable();
    readonly onCollisionEnter: Observable<DetectCollider, { other: DetectCollider, result: Result }> = new Observable();
    readonly onCollisionExit: Observable<DetectCollider, DetectCollider> = new Observable();
    readonly onTrigger: Observable<DetectCollider, { other: DetectCollider, result: Result }> = new Observable();
    readonly onTriggerEnter: Observable<DetectCollider, { other: DetectCollider, result: Result }> = new Observable();
    readonly onTriggerExit: Observable<DetectCollider, DetectCollider> = new Observable();

    collidersLastFrame: DetectCollider[] = [];

    protected constructor(readonly body: Body, readonly xOff: number, readonly yOff: number, readonly layer: number,
                          readonly isTrigger: boolean)
    {
        super();
        // Add a backref
        (<any>this.body).lagom_component = this;
    }

    onAdded(): void
    {
        super.onAdded();

        this.engine = this.getEntity().getScene().getSystem(DetectActiveCollisionSystem);

        if (this.engine == null)
        {
            Log.warn("A DetectCollisionsSystem must be added to the Scene before a DetectCollider is added.");
            return;
        }

        this.body.x = this.getEntity().transform.x + this.xOff;
        this.body.y = this.getEntity().transform.y + this.yOff;

        this.engine.addBody(this);
    }

    onRemoved(): void
    {
        super.onRemoved();

        if (this.engine !== null)
        {
            this.engine.removeBody(this)
        }
    }
}

/**
 * Circle collider type.
 */
export class CircleCollider extends DetectCollider
{
    constructor(xOff: number, yOff: number, radius: number, layer: number, isTrigger: boolean = false)
    {
        super(new Circle(0, 0, radius), xOff, yOff, layer, isTrigger);
    }

}

/**
 * Point collider type.
 */
export class PointCollider extends DetectCollider
{
    constructor(xOff: number, yOff: number, layer: number, isTrigger: boolean = false)
    {
        super(new Point(0, 0), xOff, yOff, layer, isTrigger);
    }
}

/**
 * Polygon collider. Please only use convex shapes.
 */
export class PolyCollider extends DetectCollider
{
    constructor(xOff: number, yOff: number, points: number[][], layer: number,
                rotation: number = 0, isTrigger: boolean = false)
    {
        // NOTE: The order of the points matters, the library is bugged, this function ensures they are anticlockwise.
        super(new Polygon(xOff, yOff, PolyCollider.reorderVertices(points), rotation), xOff, yOff, layer, isTrigger);
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
    constructor(xOff: number, yOff: number, width: number, height: number,
                layer: number, rotation: number = 0, isTrigger: boolean = false)
    {
        super(xOff, yOff, [[0, 0], [width, 0], [width, height], [0, height]], layer, rotation, isTrigger);
    }
}