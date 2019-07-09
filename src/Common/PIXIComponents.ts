import {Component, PIXIComponent} from "../ECS/Component";
import * as PIXI from "pixi.js";
import {WorldSystem} from "../ECS/WorldSystem";
import {LagomType} from "../ECS/LifecycleObject";

export class Sprite extends PIXIComponent<PIXI.Sprite>
{
    constructor(texture: PIXI.Texture, offsetX: number = 0, offsetY: number = 0)
    {
        super(new PIXI.Sprite(texture));

        // centre anchor unless overwritten
        this.pixiObj.anchor.set(offsetX, offsetY);
    }
}

export class AnimatedSprite extends PIXIComponent<PIXI.Sprite>
{
    animationSpeed: number;
    textures: PIXI.Texture[];
    frameIndex: number = 0;
    nextTriggerTime: number = -1;

    constructor(textures: PIXI.Texture[], offsetX: number = 0, offsetY: number = 0, animationSpeed: number = 0)
    {
        super(new PIXI.Sprite(textures[0]));

        this.textures = textures;

        // centre anchor unless overwritten
        this.pixiObj.anchor.set(offsetX, offsetY);
        this.animationSpeed = animationSpeed;
    }
}

export class AnimatedSpriteSystem extends WorldSystem
{
    private elapsed: number = 0;

    types(): LagomType<Component>[]
    {
        return [AnimatedSprite];
    }

    update(delta: number): void
    {
        this.elapsed += delta;

        this.runOnComponents((sprites: AnimatedSprite[]) => {
            sprites.forEach(sprite => {

                // First frame init
                if (sprite.nextTriggerTime == -1)
                {
                    sprite.nextTriggerTime = this.elapsed + sprite.animationSpeed;
                }
                else if (this.elapsed > sprite.nextTriggerTime)
                {
                    sprite.pixiObj.texture = sprite.textures[++sprite.frameIndex % sprite.textures.length];
                    sprite.nextTriggerTime += sprite.animationSpeed;
                }
            });
        })
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