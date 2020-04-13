import {Body, Circle, Point, Polygon, Result} from "detect-collisions";
import {Component, PIXIComponent} from "../ECS/Component";
import {Observable} from "../Common/Observer";
import {CollisionSystem} from "./CollisionSystems";

import * as PIXI from "pixi.js";

/**
 * Collision body type. Determines the way the body interacts with the collision simulation.
 */
export enum BodyType
{
    /**
     * Discrete bodies will jump to their destination position each frame.
     */
    Discrete,

    /**
     * Continuous bodies will slide to their destination, triggering events along the way. Multiple collisions
     * may be triggered per frame.
     */
    Continuous,

    /**
     * Static bodies should not move. If they do, will cause undefined behaviour.
     */
    Static
}

/**
 * Properties for colliders.
 */
export interface ColliderOptions
{
    /**
     * Layer that the collider is on. Required.
     */
    layer: number;

    /**
     * Origin point X offset.
     */
    xOff?: number;

    /**
     * Origin point Y offset.
     */
    yOff?: number;
}

/**
 * Interface type for Lagom controlled Collider bodies.
 */
export interface LagomBody
{
    /**
     * Reference to the owning Component.
     */
    lagomComponent: Component;
}

/**
 * Collider types for this collision system.
 */
export abstract class Collider extends PIXIComponent<PIXI.Container>
{
    /**
     * Observable event for continuous collision trigger. Will be fired every frame a trigger occurs. If Continuous
     * collision checking is enabled, may trigger multiple times in the same frame.
     */
    readonly onTrigger: Observable<Collider, { other: Collider; result: Result }> = new Observable();

    /**
     * Event for entry collisions. Will only be fired once until the two bodies are no longer colliding.
     */
    readonly onTriggerEnter: Observable<Collider, { other: Collider; result: Result }> = new Observable();

    /**
     * Event triggered on a collision exit. Will only trigger once.
     */
    readonly onTriggerExit: Observable<Collider, Collider> = new Observable();

    triggersLastFrame: Collider[] = [];

    readonly layer: number;
    private readonly xOff: number;
    private readonly yOff: number;

    /**
     * Construct a new collider.
     * @param engine The Collision engine the body is to be added to.
     * @param body The inner body type.
     * @param options Any additional body options.
     */
    protected constructor(private readonly engine: CollisionSystem, readonly body: Body, options: ColliderOptions)
    {
        super(new PIXI.Container());

        this.xOff = options.xOff !== undefined ? options.xOff : 0;
        this.yOff = options.yOff !== undefined ? options.yOff : 0;

        this.pixiObj.position.x = this.xOff;
        this.pixiObj.position.y = this.yOff;

        this.layer = options.layer;

        // TODO rotation, as usual. Needs to be used everywhere too

        // Add a backref
        (this.body as unknown as LagomBody).lagomComponent = this;
    }

    onAdded(): void
    {
        super.onAdded();

        this.updatePosition();
        this.engine.addBody(this);
    }

    onRemoved(): void
    {
        super.onRemoved();

        this.engine.removeBody(this);

        this.onTriggerEnter.releaseAll();
        this.onTriggerExit.releaseAll();
        this.onTrigger.releaseAll();
    }

    /**
     * Check if a place is free in the world, relative to this object.
     * @param dx X delta from current position.
     * @param dy Y delta from current position.
     * @returns True if no collisions occur at the target location.
     */
    placeFree(dx: number, dy: number): boolean
    {
        if (this.engine) return this.engine.placeFree(this, dx, dy);
        return true;
    }

    /**
     * Sync the collider position with its anchor object in the scene.
     */
    updatePosition(): void
    {
        const pt = this.globalPos();
        this.body.x = pt.x;
        this.body.y = pt.y;
    }
}

/**
 * Collider options specifically for Circle types.
 */
export interface CircleColliderOptions extends ColliderOptions
{
    /**
     * Radius of the collision circle.
     */
    radius: number;
}

/**
 * Circle collider type. The centre point is (0, 0).
 */
export class CircleCollider extends Collider
{
    /**
     * Constructor.
     * @param system System to add the collider to.
     * @param options Options for this collider.
     */
    constructor(system: CollisionSystem, options: CircleColliderOptions)
    {
        super(system, new Circle(0, 0, options.radius), options);
    }
}

/**
 * Point collider type.
 */
export class PointCollider extends Collider
{
    /**
     * Constructor.
     * @param system System to add the collider to.
     * @param options Options for this collider.
     */
    constructor(system: CollisionSystem, options: ColliderOptions)
    {
        super(system, new Point(0, 0), options);
    }
}

/**
 * Collider options specifically for Polygons.
 */
export interface PolyColliderInterface extends ColliderOptions
{
    /**
     * Points that make up the polygon. Pass in an array of pair arrays. e.g. [[x1, y2], [x2, y2], [x3, y3]].
     */
    points: number[][];

    /**
     * Rotation of the polygon. Rotation origin will be the first point in the points array.
     */
    rotation?: number;
}

/**
 * Polygon collider. Please only use convex shapes.
 */
export class PolyCollider extends Collider
{
    /**
     * Constructor.
     * @param system System to add the collider to.
     * @param options Options for this collider.
     */
    constructor(system: CollisionSystem, options: PolyColliderInterface)
    {
        // NOTE: The order of the points matters, the library is bugged, this function ensures they are anticlockwise.
        // TODO not sure about the (x, y) here, it used to be (xOff, yOff), but I'm sure it was never tested.
        super(system, new Polygon(0, 0, PolyCollider.reorderVertices(options.points), options.rotation), options);
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

    /**
     * Update the position of the collider in the engine.
     */
    updatePosition(): void
    {
        super.updatePosition();
        const poly = this.body as Polygon;

        // Polygon 'angle' is in radians.
        poly.angle = this.parent.transform.rotation;
    }
}

/**
 * Points that make up the polygon. Pass in an array of pair arrays. e.g. [[x1, y2], [x2, y2], [x3, y3]].
 */
export interface RectColliderOptions extends ColliderOptions
{
    /**
     * Rectangle width.
     */
    width: number;

    /**
     * Rectangle height.
     */
    height: number;

    /**
     * Rectangle rotation. Origin is the top left point unless offset.
     */
    rotation?: number;
}

/**
 * Rectangle collider type.
 */
export class RectCollider extends PolyCollider
{
    /**
     * Constructor.
     * @param system System to add the collider to.
     * @param options Options for this collider.
     */
    constructor(system: CollisionSystem, options: RectColliderOptions)
    {
        super(system, {
            points: [[0, 0], [options.width, 0], [options.width, options.height], [0, options.height]],
            layer: options.layer, yOff: options.yOff, xOff: options.xOff, rotation: options.rotation
        });
    }
}
