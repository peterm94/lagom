import {BoxCollider, CircleCollider, Collider} from "./Physics";

/**
 * Collection of collision detection functions and utilities.
 */
export class Collision {

    /**
     * Check for a collision between any two collider types.
     * @param collider1 The first collider to check.
     * @param collider2 The second collider to check.
     * @returns True on collision, false otherwise.
     */
    static checkCollision(collider1: Collider, collider2: Collider): boolean {

        // Need to figure out what type of collider we have
        if (collider1 instanceof BoxCollider) {
            if (collider2 instanceof BoxCollider)
                return Collision.checkCollisionBoxBox(collider1, collider2);
            else if (collider2 instanceof CircleCollider)
                return Collision.checkCollisionBoxCircle(collider1, collider2);
        } else if (collider1 instanceof CircleCollider) {
            if (collider2 instanceof BoxCollider)
                return Collision.checkCollisionBoxCircle(collider2, collider1);
            else if (collider2 instanceof CircleCollider)
                return Collision.checkCollisionCircleCircle(collider1, collider2);
        }
        // TODO unsupported collider type
        return false;
    }

    /**
     * Return the distance between two points.
     * @param x1 First point x.
     * @param y1 First point y.
     * @param x2 Second point x.
     * @param y2 Second point y.
     * @returns The distance between the provided points.
     */
    static pointDistance(x1: number, y1: number, x2: number, y2: number): number {
        return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
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
                       tolerance: number = 0.1): boolean {
        // Distance from each end to the point
        const d1 = Collision.pointDistance(px, py, x1, y1);
        const d2 = Collision.pointDistance(px, py, x2, y2);
        const lineLength = Collision.pointDistance(x1, y1, x2, y2);

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
    static pointInCircle(x: number, y: number, circle: CircleCollider): boolean {
        return Collision.pointDistance(x, y, circle.pixiObj.x, circle.pixiObj.y) < circle.radius;
    }

    /**
     * Check if a point is inside a rectangle.
     * @param x Point x.
     * @param y Point y.
     * @param rect The rectangle to check.
     * @returns True if the point is in the rectangle.
     */
    static pointInRectangle(x: number, y: number, rect: BoxCollider): boolean {
        // TODO check rotation cases
        const anchor = rect.pixiObj;

        return x > anchor.x && x < anchor.x + rect.width &&
               y > anchor.y && y < anchor.y + rect.height;
    }

    /**
     * Check for collisions between a line and a circle.
     * @param x1 Line segment start x.
     * @param y1 Line segment start y.
     * @param x2 Line segment end x.
     * @param y2 Line segment end y.
     * @param circle The circle to check.
     * @returns True if the line is inside or intersects with the circle.
     */
    static checkCollisionLineCircle(x1: number, y1: number, x2: number, y2: number, circle: CircleCollider): boolean {
        // check if end points are in the circle, cheap
        if (Collision.pointInCircle(x1, y1, circle) || Collision.pointInCircle(x2, y2, circle)) {
            return true;
        }

        // More expensive now. Find the closest point on the line to the circle centre
        const lineLength = Collision.pointDistance(x1, y1, x2, y2);
        const circleAnchor = circle.pixiObj;
        const dot = (((circleAnchor.x - x1) * (x2 - x1)) + ((circleAnchor.y - y1) * (y2 - y1))) / Math.pow(lineLength, 2);

        const closestX = x1 + (dot * (x2 - x1));
        const closestY = y1 + (dot * (y2 - y1));

        // Check the point is actually on the line segment (the maths was done for an infinite length line)
        if (!Collision.pointOnLine(closestX, closestY, x1, y1, x2, y2)) return false;

        // Check if the point is in the circle radius
        return Collision.pointInCircle(closestX, closestY, circle);
    }

    /**
     * Check for collisions between two circles.
     * @param c1 The first circle.
     * @param c2 The second circle.
     * @returns True if the circles collide.
     */
    static checkCollisionCircleCircle(c1: CircleCollider, c2: CircleCollider): boolean {
        // Distance between the centre points
        const dist = Collision.pointDistance(c1.pixiObj.x, c1.pixiObj.y, c2.pixiObj.x, c2.pixiObj.y);

        return dist < c1.radius + c2.radius;
    }

    /**
     * Check if two boxes collide.
     * @param box1 The first box.
     * @param box2 The second box.
     * @returns True if the boxes collide.
     */
    static checkCollisionBoxBox(box1: BoxCollider, box2: BoxCollider): boolean {

        const anchor1 = box1.pixiObj;
        const anchor2 = box2.pixiObj;

        // TODO this only works for axis aligned
        const axisAligned = true;
        if (axisAligned) {
            // Do AABB collision, simple
            return anchor1.x < anchor2.x + box2.width
                   && anchor1.x + box1.width > anchor2.x
                   && anchor1.y < anchor2.y + box2.height
                   && anchor1.y + box1.height > anchor2.y;
        } else {
            // haven't done this yet
            return false;
        }
    }

    /**
     * Check for collisions between a box and a circle.
     * @param box The box to check.
     * @param circle The circle to check.
     * @returns True if the box and circle intersect.
     */
    static checkCollisionBoxCircle(box: BoxCollider, circle: CircleCollider): boolean {
        const boxAnchor = box.pixiObj;
        const a = [boxAnchor.x, boxAnchor.y];
        const b = [boxAnchor.x + box.width, boxAnchor.y];
        const c = [boxAnchor.x + box.width, boxAnchor.y + box.height];
        const d = [boxAnchor.x, boxAnchor.y + box.height];

        // Check if the circle is in the box
        return Collision.pointInRectangle(circle.pixiObj.x, circle.pixiObj.y, box)
               // Check each box edge against the circle
               || Collision.checkCollisionLineCircle(a[0], a[1], b[0], b[1], circle)
               || Collision.checkCollisionLineCircle(b[0], b[1], c[0], c[1], circle)
               || Collision.checkCollisionLineCircle(c[0], c[1], d[0], d[1], circle)
               || Collision.checkCollisionLineCircle(d[0], d[1], a[0], a[1], circle)
    }
}
