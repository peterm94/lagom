import {FrameTrigger} from "../FrameTrigger";
import {Sprite, SpriteConfig} from "./Sprite";
import * as PIXI from "pixi.js";

/**
 * Animation end action.
 */
export enum AnimationEnd
{
    STOP,
    REVERSE,
    LOOP
}

/**
 * Configuration for Animated Sprites.
 */
export interface AnimatedSpriteConfig extends SpriteConfig
{
    animationSpeed?: number;
    animationEndAction?: AnimationEnd;
}

/**
 * Animated Sprite Component type.
 */
export class AnimatedSprite extends FrameTrigger<number>
{
    animationEndAction: AnimationEnd = AnimationEnd.LOOP;

    private frameIndex: number = 0;
    private frameAdvancer: number = 1;
    private _sprite: Sprite | null = null;

    /**
     * Apply configuration to this AnimatedSprite.
     * @param config Any desired configuration options.
     */
    public applyConfig(config: AnimatedSpriteConfig)
    {
        if (this._sprite) this._sprite.applyConfig(config);

        // Do animated sprite stuff
        if (config.animationSpeed) this.triggerInterval = config.animationSpeed;
        if (config.animationEndAction) this.animationEndAction = config.animationEndAction;
    }

    /**
     * Reset the state of the FrameTrigger. This will also reset the sprite to the first animation frame.
     */
    reset()
    {
        super.reset();

        this.frameIndex = 0;
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
            if (nextFrame == -1 || nextFrame == this.textures.length)
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
                        nextFrame -= this.frameAdvancer;
                        this.frameAdvancer = 0;
                        break;
                }
            }

            this.frameIndex = nextFrame;

            if (this._sprite) this._sprite.pixiObj.texture = this.textures[this.frameIndex];
        });
    }

    payload(): number
    {
        return this.frameIndex;
    }


    onAdded()
    {
        super.onAdded();
        this._sprite = this.getEntity().addComponent(new Sprite(this.textures[this.frameIndex], this.config))
        this.reset();
    }

    onRemoved()
    {
        super.onRemoved();
        if (this._sprite) this._sprite.destroy();
    }
}