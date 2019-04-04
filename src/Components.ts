import {PIXIComponent} from "./ECS";
import * as PIXI from "pixi.js";

export class Sprite extends PIXIComponent<PIXI.Sprite> {
    constructor(texture: PIXI.Texture) {
        super(new PIXI.Sprite(texture));
    }
}

export class Text extends PIXIComponent<PIXI.Text> {
    constructor(text: string, options?: PIXI.TextStyleOptions) {
        super(new PIXI.Text(text, options));
    }
}