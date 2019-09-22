import {Game} from "../../ECS/Game";
import {Diagnostics} from "../../Common/Debug";
import {CollisionMatrix} from "../../LagomCollisions/CollisionMatrix";
import {Entity} from "../../ECS/Entity";
import {System} from "../../ECS/System";
import {Component} from "../../ECS/Component";
import {Scene} from "../../ECS/Scene";
import {LagomType} from "../../ECS/LifecycleObject";
import {SpriteSheet} from "../../Common/Sprite/SpriteSheet";

import playerSpriteSheet from "./resources/player.png";
import wallSpriteSheet from "./resources/walls.png";
import {AnimatedSprite, AnimationEnd} from "../../Common/Sprite/AnimatedSprite";
import {FrameTriggerSystem} from "../../Common/FrameTrigger";
import {Sprite} from "../../Common/Sprite/Sprite";
import {FollowMe} from "../../Common/CameraUtil";
import {Camera} from "../../Common/Camera";
import {DetectCollisionSystem} from "../../DetectCollisions/DetectCollisions";
import {DetectRigidbody} from "../../DetectCollisions/DetectRigidbody";
import {DetectCollider, RectCollider} from "../../DetectCollisions/DetectColliders";
import {Key} from "../../Input/Key";
import {Log, MathUtil} from "../../Common/Util";
import {RenderRect} from "../../Common/PIXIComponents";

const playerSheet = new SpriteSheet(playerSpriteSheet, 32, 32);
const wallSheet = new SpriteSheet(wallSpriteSheet, 32, 32);

enum Layers
{
    Solid,
    Player,
    EndTrigger
}

/**
 * TODO
 * - Jump
 * - Shoot
 * - Add 'ammo' that refreshes when we hit the ground
 * - Sound
 * - Animation
 * - An enemy
 * - Another enemy
 * - Score tracking
 * - Menu/gameover screen
 */

export class Downshaft extends Game
{
    constructor()
    {
        super(new MainScene(), {width: 512, height: 512, resolution: 1.5, backgroundColor: 0x1a2b54});
    }
}

const leftWallX = 96;
const rightWallX = leftWallX + 288;
const topY = 128;

// how many blocks tall is the level
const gameHeight = 256;

class MainScene extends Scene
{
    onAdded()
    {
        super.onAdded();

        const matrix = new CollisionMatrix();
        matrix.addCollision(Layers.Solid, Layers.Player);
        matrix.addCollision(Layers.Player, Layers.EndTrigger);

        this.addEntity(new Diagnostics("cyan", 10, true));

        this.addEntity(new Player(64, topY - 32));

        // Make some stuff
        this.createLevel();

        // Add the end trigger
        this.addEntity(new NextLevelTrigger(leftWallX, topY + gameHeight * 32));

        this.addSystem(new PlayerMover());
        this.addSystem(new VerticalFollowCamera());
        this.addSystem(new DetectCollisionSystem(matrix, 2));
        this.addSystem(new SimpleGravity());
        this.addGlobalSystem(new FrameTriggerSystem());
    }

    private createLevel()
    {
        // Create the top layer
        this.addEntity(new Block(0, topY, 1, 0));
        this.addEntity(new Block(32, topY, 1, 0));
        this.addEntity(new Block(64, topY, 1, 0));
        this.addEntity(new Block(96, topY, 2, 0));
        this.addEntity(new Block(rightWallX, topY, 0, 0));
        this.addEntity(new Block(rightWallX + 32, topY, 1, 0));
        this.addEntity(new Block(rightWallX + 64, topY, 1, 0));
        this.addEntity(new Block(rightWallX + 96, topY, 1, 0));
        this.addEntity(new Block(rightWallX + 128, topY, 1, 0));

        // Make the vertical walls
        for (let i = 1; i < gameHeight; i++)
        {
            this.addEntity(new Block(leftWallX, topY + i * 32, 2, 1));
            this.addEntity(new Block(rightWallX, topY + i * 32, 0, 1));
        }

        // Interval between inner clumps
        const interval = 7;

        for (let i = 0; i < gameHeight / interval; i++)
        {
            const y = i * 32 * interval + topY;
            switch (MathUtil.randomRange(0, 4))
            {
                case 0:
                {
                    this.addEntity(new Block(leftWallX + 32, y, 2, 0));
                    this.addEntity(new Block(leftWallX + 32, y + 32, 2, 1));
                    this.addEntity(new Block(leftWallX + 64, y + 64, 2, 0));
                    this.addEntity(new Block(leftWallX + 64, y + 96, 2, 1));
                    this.addEntity(new Block(leftWallX + 96, y + 128, 2, 0));
                    this.addEntity(new Block(leftWallX + 96, y + 160, 2, 2));
                    this.addEntity(new Block(leftWallX + 64, y + 160, 1, 2));
                    this.addEntity(new Block(leftWallX + 32, y + 160, 1, 2));
                    break;
                }
                case 1:
                {
                    this.addEntity(new Block(rightWallX - 32, y, 0, 0));
                    this.addEntity(new Block(rightWallX - 32, y + 32, 0, 1));
                    this.addEntity(new Block(rightWallX - 64, y + 64, 0, 0));
                    this.addEntity(new Block(rightWallX - 64, y + 96, 0, 1));
                    this.addEntity(new Block(rightWallX - 96, y + 128, 0, 0));
                    this.addEntity(new Block(rightWallX - 96, y + 160, 0, 2));
                    this.addEntity(new Block(rightWallX - 64, y + 160, 1, 2));
                    this.addEntity(new Block(rightWallX - 32, y + 160, 1, 2));
                    break;
                }
                default:
                {
                    const xOff2 = MathUtil.randomRange(1, 6) * 32;
                    this.addEntity(new Block(xOff2 + leftWallX, y, 0, 0));
                    this.addEntity(new Block(xOff2 + leftWallX + 32, y, 2, 0));
                    this.addEntity(new Block(xOff2 + leftWallX, y + 32, 0, 2));
                    this.addEntity(new Block(xOff2 + leftWallX + 32, y + 32, 2, 2));
                }
            }
        }
    }
}

class NextLevelTrigger extends Entity
{
    constructor(x: number, y: number)
    {
        super("level end trigger", x, y);
    }

    onAdded()
    {
        super.onAdded();

        const trigger = this.addComponent(new RectCollider(0, 0, 288, 32, Layers.EndTrigger, 0, true));
        trigger.onTriggerEnter.register((caller, data) => {
            // Restart the level
            this.getScene().getGame().setScene(new MainScene());
        });
    }
}

class GravityAware extends Component
{
    vel = 0;
    readonly acc = 0.4;
    readonly terminalVelocity = 0.8;
}

class SimpleGravity extends System
{
    types(): LagomType<Component>[]
    {
        return [DetectRigidbody, GravityAware];
    }

    fixedUpdate(delta: number): void
    {
        // This emulates real(ish) physics, but doing it with move() instead of applyForce()
        this.runOnEntities((entity: Entity, body: DetectRigidbody, grav: GravityAware) => {

            // Reset velocity if we stopped
            if (body.dyLastFrame <= 0)
            {
                grav.vel = 0;
            }

            grav.vel = Math.min(grav.terminalVelocity, grav.vel + grav.acc * (delta / 1000));

            body.move(0, grav.vel * delta);
        });
    }

    update(delta: number): void
    {
    }
}

class PlayerControlled extends Component
{
}

class PlayerMover extends System
{
    private readonly moveSpeed = 0.2;
    private readonly jumpForce = -0.01;

    types(): LagomType<Component>[]
    {
        return [DetectRigidbody, DetectCollider, PlayerControlled];
    }

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, body: DetectRigidbody, collider: DetectCollider) => {

            if (Game.keyboard.isKeyDown(Key.ArrowLeft, Key.KeyA))
            {
                body.move(-this.moveSpeed * delta, 0);
            }
            if (Game.keyboard.isKeyDown(Key.ArrowRight, Key.KeyD))
            {
                body.move(this.moveSpeed * delta, 0);
            }
        });
    }
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

        this.addComponent(
            new AnimatedSprite(playerSheet.textures([[0, 0], [1, 0], [2, 0], [3, 0]]), {
                animationEndAction: AnimationEnd.LOOP,
                animationSpeed: 300
            }));

        // Physics and collisions stuff
        this.addComponent(new DetectRigidbody());
        // this.addComponent(new RectCollider(0, 0, 32, 32, Layers.Player));
        this.addComponent(new RectCollider(8, 0, 16, 32, Layers.Player));
        this.addComponent(new RenderRect(8, 0, 16, 32));


        this.addComponent(new PlayerControlled());
        this.addComponent(new FollowMe());
        this.addComponent(new GravityAware());
    }
}

class Block extends Entity
{
    constructor(x: number, y: number, private readonly wallX: number, private readonly wallY: number)
    {
        super("block", x, y);
    }

    onAdded(): void
    {
        super.onAdded();
        this.addComponent(new Sprite(wallSheet.texture(this.wallX, this.wallY)));
        this.addComponent(new RectCollider(0, 0, 32, 32, Layers.Solid));
    }
}

class VerticalFollowCamera extends System
{
    private camera!: Camera;

    onAdded(): void
    {
        super.onAdded();
        this.camera = this.getScene().camera;

    }

    types(): LagomType<Component>[]
    {
        return [FollowMe];
    }

    update(delta: number): void
    {
        this.runOnEntitiesWithSystem((system: VerticalFollowCamera, entity: Entity) => {

            const targetY = entity.transform.y;
            system.camera.move(0, targetY - system.camera.height / 4);
        });
    }
}