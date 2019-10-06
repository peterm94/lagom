import {Game} from "../../ECS/Game";
import {Scene} from "../../ECS/Scene";
import {CollisionMatrix} from "../../LagomCollisions/CollisionMatrix";
import {FrameTriggerSystem} from "../../Common/FrameTrigger";
import {DetectCollisionSystem} from "../../DetectCollisions/DetectCollisions";
import {FollowCamera} from "../../Common/CameraUtil";

import {Diagnostics} from "../../Common/Debug";
import {Enemy} from "./Entities/Enemy";
import {ClearMovement, Mover, MoveWithPlayer, PlayerControls} from "./Movement";
import {Entity} from "../../ECS/Entity";
import {RenderCircle} from "../../Common/PIXIComponents";
import {CircleCollider} from "../../DetectCollisions/DetectColliders";
import {ThrusterAnimationSystem} from "./Systems/ThrusterAnimationSystem";
import {TimerSystem} from "../../Common/Timer";
import {Player} from "./Entities/Player";
import {OffScreenGarbageGuy} from "./Systems/OffScreenGarbageGuy";
import {ScreenShaker} from "../../Common/Screenshake";
import {ConstantMotionMover, TurretShooter, TurretSystem} from "./Entities/Turret";

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
    BLOCK = 0,
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
            width: 640,
            height: 360,
            resolution: 2,
            backgroundColor: 0x2e2c3b,
            antialias: false
        })
    }
}


class MainScene extends Scene
{
    onAdded()
    {
        super.onAdded();

        this.addEntity(new Diagnostics("white", 10, true));
        this.addEntity(new Player());
        this.addEntity(new Enemy(Enemy.greenAlien));

        this.addSystem(new PlayerControls());
        this.addSystem(new Mover());
        this.addSystem(new FollowCamera({centre: true}));
        this.addSystem(new MoveWithPlayer());
        this.addSystem(new DetectCollisionSystem(collisionMatrix));

        this.addEntity(new MouseGuy("mouse", 300, 300));
        this.addSystem(new ThrusterAnimationSystem());
        this.addSystem(new TurretSystem());
        this.addSystem(new TurretShooter());
        this.addSystem(new ConstantMotionMover());

        // Make sure this is declared last if you want to actually make use of the movement...
        this.addSystem(new ClearMovement());

        this.addSystem(new OffScreenGarbageGuy());

        this.addGlobalSystem(new ScreenShaker());
        this.addGlobalSystem(new TimerSystem());
        this.addGlobalSystem(new FrameTriggerSystem());
    }
}

class MouseGuy extends Entity
{
    onAdded()
    {
        super.onAdded();

        this.addComponent(new RenderCircle(0, 0, 8));
        this.addComponent(new CircleCollider(0, 0, 8, Layers.ENEMY_PROJECTILE, true));
    }
}