import {Component, PIXIComponent} from "./ECS/Component";
import * as PIXI from "pixi.js";

export class Sprite extends PIXIComponent<PIXI.Sprite>
{
    constructor(texture: PIXI.Texture)
    {
        super(new PIXI.Sprite(texture));
        // Centrepoint anchor unless overwritten
        this.pixiObj.anchor.set(0.5, 0.5);
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
    constructor(radius: number)
    {
        super(new PIXI.Graphics());

        this.pixiObj.lineStyle(1, 0xFF3300, 1);
        this.pixiObj.drawCircle(0, 0, radius);
    }

}

export class RenderRect extends PIXIComponent<PIXI.Graphics>
{
    constructor(xOff: number, yOff: number, width: number, height: number)
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