import {Component} from "../ECS/Component";
import {LagomType} from "../ECS/LifecycleObject";
import {GlobalSystem} from "../ECS/GlobalSystem";
import {Observable} from "./Observer";

/**
 * Frame Trigger class. Custom event management base class that can be used to synchronize and coordinate events.
 */
export abstract class FrameTrigger<T> extends Component
{
    onTrigger: Observable<FrameTrigger<T>, T> = new Observable();

    nextTriggerTime = -1;
    triggerInterval = 0;

    abstract payload(): T;

    protected constructor(triggerInterval: number)
    {
        super();
        this.triggerInterval = triggerInterval;
    }

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

        this.runOnComponentsWithSystem((system: FrameTriggerSystem, triggers: FrameTrigger<any>[]) => {
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
