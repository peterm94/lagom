import {Hex} from "./Hex";
import {FlatTop} from "./FlatTop";
import {Vector} from "../../../LagomPhysics/Physics";

/**
 * List of relative neighbouring hexes.
 */
export const neighbours = [new Hex(1, 0, -1), new Hex(1, -1, 0), new Hex(0, -1, 1),
                           new Hex(-1, 0, 1), new Hex(-1, 1, 0), new Hex(0, 1, -1)];

// export const numDirection = (dir: number) => neighbours[dir % 6];

export const direction = (dir: FlatTop) => neighbours[dir % 6];

export const neighbour = (hex: Hex, dir: FlatTop) => add(hex, direction(dir));

export const add = (hex1: Hex, hex2: Hex) => new Hex(hex1.x + hex2.x,hex1.y + hex2.y, hex1.z + hex2.z);

export const subtract = (hex1: Hex, hex2: Hex) => new Hex(hex1.x - hex2.x,hex1.y - hex2.y, hex1.z - hex2.z);

/**
 * Multiples a hex's coordinates by a factor.
 */
export const multiply = (hex: Hex, factor: number) => new Hex(hex.x * factor, hex.y * factor, hex.z * factor);

/**
 * Calculates the length of a hex's coordinates.
 */
export const length = (hex: Hex) => (Math.abs(hex.x) + Math.abs(hex.y) + Math.abs(hex.z)) / 2;

/**
 * Find out if two Hex tiles are adjacent.
 */
export const adjacent = (hex1: Hex, hex2: Hex) => neighbours.find(neighbour => add(hex1, neighbour).equals(hex2));

export const hexToWorld = (hex: Hex): Vector =>
{
    const x = 25 * hex.x;
    const y = 16 * hex.x + 32 * hex.y;

    return new Vector(x, y);
};