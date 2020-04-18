import {FrameTrigger} from "../FrameTrigger";
import {Sprite, SpriteConfig} from "./Sprite";
import * as PIXI from "pixi.js";
import {Observable} from "../Observer";

/**
 * Animation end action.
 */
export enum AnimationEnd
{
    /**
     * Stop the animation.
     */
    STOP,

    /**
     * Reverse the animation.
     */
    REVERSE,

    /**
     * Continue the animation from the first frame.
     */
    LOOP
}

/**
 * Configuration for Animated Sprites.
 */
export interface AnimatedSpriteConfig extends SpriteConfig
{
    /**
     * Speed at which the animation will play.
     */
    animationSpeed?: number;

    /**
     * Action to perform when the animation completes.
     */
    animationEndAction?: AnimationEnd;
}

/**
 * Animated Sprite Component type.
 */
export class AnimatedSprite extends FrameTrigger<number>
{
    animationEndAction: AnimationEnd = AnimationEnd.LOOP;

    private frameIndex = -1;
    private frameAdvancer = 1;
    public sprite: Sprite | null = null;

    readonly onFrameChange: Observable<AnimatedSprite, number> = new Observable();

    /**
     * Apply configuration to this AnimatedSprite.
     * @param config Any desired configuration options.
     */
    public applyConfig(config: AnimatedSpriteConfig): void
    {
        if (this.sprite) this.sprite.applyConfig(config);

        // Do animated sprite stuff
        if (config.animationSpeed !== undefined) this.triggerInterval = config.animationSpeed;
        if (config.animationEndAction !== undefined) this.animationEndAction = config.animationEndAction;
    }

    /**
     * Reset the state of the FrameTrigger. This will also reset the sprite to the first animation frame.
     */
    reset(): void
    {
        super.reset();

        this.frameIndex = -1;
        this.frameAdvancer = 1;
    }

    /**
     * Create a new AnimatedSprite.
     * @param textures Textures for the Sprite to use.
     * @param config Configuration for this Sprite.
     */
    constructor(protected textures: PIXI.Texture[], readonly config: AnimatedSpriteConfig | null = null)
    {
        super(0);

        if (config) this.applyConfig(config);

        this.onTrigger.register((caller: FrameTrigger<number>, currFrame: number) => {

            let nextFrame = this.frameIndex + this.frameAdvancer;

            // Check for after last or first frame to trigger the end action.
            if (nextFrame === -1 || nextFrame === this.textures.length)
            {
                switch (this.animationEndAction)
                {
                    // Loop back to the start
                    case AnimationEnd.LOOP:
                        nextFrame %= this.textures.length;
                        break;
                    // Go back the other way
                    case AnimationEnd.REVERSE:
                        this.frameAdvancer *= -1;
                        nextFrame += this.frameAdvancer * 2;
                        break;
                    // Stop the advancer and lock the frame to the current one.
                    case AnimationEnd.STOP:
                        nextFrame = currFrame;
                        this.frameAdvancer = 0;
                        break;
                }
            }

            // Only trigger the frame change event if the next frame isn't the same as the previous one.
            const doFrameTrigger = this.frameIndex !== nextFrame;

            this.frameIndex = nextFrame;

            if (doFrameTrigger)
            {
                this.onFrameChange.trigger(this, nextFrame);
            }

            if (this.sprite) this.sprite.pixiObj.texture = this.textures[this.frameIndex];
        });
    }

    payload(): number
    {
        return this.frameIndex;
    }


    onAdded(): void
    {
        // TODO i can't wait to make this a nested guy :)
        super.onAdded();
        this.sprite = this.getEntity().addComponent(new Sprite(this.textures[this.frameIndex], this.config));
        this.reset();
    }

    onRemoved(): void
    {
        super.onRemoved();
        this.onFrameChange.releaseAll();
        if (this.sprite) this.sprite.destroy();
    }
}
