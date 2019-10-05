import {Hex} from "../Hexagons/Hex";
import {Sprite} from "../../../Common/Sprite/Sprite";
import {HexEntity, HexRegister} from "../HexEntity";
import {SpriteSheet} from "../../../Common/Sprite/SpriteSheet";
import block1Spr from "../art/block1.png";

const block1Sheet = new SpriteSheet(block1Spr, 32, 32);

export class StructureHex extends HexEntity
{
    constructor(public owner: HexRegister, public hex: Hex)
    {
        super("structure", owner, hex, 1);
    }

    onAdded()
    {
        super.onAdded();
        const spr = this.addComponent(new Sprite(block1Sheet.texture(0, 0), {xAnchor: 0.5, yAnchor: 0.5}));
    }
}
