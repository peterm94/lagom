import {Body, Circle, Point, Polygon, Result} from "detect-collisions";
import {PIXIComponent} from "../ECS/Component";
import {Observable} from "../Common/Observer";
import {Log} from "../Common/Util";
import {DiscreteCollisionSystem} from "./DetectCollisions";

/**
 * Collider types for this collision system.
 */
export abstract class DetectCollider2 extends PIXIComponent<PIXI.Container>
{
    readonly onTrigger: Observable<DetectCollider2, { other: DetectCollider2; result: Result }> = new Observable();
    readonly onTriggerEnter: Observable<DetectCollider2, { other: DetectCollider2; result: Result }> = new Observable();
    readonly onTriggerExit: Observable<DetectCollider2, DetectCollider2> = new Observable();

    triggersLastFrame: DetectCollider2[] = [];

    protected constructor(private readonly engine: DiscreteCollisionSystem,
                          readonly body: Body, readonly xOff: number,
                          readonly yOff: number, readonly layer: number)
    {
        super(new PIXI.Container());

        this.pixiObj.position.x = xOff;
        this.pixiObj.position.y = yOff;

        // TODO rotation, as usual. Needs to be used everywhere too

        // Add a backref
        (this.body as any).lagomComponent = this;
    }

    onAdded(): void
    {
        super.onAdded();

        if (this.engine == null)
        {
            Log.warn("A DetectCollisionsSystem must be added to the Scene before a DetectCollider2 is added.");
            return;
        }

        this.body.x = this.getEntity().transform.x + this.xOff;
        this.body.y = this.getEntity().transform.y + this.yOff;

        this.engine.addBody(this);
    }

    private alreadyRemoved = false;

    onRemoved(): void
    {
        super.onRemoved();

        // TODO I think this is fixed?
        // TODO this needs to be checked in the lifecycle, not here. Make that a set?
        if (this.alreadyRemoved)
        {
            Log.error("attempting to remove previously removed object");
            return;
        }
        this.alreadyRemoved = true;

        if (this.engine !== null)
        {
            this.engine.removeBody(this);
        }
        else
        {
            Log.warn("Engine is null for Collider.", this);
        }
    }

    placeFree(dx: number, dy: number): boolean
    {
        if (this.engine) return this.engine.placeFree(this, dx, dy);
        return true;
    }

    /**
     * Sync the collider position with it's anchor object in the scene.
     */
    updatePosition(): void
    {
        const pt = new PIXI.Point();
        // TODO check if we need to perform this update. I suspect we do.
        this.pixiObj.getGlobalPosition(pt, true);
        this.body.x = pt.x;
        this.body.y = pt.y;
    }
}

/**
 * Circle collider type.
 */
export class CircleCollider extends DetectCollider2
{
    constructor(system: DiscreteCollisionSystem, xOff: number, yOff: number, radius: number, layer: number)
    {
        super(system, new Circle(0, 0, radius), xOff, yOff, layer);
    }
}

/**
 * Point collider type.
 */
export class PointCollider extends DetectCollider2
{
    constructor(system: DiscreteCollisionSystem, xOff: number, yOff: number, layer: number)
    {
        super(system, new Point(0, 0), xOff, yOff, layer);
    }
}

/**
 * Polygon collider. Please only use convex shapes.
 */
export class PolyCollider extends DetectCollider2
{
    constructor(system: DiscreteCollisionSystem, xOff: number, yOff: number, points: number[][], layer: number,
                rotation = 0)
    {
        // NOTE: The order of the points matters, the library is bugged, this function ensures they are anticlockwise.
        super(system, new Polygon(xOff, yOff, PolyCollider.reorderVertices(points), rotation), xOff, yOff, layer);
    }

    /**
     * Make sure that vertices are ready to use by the collision library by ensuring their rotation is correct.
     *
     * @param vertices Vertices to reorder.
     * @returns Correctly ordered vertices.
     */
    protected static reorderVertices(vertices: number[][]): number[][]
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
    constructor(system: DiscreteCollisionSystem, xOff: number, yOff: number, width: number, height: number,
                layer: number, rotation = 0)
    {
        super(system, xOff, yOff, [[0, 0], [width, 0], [width, height], [0, height]], layer, rotation);
    }
}
