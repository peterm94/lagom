import {PIXIComponent} from "../ECS/Component";
import * as PIXI from "pixi.js";
import {FrameTrigger} from "./FrameTrigger";
import {Log} from "./Util";

export class Sprite extends PIXIComponent<PIXI.Sprite>
{
    constructor(texture: PIXI.Texture, offsetX: number = 0, offsetY: number = 0)
    {
        super(new PIXI.Sprite(texture));

        // centre anchor unless overwritten
        this.pixiObj.anchor.set(offsetX, offsetY);
    }
}

export enum AnimationEnd
{
    STOP,
    REVERSE,
    LOOP
}

export class AnimatedSprite extends FrameTrigger
{
    private frameIndex: number = 0;
    private frameAdvancer: number = 1;
    private sprite: Sprite | null = null;

    constructor(private readonly textures: PIXI.Texture[],
                private offsetX: number = 0,
                private offsetY: number = 0,
                private animationSpeed: number = 0,
                private animationEndAction: AnimationEnd = AnimationEnd.LOOP)
    {
        super(animationSpeed);

        this.onTrigger.register((caller: FrameTrigger, data: null) => {
            if (this.sprite != null)
            {
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

                this.sprite.pixiObj.texture = this.textures[nextFrame];
            }
        });
    }


    onAdded(): void
    {
        super.onAdded();
        this.sprite = this.getEntity().addComponent(new Sprite(this.textures[0], this.offsetX, this.offsetY))
    }

    onRemoved(): void
    {
        super.onRemoved();
        if (this.sprite != null)
        {
            this.sprite.destroy();
        }
    }

}

export class VeryAnimatedSprite extends FrameTrigger
{
    private readonly animations: Map<number, () => AnimatedSprite> = new Map();
    private readonly events: Map<number, Map<number, () => void>> = new Map();
    private currentAnimation: number;
    private currentSprite: AnimatedSprite | null = null;

    constructor(initialState: number)
    {
        super(0);

        this.currentAnimation = initialState;
        this.onTrigger.register(this.triggerEvent);
    }

    private triggerEvent(caller: FrameTrigger, data: null)
    {
        const spriteFactory  = this.animations.get(this.currentAnimation);
        if (spriteFactory !== undefined)
        {
            // Create the sprite using the factory.
            this.currentSprite = this.getEntity().addComponent(spriteFactory());

            // Update the interval for the new sprite.
            //this.triggerInterval =
        }



        // trigger event if it exists for this frame

        // figure out what to set for the next trigger.

    }

    addAnimation(id: number, spriteFactory: () => AnimatedSprite)
    {
        this.animations.set(id, spriteFactory);
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