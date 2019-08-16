import {FrameTrigger} from "../FrameTrigger";
import {Sprite, SpriteConfig} from "./Sprite";
import * as PIXI from "pixi.js";

export enum AnimationEnd
{
    STOP,
    REVERSE,
    LOOP
}

export interface AnimatedSpriteConfig extends SpriteConfig
{
    animationSpeed?: number;
    animationEndAction?: AnimationEnd;
}

export class AnimatedSprite extends FrameTrigger<number>
{
    private frameIndex: number = 0;
    private frameAdvancer: number = 1;

    animationEndAction: AnimationEnd = AnimationEnd.LOOP;
    private _sprite: Sprite | null = null;

    public applyConfig(config: AnimatedSpriteConfig)
    {
        if (this._sprite) this._sprite.applyConfig(config);

        // Do animated sprite stuff
        this.triggerInterval = config.animationSpeed || 0;
        this.animationEndAction = config.animationEndAction || AnimationEnd.LOOP;

        // Do trigger stuff
        this.frameIndex = 0;
        this.frameAdvancer = 1;
        this.reset();
    }

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
    }

    onRemoved()
    {
        super.onRemoved();
        if (this._sprite) this._sprite.destroy();
    }
}