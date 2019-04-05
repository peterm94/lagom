import {Entity} from "./ECS";

export class Util {
    /**
     * Convenience list removal function.
     * @param list The list to remove an element from.
     * @param element The element to remove.
     */
    static remove<T>(list: T[], element: T) {
        const idx = list.indexOf(element);

        if (idx > -1) {
            list.splice(idx, 1);
        }
    }

    static move(e: Entity, dist: number) {
        const mx = MathUtil.lengthDirX(dist, e.transform.rotation);
        const my = MathUtil.lengthDirY(dist, e.transform.rotation);

        e.transform.x += mx;
        e.transform.y += my;
    }
}

export class MathUtil {

    private static conv: number = 0.0174532925;

    static degToRad(deg: number): number {
        return MathUtil.conv * deg;
    }

    static radToDeg(rad: number): number {
        return rad / MathUtil.conv;
    }

    /**
     * Get the x component of a vector determined by the given length and direction.
     * @param length Vector length.
     * @param dir Vector direction in radians.
     * @returns The x component of the vector.
     */
    static lengthDirX(length: number, dir: number): number {
        return length * Math.cos(dir);
    }

    /**
     * Get the y component of a vector determined by the given length and direction.
     * @param length Vector length.
     * @param dir Vector direction in radians.
     * @returns The y component of the vector.
     */
    static lengthDirY(length: number, dir: number): number {
        return length * Math.sin(dir);
    }
}