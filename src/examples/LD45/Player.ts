import {Entity} from "../../ECS/Entity";
import {FollowMe} from "../../Common/CameraUtil";
import {DetectRigidbody} from "../../DetectCollisions/DetectRigidbody";
import {CircleCollider} from "../../DetectCollisions/DetectColliders";
import {Hex} from "./Hexagons/Hex";
import {DrawLayer, Layers} from "./HexGame";
import {Movement, PlayerControlled} from "./Movement";
import {PlayerHex, HexRegister, StructureHex} from "./HexEntity";
import {ThrusterHex} from "./Entities/Thruster";

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
        this.getScene().addEntity(new StructureHex(register, new Hex(0, 2, -2)));
        // this.getScene().addEntity(new StructureHex(register, new Hex(0, -1, 1)));
        this.getScene().addEntity(new ThrusterHex(register, new Hex(0, -1, 1)));
        this.getScene().addEntity(new ThrusterHex(register, new Hex(-1, 1, 0)));
        this.getScene().addEntity(new ThrusterHex(register, new Hex(-1, 0, 1)));
    }
}