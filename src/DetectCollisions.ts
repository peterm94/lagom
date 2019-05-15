import {ComponentType, WorldSystem} from "./ECS/WorldSystem";
import {Component} from "./ECS/Component";
import {Log} from "./Util";
import {Observable} from "./Observer";
import {CollisionMatrix} from "./Collision";
import {Collisions, Polygon, Body, Result, Circle, Point} from "detect-collisions";

export class DetectCollisionsSystem extends WorldSystem
{
    readonly detectSystem: Collisions;
    readonly collisionMatrix: CollisionMatrix;
    private readonly continuous: boolean;

    constructor(collisionMatrix: CollisionMatrix, continuous: boolean = true)
    {
        super();
        this.collisionMatrix = collisionMatrix;
        this.continuous = continuous;
        this.detectSystem = new Collisions();
    }

    update(delta: number): void
    {
        // Move all entities to their new positions
        this.runOnComponents((colliders: DetectCollider[]) => {
            for (let collider of colliders)
            {
                const entity = collider.getEntity();
                collider.body.x = entity.transform.x;
                collider.body.y = entity.transform.y;

                // Polygons can rotate
                if (collider.body instanceof Polygon)
                {
                    collider.body.angle = entity.transform.angle;
                }
            }
        });

        // We don't need a delta, this is a pure collision checking system. No physics.
        // Allow the system to process the changes.
        this.detectSystem.update();

        // If we have enabled continuous checks, do the collision checking.
        if (this.continuous)
        {
            this.runOnComponents((colliders: DetectCollider[]) => {
                for (let collider of colliders)
                {
                    const potentials = collider.body.potentials();
                    for (let potential of potentials)
                    {
                        const otherComp = (<any>potential).lagom_component;

                        let result = new Result();
                        // Check layers, then do actual collision check
                        if (this.collisionMatrix.canCollide(collider.layer, otherComp.layer)
                            && collider.body.collides(potential, result))
                        {
                            // Trigger collision event
                            collider.collisionEvent.trigger(collider, {other: otherComp, result: result});
                        }
                    }
                }
            });
        }
    }

    types(): ComponentType<Component>[]
    {
        return [DetectCollider];
    }
}

/**
 * Collider types for this collision system.
 */
export abstract class DetectCollider extends Component
{
    private engine: DetectCollisionsSystem | null = null;
    readonly collisionEvent: Observable<DetectCollider, { other: DetectCollider, result: Result }> = new Observable();
    readonly body: Body;
    readonly layer: number;

    protected constructor(body: Body, layer: number)
    {
        super();

        this.body = body;
        this.layer = layer;

        // Add a backref
        (<any>this.body).lagom_component = this;
    }

    onAdded(): void
    {
        super.onAdded();

        this.engine = this.getEntity().getScene().getWorldSystem(DetectCollisionsSystem);

        if (this.engine == null)
        {
            Log.warn("A DetectCollisionsSystem must be added to the Scene before a Collider is added.");
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
     * @param vertices The polygon verticies.
     * @returns The area of the polygon.
     */
    private static findArea(vertices: number[][]) : number
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