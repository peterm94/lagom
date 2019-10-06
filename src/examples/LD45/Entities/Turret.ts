import {HexEntity, HexRegister} from "../HexEntity";
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
import {Layers} from "../HexGame";
import {DetectRigidbody} from "../../../DetectCollisions/DetectRigidbody";
import {RenderCircle} from "../../../Common/PIXIComponents";
import {CircleCollider} from "../../../DetectCollisions/DetectColliders";
import {Garbage} from "../Systems/OffScreenGarbageGuy";

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

            targetDir -= entity.transform.rotation + (Math.PI / 2);

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
            const movement = tag.getMovement();
            if (!movement) return;

            // pew pew
            if (movement.shooting)
            {
                // TODO projectile type passthrough
                entity.getScene().addEntity(
                    new Bullet(Layers.PLAYER_PROJECTILE, entity.transform.x, entity.transform.y,
                               spr.sprite!.pixiObj.rotation + (entity.transform.rotation + Math.PI / 2)));
            }
        });
    }
}


export class Bullet extends Entity
{
    constructor(layer: Layers, x: number, y: number, private targRotation: number)
    {
        super("bullet", x, y);

        this.layer = layer;
    }

    onAdded()
    {
        super.onAdded();
        this.addComponent(new Garbage());
        this.addComponent(new DetectRigidbody());
        this.addComponent(new RenderCircle(0, 0, 5));
        this.addComponent(new CircleCollider(0, 0, 5, this.layer, true));
        this.addComponent(new ConstantMotion(this.targRotation));
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