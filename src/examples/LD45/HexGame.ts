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
import block1Spr from './art/block1.png'
import {Sprite} from "../../Common/Sprite/Sprite";
import {MathUtil} from "../../Common/Util";
import {Hex} from "./Hexagons/Hex";
import {GlobalSystem} from "../../ECS/GlobalSystem";
import {hexToWorld} from "./Hexagons/HexUtil";

enum Layers
{
    PLAYER,
    PLAYER_PROJECTILE,
    ENEMY_PROJECTILE,
    ENEMY,
    NONE
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

const playerSheet = new SpriteSheet(playerSpr, 32, 32);
const block1Sheet = new SpriteSheet(block1Spr, 32, 32);


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

class HexRegister extends Component
{
    readonly register: Map<String, HexEntity> = new Map();
}

abstract class HexEntity extends Entity
{
    protected constructor(name: string, x: number, y: number,
                          public owner: HexRegister, public hex: Hex)
    {
        super(name, x, y, 0);
        this.owner.register.set(this.hex.toString(), this);
    }

    onAdded()
    {
        super.onAdded();

        this.addComponent(new MoveMe(this.owner.getEntity(), this.hex));
        this.addComponent(new DetectRigidbody());
        this.addComponent(new CircleCollider(0, 0, 16, this.owner.getEntity().layer, true));
    }
}


class PlayerControlled extends Component
{
}

class MoveMe extends Component
{
    len: number;
    angle: number;

    constructor(public owner: Entity, public hex: Hex)
    {
        super();

        const offVec = hexToWorld(hex);
        const xOff = offVec.x;
        const yOff = offVec.y;
        this.len = Math.sqrt(xOff * xOff + yOff * yOff);
        this.angle = Math.atan2(yOff, xOff);
    }
}

class MoveWithPlayer extends System
{
    types(): LagomType<Component>[]
    {
        return [MoveMe, DetectRigidbody];
    }

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, moveMe: MoveMe, body: DetectRigidbody) => {
            entity.transform.rotation = moveMe.owner.transform.rotation;

            body.pendingX =
                -entity.transform.x + MathUtil.lengthDirX(moveMe.len, moveMe.owner.transform.rotation + moveMe.angle) +
                moveMe.owner.transform.x;
            body.pendingY =
                -entity.transform.y + MathUtil.lengthDirY(moveMe.len, moveMe.owner.transform.rotation + moveMe.angle) +
                moveMe.owner.transform.y;

        });
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

            // TODO this will break collisions?? something needs to update the body position
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
        this.addSystem(new MoveWithPlayer());

        this.addGlobalSystem(new FrameTriggerSystem());
    }
}

class CoreHex extends HexEntity
{
    constructor(public owner: HexRegister, public hex: Hex)
    {
        super("core", 0, 0, owner, hex);
    }


    onAdded()
    {
        super.onAdded();

        const spr = this.addComponent(new Sprite(playerSheet.texture(0, 0), {xAnchor: 0.5, yAnchor: 0.5}));
    }
}

class StructureHex extends HexEntity
{
    constructor(public owner: HexRegister, public hex: Hex)
    {
        super("core", 0, 0, owner, hex);
    }

    onAdded()
    {
        super.onAdded();
        const spr = this.addComponent(new Sprite(block1Sheet.texture(0, 0), {xAnchor: 0.5, yAnchor: 0.5}));
    }
}

class Player extends Entity
{
    constructor()
    {
        super("player", 256, 256, DrawLayer.BLOCK);
        this.layer = Layers.PLAYER;
    }

    onAdded()
    {
        super.onAdded();

        this.addComponent(new FollowMe());
        this.addComponent(new PlayerControlled());

        this.addComponent(new DetectRigidbody());
        this.addComponent(new CircleCollider(0, 0, 1, Layers.NONE, true));

        const register = this.addComponent(new HexRegister());

        this.getScene().addEntity(new CoreHex(register, new Hex(0, 0, 0)));
        this.getScene().addEntity(new StructureHex(register, new Hex(0, 1, -1)));
        this.getScene().addEntity(new StructureHex(register, new Hex(0, 2, -2)));
        this.getScene().addEntity(new StructureHex(register, new Hex(0, -1, 1)));
    }
}

