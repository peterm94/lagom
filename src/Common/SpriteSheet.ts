import * as PIXI from "pixi.js";
import {AnimatedSprite, Sprite} from "./PIXIComponents";

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

    /**
     * Create a sprite from the loaded sheet.
     * @param column The column of the sprite.
     * @param row The row of the sprite.
     * @param w The width of the sprite. If not set, will default to the initialized width.
     * @param h The height of the sprite. If not set, will default to the initialized height.
     * @returns The created sprite.
     */
    sprite(column: number, row: number, w?: number, h?: number): Sprite
    {
        const width = w || this.tileWidth;
        const height = h || this.tileHeight;

        const texture = new PIXI.Texture(this.sheetTexture, new PIXI.Rectangle(column * this.tileWidth,
                                                                               row * this.tileHeight,
                                                                               width, height));
        return new Sprite(texture);
    }

    animated(frames: [number, number][], animationSpeed: number, w?: number, h?: number): AnimatedSprite
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

        return new AnimatedSprite(textures, 0, 0, animationSpeed);
    }

    /**
     * Create a custom sprite from the loaded sheet.
     * @param x The x offset to the top left corner of the sprite.
     * @param y The y offset to the top left corner of the sprite.
     * @param w The width of the sprite.
     * @param h The height of the sprite.
     * @returns The created sprite.
     */
    spriteExt(x: number, y: number, w: number, h: number): Sprite
    {
        const texture = new PIXI.Texture(this.sheetTexture, new PIXI.Rectangle(x, y, w, h));
        return new Sprite(texture);
    }
}