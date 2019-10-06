import {Damage, HexEntity, HexRegister} from "../HexEntity";
import {Hex} from "../Hexagons/Hex";
import {Sprite} from "../../../Common/Sprite/Sprite";
import {AnimatedSprite} from "../../../Common/Sprite/AnimatedSprite";
import {SpriteSheet} from "../../../Common/Sprite/SpriteSheet";
import {block1Sheet} from "./Structure";
import {System} from "../../../ECS/System";
import {Component} from "../../../ECS/Component";
import {Movement} from "../Movement";
import turretSpr from "../art/turret.png";
import turretBaseSpr from "../art/turret_base.png"
import {Entity} from "../../../ECS/Entity";
import {MathUtil} from "../../../Common/Util";
import {DrawLayer, Layers} from "../HexGame";
import {DetectRigidbody} from "../../../DetectCollisions/DetectRigidbody";
import {RenderCircle} from "../../../Common/PIXIComponents";
import {CircleCollider, DetectCollider} from "../../../DetectCollisions/DetectColliders";
import {Garbage} from "../Systems/OffScreenGarbageGuy";
import {Result} from "detect-collisions";
import {add, neighbours} from "../Hexagons/HexUtil";
import {Timer} from "../../../Common/Timer";

const turretBaseSheet = new SpriteSheet(turretBaseSpr, 32, 32);
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
        this.addComponent(new TurretTag());
        this.addComponent(new Sprite(turretBaseSheet.texture(0, 0), {xAnchor: 0.5, yAnchor: 0.5}));
        this.addComponent(new AnimatedSprite(turretSheet.textures([[0, 0]]), {xAnchor: 0.5, yAnchor: 0.5}));
    }
}

class TurretTag extends Component
{
    canShoot: boolean = true;

    public getMovement(): Movement | null
    {
        const entity = this.getEntity() as TurretHex;
        const owner = entity.owner;
        if (owner)
        {
            return owner.getEntity().getComponent<Movement>(Movement);
        }
        return null;
    }
}

export class TurretSystem extends System
{
    types = () => [TurretTag, AnimatedSprite];

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, tag: TurretTag, spr: AnimatedSprite) => {
            const movement = tag.getMovement();
            if (!movement) return;

            let targetDir = -MathUtil.pointDirection(entity.transform.position.x, entity.transform.position.y,
                                                     movement.aimX, movement.aimY);

            targetDir -= entity.transform.rotation;

            spr.applyConfig(
                {rotation: MathUtil.angleLerp(spr.sprite!.pixiObj.rotation, targetDir, (delta / 1000) * 4)});
        });
    }
}

export class TurretShooter extends System
{
    types = () => [TurretTag, AnimatedSprite];

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, tag: TurretTag, spr: AnimatedSprite) => {
            if (!tag.canShoot) return;

            const movement = tag.getMovement();
            if (!movement) return;

            // pew pew
            if (movement.shooting)
            {
                tag.canShoot = false;
                // TODO projectile type passthrough
                entity.getScene().addEntity(
                    new Bullet(Layers.PLAYER_PROJECTILE, entity.transform.x, entity.transform.y,
                               spr.sprite!.pixiObj.rotation + (entity.transform.rotation)));
                entity.addComponent(new Timer(100, tag)).onTrigger.register((caller, data) => {
                    data.canShoot = true;
                })
            }
        });
    }
}


export class Bullet extends Entity
{
    constructor(layer: Layers, x: number, y: number, private targRotation: number)
    {
        super("bullet", x, y, DrawLayer.BULLET);

        this.layer = layer;
    }

    onAdded()
    {
        super.onAdded();
        this.addComponent(new Garbage());
        this.addComponent(new RenderCircle(0, 0, 5));
        this.addComponent(new ConstantMotion(this.targRotation));
        const coll = this.addComponent(new CircleCollider(0, 0, 5, this.layer, true));

        coll.onTriggerEnter.register((coll: DetectCollider, res: { other: DetectCollider, result: Result }) => {

            if ((res.other.layer === Layers.PLAYER && coll.layer === Layers.ENEMY_PROJECTILE)
                || (res.other.layer === Layers.ENEMY && coll.layer === Layers.PLAYER_PROJECTILE))
            {
                res.other.getEntity().addComponent(new Damage());
                coll.getEntity().destroy();
            }
        });
        this.addComponent(new DetectRigidbody());
    }
}

export class ConstantMotion extends Component
{
    readonly speed = 0.7;

    constructor(readonly targRotation: number)
    {
        super();
    }
}


export class ConstantMotionMover extends System
{
    types = () => [ConstantMotion, DetectRigidbody];

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, motion: ConstantMotion, body: DetectRigidbody) => {

            const xComp = MathUtil.lengthDirX(motion.speed * delta, motion.targRotation);
            const yComp = MathUtil.lengthDirY(motion.speed * delta, motion.targRotation);

            body.move(xComp, yComp);
        });
    }
}