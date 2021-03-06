import {Entity} from "../ECS/Entity";
import * as PIXI from "pixi.js";


export class MathUtil
{
    // Conversion constant for degrees to radians.
    private static conv = 0.0174532925;

    /**
     * Convert a degree to a radian.
     * @param deg Degree to convert.
     * @returns The radian.
     */
    static degToRad(deg: number): number
    {
        return MathUtil.conv * deg;
    }

    /**
     * Linearly interpolate a number.
     * @param start The number to start from.
     * @param end The target number.
     * @param amount The percentage to interpolate by.
     * @returns The resulting value.
     */
    static lerp(start: number, end: number, amount: number): number
    {
        return (1 - amount) * start + amount * end;
    }

    /**
     * Linearly interpolate between two angles (in radians).
     *
     * @param start The angle to start from.
     * @param end The target angle.
     * @param amount The percentage to interpolate by.
     */
    static angleLerp(start: number, end: number, amount: number): number
    {
        const max = Math.PI * 2;

        const delta = (end - start) % max;
        const shortDistance = 2 * delta % max - delta;
        return start + shortDistance * amount;
    }

    /**
     * Convert a radian to a degree.
     * @param rad The radian to convert.
     * @returns The converted degree.
     */
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
     * Calculate the direction of a vector described by two points on the line.
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

    static floatEquals(f1: number, f2: number, tolerance = 0.001): boolean
    {
        return Math.abs(f1 - f2) < tolerance;
    }

    /**
     * Return a random integer within the given range.
     * @param min The minimum value, inclusive.
     * @param max The maximum value, exclusive.
     */
    static randomRange(min: number, max: number): number
    {
        return Math.floor(Math.random() * (max - min)) + min;
    }

    static clamp(value: number, min: number, max: number): number
    {
        if (value < min) return min;
        if (value > max) return max;
        return value;
    }
}


export class Util
{
    /**
     * Convenience list removal function.
     * @param list The list to remove an element from.
     * @param element The element to remove.
     * @returns True on successful deletion, false if the element did not exist.
     */
    static remove<T>(list: T[], element: T): boolean
    {
        const idx = list.indexOf(element);

        if (idx > -1)
        {
            list.splice(idx, 1);
            return true;
        }

        return false;
    }

    static move(e: Entity, dist: number)
    {
        const mx = MathUtil.lengthDirX(dist, e.transform.rotation);
        const my = MathUtil.lengthDirY(dist, e.transform.rotation);

        e.transform.x += mx;
        e.transform.y += my;
    }

    static sortedContainer(): PIXI.Container
    {
        const container = new PIXI.Container();
        container.sortableChildren = true;
        container.sortDirty = true;
        return container;
    }

    static choose<T>(...options: T[]): T
    {
        return options[MathUtil.randomRange(0, options.length)];
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
    static logLevel: LogLevel = LogLevel.WARN;

    static error(...msg: any[]): void
    {
        if (this.logLevel >= LogLevel.ERROR)
        {
            console.error("%cERROR", 'color: red', ...msg);
        }
    }

    static warn(...msg: any[]): void
    {
        if (this.logLevel >= LogLevel.WARN)
        {
            console.warn("%cWARN ", 'color: orange', ...msg);
        }
    }

    static info(...msg: any[]): void
    {
        if (this.logLevel >= LogLevel.INFO)
        {
            console.info("%cINFO ", 'color: blue', ...msg);
        }
    }

    static debug(...msg: any[]): void
    {
        if (this.logLevel >= LogLevel.DEBUG)
        {
            console.debug("%cDEBUG", 'color: #6797c2', ...msg);
        }
    }

    static trace(...msg: any[]): void
    {
        if (this.logLevel >= LogLevel.ALL)
        {
            console.debug("%cTRACE", 'color: #65c4ff', ...msg);
        }
    }
}

class MapEntry<K, V>
{
    constructor(readonly key: K, readonly value: V)
    {
    }
}

export class MultiMap<K, V>
{
    private entries: MapEntry<K, V>[] = [];

    public clear(): void
    {
        this.entries = [];
    }

    public containsKey(key: K): boolean
    {
        return this.entries.find(entry => entry.key === key) !== undefined;
    }

    public containsValue(value: V): boolean
    {
        return this.entries.find(entry => entry.value === value) !== undefined;
    }

    public containsEntry(key: K, value: V): boolean
    {
        return this.entries.find(entry => entry.key === key && entry.value === value) !== undefined;
    }

    public remove(key: K, value: V): void
    {
        Util.remove(this.entries, new MapEntry<K, V>(key, value));
    }

    public put(key: K, value: V): void
    {
        this.entries.push(new MapEntry<K, V>(key, value));
    }
}