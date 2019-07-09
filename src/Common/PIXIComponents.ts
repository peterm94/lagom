import {PIXIComponent} from "../ECS/Component";
import * as PIXI from "pixi.js";
import {FrameTrigger} from "./FrameTrigger";

export class Sprite extends PIXIComponent<PIXI.Sprite>
{
    constructor(texture: PIXI.Texture, offsetX: number = 0, offsetY: number = 0)
    {
        super(new PIXI.Sprite(texture));

        // centre anchor unless overwritten
        this.pixiObj.anchor.set(offsetX, offsetY);
    }
}

export class AnimatedSprite extends FrameTrigger
{
    private frameIndex: number = 0;
    private sprite: Sprite | null = null;

    constructor(private readonly textures: PIXI.Texture[],
                private offsetX: number = 0,
                private offsetY: number = 0,
                private animationSpeed: number = 0)
    {
        super(animationSpeed);

        this.onTrigger.register((caller: FrameTrigger, data: null) => {
            if (this.sprite != null)
            {
                this.sprite.pixiObj.texture = this.textures[++this.frameIndex % this.textures.length];
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