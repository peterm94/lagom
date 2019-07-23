import {Body, Circle, Point, Polygon, Result} from "detect-collisions";
import {Component} from "../ECS/Component";
import {Observable} from "../Common/Observer";
import {Log} from "../Common/Util";
import {DetectActiveCollisionSystem} from "./DetectCollisions";

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
