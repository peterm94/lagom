import {PIXIComponent} from "../ECS/Component";
import * as PIXI from "pixi.js";

export class TextDisp extends PIXIComponent<PIXI.Text>
{
    constructor(xOff: number, yOff: number, text: string, options?: PIXI.TextStyle)
    {
        super(new PIXI.Text(text, options));

        this.pixiObj.x = xOff;
        this.pixiObj.y = yOff;
    }
}

export class RenderCircle extends PIXIComponent<PIXI.Graphics>
{
    constructor(xOff: number, yOff: number, radius: number)
    {
        super(new PIXI.Graphics());

        this.pixiObj.lineStyle(1, 0xFF3300, 1);
        this.pixiObj.drawCircle(xOff, yOff, radius);
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