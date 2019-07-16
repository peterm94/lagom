import {Log} from "../Common/Util";

export enum ObjectState
{
    ACTIVE,
    INACTIVE,
    PENDING_ACTIATE,
    PENDING_DEACTIVATE,
    PENDING_ADD,
    PENDING_REMOVE
}

/**
 * Base class for any lifecycle-aware object.
 */
export abstract class LifecycleObject
{
    parent: LifecycleObject | null = null;

    /**
     * Set the parent for this object.
     * @param parent The parent.
     */
    setParent(parent: LifecycleObject)
    {
        this.parent = parent;
    }

    /**
     * Retrieve the parent. If this object is not part of the ECS, it will throw an exception.
     *
     * @returns The parent of this object.
     */
    getParent(): LifecycleObject
    {
        if (this.parent == null)
        {
            // TODO throw or something
            Log.error("Object has no parent :( Use onAdded() for any initialization logic instead of the contructor.");
            return <any>null;
        }

        return this.parent;
    }

    /**
     * Will be called when added to the Game.
     */
    onAdded()
    {
    }

    /**
     * Will be called when removed from the Game.
     */
    onRemoved()
    {
    }

    /**
     * Call this to destroy the object. Any dependent objects or children will also be destroyed.
     */
    destroy()
    {
    }
}

/**
 * Type for internal ECS updates.
 */
export type PendingUpdate = { state: ObjectState, object: LifecycleObject }


/**
 * Lifecycle object that can contain other objects. Used to keep the ECS hierarchy updated correctly.
 */
export abstract class ContainerLifecycleObject extends LifecycleObject implements Updatable
{
    toUpdate: PendingUpdate[] = [];

    update(delta: number): void
    {
        // Copy the pending map make a new one, allowing it to be used for the next frame.
        const pending = this.toUpdate;
        this.toUpdate = [];

        for (let item of pending)
        {
            Log.trace(item);

            switch (item.state)
            {
                case ObjectState.PENDING_REMOVE:
                {
                    item.object.onRemoved();
                    break;
                }
                case ObjectState.PENDING_ADD:
                {
                    item.object.onAdded();
                    break;
                }
            }
        }
    }

    fixedUpdate(delta: number): void
    {
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
export type LagomType<T> = Function & { prototype: T }