import {Component} from "../../../ECS/Component";
import {Entity} from "../../../ECS/Entity";
import {Sprite} from "../../../Common/Sprite/Sprite";
import {System} from "../../../ECS/System";
import {Key} from "../../../Input/Key";
import {Game} from "../../../ECS/Game";
import basicSprite from "../Art/basicSpr.png";
import backgroundSprite from "../Art/backgroundSpr.png";
import obstacleSprite from "../Art/obstacleSpr.png";
import {SpriteSheet} from "../../../Common/Sprite/SpriteSheet";
import {Timer} from "../../../Common/Timer";
import {Log, MathUtil} from "../../../Common/Util";
import {CollisionSystem, DiscreteCollisionSystem} from "../../../Collisions/CollisionSystems";
import {RectCollider} from "../../../Collisions/Colliders";
import {Layers} from "../LD46";

const playerSpriteSheet = new SpriteSheet(basicSprite, 32, 32);
const backgroundSpriteSheet = new SpriteSheet(backgroundSprite, 32, 32);
const obstacleSpriteSheet = new SpriteSheet(obstacleSprite, 32, 32);

export class RunningMinigame extends Entity
{

    backgroundConfig = {xScale: 5, yScale: 5};
    // constructor() 
    // {
    //     super("RunningMinigame", 160, 0);
    // }

    onAdded()
    {
        super.onAdded();

        // Sprites
        // this.addComponent(new Sprite(backgroundSpriteSheet.textureFromIndex(0), this.backgroundConfig));

        // Child entities
        this.addChild(new ObstacleSpawner());
        this.addChild(new PlayerController());

        // System
        this.scene.addSystem(new ObstacleSystem());
    }
}

class ObstacleSpawner extends Entity
{
    constructor()
    {
        super("ObstacleSpawner", 10, 10);
    }

    onAdded()
    {
        super.onAdded();

        const timer = this.addComponent(new Timer(MathUtil.randomRange(3000, 5000), null, true))

        // Entities
        this.addComponent(new ObstacleSpawn());

        timer.onTrigger.register((caller) => {
            this.addChild(new ObstacleController());

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

    constructor()
    {
        super("ObstacleController", 57, 0);
    }

    onAdded()
    {
        super.onAdded();

        // Components
        this.addComponent(new Obstacle(this.moveSpeed));
        this.addComponent(new Sprite(obstacleSpriteSheet.textureFromIndex(0)));

        // Collision
        const system = this.scene.getGlobalSystem<DiscreteCollisionSystem>(CollisionSystem);

        if (system == null)
        {
            console.error("No collision system detected!");
        }
        else
        {
            this.addComponent(new RectCollider(system, {width: 32, height: 32, layer: Layers.OBSTACLE}));
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
    cantBeKilled: boolean = false;

    constructor()
    {
        super("PlayerController", 80, 90);
    }

    onAdded()
    {
        super.onAdded();

        // Sprite
        this.addComponent(new Sprite(playerSpriteSheet.textureFromIndex(0)));

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
                width: 32, height: 32, layer: Layers.PLAYER
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
