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
        super("ObstacleSpawner", 10 , 10);
    }

    onAdded() 
    {
        super.onAdded();

        const timer = this.addComponent(new Timer(MathUtil.randomRange(300, 1000), null, true))

        // Entities
        this.addComponent(new ObstacleSpawn());
        // this.addChild(new ObstacleController());

        // Systems
        // this.scene.addSystem(new ObstacleSpawnSystem());
        timer.onTrigger.register((caller, data) =>
        {
            console.log("trigger");
            this.addChild(new ObstacleController());
            caller.remainingMS = MathUtil.randomRange(300, 1000);
        });
    }
}

class ObstacleSpawn extends Component {}

class ObstacleController extends Entity 
{
    constructor() 
    {
        super("ObstacleController", 60, 0);
    }

    onAdded() 
    {
        super.onAdded();

        // this.timer = new Timer(MathUtil.randomRange(300, 1000), null);

        // Components
        this.addComponent(new Obstacle(1));
        this.addComponent(new Sprite(obstacleSpriteSheet.textureFromIndex(0)));
        

        // System
        this.scene.addSystem(new ObstacleSystem());
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

    onAdded() {
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
            if (entity.transform.position.y > 100) {
                entity.destroy();
            } else {
                entity.transform.position.y += (obstacle.speed / delta);
            }
        });
    }
}

class JumpSystem extends System 
{   
    public types = () => [Player];

    public update(delta: number): void
    {
        this.runOnEntities((entity: Entity, runningPlayer: Player) => 
        {
            if (Game.keyboard.isKeyReleased(Key.Space)) 
            {
                    // do animation  
                    // second of immunity
            }
        });
    }
}
