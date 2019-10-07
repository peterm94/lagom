import {Damage, HexEntity} from "../HexEntity";
import {AnimatedSprite, AnimationEnd} from "../../../Common/Sprite/AnimatedSprite";
import {System} from "../../../ECS/System";
import {Component} from "../../../ECS/Component";
import {ConstantMotion, Movement} from "../Movement";
import {Entity} from "../../../ECS/Entity";
import {MathUtil} from "../../../Common/Util";
import {DrawLayer, Layers} from "../HexGame";
import {DetectRigidbody} from "../../../DetectCollisions/DetectRigidbody";
import {CircleCollider, DetectCollider} from "../../../DetectCollisions/DetectColliders";
import {Result} from "detect-collisions";
import {Timer} from "../../../Common/Timer";
import {AnimatedSpriteController} from "../../../Common/Sprite/AnimatedSpriteController";
import {ScreenShake} from "../../../Common/Screenshake";

import explosionSpr from "../art/explosion.png"
import {SpriteSheet} from "../../../Common/Sprite/SpriteSheet";

const explosionSheet = new SpriteSheet(explosionSpr, 32, 32);

export enum TurretAnimationStates
{
    OFF,
    SHOOTING,
    COOLING
}

export class TurretTag extends Component
{
    canShoot: boolean = true;

    constructor(public bulletSprite: () => AnimatedSprite,
                public shootingTime: number,
                public cooldownTime: number,
                public bulletSpeed: number,
                public bulletDamage: number)
    {
        super()
    }

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

                    let bulletLayer: Layers;
                    if (entity.layer === Layers.PLAYER)
                    {
                        bulletLayer = Layers.PLAYER_PROJECTILE;
                    }
                    else
                    {
                        bulletLayer = Layers.ENEMY_PROJECTILE;
                    }


                    entity.getScene().addEntity(
                        new Bullet(bulletLayer,
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

export class Explosion extends Entity
{
    constructor(x: number, y: number)
    {
        super("explosion", x, y, DrawLayer.EXPLOSION);
    }

    onAdded()
    {
        super.onAdded();

        this.addComponent(new AnimatedSpriteController(0, [
            {
                config: {
                    animationEndAction: AnimationEnd.STOP,
                    rotation: MathUtil.degToRad(MathUtil.randomRange(0, 360)),
                    animationSpeed: 120,
                    xAnchor: 0.5,
                    yAnchor: 0.5
                },
                textures: explosionSheet.textureSliceFromRow(0, 0, 7),
                id: 0,
            }
        ])).addEvent(0, 8, () => this.destroy());
    }
}

export class Bullet extends Entity
{
    private sprite!: AnimatedSprite;

    constructor(layer: Layers, x: number, y: number,
                private targRotation: number,
                private spriteCreator: () => AnimatedSprite,
                private speed: number,
                private damage: number)
    {
        super("bullet", x, y, DrawLayer.BULLET);

        this.layer = layer;
    }

    onAdded()
    {
        super.onAdded();

        this.addComponent(new Timer(6000, undefined)).onTrigger.register(caller => {
            caller.getEntity().destroy()
        });
        this.sprite = this.addComponent(this.spriteCreator());

        this.addComponent(new ConstantMotion(this.targRotation, this.speed));
        const coll = this.addComponent(new CircleCollider(0, 0, 2, this.layer, true));

        coll.onTriggerEnter.register((coll: DetectCollider, res: { other: DetectCollider, result: Result }) => {

            if ((res.other.layer === Layers.PLAYER && coll.layer === Layers.ENEMY_PROJECTILE)
                || (res.other.layer === Layers.ENEMY && coll.layer === Layers.PLAYER_PROJECTILE))
            {
                const otherE = res.other.getEntity();
                otherE.addComponent(new Damage(this.damage));
                otherE.addComponent(new ScreenShake(0.2, 60));
                this.getScene().addEntity(new Explosion(otherE.transform.x + 16, otherE.transform.y));
                coll.getEntity().destroy();
            }
        });
        this.addComponent(new DetectRigidbody());
    }
}
