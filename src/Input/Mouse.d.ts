/**
 * Type definitions for pixi.js-mouse.
 */
declare namespace Mouse
{
    /**
     * Check if a button pressed down in this frame.
     * @param button The button to check for.
     * @returns True if they button has been pressed this frame.
     */
    export function isButtonPressed(button: Button): boolean;

    /**
     * Check if a button is currently down in this frame.
     * @param button The button to check for.
     * @returns True if they button is down this frame.
     */
    export function isButtonDown(button: Button): boolean;

    /**
     * Check if a button has been released in this frame.
     * @param button The button to check for.
     * @returns True if they button has been released this frame.
     */
    export function isButtonReleased(button: Button): boolean;

    /**
     * Get the current mouse X position.
     * @returns The current X position of the mouse.
     */
    export function getPosX(): number;

    /**
     * Get the current mouse Y position.
     * @returns The current Y position of the mouse.
     */
    export function getPosY(): number;

    /**
     * Update the state of the buttons. Should only be called once per frame.
     */
    export function update(): void;

}
