import {World} from "./World";
import {Log} from "../Util";

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

    setParent(parent: LifecycleObject)
    {
        this.parent = parent;
    }

    // TODO generic for this type? will save some dangerous casts and invalid trees
    getParent(): LifecycleObject
    {
        if (this.parent == null)
        {
            // TODO throw or something
            Log.error("Object has no parent :(");
            return <any>null;
        }

        return this.parent;
    }

    /**
     * Will be called when added to the World.
     */
    onAdded()
    {
    }

    /**
     * Will be called when removed from the World.
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

export type PendingUpdate = { state: ObjectState, object: LifecycleObject }


export abstract class ContainerLifecyleObject extends LifecycleObject implements Updatable
{
    toUpdate: PendingUpdate[] = [];

    private resolveUpdates()
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

    update(delta: number): void
    {
        this.resolveUpdates();
    }
}

export interface Updatable
{
    update(delta: number): void;
}

export interface Renderable
{
    update(world: World, delta: number): void;
}