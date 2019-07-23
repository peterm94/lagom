import {Scene} from "../../ECS/Scene";
import {Game} from "../../ECS/Game";
import spriteSheet from './resources/spritesheet.png';

import {RenderCircle, RenderRect, Sprite, VeryAnimatedSprite} from "../../Common/PIXIComponents";
import {Entity} from "../../ECS/Entity";
import {SpriteSheet} from "../../Common/SpriteSheet";
import {
    DetectActive, DetectActiveCollisionSystem
} from "../../DetectCollisions/DetectCollisions";
import {CollisionMatrix} from "../../LagomCollisions/CollisionMatrix";
import {Component} from "../../ECS/Component";
import {LagomType} from "../../ECS/LifecycleObject";
import {System} from "../../ECS/System";
import {TiledMapLoader} from "../../Common/TiledMapLoader";
import world1 from "./resources/World1.json";
import {Diagnostics} from "../../Common/Debug";
import {Vector} from "matter-js";
import {FrameTriggerSystem} from "../../Common/FrameTrigger";
import {RectCollider} from "../../DetectCollisions/Colliders";
import {MatterEngine} from "../../MatterPhysics/MatterPhysics";
import {MRectCollider} from "../../MatterPhysics/MatterColliders";
import {debug} from "util";
import * as Matter from "matter-js";

const Keyboard = require('pixi.js-keyboard');
const sprites = new SpriteSheet(spriteSheet, 16, 16);
const collisionMatrix = new CollisionMatrix();


enum Layers
{
    PLAYER,
    ENEMY,
    SOLIDS
}

export class Platformer extends Game
{
    constructor()
    {
        super(new MainScene(), {
            width: 256,
            height: 128,
            resolution: 3,
            backgroundColor: 0x212B4F,
            antialias: false
        });

        collisionMatrix.addCollision(Layers.PLAYER, Layers.SOLIDS);
        collisionMatrix.addCollision(Layers.ENEMY, Layers.SOLIDS);
        collisionMatrix.addCollision(Layers.PLAYER, Layers.ENEMY);
    }
}

class MainScene extends Scene
{
    onAdded(): void
    {
        super.onAdded();

        this.addEntity(new Diagnostics("white", 2));

        this.addSystem(new PlayerMover());
        // this.addSystem(new GravitySystem());
        // this.addSystem(new DetectActiveCollisionSystem(collisionMatrix));
        this.addSystem(new PlayerAnimationSystem());

        this.addGlobalSystem(new MatterEngine(collisionMatrix, Vector.create(0, 0), true));

        this.addGlobalSystem(new FrameTriggerSystem());

        const world1Map = new TiledMapLoader(world1);
        const mapLoader: Map<number, (x: number, y: number) => void> = new Map();
        mapLoader.set(12, (x, y) => {
            this.addEntity(new Block(x, y, 12));
        });
        mapLoader.set(13, (x, y) => {
            this.addEntity(new Block(x, y, 13));
        });

        mapLoader.set(14, (x, y) => {
            this.addEntity(new Block(x, y, 14));
        });

        mapLoader.set(15, (x, y) => {
            this.addEntity(new Block(x, y, 15));
        });
        mapLoader.set(512, (x, y) => {
            this.addEntity(new Player(x, y));
        });

        world1Map.load(this, mapLoader);
    }
}

class Block extends Entity
{
    private readonly tileId: number;

    constructor(x: number, y: number, tileId: number)
    {
        super("block", x, y);
        this.tileId = tileId;
        this.layer = Layers.SOLIDS;
    }

    onAdded(): void
    {
        super.onAdded();
        this.addComponent(sprites.sprite(this.tileId, 0, -8, -8));
        // this.addComponent(new RectCollider(0, 0, 16, 16, Layers.SOLIDS));
        // TODO if this is offset, the rotations goes wacky because it is from the origin of the entity. this is fine?
        // The collider anchor is the middle of the rectangle. This is strange, everything else has been anchored
        // top left.
        this.addComponent(new MRectCollider(0, 0, 16, 16,
                                            {layer: Layers.SOLIDS, isStatic: true}));
        this.addComponent(new RenderRect(16, 16, -8, -8));
    }
}

enum PlayerAnimationStates
{
    IDLE,
    WALK,
    FALLING,
    JUMP,
}

class Player extends Entity
{
    constructor(x: number, y: number)
    {
        super("player", x, y);
    }

    onAdded(): void
    {
        super.onAdded();
        // this.addComponent(new GravityAware());
        this.addComponent(new PlayerControlled());
        this.addComponent(new DetectActive());

        const sprite = this.addComponent(new VeryAnimatedSprite(PlayerAnimationStates.IDLE));
        sprite.addAnimation(PlayerAnimationStates.IDLE,
                            sprites.animatedConfig([[0, 16], [2, 16]], 350, -8, -8));
        sprite.addAnimation(PlayerAnimationStates.WALK,
                            sprites.animatedConfig(
                                [[0, 17], [1, 17], [2, 17], [3, 17], [4, 17], [5, 17], [6, 17], [7, 17]],
                                70));
        sprite.addAnimation(PlayerAnimationStates.FALLING,
                            sprites.animatedConfig([[6, 17]], 0));
        sprite.addAnimation(PlayerAnimationStates.JUMP,
                            sprites.animatedConfig([[5, 17]], 0));
        this.addComponent(new RenderCircle(10));
        this.addComponent(new RectCollider(-4, -8, 8, 16, Layers.PLAYER));
        this.addComponent(new MRectCollider(0, 0, 8, 16, {layer: Layers.PLAYER}));
        this.addComponent(new RenderRect(8, 16, -4, -8));
    }
}

class PlayerControlled extends Component
{
}

class PlayerAnimationSystem extends System
{
    types(): LagomType<Component>[]
    {
        return [DetectActive, VeryAnimatedSprite];
    }

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, body: DetectActive, sprite: VeryAnimatedSprite) => {

            // TODO this makes him face the wrong way when he hits a wall. check update order? maybe it is correct?
            // TODO we might want to take the values from the input/nextframe instead. Although gravity might screw
            // it then....
            const dir = body.dir();

            if (sprite.currentSprite && sprite.currentSprite.sprite)
            {
                // We are on the ground.
                if (dir[0] > 0)
                {
                    // Moving right
                    sprite.setAnimation(PlayerAnimationStates.WALK);
                    sprite.currentSprite.sprite.xScale = 1;
                }
                else if (dir[0] < 0)
                {
                    // Moving left
                    sprite.setAnimation(PlayerAnimationStates.WALK);
                    sprite.currentSprite.sprite.xScale = -1;
                }
                else
                {
                    // Idle
                    sprite.setAnimation(PlayerAnimationStates.IDLE);
                }
                // We are in the air.
                if (dir[1] > 0)
                {
                    sprite.setAnimation(PlayerAnimationStates.FALLING);
                }
                else if (dir[1] < 0)
                {
                    sprite.setAnimation(PlayerAnimationStates.JUMP);
                }
            }
        });
    }
}

class GravityAware extends Component
{
}

class GravitySystem extends System
{
    types(): LagomType<Component>[]
    {
        return [DetectActive, GravityAware];
    }

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, body: DetectActive) => {
            body.move(0, 0.1 * delta);
        });
    }
}

class Physics extends Component
{
    /// jump pls
}


class PlayerMover extends System
{
    readonly mSpeed = 0.07;
    readonly jumpPower = Vector.create(0, -0.004);

    types(): LagomType<Component>[]
    {
        return [MRectCollider, PlayerControlled];
    }

    update()
    {
    }

    fixedUpdate(delta: number): void
    {
        this.runOnEntities((entity: Entity, body: MRectCollider) => {

            // body.xVelocity = 0;
            Matter.Body.translate(body.body, Vector.create(0, 0.1 * delta));

            if (Keyboard.isKeyDown('ArrowLeft', 'KeyA'))
            {
                // body.move(-this.mSpeed * delta, 0);
                Matter.Body.translate(body.body, Vector.create(-this.mSpeed * delta, 0));
            }
            if (Keyboard.isKeyDown('ArrowRight', 'KeyD'))
            {
                // body.move(this.mSpeed * delta, 0);
                Matter.Body.translate(body.body, Vector.create(this.mSpeed * delta, 0));
            }
            if (Keyboard.isKeyPressed('ArrowUp', 'KeyW'))
            {
                // TODO if grounded
                // body.yVelocity = -0.15;
            }

        });
    }
}