import {Game} from "../../ECS/Game";
import {Scene} from "../../ECS/Scene";
import {CollisionMatrix} from "../../LagomCollisions/CollisionMatrix";
import {FrameTriggerSystem} from "../../Common/FrameTrigger";
import {DetectCollisionSystem} from "../../DetectCollisions/DetectCollisions";
import {FollowCamera} from "../../Common/CameraUtil";

import {Diagnostics} from "../../Common/Debug";
import {Player} from "./Player";
import {Enemy} from "./Enemy";
import {ClearMovement, Mover, MoveWithPlayer, PlayerControls} from "./Movement";

export enum Layers
{
    PLAYER,
    PLAYER_PROJECTILE,
    ENEMY_PROJECTILE,
    ENEMY,
    NONE
}

export enum DrawLayer
{
    BLOCK,
    BULLET,
    BACKGROUND
}

const collisionMatrix = new CollisionMatrix();
collisionMatrix.addCollision(Layers.PLAYER, Layers.ENEMY_PROJECTILE);
collisionMatrix.addCollision(Layers.ENEMY, Layers.PLAYER_PROJECTILE);

export class HexGame extends Game
{
    constructor()
    {
        super(new MainScene(), {
            width: 512,
            height: 512,
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

        this.addEntity(new Diagnostics("white"));
        this.addEntity(new Player());
        this.addEntity(new Enemy());

        this.addSystem(new PlayerControls());
        this.addSystem(new Mover());
        this.addSystem(new DetectCollisionSystem(collisionMatrix));
        this.addSystem(new FollowCamera({centre: true}));
        this.addSystem(new MoveWithPlayer());
        this.addSystem(new ClearMovement());

        this.addGlobalSystem(new FrameTriggerSystem());
    }
}



