import {HexEntity, HexRegister} from "./HexEntity";
import {Hex} from "./Hexagons/Hex";

import shieldSpr from './art/shield.png'
import {SpriteSheet} from "../../Common/Sprite/SpriteSheet";
import {Sprite} from "../../Common/Sprite/Sprite";

const shieldSheet = new SpriteSheet(shieldSpr, 32, 32);

export class ShieldHex extends HexEntity
{
    constructor(public owner: HexRegister, public hex: Hex)
    {
        super("shield", owner, hex, 0);
    }

    onAdded()
    {
        super.onAdded();
        this.addComponent(new Sprite(shieldSheet.texture(0, 0), {xAnchor: 0.5, yAnchor: 0.5}));
    }
}