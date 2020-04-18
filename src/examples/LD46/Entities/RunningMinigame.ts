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
import {MathUtil} from "../../../Common/Util";
import {DiscreteCollisionSystem, CollisionSystem} from "../../../Collisions/CollisionSystems";
import {BodyType, CircleCollider, Collider, RectCollider} from "../../../Collisions/Colliders";
import {Layers} from "../LD46";

const playerSpriteSheet = new SpriteSheet(basicSprite, 32, 32);
const backgroundSpriteSheet = new SpriteSheet(backgroundSprite, 32, 32);
const obstacleSpriteSheet = new SpriteSheet(obstacleSprite, 32, 32);

export class RunningMinigame extends Entity 
{

    backgroundConfig = {xScale: 5, yScale: 5};
    constructor() 
    {
        super("RunningMinigame", 160, 0);
    }

    onAdded() 
    {
        super.onAdded();
        
        // Sprites
        this.addComponent(new Sprite(backgroundSpriteSheet.textureFromIndex(0), this.backgroundConfig));

        // Child entities
        this.addChild(new ObstacleSpawner());
        this.addChild(new PlayerController());

        // System
        this.scene.addSystem(new ObstacleSystem());
    }

    onRemoved()
    {
        super.onRemoved();
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

        timer.onTrigger.register((caller, data) =>
        {
            this.addChild(new ObstacleController());
            caller.remainingMS = MathUtil.randomRange(3000, 5000);
        });
    }
}

class ObstacleSpawn extends Component {}

class ObstacleController extends Entity 
{
    moveSpeed: number;

    constructor() 
    {
        super("ObstacleController", 57, 0);
        this.moveSpeed = 10;
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
            this.addComponent(new RectCollider(system, {width: 500, height: 500, layer: Layers.LAYER1}));
        }
    }
}

class Obstacle extends Component 
{
    constructor(readonly speed: number) 
    {
        super();
    }

    onAdded() 
    {
        super.onAdded();
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
        let spriteConfig = {xScale: 0.25, yScale: 0.25, xOffset: 0, yOffset: 0};
        super.onAdded();
        
        // Sprite
        this.addComponent(new Sprite(playerSpriteSheet.textureFromIndex(0), spriteConfig));

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
            this.addComponent(new RectCollider(system, {width: 50, height: 50, layer: Layers.LAYER1}))
            .onTriggerEnter.register(() => console.log("HELP"));
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
    constructor() 
    {
        super();
    }

    onAdded() 
    {
        super.onAdded();
    }
}

class ObstacleSystem extends System 
{   
    public types = () => [Obstacle];

    public update(delta: number): void
    {
        this.runOnEntities((entity: Entity, obstacle: Obstacle) => 
        {
            if (entity.transform.position.y > 150) {
                entity.destroy();
            } else {
                entity.transform.position.y += obstacle.speed * (delta / 1000);
            }
        });
    }
}

class JumpSystem extends System 
{   
    timeElapsed: number = 0;
    public types = () => [Player];

    public update(delta: number): void
    {
        if (this.timeElapsed > 0) 
        {
            this.timeElapsed -= delta;
        }
        
        this.runOnEntities((entity: Entity, runningPlayer: Player) => 
        {
            if (this.timeElapsed <= 0) 
            {
                console.log("COLLIDER BACK ON!");
                entity.getComponent(RectCollider)!.active = true;
            }
            if (Game.keyboard.isKeyReleased(Key.Space)) 
            {
                if (!entity.getComponent(RectCollider))
                {
                    console.log("No collider on player!");
                    return;
                } 
                else 
                {
                    this.timeElapsed = 1000;
                    // Do animation  
                    entity.getComponent(RectCollider)!.active = false;
                }
            }
        });
    }
}
