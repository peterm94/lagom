import {HexEntity, HexRegister} from "../HexEntity";
import {Hex} from "../Hexagons/Hex";

import shieldSpr from '../art/shield.png'
import {SpriteSheet} from "../../../Common/Sprite/SpriteSheet";
import {Sprite} from "../../../Common/Sprite/Sprite";
import {AnimatedSprite, AnimationEnd} from "../../../Common/Sprite/AnimatedSprite";

const shieldSheet = new SpriteSheet(shieldSpr, 32, 32);

export class ShieldHex extends HexEntity
{
    constructor(public owner: HexRegister, public hex: Hex)
    {
        super("shield", owner, hex, 3);
    }

    onAdded()
    {
        super.onAdded();

        this.addComponent(new AnimatedSprite(
            shieldSheet.textures([[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0]]),
            {xAnchor: 0.5, yAnchor: 0.5, animationEndAction: AnimationEnd.LOOP, animationSpeed: 125}));

        this.addComponent(new Sprite(shieldSheet.texture(0, 0), {xAnchor: 0.5, yAnchor: 0.5}));
    }
}