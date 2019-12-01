import {SpriteSheet} from "../../Common/Sprite/SpriteSheet";
import {Entity} from "../../ECS/Entity";
import {DrawLayer} from "./HexGame";
import {PIXIComponent} from "../../ECS/Component";
import * as PIXI from "pixi.js";
import backgroundSpr from './art/background.png'
import {System} from "../../ECS/System";

const backgroundSheet = new SpriteSheet(backgroundSpr, 128, 128);


export class Background extends Entity
{
    constructor()
    {
        super("background", 200, 200, DrawLayer.BACKGROUND);
    }

    onAdded()
    {
        super.onAdded();
        this.addComponent(new TilingSprite(backgroundSheet.texture(0, 0), 2000, 2000));
    }
}

export class TilingSprite extends PIXIComponent<PIXI.TilingSprite>
{
    readonly w: number;
    readonly h: number;

    constructor(texture: PIXI.Texture, w: number, h: number)
    {
        super(new PIXI.TilingSprite(texture, w, h));

        this.w = texture.width;
        this.h = texture.height;
    }
}

export class TileMover extends System
{
    types = () => [TilingSprite];

    update(delta: number): void
    {
        const cam = this.getScene().camera.position();

        this.runOnEntities((entity: Entity, spr: TilingSprite) => {
            const xStart = Math.floor((cam.x / spr.w) - 1) * spr.w;
            const yStart = Math.floor((cam.y / spr.h) - 1) * spr.h;

            entity.transform.x = xStart;
            entity.transform.y = yStart;
        });
    }
}