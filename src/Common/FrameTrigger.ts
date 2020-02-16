import {Component} from "../ECS/Component";
import {LagomType} from "../ECS/LifecycleObject";
import {GlobalSystem} from "../ECS/GlobalSystem";
import {Observable} from "./Observer";

/**
 * Frame Trigger class. Custom event management base class that can be used to synchronize and coordinate events.
 */
export abstract class FrameTrigger<T> extends Component
{
    /**
     * Observable event. Will be fired when the trigger occurs.
     */
    onTrigger: Observable<FrameTrigger<T>, T> = new Observable();

    nextTriggerTime = -1;
    triggerInterval = 0;

    /**
     * Will be put in the payload of the Observable event.
     *
     * @returns The payload of the trigger.
     */
    abstract payload(): T;

    /**
     * Create a new FrameTrigger.
     *
     * @param triggerInterval The interval at which the trigger event is fired.
     */
    protected constructor(triggerInterval: number)
    {
        super();
        this.triggerInterval = triggerInterval;
    }

    /**
     * Reset the internal trigger timer.
     */
    reset(): void
    {
        this.nextTriggerTime = -1;
    }

    onRemoved(): void
    {
        super.onRemoved();

        this.onTrigger.releaseAll();
    }
}


/**
 * System used in conjunction with an implemented FrameTrigger. This system is required for them to actually function.
 */
export class FrameTriggerSystem extends GlobalSystem
{
    private elapsed = 0;

    types(): LagomType<Component>[]
    {
        return [FrameTrigger];
    }

    update(delta: number): void
    {
        this.elapsed += delta;

        this.runOnComponentsWithSystem((system: FrameTriggerSystem, triggers: FrameTrigger<unknown>[]) => {

            for (const trigger of triggers)
            {
                if (trigger.nextTriggerTime === -1)
                {
                    // First trigger. Synchronise the component to the system.
                    trigger.onTrigger.trigger(trigger, trigger.payload());
                    trigger.nextTriggerTime = system.elapsed + trigger.triggerInterval;
                }
                else if (system.elapsed > trigger.nextTriggerTime)
                {
                    // FRAME. TRIGGERED. EVENT.
                    trigger.onTrigger.trigger(trigger, trigger.payload());
                    trigger.nextTriggerTime += trigger.triggerInterval;
                }
            }
        });
    }
}
