import {HexEntity, HexRegister} from "../HexEntity";
import {Hex} from "../Hexagons/Hex";
import {Sprite} from "../../../Common/Sprite/Sprite";
import {AnimatedSprite} from "../../../Common/Sprite/AnimatedSprite";
import turretSpr from "../art/turret.png";
import {SpriteSheet} from "../../../Common/Sprite/SpriteSheet";
import {block1Sheet} from "./Structure";
import {System} from "../../../ECS/System";
import {Component} from "../../../ECS/Component";
import {Movement} from "../Movement";

const turretSheet = new SpriteSheet(turretSpr, 32, 32);

export class TurretHex extends HexEntity
{
    constructor(public owner: HexRegister, public hex: Hex)
    {
        super("turret", owner, hex, 4);
    }

    onAdded()
    {
        super.onAdded();

        const spr = this.addComponent(new Sprite(block1Sheet.texture(0, 0), {xAnchor: 0.5, yAnchor: 0.5}));
        const turret = this.addComponent(
            new AnimatedSprite(turretSheet.textures([[0, 0]]), {xAnchor: 0.5, yAnchor: 0.5}));
    }
}

class TurretTag extends Component
{
    constructor(public movement: Movement)
    {
        super();
    }
}

export class TurretSystem extends System
{
    types = () => [TurretTag];

    update(delta: number): void
    {

    }
}

