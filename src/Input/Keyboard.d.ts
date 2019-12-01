import {Key} from "./Key";

/**
 * Type definitions for pixi.js-keyboard.
 */
declare namespace Keyboard
{
    /**
     * Check if a key has been pressed down in this frame.
     * @param keys The keys to check for. Only one key must be down for this to trigger.
     * @returns True if they key has been pressed this frame.
     */
    export function isKeyPressed(...keys: Key[]): boolean;

    /**
     * Check if a key is currently down in this frame.
     * @param keys The keys to check for. Only one key must be down for this to trigger.
     * @returns True if they key is down this frame.
     */
    export function isKeyDown(...keys: Key[]): boolean;

    /**
     * Check if a key has been released in this frame.
     * @param keys The keys to check for. Only one key must be released for this to trigger.
     * @returns True if they key has been released this frame.
     */
    export function isKeyReleased(...keys: Key[]): boolean;

    /**
     * Update the state of the keys. Should only be called once per frame.
     */
    export function update(): void;
}