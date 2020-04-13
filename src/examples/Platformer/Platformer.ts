import {Scene} from "../../ECS/Scene";
import {Game} from "../../ECS/Game";
import spriteSheet from './resources/spritesheet.png';

import {RenderRect} from "../../Common/PIXIComponents";
import {Entity} from "../../ECS/Entity";
import {SpriteSheet} from "../../Common/Sprite/SpriteSheet";
import {CollisionMatrix} from "../../Collisions/CollisionMatrix";
import {Component} from "../../ECS/Component";
import {LagomType} from "../../ECS/LifecycleObject";
import {System} from "../../ECS/System";
import {TiledMapLoader} from "../../Common/TiledMapLoader";
import world2 from "./resources/World2.json";
import {Diagnostics} from "../../Common/Debug";
import {FrameTriggerSystem} from "../../Common/FrameTrigger";
import {Sprite} from "../../Common/Sprite/Sprite";
import {AnimatedSpriteController} from "../../Common/Sprite/AnimatedSpriteController";
import {FollowCamera, FollowMe} from "../../Common/CameraUtil";
import {Key} from "../../Input/Key";
import {Button} from "../../Input/Button";
import {AudioAtlas} from "../../Audio/AudioAtlas";
import {BodyType, Collider, RectCollider} from "../../Collisions/Colliders";
import {CollisionSystem, ContinuousCollisionSystem} from "../../Collisions/CollisionSystems";
import {Log} from "../../Common/Util";
import {Rigidbody} from "../../Collisions/Rigidbody";
import {SimplePhysics, SimplePhysicsBody} from "../../Physics/SimplePhysics";


const sprites = new SpriteSheet(spriteSheet, 16, 16);
const collisionMatrix = new CollisionMatrix();
const soundLoader = new AudioAtlas();
const jumpSound = soundLoader.load('jump', require("./resources/jump.wav"));

enum Layers
{
    PLAYER,
    ENEMY,
    SOLIDS
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

        const system = this.scene.getGlobalSystem<CollisionSystem>(CollisionSystem);
        if (system === null)
        {
            Log.error("Collision system not added to scene.");
            return;
        }

        this.addComponent(new Sprite(sprites.texture(this.tileId, 0)));
        this.addComponent(new Rigidbody(BodyType.Static));
        this.addComponent(new RectCollider(system, {width: 16, height: 16, layer: Layers.SOLIDS}));
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
            this.getScene().camera.rotate2(this.getScene().camera.angle - delta * this.amt);
        }
        if (Game.keyboard.isKeyDown(Key.KeyE))
        {
            this.getScene().camera.rotate2(this.getScene().camera.angle + delta * this.amt);
        }
    }
}

class PlayerControlled extends Component
{
}

class GravityAware extends Component
{
}

class Gravity extends System
{
    spd = 0.002;

    types = (): LagomType<Component>[] => [SimplePhysicsBody, GravityAware];

    fixedUpdate(delta: number): void
    {
        this.runOnEntitiesWithSystem((system: Gravity, entity: Entity, body: SimplePhysicsBody) => {
            body.move(0, system.spd);
        });
    }

    update(delta: number): void
    {
        // fixed update only.
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
        this.addComponent(new Rigidbody(BodyType.Discrete));
        this.addComponent(new SimplePhysicsBody());
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

        const system = this.scene.getGlobalSystem<CollisionSystem>(CollisionSystem);
        if (system === null)
        {
            Log.error("Collision system not added to scene.");
            return;
        }

        this.addComponent(new RenderRect(-4, -8, 8, 16));
        const collider = this.addComponent(new RectCollider(system, {
            xOff: -4, yOff: -8, width: 8, height: 16,
            layer: Layers.PLAYER
        }));

        collider.onTrigger.register((caller, data) => {
            caller.getEntity().getComponent<Rigidbody>(Rigidbody)?.stopMotion();
            caller.getEntity().getComponent<SimplePhysicsBody>(SimplePhysicsBody)?.stopMotion();

            caller.getEntity().transform.x -= data.result.overlap_x * data.result.overlap;
            caller.getEntity().transform.y -= data.result.overlap_y * data.result.overlap;
        });

    }
}


class PlayerAnimationSystem extends System
{
    types(): LagomType<Component>[]
    {
        return [Rigidbody, AnimatedSpriteController];
    }

    fixedUpdate(delta: number): void
    {
        this.runOnEntities((entity: Entity, body: Rigidbody, sprite: AnimatedSpriteController) => {

            // // We are on the ground.
            // if (body.dxLastFrame > 0.001)
            // {
            //     // Moving right
            //     sprite.setAnimation(PlayerAnimationStates.WALK);
            //     sprite.applyConfig({xScale: 1});
            // }
            // else if (body.dxLastFrame < -0.001)
            // {
            //     // Moving left
            //     sprite.setAnimation(PlayerAnimationStates.WALK);
            //     sprite.applyConfig({xScale: -1});
            // }
            // else if (body.dxLastFrame === 0)
            // {
            //     // Idle
            //     sprite.setAnimation(PlayerAnimationStates.IDLE);
            // }
            // // We are in the air.
            // if (body.dyLastFrame > 0.001)
            // {
            //     sprite.setAnimation(PlayerAnimationStates.FALLING);
            // }
            // else if (body.dyLastFrame < -0.001)
            // {
            //     sprite.setAnimation(PlayerAnimationStates.JUMP);
            // }
        });
    }

    update(delta: number): void
    {
        // Not required
    }
}

class PlayerMover extends System
{
    readonly mSpeed = 0.07;
    readonly jumpPower = -0.12;

    types(): LagomType<Component>[]
    {
        return [Collider, Rigidbody, SimplePhysicsBody, PlayerControlled];
    }

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, collider: Collider, body: Rigidbody, body2: SimplePhysicsBody) => {
            if (Game.keyboard.isKeyPressed(Key.ArrowUp, Key.KeyW))
            {
                if (!collider.placeFree(0, 2))
                {
                    body2.yVel = 0;
                    body2.move(0, this.jumpPower);
                    // body.addForce(0, this.jumpPower);
                    jumpSound.volume(0.05);
                    jumpSound.play();
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

class MainScene extends Scene
{
    onAdded(): void
    {
        super.onAdded();

        this.addGUIEntity(new Diagnostics("white", 8));

        this.addSystem(new PlayerMover());
        this.addSystem(new PlayerAnimationSystem());
        this.addSystem(new FollowCamera({centre: true, lerpSpeed: 5, yOffset: 10}));
        this.addSystem(new SimplePhysics());
        this.addSystem(new Gravity());

        this.addGlobalSystem(new ContinuousCollisionSystem(collisionMatrix));
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

        world1Map.load(0, mapLoader);
        // world1Map.loadFn(this, 1, (tileId, x, y) => {
        //     tileEntity.addComponent(new Sprite(sprites.textureFromIndex(tileId), {xOffset: x, yOffset: y}));
        // });
    }
}

export class Platformer extends Game
{
    constructor()
    {
        super({
                  width: 256,
                  height: 128,
                  resolution: 4,
                  backgroundColor: 0xad58ac,
                  antialias: false
              });

        this.setScene(new MainScene(this));

        collisionMatrix.addCollision(Layers.PLAYER, Layers.SOLIDS);
        collisionMatrix.addCollision(Layers.ENEMY, Layers.SOLIDS);
        collisionMatrix.addCollision(Layers.PLAYER, Layers.ENEMY);
    }
}
