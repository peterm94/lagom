import {Entity} from "./ECS";

export class Util
{
    /**
     * Convenience list removal function.
     * @param list The list to remove an element from.
     * @param element The element to remove.
     */
    static remove<T>(list: T[], element: T)
    {
        const idx = list.indexOf(element);

        if (idx > -1)
        {
            list.splice(idx, 1);
        }
    }

    static move(e: Entity, dist: number)
    {
        const mx = MathUtil.lengthDirX(dist, e.transform.rotation);
        const my = MathUtil.lengthDirY(dist, e.transform.rotation);

        e.transform.x += mx;
        e.transform.y += my;
    }
}

export class MathUtil
{
    private static conv: number = 0.0174532925;

    static degToRad(deg: number): number
    {
        return MathUtil.conv * deg;
    }

    static radToDeg(rad: number): number
    {
        return rad / MathUtil.conv;
    }

    /**
     * Get the x component of a vector determined by the given length and direction.
     * @param length Vector length.
     * @param dir Vector direction in radians.
     * @returns The x component of the vector.
     */
    static lengthDirX(length: number, dir: number): number
    {
        return length * Math.cos(dir);
    }

    /**
     * Get the y component of a vector determined by the given length and direction.
     * @param length Vector length.
     * @param dir Vector direction in radians.
     * @returns The y component of the vector.
     */
    static lengthDirY(length: number, dir: number): number
    {
        return length * Math.sin(dir);
    }

    /**
     * Return the distance between two points.
     * @param x1 First point x.
     * @param y1 First point y.
     * @param x2 Second point x.
     * @param y2 Second point y.
     * @returns The distance between the provided points.
     */
    static pointDistance(x1: number, y1: number, x2: number, y2: number): number
    {
        return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
    }

    /**
     * Distance squared between two sets of points.
     * @param x1 Point 1 x.
     * @param y1 Point 1 y.
     * @param x2 Point 2 x.
     * @param y2 Point 2 y.
     * @returns The distance squared.
     */
    static distanceSquared(x1: number, y1: number, x2: number, y2: number): number
    {
        return Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2);
    }

    /**
     * Calculate the direction of a vector descibed by two points on the line.
     * @param x1 Point 1 x.
     * @param y1 Point 1 y.
     * @param x2 Point 2 x.
     * @param y2 Point 2 y.
     * @returns The direction between two points in radians.
     */
    static pointDirection(x1: number, y1: number, x2: number, y2: number): number
    {
        // trig, tan = O(y)/A(x)
        return -Math.atan2((y2 - y1), (x2 - x1));
    }
}

enum LogLevel
{
    NONE,
    ERROR,
    WARN,
    INFO,
    DEBUG,
    ALL
}

export class Log
{
    static logLevel: LogLevel = LogLevel.DEBUG;

    static error(...x: any[])
    {
        if (this.logLevel >= LogLevel.ERROR)
        {
            console.log("%cERROR", 'color: red', ...x);
        }
    }

    static warn(...x: any[])
    {
        if (this.logLevel >= LogLevel.WARN)
        {
            console.log("%cWARN ", 'color: orange', ...x);
        }
    }

    static info(...x: any[])
    {
        if (this.logLevel >= LogLevel.INFO)
        {
            console.log("%cINFO ", 'color: blue', ...x);
        }
    }

    static debug(...x: any[])
    {
        if (this.logLevel >= LogLevel.DEBUG)
        {
            console.log("%cDEBUG", 'color: #6797c2', ...x);
        }
    }

    static trace(...x: any[])
    {
        if (this.logLevel >= LogLevel.ALL)
        {
            console.log("%cTRACE", 'color: #65c4ff', ...x);
        }
    }
}