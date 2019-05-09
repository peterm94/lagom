import {PIXIComponent} from "./ECS";
import * as PIXI from "pixi.js";

export class Sprite extends PIXIComponent<PIXI.Sprite> {
    constructor(texture: PIXI.Texture) {
        super(new PIXI.Sprite(texture));
        // Centrepoint anchor unless overwritten
        this.pixiObj.anchor.set(0.5, 0.5);
    }
}

export class TextDisp extends PIXIComponent<PIXI.Text> {
    constructor(text: string, options?: PIXI.TextStyle) {
        super(new PIXI.Text(text, options));
    }
}
