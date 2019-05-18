import * as PIXI from "pixi.js";
import {Component, PIXIComponent} from "../ECS/Component";
import {Observable} from "../Common/Observer";
import {Sprite} from "../Common/PIXIComponents";
import {MathUtil} from "../Common/Util";
import {WorldSystem} from "../ECS/WorldSystem";
import {LagomType} from "../ECS/LifecycleObject";
import {CollisionMatrix} from "./CollisionMatrix";

/**
 * Collection of collision detection functions and utilities.
 */
export class Collision
{

    /**
     * Check for a collision between any two collider types.
     * @param collider1 The first collider to check.
     * @param collider2 The second collider to check.
     * @returns True on collision, false otherwise.
     */
    static checkCollision(collider1: Collider, collider2: Collider): boolean
    {

        // Need to figure out what type of collider we have
        if (collider1 instanceof BoxCollider)
        {
            if (collider2 instanceof BoxCollider)
            {
                return Collision.checkCollisionBoxBox(collider1, collider2);
            }
            else if (collider2 instanceof CircleCollider)
            {
                return Collision.checkCollisionBoxCircle(collider1, collider2);
            }
        }
        else if (collider1 instanceof CircleCollider)
        {
            if (collider2 instanceof BoxCollider)
            {
                return Collision.checkCollisionBoxCircle(collider2, collider1);
            }
            else if (collider2 instanceof CircleCollider)
            {
                return Collision.checkCollisionCircleCircle(collider1, collider2);
            }
        }
        // TODO unsupported collider type
        return false;
    }

    /**
     * Check if a point is on a given line.
     * @param px Point x.
     * @param py Point y.
     * @param x1 Line segment start x.
     * @param y1 Line segment start y.
     * @param x2 Line segment end x.
     * @param y2 Line segment end y.
     * @param tolerance Tolerance to check for. Need this for imprecise numbers.
     * @returns True if the point is on the line, false otherwise.
     */
    static pointOnLine(px: number, py: number, x1: number, y1: number, x2: number, y2: number,
                       tolerance: number = 0.1): boolean
    {
        // Distance from each end to the point
        const d1 = MathUtil.pointDistance(px, py, x1, y1);
        const d2 = MathUtil.pointDistance(px, py, x2, y2);
        const lineLength = MathUtil.pointDistance(x1, y1, x2, y2);

        // If the sum of d1 and d2 is equal to the line length (with some tolerance), the point is on the line.
        return d1 + d2 >= lineLength - tolerance && d1 + d2 <= lineLength + tolerance;
    }

    /**
     * Check if a point is in a circle.
     * @param x The point x.
     * @param y The point y.
     * @param circle The circle to check.
     * @returns True if the point is in the circle.
     */
    static pointInCircle(x: number, y: number, circle: CircleCollider): boolean
    {
        const cp = circle.pixiObj.getGlobalPosition(<any>undefined, true);
        return MathUtil.pointDistance(x, y, cp.x, cp.y) < circle.radius;
    }

    /**
     * Check if a point is inside a rectangle.
     * @param x Point x.
     * @param y Point y.
     * @param rect The rectangle to check.
     * @returns True if the point is in the rectangle.
     */
    static pointInRectangle(x: number, y: number, rect: BoxCollider): boolean
    {
        // TODO check rotation cases
        const anchor = rect.pixiObj.getGlobalPosition(<any>undefined, true);

        return x > anchor.x && x < anchor.x + rect.width &&
            y > anchor.y && y < anchor.y + rect.height;
    }

    /**
     * Check for collisions between two circles.
     * @param c1 The first circle.
     * @param c2 The second circle.
     * @returns True if the circles collide.
     */
    static checkCollisionCircleCircle(c1: CircleCollider, c2: CircleCollider): boolean
    {
        // TODO check how offsets work.. i think global handles it but make sure
        let p1 = c1.pixiObj.getGlobalPosition(<any>undefined, true);
        let p2 = c2.pixiObj.getGlobalPosition(<any>undefined, true);

        const dst = MathUtil.distanceSquared(p1.x, p1.y, p2.x, p2.y);
        const rad = Math.pow(c1.radius + c2.radius, 2);
        return dst <= rad;
    }

    /**
     * Check if two boxes collide.
     * @param box1 The first box.
     * @param box2 The second box.
     * @returns True if the boxes collide.
     */
    static checkCollisionBoxBox(box1: BoxCollider, box2: BoxCollider): boolean
    {

        const anchor1 = box1.pixiObj.getGlobalPosition(<any>undefined, true);
        const anchor2 = box2.pixiObj.getGlobalPosition(<any>undefined, true);


        // TODO this only works for axis aligned
        const axisAligned = true;
        if (axisAligned)
        {
            // Do AABB collision, simple
            if (anchor1.y + box1.height <= anchor2.y) return false;
            if (anchor2.y + box2.height <= anchor1.y) return false;
            if (anchor1.x + box1.width <= anchor2.x) return false;
            return anchor2.x + box2.width > anchor1.x;

        }
        else
        {
            // haven't done this yet
            return false;
        }
    }

    /**
     * Check for collisions between a box and a circle.
     * TODO this doesn't work with rotated boxes
     * @param box The box to check.
     * @param circle The circle to check.
     * @returns True if the box and circle intersect.
     */
    static checkCollisionBoxCircle(box: BoxCollider, circle: CircleCollider): boolean
    {

        // Find the closest point on the box edge to the circle and check the distance.
        const boxAnchor = box.pixiObj.getGlobalPosition(<any>undefined, true);
        const circleAnchor = circle.pixiObj.getGlobalPosition(<any>undefined, true);

        return MathUtil.distanceSquared(circleAnchor.x, circleAnchor.y,
                                        Math.max(boxAnchor.x, Math.min(circleAnchor.x, boxAnchor.x + box.width)),
                                        Math.max(boxAnchor.y, Math.min(circleAnchor.y, boxAnchor.y + box.height)))
            < circle.radius * circle.radius;
    }
}

export abstract class Collider extends PIXIComponent<PIXI.Container>
{

    readonly collisionEvent: Observable<Collider, Collider> = new Observable();
    isTrigger: boolean;

    protected constructor(trigger: boolean = true)
    {
        super(new PIXI.Container());
        this.isTrigger = trigger;
    }
}

export class BoxCollider extends Collider
{
    width: number;
    height: number;

    constructor(width: number, height: number, xoff: number = 0, yoff: number = 0, isTrigger: boolean = true)
    {
        super(isTrigger);
        this.width = width;
        this.height = height;

        this.pixiObj.x += xoff;
        this.pixiObj.y += yoff;
    }

    static fromSprite(sprite: Sprite, xoff: number = 0, yoff: number = 0, isTrigger: boolean = true): BoxCollider
    {
        return new BoxCollider(sprite.pixiObj.width, sprite.pixiObj.height, xoff, yoff, isTrigger);
    }
}

export class CircleCollider extends Collider
{
    radius: number;

    constructor(radius: number, isTrigger: boolean = true)
    {
        super(isTrigger);
        this.radius = radius;
    }
}

export class CollisionSystem extends WorldSystem
{
    private readonly collisionMatrix: CollisionMatrix;

    constructor(collisions: CollisionMatrix)
    {
        super();
        this.collisionMatrix = collisions;
    }

    update(delta: number): void
    {
        this.runOnComponents((colliders: Collider[]) => {
            for (let i = 0; i < colliders.length; i++)
            {
                for (let j = i + 1; j < colliders.length; j++)
                {
                    const c1 = colliders[i];
                    const c2 = colliders[j];

                    // check layers can intersect, exit if they cannot
                    if (!this.collisionMatrix.canCollide(c1.getEntity().layer, c2.getEntity().layer)) continue;

                    // Trigger the collision event, passing through 'other'.
                    if (Collision.checkCollision(c1, c2))
                    {
                        c1.collisionEvent.trigger(c1, c2);
                        c2.collisionEvent.trigger(c2, c1);
                    }
                }
            }
        });
    }

    types(): LagomType<Component>[]
    {
        return [Collider];
    }
}

