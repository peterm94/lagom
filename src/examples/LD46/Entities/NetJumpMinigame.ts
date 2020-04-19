import {Entity} from "../../../ECS/Entity";
import runnerSprite from "../Art/actual_runner.png"
import {SpriteSheet} from "../../../Common/Sprite/SpriteSheet";
import {AnimatedSprite, AnimationEnd} from "../../../Common/Sprite/AnimatedSprite";
import {Sprite} from "../../../Common/Sprite/Sprite";
import {Component} from "../../../ECS/Component";
import {System} from "../../../ECS/System";
import {CollisionSystem, DiscreteCollisionSystem} from "../../../Collisions/CollisionSystems";
import {RectCollider} from "../../../Collisions/Colliders";
import {Layers} from "../LD46";
import {Log, MathUtil} from "../../../Common/Util";
import {Key} from "../../../Input/Key";
import {Game} from "../../../ECS/Game";
import {Timer} from "../../../Common/Timer";

const runnerSpriteSheet = new SpriteSheet(runnerSprite, 32, 32);

const floorY = 80;

class Lobster extends Entity
{
    onAdded(): void
    {
        super.onAdded();

        this.addComponent(new Jump());
        this.addComponent(new AnimatedSprite(runnerSpriteSheet.textureSliceFromRow(0, 0, 1),
                                             {animationSpeed: 150, animationEndAction: AnimationEnd.LOOP}));

        // Collision
        const system = this.scene.getGlobalSystem<DiscreteCollisionSystem>(CollisionSystem);

        if (system === null)
        {
            console.log("No collision system detected!");
            return;
        }
        else
        {
            let coll = this.addComponent(
                new RectCollider(system, {xOff: 10, yOff: 20, width: 10, height: 10, layer: Layers.JUMP_NET}))

            coll.onTriggerEnter.register((caller, data) => {
                Log.info("dead");
            })
        }
    }
}

enum JumpState
{
    Ground,
    Jumping
}

class Jump extends Component
{
    yVel = 0;
    drag = 0.0015;
    state = JumpState.Ground;
    gravity = 0.06;
}

class MoveLeft extends Component
{
}

class JumpSystem extends System
{
    types = () => [Jump]

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, jump: Jump) => {

            if (jump.state === JumpState.Ground && Game.keyboard.isKeyPressed(Key.Space))
            {
                jump.state = JumpState.Jumping;
                jump.yVel = -4;
            }
            else if (jump.state === JumpState.Jumping)
            {
                jump.yVel -= jump.yVel * jump.drag * delta;
                entity.transform.y += jump.yVel;

                // Gravity
                entity.transform.y += jump.gravity * delta;

                if (entity.transform.y >= floorY)
                {
                    entity.transform.y = floorY;
                    jump.state = JumpState.Ground;
                    jump.yVel = 0;
                }
            }
        });
    }
}


class MoveLefter extends System
{
    types = () => [MoveLeft]

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity) => {
            entity.transform.position.x -= (delta / 1000) * 40;

            if (entity.transform.position.x < -100)
            {
                entity.destroy();
            }
        })
    }
}

class Net extends Entity
{
    onAdded(): void
    {
        super.onAdded();

        this.addComponent(new Sprite(runnerSpriteSheet.texture(2, 0)));
        this.addComponent(new MoveLeft());

        // Collision
        const system = this.scene.getGlobalSystem<DiscreteCollisionSystem>(CollisionSystem);

        if (system == null)
        {
            console.log("No collision system detected!");
            return;
        }
        else
        {
            this.addComponent(
                new RectCollider(system, {xOff: 10, yOff: 20, width: 10, height: 10, layer: Layers.JUMP_NET}))
        }
    }
}


export class NetJumpMinigame extends Entity
{
    onAdded(): void
    {
        super.onAdded();

        this.addChild(new Lobster("lobby", 5, floorY));


        this.addComponent(new Timer(100, null, true)).onTrigger.register(caller => {
            caller.parent.addChild(new Net("net", 100, floorY));

            // 4 seconds is probably the fastest it should come out
            caller.remainingMS = MathUtil.randomRange(4000, 10000);
        })

        this.scene.addSystem(new MoveLefter());
        this.scene.addSystem(new JumpSystem());
    }
}
