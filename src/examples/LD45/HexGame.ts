import {Game} from "../../ECS/Game";
import {Scene} from "../../ECS/Scene";
import {CollisionMatrix} from "../../LagomCollisions/CollisionMatrix";
import {FrameTriggerSystem} from "../../Common/FrameTrigger";
import {DetectCollisionSystem} from "../../DetectCollisions/DetectCollisions";
import {System} from "../../ECS/System";
import {FollowCamera, FollowMe} from "../../Common/CameraUtil";
import {Entity} from "../../ECS/Entity";
import {Component} from "../../ECS/Component";
import {LagomType} from "../../ECS/LifecycleObject";
import {RenderCircle} from "../../Common/PIXIComponents";
import {CircleCollider, DetectCollider} from "../../DetectCollisions/DetectColliders";
import {DetectRigidbody} from "../../DetectCollisions/DetectRigidbody";
import {Key} from "../../Input/Key";
import {Diagnostics} from "../../Common/Debug";
import {SpriteSheet} from "../../Common/Sprite/SpriteSheet";

import playerSpr from './art/player.png';
import {Sprite} from "../../Common/Sprite/Sprite";
import {MathUtil} from "../../Common/Util";

enum Layers
{
    PLAYER,
    PLAYER_PROJECTILE,
    ENEMY_PROJECTILE,
    ENEMY
}

enum DrawLayer
{
    BLOCK,
    BULLET,
    BACKGROUND
}

const collisionMatrix = new CollisionMatrix();
collisionMatrix.addCollision(Layers.PLAYER, Layers.ENEMY_PROJECTILE);

collisionMatrix.addCollision(Layers.ENEMY, Layers.PLAYER_PROJECTILE);
const hexSheet = new SpriteSheet(playerSpr, 32, 32);


function createShip(entity: Entity)
{
    entity.getScene().addEntity(new StructureBlock(entity, 100, 100));
}

export class HexGame extends Game
{
    constructor()
    {
        super(new MainScene(), {
            width: 512,
            height: 512,
            resolution: 2,
            backgroundColor: 0x341a40,
            antialias: false
        })
    }

}

class PlayerControlled extends Component
{
}

class StructureBlock extends Entity
{
    constructor(public owner: Entity, public xOffset: number, public yOffset: number, rotation: number = 0)
    {
        super("structure", owner.transform.x + xOffset,
              owner.transform.y + yOffset);
    }


    update(delta: number): void
    {
        super.update(delta);

        this.transform.x = MathUtil.lengthDirX(this.xOffset, this.owner.transform.rotation) + this.owner.transform.x;
        this.transform.y = MathUtil.lengthDirY(this.yOffset, this.owner.transform.rotation) + this.owner.transform.y;
        //this.transform.rotation = this.owner.transform.rotation;
    }

    onAdded()
    {
        super.onAdded();

        const spr = this.addComponent(new Sprite(hexSheet.texture(0, 0), {xAnchor: 0.5, yAnchor: 0.5}));
        this.addComponent(new RenderCircle(0, 0, 16));
    }
}

class PlayerMover extends System
{
    readonly moveSpeed = 0.2;
    readonly rotSpeed = 0.002;

    types(): LagomType<Component>[]
    {
        return [DetectRigidbody, PlayerControlled];
    }

    update(delta: number): void
    {
        this.runOnEntitiesWithSystem((system: FollowCamera, entity: Entity, body: DetectRigidbody) => {

            if (Game.keyboard.isKeyDown(Key.ArrowLeft, Key.KeyA))
            {
                body.move(-this.moveSpeed * delta, 0);
            }
            if (Game.keyboard.isKeyDown(Key.ArrowRight, Key.KeyD))
            {
                body.move(this.moveSpeed * delta, 0);
            }
            if (Game.keyboard.isKeyDown(Key.ArrowUp, Key.KeyW))
            {
                body.move(0, -this.moveSpeed * delta);
            }
            if (Game.keyboard.isKeyDown(Key.ArrowDown, Key.KeyS))
            {
                body.move(0, this.moveSpeed * delta);
            }

            if (Game.keyboard.isKeyDown(Key.KeyQ))
            {
                entity.transform.rotation -= this.rotSpeed * delta;
                // body.move(0, this.moveSpeed * delta);
            }
            if (Game.keyboard.isKeyDown(Key.KeyE))
            {
                entity.transform.rotation += this.rotSpeed * delta;
                // body.move(0, this.moveSpeed * delta);
            }
        });
    }
}

class MainScene extends Scene
{
    onAdded()
    {
        super.onAdded();

        this.addEntity(new Diagnostics("white"));
        this.addEntity(new Player());

        this.addSystem(new PlayerMover());
        this.addSystem(new DetectCollisionSystem(collisionMatrix));
        this.addSystem(new FollowCamera({centre: true}));

        this.addGlobalSystem(new FrameTriggerSystem());
    }
}

class Player extends Entity
{
    constructor()
    {
        super("player", 256, 256, DrawLayer.BLOCK);
    }

    onAdded()
    {
        super.onAdded();

        this.addComponent(new FollowMe());
        this.addComponent(new CircleCollider(16, 16, 16, Layers.PLAYER, true));
        this.addComponent(new DetectRigidbody());
        this.addComponent(new PlayerControlled());

        const spr = this.addComponent(new Sprite(hexSheet.texture(0, 0), {xAnchor: 0.5, yAnchor: 0.5}));
        this.addComponent(new RenderCircle(0, 0, 16));

        createShip(this);
    }
}

