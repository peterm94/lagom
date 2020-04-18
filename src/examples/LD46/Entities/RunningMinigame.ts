import {Entity} from "../../../ECS/Entity";
import {Sprite} from "../../../Common/Sprite/Sprite";
import basicSprite from "../Art/basicSpr.png";
import backgroundSprite from "../Art/backgroundSpr.png";
import {SpriteSheet} from "../../../Common/Sprite/SpriteSheet";

const playerSpriteSheet = new SpriteSheet(basicSprite, 32, 32);
const backgroundSpriteSheet = new SpriteSheet(backgroundSprite, 32, 32);

export class RunningMinigame extends Entity {
    player!: Entity;

    constructor() {
        super("RunningMinigame", 160, 0);
    }

    onAdded() {
        let backgroundConfig = {xScale: 10, yScale: 10};
        super.onAdded();
        
        this.addComponent(new Sprite(backgroundSpriteSheet.textureFromIndex(0), backgroundConfig));
        this.addChild(new RunningMiniGamePlayer());
    }

    onRemoved()
    {
        super.onRemoved();
    }
}

export class RunningMiniGamePlayer extends Entity {
    constructor() {
        super("RunningMiniGamePlayer", 80, 90);
    }

    onAdded() {
        let spriteConfig = {xScale: 0.25, yScale: 0.25, xOffset: 0, yOffset: 0};
        super.onAdded();
        
        // this.addComponent = 
        this.addComponent(new Sprite(playerSpriteSheet.textureFromIndex(0), spriteConfig));
        // this.player = this.getScene().addGUIEntity(new EnemyMarkerE("enemy_marker", 0, 0, DrawLayer.GUI));
    }

    onRemoved()
    {
        super.onRemoved();
    }
}