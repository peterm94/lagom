import {Component} from "../../../ECS/Component";
import {Entity} from "../../../ECS/Entity";
import {System} from "../../../ECS/System";
import {Key} from "../../../Input/Key";
import {Game} from "../../../ECS/Game";
import runnerSprite from "../Art/runner.png";
import adkeys from "../Art/adkeys.png";
import {SpriteSheet} from "../../../Common/Sprite/SpriteSheet";
import {Timer} from "../../../Common/Timer";
import {Log, MathUtil} from "../../../Common/Util";
import {CollisionSystem, DiscreteCollisionSystem} from "../../../Collisions/CollisionSystems";
import {RectCollider} from "../../../Collisions/Colliders";
import {Layers} from "../LD46";
import {AnimatedSprite, AnimationEnd} from "../../../Common/Sprite/AnimatedSprite";
import {RenderRect} from "../../../Common/PIXIComponents";

const runnerSpriteSheet = new SpriteSheet(runnerSprite, 24, 32);
const adkeysSpriteSheet = new SpriteSheet(adkeys, 64, 32);

export class RunningMinigame extends Entity
{
    readonly gameWidth = 100;

    onAdded()
    {
        super.onAdded();

        // Child entities
        this.addChild(new ObstacleSpawner(this.gameWidth));
        this.addChild(new PlayerController(this.gameWidth / 2, 55));
        this.addComponent(new RenderRect(0, 0, this.gameWidth, 100));
        this.addComponent(new AnimatedSprite(adkeysSpriteSheet.textures([[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0]]),
                          {animationEndAction: AnimationEnd.LOOP, animationSpeed: 200, xOffset: -20}));

        // System
        this.scene.addSystem(new ObstacleSystem());
    }
}

class ObstacleSpawner extends Entity
{
    constructor(readonly gameWidth: number)
    {
        super("ObstacleSpawner", 0, 0);
    }

    onAdded()
    {
        super.onAdded();

        const timer = this.addComponent(new Timer(MathUtil.randomRange(3000, 5000), null, true))

        // Entities
        this.addComponent(new ObstacleSpawn());

        timer.onTrigger.register((caller) => {
            this.addChild(new ObstacleController(MathUtil.randomRange(0, this.gameWidth - 12)));

            // Reset.
            caller.remainingMS = MathUtil.randomRange(3000, 5000);
        });
    }
}

class ObstacleSpawn extends Component
{
}

class ObstacleController extends Entity
{
    readonly moveSpeed = 10;

    constructor(x: number)
    {
        super("ObstacleController", x, 0);
    }

    onAdded()
    {
        super.onAdded();

        // Components
        this.addComponent(new Obstacle(this.moveSpeed));
        this.addComponent(new AnimatedSprite(runnerSpriteSheet.textures([[2, 0], [3, 0], [4, 0]]),
                                             {animationEndAction: AnimationEnd.LOOP, animationSpeed: 200}));

        // Collision
        const system = this.scene.getGlobalSystem<DiscreteCollisionSystem>(CollisionSystem);

        if (system == null)
        {
            console.error("No collision system detected!");
        }
        else
        {
            this.addComponent(new RectCollider(system, {width: 24, height: 32, layer: Layers.OBSTACLE}));
        }
    }
}

class Obstacle extends Component
{
    constructor(readonly speed: number)
    {
        super();
    }
}

class PlayerController extends Entity
{
    constructor(x: number, y: number)
    {
        super("PlayerController", x, y);
    }

    onAdded()
    {
        super.onAdded();

        // Sprite
        this.addComponent(new AnimatedSprite(runnerSpriteSheet.textures([[0, 0], [1, 0]]),
                                             {animationEndAction: AnimationEnd.LOOP, animationSpeed: 200}));

        // Component
        this.addComponent(new Player());

        // Collision
        const system = this.scene.getGlobalSystem<DiscreteCollisionSystem>(CollisionSystem);

        if (system == null)
        {
            console.log("No collision system detected!");
            return;
        }
        else
        {
            this.addComponent(new RectCollider(system, {
                width: 24, height: 32, layer: Layers.PLAYER
            })).onTriggerEnter.register((caller, data) => {
                if (caller.parent.getComponent(Jumping) === null)
                {
                    Log.info("HIT");
                }
                else
                {
                    Log.info("Jumping, not hit!");
                }
            });
        }

        // System
        this.scene.addSystem(new JumpSystem());
    }

    onRemoved()
    {
        super.onRemoved();
    }
}

export class Player extends Component
{
}

export class Jumping extends Component
{

}

class ObstacleSystem extends System
{
    public types = () => [Obstacle];

    public update(delta: number): void
    {
        this.runOnEntities((entity: Entity, obstacle: Obstacle) => {
            if (entity.transform.position.y > 150)
            {
                entity.destroy();
            }
            else
            {
                entity.transform.position.y += obstacle.speed * (delta / 1000);
            }
        });
    }
}

class JumpSystem extends System
{
    public types = () => [Player];

    public update(delta: number): void
    {
        this.runOnEntities((entity: Entity) => {

            if (Game.keyboard.isKeyPressed(Key.Space))
            {
                const jumping = entity.addComponent(new Jumping());

                entity.addComponent(new Timer(1000, jumping, false))
                      .onTrigger.register((caller, data) => {
                    data.destroy();
                });
            }
        });
    }
}
