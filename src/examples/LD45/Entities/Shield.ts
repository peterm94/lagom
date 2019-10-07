import {HexEntity, HexRegister} from "../HexEntity";
import {Hex} from "../Hexagons/Hex";
import {SpriteSheet} from "../../../Common/Sprite/SpriteSheet";
import {Sprite} from "../../../Common/Sprite/Sprite";
import {AnimatedSprite, AnimationEnd} from "../../../Common/Sprite/AnimatedSprite";
import shieldSpr from '../art/shield.png'
import shieldBubbleSpr from '../art/shield_bubble.png'
import {DrawLayer} from "../HexGame";

const shieldSheet = new SpriteSheet(shieldSpr, 32, 32);
const shieldBubbleSheet = new SpriteSheet(shieldBubbleSpr, 96, 96);

export class ShieldHex extends HexEntity
{
    constructor(public owner: HexRegister, public hex: Hex)
    {
        super("shield", owner, hex, 3, DrawLayer.SHIELD, 7, 48)
    }

    onAdded()
    {
        super.onAdded();

        this.addComponent(new AnimatedSprite(
            shieldSheet.textureSliceFromRow(0, 0, 7),
            {xAnchor: 0.5, yAnchor: 0.5, animationEndAction: AnimationEnd.LOOP, animationSpeed: 120}));

        this.addComponent(new AnimatedSprite(
            shieldBubbleSheet.textureSliceFromRow(0, 0, 7),
            {xAnchor: 0.5, yAnchor: 0.5, alpha: 0.2, animationEndAction: AnimationEnd.LOOP, animationSpeed: 120}));

        this.addComponent(new Sprite(shieldSheet.texture(0, 0), {xAnchor: 0.5, yAnchor: 0.5}));
    }
}