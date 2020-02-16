/**
 * Base class for any lifecycle-aware object.
 */
export abstract class LifecycleObject
{
    active = true;

    /**
     * Will be called when added to the Game.
     */
    onAdded(): void
    {
        // Default empty implementation.
    }

    /**
     * Will be called when removed from the Game.
     */
    onRemoved(): void
    {
        this.active = false;
    }

    /**
     * Call this to destroy the object. Any dependent objects or children will also be destroyed.
     */
    destroy(): void
    {
        // Default empty implementation.
    }
}

/**
 * Interface for updatable objects. Update will be called once per logic frame.
 */
export interface Updatable
{
    /**
     * The update method.
     * @param delta Elapsed time since the last update call.
     */
    update(delta: number): void;

    /**
     * The fixed update method. Should be called on a regular interval.
     * @param delta Elapsed time since the last update call.
     */
    fixedUpdate(delta: number): void;
}

/**
 * Interface for renderable objects. Render will be called once per render frame.
 */
export interface Renderable
{
    /**
     * The render method.
     * @param delta Elapsed time since the last render call.
     */
    render(delta: number): void;
}

/**
 * Type for our object constructors. Allows for abstract constructor types.
 * https://stackoverflow.com/questions/52349758/how-does-type-constructort-function-prototype-t-apply-to-abstract-c
 */
export type LagomType<T> = Function & { prototype: T };
