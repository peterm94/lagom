import {Entity} from "../../ECS/Entity";
import {Hex} from "./Hexagons/Hex";
import {DetectRigidbody} from "../../DetectCollisions/DetectRigidbody";
import {CircleCollider} from "../../DetectCollisions/DetectColliders";
import {Sprite} from "../../Common/Sprite/Sprite";


import playerSpr from './art/player.png';
import block1Spr from './art/block1.png'
import {SpriteSheet} from "../../Common/Sprite/SpriteSheet";
import {Component} from "../../ECS/Component";
import {MoveMe} from "./Movement";

const playerSheet = new SpriteSheet(playerSpr, 32, 32);
const block1Sheet = new SpriteSheet(block1Spr, 32, 32);



export class HexRegister extends Component
{
    readonly register: Map<String, HexEntity> = new Map();
}
export abstract class HexEntity extends Entity
{
    protected constructor(name: string, x: number, y: number,
                          public owner: HexRegister, public hex: Hex)
    {
        super(name, x, y, 0);
        this.owner.register.set(this.hex.toString(), this);
    }

    onAdded()
    {
        super.onAdded();

        this.addComponent(new MoveMe(this.owner.getEntity(), this.hex));
        this.addComponent(new DetectRigidbody());
        this.addComponent(new CircleCollider(0, 0, 16, this.owner.getEntity().layer, true));
    }
}


export class CoreHex extends HexEntity
{
    constructor(public owner: HexRegister, public hex: Hex)
    {
        super("core", 0, 0, owner, hex);
    }


    onAdded()
    {
        super.onAdded();

        const spr = this.addComponent(new Sprite(playerSheet.texture(0, 0), {xAnchor: 0.5, yAnchor: 0.5}));
    }
}

export class StructureHex extends HexEntity
{
    constructor(public owner: HexRegister, public hex: Hex)
    {
        super("structure", 0, 0, owner, hex);
    }

    onAdded()
    {
        super.onAdded();
        const spr = this.addComponent(new Sprite(block1Sheet.texture(0, 0), {xAnchor: 0.5, yAnchor: 0.5}));
    }
}