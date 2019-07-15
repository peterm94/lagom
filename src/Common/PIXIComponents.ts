import {Component, PIXIComponent} from "../ECS/Component";
import * as PIXI from "pixi.js";
import {FrameTrigger} from "./FrameTrigger";
import {Log} from "./Util";

export class Sprite extends PIXIComponent<PIXI.Sprite>
{
    get yScale(): number
    {
        return this._yScale;
    }

    set yScale(value: number)
    {
        this.pixiObj.scale.y = value;
        this._yScale = value;
    }

    get xScale(): number
    {
        return this._xScale;
    }

    set xScale(value: number)
    {
        this.pixiObj.scale.x = value;
        this._xScale = value;
    }

    constructor(texture: PIXI.Texture, offsetX: number = 0, offsetY: number = 0)
    {
        super(new PIXI.Sprite(texture));

        // Set the anchor point. It works using a percentage of the width/height
        this.pixiObj.anchor.set(offsetX / texture.width, offsetY / texture.height);
    }

    private _xScale: number = 1;
    private _yScale: number = 1;
}

export enum AnimationEnd
{
    STOP,
    REVERSE,
    LOOP
}

export interface AnimatedSpriteConfig
{
    readonly textures: PIXI.Texture[];
    animationSpeed: number;
    offsetX?: number;
    offsetY?: number;
    animationEndAction: AnimationEnd;
}

export class AnimatedSprite extends FrameTrigger<number>
{
    get sprite(): Sprite | null
    {
        return this._sprite;
    }

    private frameIndex: number = 0;
    private frameAdvancer: number = 1;
    private _sprite: Sprite | null = null;

    applyConfiguration(config: AnimatedSpriteConfig)
    {
        this.config = config;
        this.frameIndex = 0;
        this.frameAdvancer = 1;

        this.triggerInterval = config.animationSpeed;
        this.reset();
    }

    constructor(private config: AnimatedSpriteConfig)
    {
        super(config.animationSpeed);

        this.onTrigger.register((caller: FrameTrigger<number>, currFrame: number) => {
            if (this._sprite != null)
            {
                let nextFrame = this.frameIndex + this.frameAdvancer;

                // Check for after last or first frame to trigger the end action.
                if (nextFrame == -1 || nextFrame == this.config.textures.length)
                {
                    switch (this.config.animationEndAction)
                    {
                        // Loop back to the start
                        case AnimationEnd.LOOP:
                            nextFrame %= this.config.textures.length;
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
                this._sprite.pixiObj.texture = this.config.textures[this.frameIndex];
            }
        });
    }


    onAdded(): void
    {
        super.onAdded();
        this._sprite = this.getEntity().addComponent(new Sprite(this.config.textures[0],
                                                                this.config.offsetX,
                                                                this.config.offsetY))
    }

    onRemoved(): void
    {
        super.onRemoved();
        if (this._sprite != null)
        {
            this._sprite.destroy();
        }
    }

    payload(): number
    {
        return this.frameIndex;
    }

}

export class VeryAnimatedSprite extends Component
{
    get currentSprite(): AnimatedSprite
    {
        return this._currentSprite as AnimatedSprite;
    }

    get currentState(): number
    {
        return this._currentState;
    }

    private readonly animations: Map<number, AnimatedSpriteConfig> = new Map();
    private readonly events: Map<number, Map<number, () => void>> = new Map();
    private currentEventMap: Map<number, () => void> | null = null;
    private currentConfig: AnimatedSpriteConfig | null = null;
    private _currentSprite: AnimatedSprite | null = null;

    private _currentState: number;

    constructor(private initialState: number)
    {
        super();
        this._currentState = initialState;
    }

    onAdded(): void
    {
        super.onAdded();
        const config = this.animations.get(this._currentState);
        if (config !== undefined)
        {
            this._currentSprite = this.getEntity().addComponent(new AnimatedSprite(config));
            this._currentSprite.onTrigger.register(this.spriteChangeFrame.bind(this));
            this.setAnimation(this._currentState);
        }
        else
        {
            Log.error("An animation was not added for the requested state: " + this.initialState);
        }
    }

    private spriteChangeFrame(caller: FrameTrigger<number>, animationFrame: number)
    {
        if (this.currentEventMap !== null)
        {
            const event = this.currentEventMap.get(animationFrame);
            if (event !== undefined)
            {
                event();
            }
        }
    }

    setAnimation(animation: number, reset: boolean = false)
    {
        // Check if we are already in the desired state.
        if (this._currentState === animation && !reset) return;

        // Create the new sprite using the factory.
        const loadedConfig = this.animations.get(animation) || null;
        if (loadedConfig !== null)
        {
            // Apply the configuration to the sprite
            this.currentSprite.applyConfiguration(loadedConfig);

            this.currentConfig = loadedConfig;
            this.currentEventMap = this.events.get(animation) || null;
            this._currentState = animation;
        }
    }

    addAnimation(id: number, spriteConfig: AnimatedSpriteConfig)
    {
        this.animations.set(id, spriteConfig);
        this.events.set(id, new Map());
    }

    addEvent(animationId: number, frame: number, event: () => void)
    {
        const animation = this.events.get(animationId);
        if (animation === undefined)
        {
            Log.warn("Expected animation does not exist on VeryAnimatedSprite.", this, animationId);
        }
        else
        {
            animation.set(frame, event);
        }
    }
}

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