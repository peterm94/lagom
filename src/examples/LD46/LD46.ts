import {Game} from "../../ECS/Game";
import {Scene} from "../../ECS/Scene";
import {Diagnostics} from "../../Common/Debug";
import {CollisionMatrix} from "../../Collisions/CollisionMatrix";
import {RunningMinigame} from "./Entities/RunningMinigame";
import {Entity} from "../../ECS/Entity";
import {RenderRect} from "../../Common/PIXIComponents";
import {LobsterMinigame} from "./Entities/LobsterMinigame";
import {TimerSystem} from "../../Common/Timer";
import {TopFrame, MinigamePanes, BottomFrame} from "./Entities/Background";
import {DiscreteCollisionSystem} from "../../Collisions/CollisionSystems";
import {FrameTriggerSystem} from "../../Common/FrameTrigger";
import {Log, LogLevel} from "../../Common/Util";
import {ScreenShaker} from "../../Common/Screenshake";
import {NetJumpMinigame} from "./Entities/NetJumpMinigame";

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
    FRAME = 120,
    MINIGAME_PANES = 90,
    MINIGAME = 100,
    LOBSTER = 150,
    BOTTOM_FRAME = 200
}

class MainScene extends Scene
{
    onAdded(): void
    {
        super.onAdded();

        this.addGlobalSystem(new TimerSystem());
        this.addGlobalSystem(new FrameTriggerSystem());
        this.addGlobalSystem(new ScreenShaker());

        // Collisions
        collisionMatrix.addCollision(Layers.OBSTACLE, Layers.PLAYER);
        collisionMatrix.addCollision(Layers.CONV_PLAYER, Layers.CONV_LETTERS);
        collisionMatrix.addCollision(Layers.CONV_PLAYER, Layers.CHEF_CHOP_TRIGGER);
        collisionMatrix.addCollision(Layers.CONV_LETTERS, Layers.CHEF_CHOP_TRIGGER);
        collisionMatrix.addCollision(Layers.JUMP_NET, Layers.JUMP_PLAYER);

        this.addGlobalSystem(new DiscreteCollisionSystem(collisionMatrix));

        this.addGUIEntity(new Diagnostics("black", 8));
        this.addEntity(new TopFrame())
        this.addEntity(new BottomFrame())
        this.addEntity(new MinigamePanes())

        // Put any init stuff here
        this.addEntity(new RunningMinigame("runninggame", 220, 0, DrawLayers.MINIGAME));
        // this.addEntity(new Divider());

        this.addEntity(new LobsterMinigame("lobstergame", 0, 64, DrawLayers.LOBSTER))

        this.addEntity(new NetJumpMinigame("netjumpgame", 0, 0, DrawLayers.MINIGAME));

    }
}

export class Divider extends Entity
{
    constructor()
    {
        super("Divider", 159, 0);
    }

    public onAdded()
    {
        super.onAdded();

        this.addComponent(new RenderRect(0, 0, 1, 320, null, 0x000));
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
