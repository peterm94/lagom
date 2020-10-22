import * as PIXI from "pixi.js";
import {Vector} from "./Vector";


/**
 * A collection of maths related utility functions.
 */
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
     * @returns The new angle.
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
     * Get the X and Y components of a vector determined by the given length and direction.
     * @param length Vector length.
     * @param dir Vector direction in radians.
     * @returns The resulting vector.
     */
    static lengthDirXY(length: number, dir: number): Vector
    {
        return new Vector(this.lengthDirX(length, dir), this.lengthDirY(length, dir));
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

    /**
     * Equality checker for floats that has built in tolerance for floating point errors.
     * @param f1 First float to compare.
     * @param f2 Second float to compare.
     * @param tolerance Equality tolerance.
     * @returns True if equal, false otherwise.
     */
    static floatEquals(f1: number, f2: number, tolerance = 0.001): boolean
    {
        return Math.abs(f1 - f2) < tolerance;
    }

    /**
     * Return a random integer within the given range.
     * @param min The minimum value, inclusive.
     * @param max The maximum value, exclusive.
     * @returns The generated number.
     */
    static randomRange(min: number, max: number): number
    {
        return Math.floor(Math.random() * (max - min)) + min;
    }

    /**
     * Clamp a number by two given bounds.
     * @param value The value to clamp.
     * @param min The lower bound.
     * @param max The upper bound.
     * @returns The clamped value.
     */
    static clamp(value: number, min: number, max: number): number
    {
        if (value < min) return min;
        if (value > max) return max;
        return value;
    }
}

/**
 * Collection of generic utility functions and helper methods.
 */
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

    /**
     * Creates a sorted PIXI container. Can maintain order.
     *
     * @returns The container.
     */
    static sortedContainer(): PIXI.Container
    {
        const container = new PIXI.Container();
        container.sortableChildren = true;
        container.sortDirty = true;
        return container;
    }

    /**
     * Make a random selection from the given options.
     * @param options The options to choose from.
     * @returns A randomly selected option.
     */
    static choose<T>(...options: T[]): T
    {
        return options[MathUtil.randomRange(0, options.length)];
    }

    /**
     * Returns the last element from a given array without removing it.
     * @param arr The array.
     * @returns The last element of the array.
     */
    static last<T>(arr: T[]): T
    {
        return arr[arr.length -1];
    }
}

/**
 * Logging level of the system.
 */
export enum LogLevel
{
    NONE,
    ERROR,
    WARN,
    INFO,
    DEBUG,
    ALL
}

/**
 * Logger class. Output will go the the console.
 */
export class Log
{
    /**
     * The current system logging level.
     */
    static logLevel: LogLevel = LogLevel.ALL;

    /**
     * Print an error message.
     * @param msg The message components.
     */
    static error(...msg: unknown[]): void
    {
        if (this.logLevel >= LogLevel.ERROR)
        {
            console.error("%cERROR", 'color: red', ...msg);
        }
    }

    /**
     * Print a warning.
     * @param msg The message components.
     */
    static warn(...msg: unknown[]): void
    {
        if (this.logLevel >= LogLevel.WARN)
        {
            console.warn("%cWARN ", 'color: orange', ...msg);
        }
    }

    /**
     * Print an informational message.
     * @param msg The message components.
     */
    static info(...msg: unknown[]): void
    {
        if (this.logLevel >= LogLevel.INFO)
        {
            console.info("%cINFO ", 'color: blue', ...msg);
        }
    }

    /**
     * Print a debug message.
     * @param msg The message components.
     */
    static debug(...msg: unknown[]): void
    {
        if (this.logLevel >= LogLevel.DEBUG)
        {
            console.debug("%cDEBUG", 'color: #6797c2', ...msg);
        }
    }

    /**
     * Print a trace message.
     * @param msg The message components.
     */
    static trace(...msg: unknown[]): void
    {
        if (this.logLevel >= LogLevel.ALL)
        {
            console.debug("%cTRACE", 'color: #65c4ff', ...msg);
        }
    }
}

/**
 * Map single entry type.
 */
class MapEntry<K, V>
{
    /**
     * Create a new entry.
     * @param key Entry key.
     * @param value Entry value.
     */
    constructor(readonly key: K, readonly value: V)
    {
    }
}

/**
 * Multi value map. Very basic implementation.
 */
export class MultiMap<K, V>
{
    private entries: MapEntry<K, V>[] = [];

    /**
     * Empty the map.
     */
    public clear(): void
    {
        this.entries = [];
    }

    /**
     * Check if the given key exists.
     * @param key The key to check.
     * @returns True if the key is present.
     */
    public containsKey(key: K): boolean
    {
        return this.entries.find(entry => entry.key === key) !== undefined;
    }

    /**
     * Check if the given value exists, across all entries.
     * @param value The value to check.
     * @returns True if the value is present.
     */
    public containsValue(value: V): boolean
    {
        return this.entries.find(entry => entry.value === value) !== undefined;
    }

    /**
     * Check if a given key value pair exists.
     * @param key The key to check.
     * @param value The value to check.
     * @returns True if the entry is found.
     */
    public containsEntry(key: K, value: V): boolean
    {
        return this.entries.find(entry => entry.key === key && entry.value === value) !== undefined;
    }

    /**
     * Remove a value from the map.
     * @param key The key to look under.
     * @param value The value to remove.
     */
    public remove(key: K, value: V): void
    {
        Util.remove(this.entries, new MapEntry<K, V>(key, value));
    }

    /**
     * Put a value in the map.
     * @param key The key to put the value under.
     * @param value The value to insert.
     */
    public put(key: K, value: V): void
    {
        this.entries.push(new MapEntry<K, V>(key, value));
    }

    public get(key: K): V[]
    {
        return this.entries.filter(x => x.key === key).flatMap(x => x.value);
    }
}
