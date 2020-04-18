import {Component} from "../../../ECS/Component";
import {Entity} from "../../../ECS/Entity";
import {Sprite} from "../../../Common/Sprite/Sprite";
import basicSprite from "../Art/basicSpr.png";
import backgroundSprite from "../Art/backgroundSpr.png";
import {SpriteSheet} from "../../../Common/Sprite/SpriteSheet";
import {RunningMinigameInfiniteRunner} from "../Systems/RunningMinigame/RunningMinigameInfiniteRunner";
import {RunningMinigameJump} from "../Systems/RunningMinigame/RunningMinigameJump";

const playerSpriteSheet = new SpriteSheet(basicSprite, 32, 32);
const backgroundSpriteSheet = new SpriteSheet(backgroundSprite, 32, 32);

export class RunningMinigame extends Entity {

    constructor() {
        super("RunningMinigame", 160, 0);
    }

    onAdded() {
        super.onAdded();
        
        this.addChild(new RunningMinigameBackgroundController());
        this.addChild(new RunningMinigamePlayerController());
    }

    onRemoved()
    {
        super.onRemoved();
    }
}

export class RunningMinigameBackgroundController extends Entity {
    constructor() {
        super("RunningMinigameBackgroundController")
    }

    onAdded() {
        let backgroundConfig = {xScale: 2, yScale: 2};
        super.onAdded();

        // Sprite
        this.addComponent(new Sprite(backgroundSpriteSheet.textureFromIndex(0), backgroundConfig));

        // Component
        this.addComponent(new RunningMinigameBackground());

        // System
        this.scene.addSystem(new RunningMinigameInfiniteRunner());
    }

    onRemoved()
    {
        super.onRemoved();
    }
}

export class RunningMinigameBackground extends Component {
    constructor() {
        super();
    }

    onAdded() {
        super.onAdded();
    }
}

export class RunningMinigamePlayerController extends Entity {
    constructor() {
        super("RunningMinigamePlayer", 80, 90);
    }

    onAdded() {
        let spriteConfig = {xScale: 0.25, yScale: 0.25, xOffset: 0, yOffset: 0};
        super.onAdded();
        
        // Sprite
        this.addComponent(new Sprite(playerSpriteSheet.textureFromIndex(0), spriteConfig));

        // Component
        this.addComponent(new RunningMinigamePlayer());

        // System
        this.scene.addSystem(new RunningMinigameJump());
    }

    onRemoved()
    {
        super.onRemoved();
    }
}

export class RunningMinigamePlayer extends Component {
    constructor() {
        super();
    }

    onAdded() {
        super.onAdded();
    }
}