import {Game} from "../../ECS/Game";
import {Scene} from "../../ECS/Scene";
import {CollisionMatrix} from "../../LagomCollisions/CollisionMatrix";
import {FrameTriggerSystem} from "../../Common/FrameTrigger";
import {DetectCollisionSystem} from "../../DetectCollisions/DetectCollisions";
import {FollowCamera} from "../../Common/CameraUtil";
import {Diagnostics} from "../../Common/Debug";
import {EnemyMarkerSystem} from "./Entities/Enemy";
import {
    ClearMovement,
    ConstantMotion,
    ConstantMotionMover,
    MoveMe,
    Mover,
    MoveWithPlayer,
    PlayerControls
} from "./Movement";
import {ThrusterAnimationSystem} from "./Systems/ThrusterAnimationSystem";
import {Timer, TimerSystem} from "../../Common/Timer";
import {Player} from "./Entities/Player";
import {ScreenShaker} from "../../Common/Screenshake";
import {TurretShooter, TurretSystem} from "./Entities/Turret";
import {DamageSystem, HexEntity} from "./HexEntity";
import {Background, TileMover} from "./Background";
import {GameDirector} from "./Systems/GameDirector";
import {EnemyAI} from "./Systems/EnemyAI";
import {Intro} from "./Entities/Intro";
import {ShieldHex} from "./Entities/Shield";
import {Hex} from "./Hexagons/Hex";
import {CircleCollider} from "../../DetectCollisions/DetectColliders";
import {MathUtil} from "../../Common/Util";
import {StructureHex} from "./Entities/Structure";
import {ThrusterHex} from "./Entities/Thruster";
import {LaserTurretHex} from "./Entities/Turrets/LaserTurretHex";

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
    EXPLOSION = 90,
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
        super(new HexMainScene(), {
            width: 1280,
            height: 720,
            resolution: 1,
            backgroundColor: 0xfff9ba,
            antialias: false
        })
    }
}

const makeFloater = (hex: HexEntity, x: number, y: number) => {
    hex.transform.x = x;
    hex.transform.y = y;
    hex.layer = Layers.FREE_FLOAT;
    hex.getComponentsOfType<MoveMe>(MoveMe).forEach(value1 => value1.destroy());
    hex.getComponentsOfType<CircleCollider>(CircleCollider).forEach(value1 => value1.destroy());
    const chunkDir = MathUtil.degToRad(MathUtil.randomRange(0, 360));
    const chunkSpd = MathUtil.randomRange(1, 5) / 20;
    const motion = hex.addComponent(new ConstantMotion(chunkDir, chunkSpd));
    const collider = hex.addComponent(new CircleCollider(0, 0, 1, Layers.NONE, true));

    // After a delay, allow to be reattached
    hex.addComponent(new Timer(1000, undefined)).onTrigger.register(() => {
        collider.destroy();
        motion.destroy();
        const chunkSpd = MathUtil.randomRange(1, 5) / 200;
        const chunkDir = MathUtil.degToRad(MathUtil.randomRange(0, 360));
        hex.addComponent(new ConstantMotion(chunkDir, chunkSpd));
        hex.addComponent(new CircleCollider(0, 0, 16, Layers.FREE_FLOAT, true));
    });

    return hex;
};

export class HexMainScene extends Scene
{
    onAdded()
    {
        super.onAdded();

        this.addEntity(new Background());
        // this.addEntity(new Diagnostics("white", 10, false));
        this.addEntity(new Player(this.camera.halfWidth, this.camera.halfHeight));

        this.addEntity(makeFloater(new ShieldHex(null, new Hex(0,0,0)), 640, 360));
        this.addEntity(makeFloater(new ShieldHex(null, new Hex(0,0,0)), 640, 360));
        this.addEntity(makeFloater(new LaserTurretHex(null, new Hex(0,0,0)), 640, 360));
        this.addEntity(makeFloater(new LaserTurretHex(null, new Hex(0,0,0)), 640, 360));
        this.addEntity(makeFloater(new StructureHex(null, new Hex(0,0,0)), 640, 360));
        this.addEntity(makeFloater(new StructureHex(null, new Hex(0,0,0)), 640, 360));
        this.addEntity(makeFloater(new StructureHex(null, new Hex(0,0,0)), 640, 360));
        this.addEntity(makeFloater(new StructureHex(null, new Hex(0,0,0)), 640, 360));
        this.addEntity(makeFloater(new ThrusterHex(null, new Hex(0,0,0)), 640, 360));
        this.addEntity(makeFloater(new ThrusterHex(null, new Hex(0,0,0)), 640, 360));

        this.addEntity(new Intro());

        this.addEntity(new GameDirector());

        this.addSystem(new EnemyAI());
        this.addSystem(new PlayerControls());
        this.addSystem(new Mover());
        this.addSystem(new MoveWithPlayer());
        this.addSystem(new DetectCollisionSystem(collisionMatrix, 5));

        this.addSystem(new ThrusterAnimationSystem());
        this.addSystem(new TurretSystem());
        this.addSystem(new TurretShooter());
        this.addSystem(new ConstantMotionMover());
        this.addSystem(new DamageSystem());
        this.addSystem(new EnemyMarkerSystem());

        // Make sure this is declared last if you want to actually make use of the movement...
        this.addSystem(new ClearMovement());
        this.addSystem(new TileMover());

        this.addSystem(new FollowCamera({centre: true, lerpSpeed: 0.8}));

        this.addGlobalSystem(new ScreenShaker());
        this.addGlobalSystem(new TimerSystem());
        this.addGlobalSystem(new FrameTriggerSystem());
    }
}
