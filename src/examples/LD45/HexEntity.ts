import {Entity} from "../../ECS/Entity";
import {Hex} from "./Hexagons/Hex";
import {DetectRigidbody} from "../../DetectCollisions/DetectRigidbody";
import {CircleCollider, DetectCollider} from "../../DetectCollisions/DetectColliders";
import {Component} from "../../ECS/Component";
import {ConstantMotion, MoveMe} from "./Movement";
import {MathUtil} from "../../Common/Util";
import {add, hexToWorld, neighbours} from "./Hexagons/HexUtil";
import {DrawLayer, Layers} from "./HexGame";
import {Timer} from "../../Common/Timer";
import {Result} from "detect-collisions";
import {ScreenShake} from "../../Common/Screenshake";
import {System} from "../../ECS/System";

export class HexRegister extends Component
{
    readonly register: Map<String, HexEntity> = new Map();

    computeValue(): number
    {
        let val = 0;

        this.register.forEach((hex, _) => {
            val += hex.value;
        });

        return val;
    }

    findUnattached(explored: Set<HexEntity>, hexEntity: HexEntity): boolean
    {
        // We found the root
        if (hexEntity.hex.toString() === new Hex(0, 0, 0).toString())
        {
            return true;
        }

        explored.add(hexEntity);
        for (const neighbour of neighbours)
        {
            const nextNodeKey = add(neighbour, hexEntity.hex).toString();
            const nextNode = this.register.get(nextNodeKey);

            // If we haven't explored this node yet, traverse
            if (nextNode !== undefined && !explored.has(nextNode))
            {
                if (this.findUnattached(explored, nextNode))
                {
                    return true;
                }
            }
        }
        return false;
    }

    removeHex(hexEntity: HexEntity)
    {
        const remPos = hexToWorld(hexEntity.hex);

        // Remove the hex from the map.
        this.register.delete(hexEntity.hex.toString());

        const visited = new Set();

        // Find any node that can't reach the core any more
        this.register.forEach((potential: HexEntity, _) => {
            const attached = this.findUnattached(visited, potential);

            if (!attached)
            {
                const mePos = hexToWorld(potential.hex);

                const dir = -MathUtil.pointDirection(remPos.x, remPos.y, mePos.x, mePos.y);
                const chunkDir = MathUtil.degToRad(MathUtil.randomRange(-45, 45)) + dir;
                const chunkSpd = MathUtil.randomRange(1, 5) / 100;

                visited.forEach((value: HexEntity) => {
                    if (value.layer !== Layers.FREE_FLOAT)
                    {
                        value.layer = Layers.FREE_FLOAT;

                        // Remove the node from the register
                        this.register.delete(value.toString());

                        // Reset any specific components
                        value.getComponentsOfType<MoveMe>(MoveMe).forEach(value1 => value1.destroy());
                        value.getComponentsOfType<CircleCollider>(CircleCollider).forEach(value1 => value1.destroy());
                        value.owner = null;

                        // Float away in a random direction
                        value.addComponent(new ConstantMotion(chunkDir, chunkSpd));
                        value.addComponent(new CircleCollider(0, 0, 1, Layers.NONE, true));

                        // After a delay, allow to be reattached
                        value.addComponent(new Timer(1000, undefined)).onTrigger.register(() => {
                            value.getComponentsOfType<CircleCollider>(CircleCollider)
                                 .forEach(value1 => value1.destroy());
                            value.addComponent(new CircleCollider(0, 0, 16, Layers.FREE_FLOAT, true));
                        });
                    }
                });
            }
            visited.clear();
        });
    }
}

export abstract class HexEntity extends Entity
{
    protected constructor(name: string,
                          public owner: HexRegister | null,
                          public hex: Hex,
                          public value: number,
                          depth?: DrawLayer,
                          private hexHp: number = 6,
                          private colliderRadius: number = 14)
    {
        super(name, -999, -999, (depth === undefined ? DrawLayer.BLOCK : depth));
        if (owner) owner.register.set(hex.toString(), this);
    }

    addFor(owner: HexRegister, hex: Hex)
    {
        this.owner = owner;
        this.hex = hex;
        this.layer = owner.getEntity().layer;

        owner.register.set(hex.toString(), this);
        this.addComponent(new MoveMe(this.owner.getEntity(), this.hex));

        // Remove any movement applied
        this.getComponentsOfType<ConstantMotion>(ConstantMotion).forEach(value1 => value1.destroy());

        const col = this.addComponent(new CircleCollider(0, 0, this.colliderRadius, this.layer, true));
        col.onTriggerEnter.register((coll: DetectCollider, res: { other: DetectCollider, result: Result }) => {
            const me = coll.getEntity() as HexEntity;

            if (res.other.layer === Layers.FREE_FLOAT && coll.layer !== Layers.FREE_FLOAT)
            {
                const other = res.other.getEntity() as HexEntity;

                // Figure out which side is closest
                const dir = MathUtil.pointDirection(me.transform.x,
                                                    me.transform.y,
                                                    other.transform.x,
                                                    other.transform.y);

                const neighbour = Math.floor(((MathUtil.radToDeg(dir + me.transform.rotation)
                    + 780) % 360) / 60) % 6; // what the fuck?

                const dest = add(me.hex, neighbours[neighbour]);
                if (this.owner && this.owner.register.get(dest.toString()) === undefined)
                {
                    res.other.destroy();
                    if (me.owner) other.addFor(me.owner, dest);
                }
            }
        });
    }

    onAdded()
    {
        super.onAdded();

        if (this.owner) this.addFor(this.owner, this.hex);
        this.addComponent(new DetectRigidbody());
        this.addComponent(new HexHP(this.hexHp));
    }

    destroy()
    {
        super.destroy();
        if (this.owner) this.owner.removeHex(this);
    }
}

export class HexHP extends Component
{

    constructor(hp: number)
    {
        super();
        this.hp = hp;
    }

    hp: number = 6;
}

export class Damage extends Component
{
    constructor(readonly amt: number = 3)
    {
        super()
    }
}

export class DamageSystem extends System
{
    types = () => [HexHP, Damage];
    private entity!: Entity;

    onAdded()
    {
        super.onAdded();
        this.entity = this.getScene().addEntity(new Entity("damagehook"));
    }

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, hp: HexHP) => {

            entity.getComponentsOfType<Damage>(Damage).forEach(value => {
                hp.hp -= value.amt;
                value.destroy();
            });

            if (hp.hp <= 0)
            {
                this.entity.addComponent(new ScreenShake(0.8, 80));
                entity.destroy();
            }
        });
    }

    onRemoved()
    {
        super.onRemoved();
        this.entity.destroy();
    }
}
