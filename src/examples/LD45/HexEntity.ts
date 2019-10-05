import {Entity} from "../../ECS/Entity";
import {Hex} from "./Hexagons/Hex";
import {DetectRigidbody} from "../../DetectCollisions/DetectRigidbody";
import {CircleCollider, DetectCollider} from "../../DetectCollisions/DetectColliders";
import {Sprite} from "../../Common/Sprite/Sprite";
import playerSpr from './art/player.png';
import block1Spr from './art/block1.png';
import {SpriteSheet} from "../../Common/Sprite/SpriteSheet";
import {Component} from "../../ECS/Component";
import {MoveMe} from "./Movement";
import {Log, MathUtil} from "../../Common/Util";
import {add, neighbours} from "./Hexagons/HexUtil";
import {Layers} from "./HexGame";
import {Timer} from "../../Common/Timer";
import {Result} from "detect-collisions";

const playerSheet = new SpriteSheet(playerSpr, 32, 32);
export const block1Sheet = new SpriteSheet(block1Spr, 32, 32);

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

            if (value.layer !== Layers.FREE_FLOAT)
            {
                this.register.delete(value.toString());

                Log.error("detaching", value);
                const moveMe = value.getComponent<MoveMe>(MoveMe);
                if (moveMe) moveMe.destroy();
                const coll = value.getComponent<CircleCollider>(CircleCollider);
                if (coll) coll.destroy();

                value.layer = Layers.FREE_FLOAT;

                value.addComponent(new Timer(1000, undefined)).onTrigger.register(() => {
                    Log.error("Adding flat collider for ", value);
                    value.addComponent(new CircleCollider(0, 0, 16, Layers.FREE_FLOAT, true));
                });
            }
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
    protected constructor(name: string, public owner: HexRegister, public hex: Hex, public value: number)
    {
        super(name, -999, -999, 0);
    }

    addFor(owner: HexRegister, hex: Hex)
    {
        this.owner = owner;
        this.hex = hex;
        this.layer = owner.getEntity().layer;

        owner.register.set(hex.toString(), this);
        this.addComponent(new MoveMe(this.owner.getEntity(), this.hex));


        const col = this.addComponent(new CircleCollider(0, 0, 16, this.layer, true));
        col.onTriggerEnter.register((coll: DetectCollider, res: { other: DetectCollider, result: Result }) => {
            if (res.other.layer === Layers.FREE_FLOAT && coll.layer !== Layers.FREE_FLOAT)
            {
                const other = res.other.getEntity() as HexEntity;
                const me = coll.getEntity() as HexEntity;
                Log.error("TRY ATTACH");
                // Figure out which side is closest
                // TODO I think rotation makes this incorrect
                const dir = MathUtil.pointDirection(me.transform.x,
                                                    me.transform.y,
                                                    other.transform.x,
                                                    other.transform.y);

                const neighbour = Math.floor(((MathUtil.radToDeg(dir) + 720) % 360) / 60) % 6;

                const dest = add(me.hex, neighbours[neighbour]);
                if (this.owner.register.get(dest.toString()) === undefined)
                {
                    Log.error("Try to attach set ", dest);
                    res.other.destroy();
                    other.addFor(me.owner, dest);
                }
            }
            else if ((res.other.layer === Layers.ENEMY_PROJECTILE && coll.layer === Layers.PLAYER)
                || (res.other.layer === Layers.PLAYER_PROJECTILE && coll.layer === Layers.ENEMY))
            {
                this.destroy();
            }
        });
    }

    onAdded()
    {
        super.onAdded();

        this.addFor(this.owner, this.hex);
        this.addComponent(new DetectRigidbody());
    }

    destroy()
    {
        super.destroy();
        this.owner.removeHex(this);
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

export class EnemyHex extends HexEntity
{
    constructor(public owner: HexRegister, public hex: Hex, private sprite: Component)
    {
        super("purpleEnemy", owner, hex, 0);
    }

    onAdded()
    {
        super.onAdded();

        const spr = this.addComponent(this.sprite);
    }
}

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
