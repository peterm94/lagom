import {Component} from "../ECS/Component";
import {GlobalSystem} from "../ECS/GlobalSystem";
import {LagomType} from "../ECS/LifecycleObject";
import {Observable} from "./Observer";

/**
 * Frame synced timer. Requires the TimerSystem to be updated.
 */
export class Timer<T> extends Component
{
    onTrigger: Observable<Timer<T>, T> = new Observable();
    remainingMS: number;
    payload: T;
    repeat: boolean;

    constructor(lengthMS: number, payload: T, repeat: boolean = false)
    {
        super();
        this.remainingMS = lengthMS;
        this.payload = payload;
        this.repeat = repeat;
    }
}

// This is frame synced. Could be an async call instead? Not sure if I want to do that though
export class TimerSystem extends GlobalSystem
{
    types(): LagomType<Component>[]
    {
        return [Timer];
    }

    update(delta: number): void
    {
        this.runOnComponents((timers: Timer<any>[]) => {
            for (let timer of timers)
            {
                timer.remainingMS -= delta;

                if (timer.remainingMS <= 0)
                {
                    timer.onTrigger.trigger(timer, timer.payload);
                    if (!timer.repeat)
                    {
                        timer.destroy();
                    }
                }
            }
        });
    }
}

/**
 * Non frame-synced timer.
 */
export class AsyncTimer
{
    private remainingMS: number;
    private readonly callback: () => void;

    constructor(lengthMS: number, triggerCallback: () => void)
    {
        this.remainingMS = lengthMS;
        this.callback = triggerCallback;

        this.update(0);
    }

    private update(elapsedMS: number)
    {
        this.remainingMS -= elapsedMS;

        if (this.remainingMS <= 0)
        {
            this.callback();
        }
        else
        {
            requestAnimationFrame(this.update.bind(this));
        }
    }
}