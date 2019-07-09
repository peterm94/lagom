import {Component} from "../ECS/Component";
import {LagomType} from "../ECS/LifecycleObject";
import {WorldSystem} from "../ECS/WorldSystem";
import {Observable} from "./Observer";

export abstract class FrameTrigger extends Component
{
    onTrigger: Observable<FrameTrigger, null> = new Observable();

    nextTriggerTime: number = -1;
    triggerInterval: number = 0;


    protected constructor(triggerInterval: number)
    {
        super();
        this.triggerInterval = triggerInterval;
    }
}


export class FrameTriggerSystem extends WorldSystem
{
    private elapsed: number = 0;

    types(): LagomType<Component>[]
    {
        return [FrameTrigger];
    }

    update(delta: number): void
    {
        this.elapsed += delta;

        this.runOnComponentsWithSystem((system: FrameTriggerSystem, triggers: FrameTrigger[]) => {
            for (let trigger of triggers)
            {
                if (trigger.nextTriggerTime == -1)
                {
                    // First trigger, do nothing, but synchronise the component to the system.
                    // TODO do we want to do something?
                    trigger.nextTriggerTime = system.elapsed + trigger.triggerInterval;
                }
                else if (system.elapsed > trigger.nextTriggerTime)
                {
                    // FRAME. TRIGGERED. EVENT.
                    trigger.onTrigger.trigger(trigger, null);
                    trigger.nextTriggerTime += trigger.triggerInterval;
                }
            }
        });
    }
}
