import * as PIXI from "pixi.js";
import {Component} from "../../../ECS/Component";
import {Entity} from "../../../ECS/Entity";
import {System} from "../../../ECS/System";
import {Key} from "../../../Input/Key";
import {Game} from "../../../ECS/Game";
import runnerSprite from "../Art/runner.png";
import {SpriteSheet} from "../../../Common/Sprite/SpriteSheet";
import {Timer} from "../../../Common/Timer";
import {Log, MathUtil, Util} from "../../../Common/Util";
import {CollisionSystem, DiscreteCollisionSystem} from "../../../Collisions/CollisionSystems";
import {RectCollider} from "../../../Collisions/Colliders";
import {Layers, MainScene} from "../LD46";
import {AnimatedSprite, AnimationEnd} from "../../../Common/Sprite/AnimatedSprite";
import {ConveyorMoveSystem} from "../Entities/LobsterMinigame";
import {GameState} from "../Systems/StartedSystem";
import {backgroundSheet, MoverComponent} from "./Background";
import {SoundManager} from "./SoundManager";
import {ScreenShake} from "../../../Common/Screenshake";

const runnerSpriteSheet = new SpriteSheet(runnerSprite, 24, 32);

export class RunningMinigame extends Entity
{
    readonly gameWidth = 100;

    onAdded()
    {
        super.onAdded();

        this.addComponent(new Timer(100, null, true)).onTrigger.register(caller =>
        {
            // Wait for sync up trigger, then wait 40 seconds for the minigame to load
            if (GameState.GameRunning == "SYNC-UP")
            {
                caller.remainingMS = 42000;

                return;
            }

            if (GameState.GameRunning != "RUNNING")
            {
                caller.remainingMS = 100;

                return;
            }
            // Child entities
            this.addComponent(new MoverComponent());
            this.addChild(new ObstacleSpawner(this.gameWidth));
            this.addChild(new PlayerController(this.gameWidth / 2, 55));

            // System
            this.scene.addSystem(new ObstacleSystem());
            caller.destroy();
        });
    }
}

class ObstacleSpawner extends Entity
{
    readonly spawnSpots = [10, 30, 50, 70];

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
            if (GameState.GameRunning != "RUNNING") return;

            this.addChild(new ObstacleController(this.spawnSpots[Math.floor(Math.random() * this.spawnSpots.length)]));

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
            this.addComponent(
                new RectCollider(system, {xOff: 7, yOff: 18, width: 10, height: 10, layer: Layers.OBSTACLE}));
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
                xOff: 7, yOff: 5, width: 10, height: 8, layer: Layers.PLAYER
            })).onTriggerEnter.register((caller, data) => {
                if (caller.parent.getComponent(Jumping) === null)
                {
                    const flash = new AnimatedSprite(backgroundSheet.textureSliceFromRow(0, 8, 8), {
                        animationSpeed: 1000,
                        animationEndAction: AnimationEnd.STOP,
                        xOffset: -220
                    });

                    this.parent?.addComponent(flash)

                    this.addComponent(new Timer(500, null, false)).onTrigger.register(_ => {
                        this.parent?.removeComponent(flash, true);
                    });

                    this.addComponent(new ScreenShake(0.25, 500));

                    (this.scene.getEntityWithName("audio") as SoundManager).playSound(
                        Util.choose("hurt1", "hurt2", "hurt3"));

                    // bad for nwo
                    ConveyorMoveSystem.increaseConveyor();
                }
                else
                {
                    Log.info("Jumping, not hit!");
                }
            });
        }

        // System
        this.scene.addSystem(new MoveSystem());
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
        // cleanup
        if (GameState.GameRunning == "DIED")
        {
            this.runOnEntities((entity: Entity, obstacle: Obstacle) => {
                entity.destroy();
            });
        }

        if (GameState.GameRunning != "RUNNING") return;

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

class MoveSystem extends System
{
    public types = () => [Player];

    public update(delta: number): void
    {
        if (GameState.GameRunning != "RUNNING") return;

        this.runOnEntities((entity: Entity) => {
            if ((Game.keyboard.isKeyPressed(Key.KeyA) || Game.keyboard.isKeyPressed(Key.ArrowLeft))
                && entity.transform.position.x > 10)
            {
                entity.transform.position.x -= 20;
                (this.scene.getEntityWithName("audio") as SoundManager).playSound("hop");

                // const jumping = entity.addComponent(new Jumping());

                // entity.addComponent(new Timer(1000, jumping, false))
                //       .onTrigger.register((caller, data) => {
                //     data.destroy();
                // });
            }
            else if ((Game.keyboard.isKeyPressed(Key.KeyD) || Game.keyboard.isKeyPressed(Key.ArrowRight))
                && entity.transform.position.x < 70)
            {
                entity.transform.position.x += 20;
                (this.scene.getEntityWithName("audio") as SoundManager).playSound("hop");
            }
        });
    }
}
