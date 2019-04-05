import {Entity} from "./ECS";

export class Maths {
    static point_distance(x1: number, y1: number, x2: number, y2: number): number {
        return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
    }

    static point_distance_entity(e1: Entity, e2: Entity): number {
        return Maths.point_distance(e1.transform.x, e1.transform.y, e2.transform.x, e2.transform.y);
    }
}

export class Collision {
    static collision_point(x: number, y: number, entityType: string[] = []): Entity | null {
        return null;
    }

    static collision_circle(x: number, y: number, r: number, entityType: string[] = []): Entity | null {
        return null;
    }

    static collision_line(x1: number, y1: number, x2: number, y2: number, entityType: string[] = []): Entity | null {
        return null;
    }

    static collision_rectangle(x1: number, y1: number, x2: number, y2: number,
                               entityType: string[] = []): Entity | null {
        return null;
    }
}
