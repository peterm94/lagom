import {PIXIComponent} from "../../ECS/Component";
import * as PIXI from "pixi.js";

/**
 * Simple Sprite Component.
 */
export class Sprite extends PIXIComponent<PIXI.Sprite>
{
    /**
     * Create a new Sprite.
     * @param texture The Texture for the Sprite.
     * @param config Configuration for the Sprite.
     */
    constructor(texture: PIXI.Texture, config: SpriteConfig | null = null)
    {
        super(new PIXI.Sprite(texture));

        if (config) this.applyConfig(config);
    }

    /**
     * Apply a set of configuration to the Sprite.
     * @param config Configuration to apply.
     */
    public applyConfig(config: SpriteConfig)
    {
        if (config.xOffset) this.pixiObj.x = config.xOffset;
        if (config.yOffset) this.pixiObj.y = config.yOffset;
        if (config.xAnchor) this.pixiObj.anchor.x = config.xAnchor;
        if (config.yAnchor) this.pixiObj.anchor.y = config.yAnchor;
        if (config.xScale) this.pixiObj.scale.x = config.xScale;
        if (config.yScale) this.pixiObj.scale.y = config.yScale;
        if (config.rotation) this.pixiObj.rotation = config.rotation;
    }
}

/**
 * Configuration options for the Sprite.
 */
export interface SpriteConfig
{
    /** X offset from the entity position. */
    xOffset?: number;
    /** Y offset from the entity position. */
    yOffset?: number;
    /** X anchor position. This works as a percentage of the width, so 0.5 would be the centre. */
    xAnchor?: number;
    /** Y anchor position. This works as a percentage of the height, so 0.5 would be the centre. */
    yAnchor?: number;
    /** Texture scaling in the X direction. A negative number will flip the texture. */
    xScale?: number;
    /** Texture scaling in the Y direction. A negative number will flip the texture. */
    yScale?: number;

    rotation?: number;
}
