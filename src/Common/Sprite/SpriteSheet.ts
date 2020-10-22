import * as PIXI from "pixi.js";

/**
 * Convenient way to load multiple sprites from a single Sprite Sheet.
 */
export class SpriteSheet
{
    private readonly sheetTexture: PIXI.BaseTexture;

    /**
     * Create a new SpriteSheet.
     * @param resource The base sprite sheet resource.
     * @param tileWidth The width of the tiles on the sheet.
     * @param tileHeight The height of the tiles on the sheet.
     */
    constructor(resource: string, private readonly tileWidth: number, private readonly tileHeight: number)
    {
        this.sheetTexture = PIXI.BaseTexture.from(resource);
        this.tileWidth = tileWidth;
        this.tileHeight = tileHeight;

        // Turn off antialiasing. I'm not even making this optional, who would want it on?
        this.sheetTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
    }

    /**
     * Get a texture from the SpriteSheet.
     * @param column The column index for the texture.
     * @param row The row index for the texture.
     * @param width Optional override for the texture width.
     * @param height Optional override for the texture height.
     */
    texture(column: number, row: number, width?: number, height?: number): PIXI.Texture
    {
        const w = width || this.tileWidth;
        const h = height || this.tileHeight;

        return new PIXI.Texture(this.sheetTexture, new PIXI.Rectangle(column * this.tileWidth,
                                                                      row * this.tileHeight,
                                                                      w, h));
    }

    /**
     * Get a texture from the spritesheet using pixel offsets.
     * @param x X Pixel offset.
     * @param y Y Pixel offset.
     * @param width Width in pixels.
     * @param height Height in pixels.
     */
    textureFromPoints(x: number, y: number, width: number, height: number): PIXI.Texture
    {
        return new PIXI.Texture(this.sheetTexture, new PIXI.Rectangle(x, y, width, height));
    }

    /**
     * Create a texture by index.
     * @param index Tile index of the texture to load.
     * @returns The loaded texture.
     */
    textureFromIndex(index: number): PIXI.Texture
    {
        const col = index % (this.sheetTexture.realWidth / this.tileWidth);
        const row = Math.floor(index / (this.sheetTexture.realHeight / this.tileHeight));

        return new PIXI.Texture(this.sheetTexture, new PIXI.Rectangle(col * this.tileWidth,
                                                                      row * this.tileHeight,
                                                                      this.tileWidth, this.tileHeight));
    }

    /**
     * Get multiple textures from the SpriteSheet.
     * @param frames Desired texture indexes from the SpriteSheet. Supplied as pairs of [column, row].
     * @param width Optional override for the texture width.
     * @param height Optional override for the texture height.
     * @returns The loaded textures.
     */
    textures(frames: [number, number][], width?: number, height?: number): PIXI.Texture[]
    {
        const textures = [];
        for (const frame of frames)
        {
            textures.push(this.texture(frame[0], frame[1], width, height));
        }
        return textures;
    }

    /**
     * Slices a row of textures with. Starting at [start] and ending at [end], inclusively.
     * @param row The row of textures to slice.
     * @param start The start index of the slice. Inclusive.
     * @param end The end index of the slice. Inclusive.
     * @param width Optional override for the texture width.
     * @param height Optional override for the texture height.
     * @returns The loaded texture.
     */
    textureSliceFromRow(row: number, start: number, end: number, width?: number, height?: number): PIXI.Texture[]
    {
        const textures = [];

        for (let i = start; i <= end; i++)
        {
            textures.push(this.texture(i, row, width, height));
        }

        return textures;
    }
}
