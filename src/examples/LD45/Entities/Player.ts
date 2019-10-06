import {Hex} from "../Hexagons/Hex";
import {Sprite} from "../../../Common/Sprite/Sprite";
import {HexEntity, HexRegister} from "../HexEntity";
import {SpriteSheet} from "../../../Common/Sprite/SpriteSheet";
import playerSpr from "../art/player.png";
import {Entity} from "../../../ECS/Entity";
import {DrawLayer, Layers} from "../HexGame";
import {FollowMe} from "../../../Common/CameraUtil";
import {Movement, PlayerControlled} from "../Movement";
import {DetectRigidbody} from "../../../DetectCollisions/DetectRigidbody";
import {CircleCollider} from "../../../DetectCollisions/DetectColliders";
import {ThrusterHex} from "./Thruster";
import {StructureHex} from "./Structure";
import {ShieldHex} from "./Shield";
import {LaserTurretHex} from "./Turrets/LaserTurretHex";
import {PlasmaCannonHex} from "./Turrets/PlasmaCannonHex";

const playerSheet = new SpriteSheet(playerSpr, 32, 32);

export class Player extends Entity
{
    constructor()
    {
        super("player", 256, 256, DrawLayer.BLOCK);
        this.layer = Layers.PLAYER;
    }

    onAdded()
    {
        super.onAdded();

        this.addComponent(new FollowMe());
        this.addComponent(new PlayerControlled());
        this.addComponent(new Movement());
        this.addComponent(new DetectRigidbody());
        this.addComponent(new CircleCollider(0, 0, 1, Layers.NONE, true));

        const register = this.addComponent(new HexRegister());

        this.getScene().addEntity(new PlayerHex(register, new Hex(0, 0, 0)));
        this.getScene().addEntity(new StructureHex(register, new Hex(0, 1, -1)));
        this.getScene().addEntity(new ShieldHex(register, new Hex(0, 2, -2)));
        this.getScene().addEntity(new LaserTurretHex(register, new Hex(0, -1, 1)));
        this.getScene().addEntity(new ThrusterHex(register, new Hex(-1, 1, 0)));
        this.getScene().addEntity(new PlasmaCannonHex(register, new Hex(-1, 0, 1)));
    }
}

export class PlayerHex extends HexEntity
{
    constructor(public owner: HexRegister, public hex: Hex)
    {
        super("player", owner, hex, 0);
    }


    onAdded()
    {
        super.onAdded();

        const spr = this.addComponent(new Sprite(playerSheet.texture(0, 0), {xAnchor: 0.5, yAnchor: 0.5}));
    }
}
