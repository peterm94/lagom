enum ObjectState
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
    state: ObjectState = ObjectState.PENDING_ADD;

    /**
     * Will be called when added to the World.
     */
    onAdded()
    {
    }

    /**
     * Will be called once per frame.
     */
    internalUpdate()
    {
    }

    /**
     * Will be called when removed from the world.
     */
    onRemoved()
    {
    }
}