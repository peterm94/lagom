import {Game} from "../../ECS/Game";
import {Scene} from "../../ECS/Scene";
import {CollisionMatrix} from "../../LagomCollisions/CollisionMatrix";
import {FrameTriggerSystem} from "../../Common/FrameTrigger";
import {DetectCollisionSystem} from "../../DetectCollisions/DetectCollisions";
import {FollowCamera} from "../../Common/CameraUtil";
import {Diagnostics} from "../../Common/Debug";
import {EnemyMarkerSystem} from "./Entities/Enemy";
import {ClearMovement, ConstantMotionMover, Mover, MoveWithPlayer, PlayerControls} from "./Movement";
import {ThrusterAnimationSystem} from "./Systems/ThrusterAnimationSystem";
import {TimerSystem} from "../../Common/Timer";
import {Player} from "./Entities/Player";
import {ScreenShaker} from "../../Common/Screenshake";
import {TurretShooter, TurretSystem} from "./Entities/Turret";
import {DamageSystem} from "./HexEntity";
import {Background, TileMover} from "./Background";
import {GameDirector} from "./Systems/GameDirector";
import {EnemyAI} from "./Systems/EnemyAI";

export enum Layers
{
    PLAYER,
    PLAYER_PROJECTILE,
    ENEMY_PROJECTILE,
    ENEMY,
    FREE_FLOAT,
    NONE
}

export enum DrawLayer
{
    GUI = 1000,
    BLOCK = 0,
    SHIELD = 50,
    BULLET = 100,
    BACKGROUND = -100
}

const collisionMatrix = new CollisionMatrix();
collisionMatrix.addCollision(Layers.PLAYER, Layers.ENEMY_PROJECTILE);
collisionMatrix.addCollision(Layers.ENEMY, Layers.PLAYER_PROJECTILE);
collisionMatrix.addCollision(Layers.PLAYER, Layers.FREE_FLOAT);

export class HexGame extends Game
{
    constructor()
    {
        super(new MainScene(), {
            width: 1280,
            height: 720,
            resolution: 1,
            backgroundColor: 0xfff9ba,
            antialias: false
        })
    }
}


class MainScene extends Scene
{
    onAdded()
    {
        super.onAdded();

        this.addEntity(new Background());
        this.addEntity(new Diagnostics("white", 10, false));
        this.addEntity(new Player());

        this.addEntity(new GameDirector());

        this.addSystem(new EnemyAI());
        this.addSystem(new PlayerControls());
        this.addSystem(new Mover());
        this.addSystem(new MoveWithPlayer());
        this.addSystem(new DetectCollisionSystem(collisionMatrix));

        this.addSystem(new ThrusterAnimationSystem());
        this.addSystem(new TurretSystem());
        this.addSystem(new TurretShooter());
        this.addSystem(new ConstantMotionMover());
        this.addSystem(new DamageSystem());
        this.addSystem(new EnemyMarkerSystem());

        // Make sure this is declared last if you want to actually make use of the movement...
        this.addSystem(new ClearMovement());
        this.addSystem(new TileMover());
        // this.addSystem(new OffScreenGarbageGuy());

        this.addSystem(new FollowCamera({centre: true, lerpSpeed: 0.8}));

        this.addGlobalSystem(new ScreenShaker());
        this.addGlobalSystem(new TimerSystem());
        this.addGlobalSystem(new FrameTriggerSystem());
    }
}