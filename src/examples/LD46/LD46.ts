import {Game} from "../../ECS/Game";
import {Scene} from "../../ECS/Scene";
import {CollisionMatrix} from "../../Collisions/CollisionMatrix";
import {RunningMinigame} from "./Entities/RunningMinigame";
import {BoilingMinigame} from "./Entities/BoilingMinigame";
import {LobsterMinigame} from "./Entities/LobsterMinigame";
import {TimerSystem} from "../../Common/Timer";
import {
    ArrowKeys,
    Background,
    Background2,
    BottomFrame,
    FrameMoverSystem,
    MinigameBackgrounds,
    MouseAnimation,
    SpaceKey,
    TopFrame
} from "./Entities/Background";
import {DiscreteCollisionSystem} from "../../Collisions/CollisionSystems";
import {FrameTriggerSystem} from "../../Common/FrameTrigger";
import {Log, LogLevel} from "../../Common/Util";
import {ScreenShaker} from "../../Common/Screenshake";
import {NetJumpMinigame} from "./Entities/NetJumpMinigame";
import {StartScreen, StartScreenMoverSystem} from "./Entities/StartScreen";
import {GameState} from "./Systems/StartedSystem";
import {EndScreen, EndScreenMoverSystem} from "./Entities/EndScreen";
import {SoundManager} from "./Entities/SoundManager";

const collisionMatrix = new CollisionMatrix();

export enum Layers
{
    OBSTACLE,
    PLAYER,
    CONV_PLAYER,
    CONV_LETTERS,
    CHEF_CHOP_TRIGGER,
    JUMP_NET,
    JUMP_PLAYER
}

export enum DrawLayers
{
    TOP_FRAME = 40,
    MINIGAME_BACKGROUND = 19,
    BACKGROUND = 18,
    BACKGROUND2 = 21,
    MINIGAME = 20,
    LOBSTER_GAME = 50,
    BOTTOM_FRAME = 60
}

export class MainScene extends Scene
{
    onAdded(): void
    {
        super.onAdded();

        this.addGlobalSystem(new TimerSystem());
        this.addGlobalSystem(new FrameTriggerSystem());
        this.addGlobalSystem(new ScreenShaker());

        this.addSystem(new GameState());
        this.addSystem(new FrameMoverSystem());
        this.addSystem(new StartScreenMoverSystem());
        this.addSystem(new EndScreenMoverSystem());

        // Collisions
        collisionMatrix.addCollision(Layers.OBSTACLE, Layers.PLAYER);
        collisionMatrix.addCollision(Layers.CONV_PLAYER, Layers.CONV_LETTERS);
        collisionMatrix.addCollision(Layers.CONV_PLAYER, Layers.CHEF_CHOP_TRIGGER);
        collisionMatrix.addCollision(Layers.CONV_LETTERS, Layers.CHEF_CHOP_TRIGGER);
        collisionMatrix.addCollision(Layers.JUMP_NET, Layers.JUMP_PLAYER);

        this.addGlobalSystem(new DiscreteCollisionSystem(collisionMatrix));

        // this.addGUIEntity(new Diagnostics("white", 8));

        this.addGUIEntity(new SoundManager());
        this.addEntity(new StartScreen());
        this.addEntity(new EndScreen());

        this.addEntity(new ArrowKeys());
        this.addEntity(new SpaceKey());
        this.addEntity(new MouseAnimation());
        this.addEntity(new TopFrame());
        this.addEntity(new BottomFrame());
        this.addEntity(new MinigameBackgrounds());
        this.addEntity(new Background());
        this.addEntity(new Background2());

        // Put any init stuff here
        this.addEntity(new RunningMinigame("runninggame", 220, 0, DrawLayers.MINIGAME));
        // this.addEntity(new Divider());
        this.addEntity(new BoilingMinigame("boilinggame", 110, 0, DrawLayers.MINIGAME))

        this.addEntity(new LobsterMinigame("lobstergame", 0, 64, DrawLayers.LOBSTER_GAME))

        this.addEntity(new NetJumpMinigame("netjumpgame", 0, 0, DrawLayers.MINIGAME));

    }
}

export class LD46 extends Game
{
    constructor()
    {
        super({
                  width: 320,
                  height: 180,
                  resolution: 4,
                  backgroundColor: 0x88965d,
                  antialias: false,
                  fontContext: {
                      custom: {
                          families: ['8bitoperator JVE'],
                          urls: ['css/stylesheet.css']
                      }
                  }
              });

        this.setScene(new MainScene(this));

        Log.logLevel = LogLevel.INFO;
    }
}
