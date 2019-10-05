import {Component} from "../../../ECS/Component";
import {Hex} from "../Hexagons/Hex";
import {Sprite} from "../../../Common/Sprite/Sprite";
import {AnimatedSpriteController} from "../../../Common/Sprite/AnimatedSpriteController";
import {AnimationEnd} from "../../../Common/Sprite/AnimatedSprite";
import {HexEntity, HexRegister} from "../HexEntity";
import {SpriteSheet} from "../../../Common/Sprite/SpriteSheet";
import thrusterSpr from "../art/thruster.png";
import thrusterBaseSpr from "../art/thruster_base.png";

const thrusterSheet = new SpriteSheet(thrusterSpr, 32, 32);
const thrusterBaseSheet = new SpriteSheet(thrusterBaseSpr, 32, 32);

export enum ThrusterAnimationStates
{
    OFF,
    ON,
}

export class ThrusterTag extends Component {}

export class ThrusterHex extends HexEntity
{
    constructor(public owner: HexRegister, public hex: Hex)
    {
        super("thruster", owner, hex, 2);
    }

    onAdded()
    {
        super.onAdded();

        this.addComponent(new ThrusterTag());

        const spr = this.addComponent(new Sprite(thrusterBaseSheet.texture(0, 0), {xAnchor: 0.5, yAnchor: 0.5}));

        const thruster = this.addComponent(new AnimatedSpriteController(ThrusterAnimationStates.OFF, [
            {
                id: ThrusterAnimationStates.OFF,
                textures: [thrusterSheet.texture(0, 0)],
                config: {xAnchor: 0.5, yAnchor: 0.5}
            },
            {
                id: ThrusterAnimationStates.ON,
                textures: thrusterSheet.textures([[1, 0], [2, 0], [3, 0]] ),
                config: {xAnchor: 0.5, yAnchor: 0.5, animationEndAction: AnimationEnd.STOP, animationSpeed: 1000}
            }
        ]));
    }
}
