import {Scene} from "../../ECS/Scene";
import {Game} from "../../ECS/Game";
import spriteSheet from './resources/spritesheet.png';

import {RenderRect} from "../../Common/PIXIComponents";
import {Entity} from "../../ECS/Entity";
import {SpriteSheet} from "../../Common/Sprite/SpriteSheet";
import {DetectCollisionSystem} from "../../DetectCollisions/DetectCollisions";
import {CollisionMatrix} from "../../LagomCollisions/CollisionMatrix";
import {Component} from "../../ECS/Component";
import {LagomType} from "../../ECS/LifecycleObject";
import {System} from "../../ECS/System";
import {TiledMapLoader} from "../../Common/TiledMapLoader";
import world1 from "./resources/World1.json";
import world2 from "./resources/World2.json";
import {Diagnostics} from "../../Common/Debug";
import {FrameTriggerSystem} from "../../Common/FrameTrigger";
import {DetectCollider, RectCollider} from "../../DetectCollisions/DetectColliders";
import {DetectRigidbody} from "../../DetectCollisions/DetectRigidbody";
import {Sprite} from "../../Common/Sprite/Sprite";
import {AnimatedSpriteController} from "../../Common/Sprite/AnimatedSpriteController";
import {FollowCamera, FollowMe} from "../../Common/CameraUtil";
import {Key} from "../../Input/Key";
import {Button} from "../../Input/Button";


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
            resolution: 4,
            backgroundColor: 0xad58ac,
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

        this.addEntity(new Diagnostics("white", 8));

        this.addSystem(new PlayerMover());
        this.addSystem(new GravitySystem());
        this.addSystem(new DetectCollisionSystem(collisionMatrix));
        this.addSystem(new PlayerAnimationSystem());
        this.addSystem(new FollowCamera({centre: true, lerpSpeed: 5, yOffset: 10}));

        this.addGlobalSystem(new FrameTriggerSystem());

        const tileEntity = this.addEntity(new Entity("backgroundTiles"));
        tileEntity.depth = -100;

        const world1Map = new TiledMapLoader(world2);
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

        world1Map.load(this, 0, mapLoader);
        // world1Map.loadFn(this, 1, (tileId, x, y) => {
        //     tileEntity.addComponent(new Sprite(sprites.textureFromId(tileId), {xOffset: x, yOffset: y}));
        // });
    }
}

class Block extends Entity
{
    constructor(x: number, y: number, private readonly tileId: number)
    {
        super("block", x, y);
        this.layer = Layers.SOLIDS;
    }

    onAdded(): void
    {
        super.onAdded();
        this.addComponent(new Sprite(sprites.texture(this.tileId, 0)));
        this.addComponent(new RectCollider(0, 0, 16, 16, Layers.SOLIDS));
        // this.addComponent(new RenderRect(16, 16));
    }
}

enum PlayerAnimationStates
{
    IDLE,
    WALK,
    FALLING,
    JUMP,
}

class Rotator extends System
{
    amt = 0.03;

    types(): LagomType<Component>[]
    {
        return [];
    }

    update(delta: number): void
    {
        if (Game.keyboard.isKeyDown(Key.KeyQ))
        {
            this.getScene().camera.rotate2(this.getScene().camera.angle - delta * this.amt)
        }
        if (Game.keyboard.isKeyDown(Key.KeyE))
        {
            this.getScene().camera.rotate2(this.getScene().camera.angle + delta * this.amt)
        }
    }
}

class Player extends Entity
{
    constructor(x: number, y: number)
    {
        super("player", x, y);
        this.depth = 10;
    }

    onAdded(): void
    {
        super.onAdded();
        this.addComponent(new GravityAware());
        this.addComponent(new PlayerControlled());
        this.addComponent(new DetectRigidbody());
        this.addComponent(new FollowMe());

        // Static sprite
        // this.addComponent(new Sprite(sprites.texture(0, 16), {xOffset: -8, yOffset: -8}));

        // Simple animated sprite
        // this.addComponent(new AnimatedSprite(sprites.textures([[0, 16], [2, 16]]),
        //                                      {xOffset: -8, yOffset: -8, animationSpeed: 350}));

        // Full blown sprite with state machine
        this.addComponent(new AnimatedSpriteController(PlayerAnimationStates.IDLE, [
            {
                id: PlayerAnimationStates.IDLE,
                textures: sprites.textures([[0, 16], [2, 16]]),
                config: {animationSpeed: 350, yOffset: -8, xAnchor: 0.5}
            },
            {
                id: PlayerAnimationStates.WALK,
                textures: sprites.textures([[0, 17], [1, 17], [2, 17], [3, 17], [4, 17], [5, 17], [6, 17], [7, 17]]),
                config: {animationSpeed: 70, yOffset: -8, xAnchor: 0.5}
            },
            {
                id: PlayerAnimationStates.FALLING,
                textures: sprites.textures([[6, 17]]),
                config: {animationSpeed: 0, yOffset: -8, xAnchor: 0.5}
            },
            {
                id: PlayerAnimationStates.JUMP,
                textures: sprites.textures([[5, 17]]),
                config: {animationSpeed: 0, yOffset: -8, xAnchor: 0.5}
            }
        ]));

        this.addComponent(new RectCollider(-4, -8, 8, 16, Layers.PLAYER));
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
        return [DetectRigidbody, AnimatedSpriteController];
    }

    fixedUpdate(delta: number): void
    {
        this.runOnEntities((entity: Entity, body: DetectRigidbody, sprite: AnimatedSpriteController) => {

            // We are on the ground.
            if (body.dxLastFrame > 0.001)
            {
                // Moving right
                sprite.setAnimation(PlayerAnimationStates.WALK);
                sprite.applyConfig({xScale: 1});
            }
            else if (body.dxLastFrame < -0.001)
            {
                // Moving left
                sprite.setAnimation(PlayerAnimationStates.WALK);
                sprite.applyConfig({xScale: -1});
            }
            else if (body.dxLastFrame === 0)
            {
                // Idle
                sprite.setAnimation(PlayerAnimationStates.IDLE);
            }
            // We are in the air.
            if (body.dyLastFrame > 0.001)
            {
                sprite.setAnimation(PlayerAnimationStates.FALLING);
            }
            else if (body.dyLastFrame < -0.001)
            {
                sprite.setAnimation(PlayerAnimationStates.JUMP);
            }
        });
    }

    update(delta: number): void
    {
    }
}

class GravityAware extends Component
{
}

class GravitySystem extends System
{
    types(): LagomType<Component>[]
    {
        return [DetectRigidbody, GravityAware];
    }

    fixedUpdate(delta: number): void
    {
        this.runOnEntities((entity: Entity, body: DetectRigidbody) => {
            body.addForce(0, 0.0005);
        });
    }

    update(delta: number): void
    {
    }
}

class PlayerMover extends System
{
    readonly mSpeed = 0.07;
    readonly jumpPower = -0.012;

    types(): LagomType<Component>[]
    {
        return [DetectRigidbody, DetectCollider, PlayerControlled];
    }

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, body: DetectRigidbody, collider: DetectCollider) => {
            if (Game.keyboard.isKeyPressed(Key.ArrowUp, Key.KeyW))
            {
                if (!collider.place_free(0, 2))
                {
                    body.addForce(0, this.jumpPower);
                }
            }

            if (Game.keyboard.isKeyDown(Key.ArrowLeft, Key.KeyA))
            {
                body.move(-this.mSpeed * delta, 0);
            }
            if (Game.keyboard.isKeyDown(Key.ArrowRight, Key.KeyD))
            {
                body.move(this.mSpeed * delta, 0);
            }

            if (Game.mouse.isButtonDown(Button.LEFT))
            {
                this.getScene().getGame().renderer.backgroundColor += 0x00FFFF;
            }
        });
    }
}