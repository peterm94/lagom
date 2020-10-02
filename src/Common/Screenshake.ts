import {Component} from "../ECS/Component";
import {GlobalSystem} from "../ECS/GlobalSystem";
import {LagomType} from "../ECS/LifecycleObject";

/**
 * Add this component to an Entity to trigger the ScreenShaker controller.
 */
export class ScreenShake extends Component
{
    readonly intensity: number;
    readonly duration: number;

    /**
     * Constructor.
     * @param intensity Intensity of the shake.
     * @param durationMS Duration of the shake in milliseconds.
     */
    constructor(intensity: number, durationMS: number)
    {
        super();
        this.intensity = intensity;
        this.duration = durationMS;
    }
}

/**
 * Screenshake controller. Must be added to a scene for the ScreenShake to be applied.
 */
export class ScreenShaker extends GlobalSystem
{
    intensity = 0;
    duration = 0;

    types(): LagomType<Component>[]
    {
        return [ScreenShake];
    }

    update(delta: number): void
    {
        this.runOnComponents((shakers: ScreenShake[]) => {
            for (const shaker of shakers)
            {
                // TODO this isn't perfect, if more than 1 are called, the will be combined
                this.intensity = shaker.intensity > this.intensity ? shaker.intensity : this.intensity;
                this.duration = shaker.duration > this.duration ? shaker.duration : this.duration;
                shaker.destroy();
            }
        });

        if (this.duration > 0)
        {
            this.getScene().camera.rotate(Math.random() * (this.intensity + this.intensity) - this.intensity);
            this.duration -= delta;
        }
        else
        {
            this.getScene().camera.rotate(0);
            this.intensity = 0;
        }
    }
}
