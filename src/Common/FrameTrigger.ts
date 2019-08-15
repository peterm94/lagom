import {Component} from "../ECS/Component";
import {LagomType} from "../ECS/LifecycleObject";
import {GlobalSystem} from "../ECS/GlobalSystem";
import {Observable} from "./Observer";


export class Trigger<T>
{
    nextTriggerTime: number = -1;
    onTrigger: Observable<FrameTrigger<T>, T> = new Observable();

    constructor(public triggerInterval: number)
    {
    }

    reset()
    {
        this.nextTriggerTime = -1;
    }
}

// TODO remove the component and use this everywhere instead
export interface IFrameTrigger<T>
{
    trigger: Trigger<T>;
}

export abstract class FrameTrigger<T> extends Component
{
    onTrigger: Observable<FrameTrigger<T>, T> = new Observable();

    nextTriggerTime: number = -1;
    triggerInterval: number = 0;

    abstract payload(): T;

    protected constructor(triggerInterval: number)
    {
        super();
        this.triggerInterval = triggerInterval;
    }


}


export class FrameTriggerSystem extends GlobalSystem
{
    private elapsed: number = 0;

    types(): LagomType<Component>[]
    {
        return [FrameTrigger];
    }

    update(delta: number): void
    {
        this.elapsed += delta;

        this.runOnComponentsWithSystem((system: FrameTriggerSystem, triggers: FrameTrigger<any>[]) => {
            for (let trigger of triggers)
            {
                if (trigger.nextTriggerTime == -1)
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
