import {Game} from "../../ECS/Game";
import {Scene} from "../../ECS/Scene";
import {CollisionMatrix} from "../../LagomCollisions/CollisionMatrix";
import {FrameTriggerSystem} from "../../Common/FrameTrigger";
import {DetectCollisionSystem} from "../../DetectCollisions/DetectCollisions";
import {FollowCamera} from "../../Common/CameraUtil";

import {Diagnostics} from "../../Common/Debug";
import {Player} from "./Player";
import {Enemy} from "./Enemy";
import {MoveWithPlayer, PlayerMover} from "./Movement";
import {Entity} from "../../ECS/Entity";
import {Component} from "../../ECS/Component";
import {System} from "../../ECS/System";
import {DetectRigidbody} from "../../DetectCollisions/DetectRigidbody";
import {RenderCircle} from "../../Common/PIXIComponents";
import {CircleCollider} from "../../DetectCollisions/DetectColliders";
import {HexDetacher} from "./HexEntity";
import {TimerSystem} from "../../Common/Timer";

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
    BLOCK,
    BULLET,
    BACKGROUND
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

        this.addSystem(new PlayerMover());
        this.addSystem(new FollowCamera({centre: true}));
        this.addSystem(new MoveWithPlayer());
        this.addSystem(new DetectCollisionSystem(collisionMatrix));
        // this.addSystem(new HexDetacher());

        this.addEntity(new MouseGuy("mouse", 300, 300));

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