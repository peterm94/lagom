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

export abstract class PIXIGraphicsComponent extends PIXIComponent<PIXI.Graphics>
{
    static readonly defaultLine = 0xFF3300;
    static readonly defaultFill = null;

    protected constructor(fillColour: number | null, lineColour: number)
    {
        super(new PIXI.Graphics());

        this.pixiObj.lineStyle(1, lineColour, 1);
        if (fillColour !== null)
        {
            this.pixiObj.beginFill(fillColour);
        }
    }
}

export class RenderCircle extends PIXIGraphicsComponent
{
    constructor(xOff: number,
                yOff: number,
                radius: number,
                fillColour: number | null = PIXIGraphicsComponent.defaultFill,
                lineColour: number = PIXIGraphicsComponent.defaultLine)
    {
        super(fillColour,
              lineColour);
        this.pixiObj.drawCircle(xOff, yOff, radius);
    }
}

export class RenderRect extends PIXIGraphicsComponent
{
    constructor(xOff: number,
                yOff: number,
                width: number,
                height: number,
                fillColour: number | null = PIXIGraphicsComponent.defaultFill,
                lineColour: number = PIXIGraphicsComponent.defaultLine)
    {
        super(fillColour,
              lineColour);
        this.pixiObj.drawRect(xOff, yOff, width, height);
    }
}

export class RenderPoly extends PIXIGraphicsComponent
{
    constructor(points: PIXI.Point[],
                fillColour: number | null = PIXIGraphicsComponent.defaultFill,
                lineColour: number = PIXIGraphicsComponent.defaultLine)
    {
        super(fillColour,
              lineColour);
        this.pixiObj.drawPolygon(points);
    }
}
