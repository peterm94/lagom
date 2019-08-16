import {PIXIComponent} from "../../ECS/Component";
import * as PIXI from "pixi.js";

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

export interface SpriteConfig
{
    xOffset?: number;
    yOffset?: number;
    xAnchor?: number;
    yAnchor?: number;
    xScale?: number;
    yScale?: number;
}
