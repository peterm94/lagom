import {Entity} from "../../ECS/Entity";
import {Hex} from "./Hexagons/Hex";
import {DetectRigidbody} from "../../DetectCollisions/DetectRigidbody";
import {CircleCollider} from "../../DetectCollisions/DetectColliders";
import {Sprite} from "../../Common/Sprite/Sprite";


import playerSpr from './art/player.png';
import block1Spr from './art/block1.png';
import {SpriteSheet} from "../../Common/Sprite/SpriteSheet";
import {Component} from "../../ECS/Component";
import {MoveMe} from "./Movement";
import {add, neighbours} from "./Hexagons/HexUtil";
import {System} from "../../ECS/System";
import {Layers} from "./HexGame";
import {Log} from "../../Common/Util";

const playerSheet = new SpriteSheet(playerSpr, 32, 32);
const block1Sheet = new SpriteSheet(block1Spr, 32, 32);


class DetachHex extends Component
{
}

export class HexDetacher extends System
{
    types = () => [DetachHex, CircleCollider, MoveMe];

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, detach: DetachHex, coll: CircleCollider, moveMe: MoveMe) => {
            moveMe.destroy();
            coll.destroy();
            detach.destroy();
            entity.addComponent(new CircleCollider(0, 0, 16, Layers.FREE_FLOAT, true));
        });
    }
}

export class HexRegister extends Component
{
    readonly register: Map<String, HexEntity> = new Map();

    DFS(explored: HexEntity[], hexEntity: HexEntity): boolean
    {
        if (hexEntity.hex.toString() === new Hex(0, 0, 0).toString())
        {
            return true;
        }

        explored.push(hexEntity);
        for (const neighbour of neighbours)
        {
            const nextNodeKey = add(neighbour, hexEntity.hex).toString();
            const nextNode = this.register.get(nextNodeKey);
            if (nextNode !== undefined && explored.find(value1 => value1.hex == nextNode.hex) === undefined)
            {
                if (this.DFS(explored, nextNode))
                {
                    return true;
                }
            }
        }

        // remove all visited nodes, no way to the core
        explored.forEach(value => {
            this.register.delete(value.toString());

            value.addComponent(new DetachHex());
        });

        return false;
    }

    removeHex(hexEntity: HexEntity)
    {
        // Remove the hex from the map.
        this.register.delete(hexEntity.hex.toString());

        // Delete any node that can't reach the core any more
        this.register.forEach((value, key) => {
            this.DFS([], value);
        })
    }
}

export abstract class HexEntity extends Entity
{
    protected constructor(name: string, public owner: HexRegister, public hex: Hex)
    {
        super(name, -999, -999, 0);
        this.owner.register.set(this.hex.toString(), this);
    }

    onAdded()
    {
        super.onAdded();

        this.addComponent(new MoveMe(this.owner.getEntity(), this.hex));
        this.addComponent(new DetectRigidbody());
        const col = this.addComponent(new CircleCollider(0, 0, 16, this.owner.getEntity().layer, true));
        col.onTrigger.register((caller, data) => {
            if (data.other.layer === Layers.FREE_FLOAT)
            {
                Log.error("TRY ATTACH");
            }
            else
            {
                this.destroy();
            }
        });
    }

    destroy()
    {
        super.destroy();
        this.owner.removeHex(this);
    }
}


export class CoreHex extends HexEntity
{
    constructor(public owner: HexRegister, public hex: Hex)
    {
        super("core", owner, hex);
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
        super("structure", owner, hex);
    }

    onAdded()
    {
        super.onAdded();
        const spr = this.addComponent(new Sprite(block1Sheet.texture(0, 0), {xAnchor: 0.5, yAnchor: 0.5}));
    }
}
