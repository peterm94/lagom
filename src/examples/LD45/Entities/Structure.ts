import {Hex} from "../Hexagons/Hex";
import {Sprite} from "../../../Common/Sprite/Sprite";
import {HexEntity, HexRegister} from "../HexEntity";
import {SpriteSheet} from "../../../Common/Sprite/SpriteSheet";
import block1Spr from "../art/block1.png";
import circuitsSpr from "../art/circuits.png";
import {MathUtil} from "../../../Common/Util";

export const block1Sheet = new SpriteSheet(block1Spr, 32, 32);
const circuitsSheet = new SpriteSheet(circuitsSpr, 32, 32);

export class StructureHex extends HexEntity
{
    constructor(public owner: HexRegister, public hex: Hex)
    {
        super("structure", owner, hex, 1);
    }

    getSprite() {
        switch(MathUtil.randomRange(0,10))
        {
            case 1:
            case 2:
            case 3: return circuitsSheet;
            default: return block1Sheet;
        }
    }

    onAdded()
    {
        super.onAdded();
        const spr = this.addComponent(new Sprite(this.getSprite().texture(0, 0), {xAnchor: 0.5, yAnchor: 0.5}));
    }
}
