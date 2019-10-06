import {Damage, HexEntity, HexRegister} from "../HexEntity";
import {Hex} from "../Hexagons/Hex";
import {Sprite} from "../../../Common/Sprite/Sprite";
import {AnimatedSprite, AnimationEnd} from "../../../Common/Sprite/AnimatedSprite";
import {SpriteSheet} from "../../../Common/Sprite/SpriteSheet";
import {System} from "../../../ECS/System";
import {Component} from "../../../ECS/Component";
import {ConstantMotion, Movement} from "../Movement";
import {Entity} from "../../../ECS/Entity";
import {MathUtil} from "../../../Common/Util";
import {DrawLayer, Layers} from "../HexGame";
import {DetectRigidbody} from "../../../DetectCollisions/DetectRigidbody";
import {CircleCollider, DetectCollider} from "../../../DetectCollisions/DetectColliders";
import {Garbage} from "../Systems/OffScreenGarbageGuy";
import {Result} from "detect-collisions";
import {Timer} from "../../../Common/Timer";
import {AnimatedSpriteController} from "../../../Common/Sprite/AnimatedSpriteController";

export enum TurretAnimationStates
{
    OFF,
    SHOOTING,
    COOLING
}

export class TurretTag extends Component
{
    canShoot: boolean = true;

    constructor(public bulletSprite: Component,
                public shootingTime: number,
                public cooldownTime: number,
                public bulletSpeed: number,
                public bulletDamage: number) { super() }

    public getMovement(): Movement | null
    {
        const entity = this.getEntity() as HexEntity;
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
    types = () => [TurretTag, AnimatedSpriteController];

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, tag: TurretTag, spr: AnimatedSpriteController) => {
            if (!tag.canShoot) return;

            const movement = tag.getMovement();
            if (!movement) return;

            // pew pew
            if (movement.shooting)
            {
                tag.canShoot = false;

                spr.setAnimation(TurretAnimationStates.SHOOTING);

                entity.addComponent(new Timer(tag.shootingTime, null)).onTrigger.register(() => {

                    entity.getScene().addEntity(
                        new Bullet(Layers.PLAYER_PROJECTILE,
                                   entity.transform.x,
                                   entity.transform.y,
                                   spr.sprite!.pixiObj.rotation + entity.transform.rotation,
                                   tag.bulletSprite,
                                   tag.bulletSpeed,
                                   tag.bulletDamage));

                    spr.setAnimation(TurretAnimationStates.COOLING);

                    entity.addComponent(new Timer(tag.cooldownTime, null)).onTrigger.register(() => {
                        tag.canShoot = true;
                        spr.setAnimation(TurretAnimationStates.OFF);
                    })
                });
            }
        });
    }
}

export class Bullet extends Entity
{
    constructor(layer: Layers, x: number, y: number,
                private targRotation: number,
                private sprite: Component,
                private speed: number,
                private damage: number)
    {
        super("bullet", x, y, DrawLayer.BULLET);

        this.layer = layer;
    }

    onAdded()
    {
        super.onAdded();
        this.addComponent(new Garbage());

        this.addComponent(this.sprite);

        this.addComponent(new ConstantMotion(this.targRotation, this.speed));
        const coll = this.addComponent(new CircleCollider(0, 0, 4, this.layer, true));

        coll.onTriggerEnter.register((coll: DetectCollider, res: { other: DetectCollider, result: Result }) => {

            if ((res.other.layer === Layers.PLAYER && coll.layer === Layers.ENEMY_PROJECTILE)
                || (res.other.layer === Layers.ENEMY && coll.layer === Layers.PLAYER_PROJECTILE))
            {
                res.other.getEntity().addComponent(new Damage(this.damage));
                coll.getEntity().destroy();
            }
        });
        this.addComponent(new DetectRigidbody());
    }
}