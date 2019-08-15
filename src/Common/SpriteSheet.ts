import * as PIXI from "pixi.js";
import {AnimatedSprite, AnimatedSpriteConfig, AnimationEnd, Sprite, SpriteConfig} from "./PIXIComponents";

/**
 * Convenient way to load multiple sprites from a single spritesheet.
 */
export class SpriteSheet
{
    private readonly sheetTexture: PIXI.BaseTexture;
    private readonly tileWidth: number;
    private readonly tileHeight: number;

    /**
     * Create a new SpriteSheet
     * @param resource The base sprite sheet resource.
     * @param tileWidth The width of the tiles on the sheet.
     * @param tileHeight The height of the tiles on the sheet.
     */
    constructor(resource: string, tileWidth: number, tileHeight: number)
    {
        this.sheetTexture = PIXI.BaseTexture.from(resource);
        this.tileWidth = tileWidth;
        this.tileHeight = tileHeight;

        // Turn off antialiasing. I'm not even making this optional, who would want it on?
        this.sheetTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
    }

    texture(column: number, row: number, w?: number, h?: number): PIXI.Texture
    {
        const width = w || this.tileWidth;
        const height = h || this.tileHeight;

        return new PIXI.Texture(this.sheetTexture, new PIXI.Rectangle(column * this.tileWidth,
                                                                      row * this.tileHeight,
                                                                      width, height));
    }

    textures(frames: [number, number][], w?: number, h?: number): PIXI.Texture[]
    {
        const width = w || this.tileWidth;
        const height = h || this.tileHeight;

        const textures = [];
        for (let frame of frames)
        {
            textures.push(new PIXI.Texture(this.sheetTexture, new PIXI.Rectangle(frame[0] * this.tileWidth,
                                                                                 frame[1] * this.tileHeight,
                                                                                 width, height)));
        }

        return textures;
    }
}