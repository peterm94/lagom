import {Game} from "../../ECS/Game";
import {Scene} from "../../ECS/Scene";
import {Diagnostics} from "../../Common/Debug";
import {CollisionMatrix} from "../../Collisions/CollisionMatrix";
import {RunningMinigame} from "./Entities/RunningMinigame";
import {BoilingMinigame} from "./Entities/BoilingMinigame";
import {Entity} from "../../ECS/Entity";
import {RenderRect} from "../../Common/PIXIComponents";
import {LobsterMinigame} from "./Entities/LobsterMinigame";
import {TimerSystem} from "../../Common/Timer";
import {
    TopFrame,
    MinigameBackgrounds,
    BottomFrame,
    ArrowKeys,
    SpaceKey,
    MouseAnimation,
    Background, FrameMoverSystem, Background2
} from "./Entities/Background";
import {DiscreteCollisionSystem} from "../../Collisions/CollisionSystems";
import {FrameTriggerSystem} from "../../Common/FrameTrigger";
import {Log, LogLevel} from "../../Common/Util";
import {ScreenShaker} from "../../Common/Screenshake";
import {NetJumpMinigame} from "./Entities/NetJumpMinigame";
import {StartScreen, StartScreenMoverSystem} from "./Entities/StartScreen";
import {GameState} from "./Systems/StartedSystem";
import {EndScreen, EndScreenMoverSystem} from "./Entities/EndScreen";
import {AudioAtlas} from "../../Audio/AudioAtlas";
import {System} from "../../ECS/System";

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
    audioAtlas: AudioAtlas;

    constructor(game: Game)
    {
        super(game);

        // Load sounds
        this.audioAtlas = new AudioAtlas();
        const music = this.audioAtlas.load("music", require("./Audio/music.mp3"));
        music.loop(true);
        music.volume(0.4);

        this.audioAtlas.load("chop1", require("./Audio/chop1.wav"));
        this.audioAtlas.load("chop2", require("./Audio/chop2.wav"));
        this.audioAtlas.load("chop3", require("./Audio/chop3.wav"));
        this.audioAtlas.load("hop", require("./Audio/hop.wav")).volume(0.5);
        this.audioAtlas.load("jump", require("./Audio/jump.wav")).volume(0.5);
        this.audioAtlas.load("hurt1", require("./Audio/hurt1.wav")).volume(0.5);
        this.audioAtlas.load("hurt2", require("./Audio/hurt2.wav")).volume(0.5);
        this.audioAtlas.load("hurt3", require("./Audio/hurt3.wav")).volume(0.5);
    }


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
        this.addEntity(new BoilingMinigame("lobstergame", 110, 0, DrawLayers.LOBSTER_GAME))

        this.addEntity(new LobsterMinigame("lobstergame", 0, 64, DrawLayers.LOBSTER_GAME))

        this.addEntity(new NetJumpMinigame("netjumpgame", 0, 0, DrawLayers.MINIGAME));

        //this.audioAtlas.play("music");
    }

    destroy(): void
    {
        super.destroy();

        this.audioAtlas.sounds.forEach((k, v) => k.stop())
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
                  antialias: false
              });

        this.setScene(new MainScene(this));

        Log.logLevel = LogLevel.INFO;
    }
}
