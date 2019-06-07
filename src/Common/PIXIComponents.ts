import {PIXIComponent} from "../ECS/Component";
import * as PIXI from "pixi.js";

export class Sprite extends PIXIComponent<PIXI.Sprite>
{
    constructor(texture: PIXI.Texture, offsetX: number = 0, offsetY: number = 0)
    {
        super(new PIXI.Sprite(texture));

        // Centrepoint anchor unless overwritten
        this.pixiObj.anchor.set(offsetX, offsetY);
    }

    setOffset(x: number, y: number): Sprite
    {
        this.pixiObj.anchor.set(x, y);
        return this;
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