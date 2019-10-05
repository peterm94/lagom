import {Entity} from "../../ECS/Entity";
import {FollowMe} from "../../Common/CameraUtil";
import {DetectRigidbody} from "../../DetectCollisions/DetectRigidbody";
import {CircleCollider} from "../../DetectCollisions/DetectColliders";
import {Hex} from "./Hexagons/Hex";
import {DrawLayer, Layers} from "./HexGame";
import {CoreHex, HexRegister, StructureHex} from "./HexEntity";

export class Enemy extends Entity
{
    constructor()
    {
        super("enemy", 512, 256, DrawLayer.BLOCK);
        this.layer = Layers.ENEMY;
    }

    onAdded()
    {
        super.onAdded();

        this.addComponent(new FollowMe());

        this.addComponent(new DetectRigidbody());
        this.addComponent(new CircleCollider(0, 0, 1, Layers.NONE, true));

        const register = this.addComponent(new HexRegister());

        this.getScene().addEntity(new CoreHex(register, new Hex(0, 0, 0)));
        this.getScene().addEntity(new StructureHex(register, new Hex(0, 1, -1)));
        this.getScene().addEntity(new StructureHex(register, new Hex(0, 2, -2)));
        this.getScene().addEntity(new StructureHex(register, new Hex(0, -1, 1)));
    }
}

