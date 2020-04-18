import {Component} from "../../../ECS/Component";
import {Entity} from "../../../ECS/Entity";
import {Sprite} from "../../../Common/Sprite/Sprite";
import {System} from "../../../ECS/System";
import {Key} from "../../../Input/Key";
import {Game} from "../../../ECS/Game";
import basicSprite from "../Art/basicSpr.png";
import backgroundSprite from "../Art/backgroundSpr.png";
import {SpriteSheet} from "../../../Common/Sprite/SpriteSheet";

const playerSpriteSheet = new SpriteSheet(basicSprite, 32, 32);
const backgroundSpriteSheet = new SpriteSheet(backgroundSprite, 32, 32);

export class RunningMinigame extends Entity {

    constructor() {
        super("RunningMinigame", 160, 0);
    }

    onAdded() {
        super.onAdded();
        
        this.addChild(new BackgroundController());
        this.addChild(new PlayerController());
    }

    onRemoved()
    {
        super.onRemoved();
    }
}

class BackgroundController extends Entity {
    constructor() {
        super("BackgroundController")
    }

    onAdded() {
        let backgroundConfig = {xScale: 2, yScale: 2};
        super.onAdded();

        // Sprite
        this.addComponent(new Sprite(backgroundSpriteSheet.textureFromIndex(0), backgroundConfig));

        // Component
        this.addComponent(new Background());

        // System
        this.scene.addSystem(new InfiniteRunnerSystem());
    }

    onRemoved()
    {
        super.onRemoved();
    }
}

class Background extends Component {
    constructor() {
        super();
    }

    onAdded() {
        super.onAdded();
    }
}

class PlayerController extends Entity {
    constructor() {
        super("PlayerController", 80, 90);
    }

    onAdded() {
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

export class Player extends Component {
    constructor() {
        super();
    }

    onAdded() {
        super.onAdded();
    }
}

class InfiniteRunnerSystem extends System {   
    public types = () => [Background];

    public update(delta: number): void
    {
        this.runOnEntities((entity: Entity, runningPlayer: Background) => {
            entity.transform.position.y += 0.2;
        });
    }
}

class JumpSystem extends System {   
    public types = () => [Player];

    public update(delta: number): void
    {
        this.runOnEntities((entity: Entity, runningPlayer: Player) => {
            if (Game.keyboard.isKeyReleased(Key.Space)) {
                    // do animation  
            }
        });
    }
}