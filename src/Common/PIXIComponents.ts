import {PIXIComponent} from "../ECS/Component";
import * as PIXI from "pixi.js";
import {FrameTrigger} from "./FrameTrigger";
import {Log} from "./Util";

export class Sprite extends PIXIComponent<PIXI.Sprite>
{
    constructor(texture: PIXI.Texture, config: SpriteConfig | null = null)
    {
        super(new PIXI.Sprite(texture));

        if (config) this.applyConfig(config);
    }

    public applyConfig(config: SpriteConfig)
    {
        if (config.xOffset) this.pixiObj.x = config.xOffset;
        if (config.yOffset) this.pixiObj.y = config.yOffset;
        if (config.xAnchor) this.pixiObj.anchor.x = config.xAnchor;
        if (config.yAnchor) this.pixiObj.anchor.y = config.yAnchor;
        if (config.xScale) this.pixiObj.scale.x = config.xScale;
        if (config.yScale) this.pixiObj.scale.y = config.yScale;
    }
}

export enum AnimationEnd
{
    STOP,
    REVERSE,
    LOOP
}

export interface SpriteConfig
{
    xOffset?: number;
    yOffset?: number;
    xAnchor?: number;
    yAnchor?: number;
    xScale?: number;
    yScale?: number;
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

    private applyConfig(config: AnimatedSpriteConfig)
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

    constructor(readonly textures: PIXI.Texture[], readonly config: AnimatedSpriteConfig | null = null)
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

export interface SpriteAnimation
{
    id: number;
    spriteConfig: AnimatedSpriteConfig;
}

export class VeryAnimatedSprite extends AnimatedSprite
{
    setAnimation(stateId: number, reset: boolean = false)
    {
    }
}

// export class VeryAnimatedSprite extends AnimatedSprite
// {
//     get currentState(): number
//     {
//         return this._currentState;
//     }
//
//     private readonly animationStates: Map<number, AnimatedSpriteConfig> = new Map();
//     private readonly events: Map<number, Map<number, () => void>> = new Map();
//     private currentEventMap: Map<number, () => void> | null = null;
//
//     private _currentState: number;
//
//     constructor(private initialState: number, private animations: SpriteAnimation[])
//     {
//         super({}, animations[0].spriteConfig);
//         this._currentState = initialState;
//     }
//
//     onAdded(): void
//     {
//         super.onAdded();
//         const config = this.animationStates.get(this._currentState);
//         if (config !== undefined)
//         {
//             this.trigger.onTrigger.register(this.spriteChangeFrame.bind(this));
//             this.setAnimation(this._currentState);
//         }
//         else
//         {
//             Log.error("An animation was not added for the requested state: " + this.initialState);
//         }
//     }
//
//     private spriteChangeFrame(caller: FrameTrigger<number>, animationFrame: number)
//     {
//         if (this.currentEventMap !== null)
//         {
//             const event = this.currentEventMap.get(animationFrame);
//             if (event !== undefined)
//             {
//                 event();
//             }
//         }
//     }
//
//     setAnimation(stateId: number, reset: boolean = false)
//     {
//         // Check if we are already in the desired state.
//         if (this._currentState === stateId && !reset) return;
//
//         // Create the new sprite using the factory.
//         const loadedConfig = this.animationStates.get(stateId) || null;
//         if (loadedConfig !== null)
//         {
//             // Apply the configuration to the sprite
//             this.applyAnimConfig({}, loadedConfig);
//             this.currentEventMap = this.events.get(stateId) || null;
//             this._currentState = stateId;
//         }
//     }
//
//     // TODO this needs to come in with the SpriteAnimation object.
//     addEvent(animationId: number, frame: number, event: () => void)
//     {
//         const animation = this.events.get(animationId);
//         if (animation === undefined)
//         {
//             Log.warn("Expected animation does not exist on VeryAnimatedSprite.", this, animationId);
//         }
//         else
//         {
//             animation.set(frame, event);
//         }
//     }
// }

export class TextDisp extends PIXIComponent<PIXI.Text>
{
    constructor(text: string, options?: PIXI.TextStyle)
    {
        super(new PIXI.Text(text, options));
    }
}

export class RenderCircle extends PIXIComponent<PIXI.Graphics>
{
    constructor(radius: number, xOff: number = 0, yOff: number = 0)
    {
        super(new PIXI.Graphics());

        this.pixiObj.lineStyle(1, 0xFF3300, 1);
        this.pixiObj.drawCircle(xOff, yOff, radius);
    }

}

export class RenderRect extends PIXIComponent<PIXI.Graphics>
{
    constructor(width: number, height: number, xOff: number = 0, yOff: number = 0)
    {
        super(new PIXI.Graphics());

        this.pixiObj.lineStyle(1, 0xFF3300, 1);
        this.pixiObj.drawRect(xOff, yOff, width, height);
    }
}

export class RenderPoly extends PIXIComponent<PIXI.Graphics>
{
    constructor(points: PIXI.Point[])
    {
        super(new PIXI.Graphics());

        this.pixiObj.lineStyle(1, 0xFF3300, 1);
        this.pixiObj.drawPolygon(points);
    }
}