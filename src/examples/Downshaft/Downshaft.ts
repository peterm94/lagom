import * as PIXI from "pixi.js";

import {Game} from "../../ECS/Game";
import {Diagnostics} from "../../Common/Debug";
import {CollisionMatrix} from "../../LagomCollisions/CollisionMatrix";
import {Entity, GUIEntity} from "../../ECS/Entity";
import {System} from "../../ECS/System";
import {Component} from "../../ECS/Component";
import {Scene} from "../../ECS/Scene";
import {LagomType} from "../../ECS/LifecycleObject";
import {SpriteSheet} from "../../Common/Sprite/SpriteSheet";

import playerSpriteSheet from "./resources/player.png";
import wallSpriteSheet from "./resources/walls.png";
import bulletSpriteSheet from "./resources/bullet.png";
import enemiesSpriteSheet from "./resources/enemies.png";
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
import {RenderRect, TextDisp} from "../../Common/PIXIComponents";
import {Timer, TimerSystem} from "../../Common/Timer";
import {Observable} from "../../Common/Observer";
import {Result} from "detect-collisions";

const playerSheet = new SpriteSheet(playerSpriteSheet, 32, 32);
const wallSheet = new SpriteSheet(wallSpriteSheet, 32, 32);
const bulletSheet = new SpriteSheet(bulletSpriteSheet, 16, 16);
const enemiesSheet = new SpriteSheet(enemiesSpriteSheet, 32, 32);

enum Layers
{
    Solid,
    Player,
    EndTrigger,
    Bullet,
    Enemy
}

/**
 * TODO
 * - Sound
 * - Animation
 * - Another enemy
 * - Score tracking
 * - Menu/gameover screen
 */

export class Downshaft extends Game
{
    constructor()
    {
        super(() => new MainScene(), {width: 512, height: 512, resolution: 1.5, backgroundColor: 0x0b1224});
    }
}

const leftWallX = 96;
const rightWallX = leftWallX + 288;
const topY = 128;

// how many blocks tall is the level
const gameHeight = 256;

class Blob extends Entity
{
    constructor(x: number, y: number)
    {
        super("blob", x, y);
    }

    onAdded()
    {
        super.onAdded();
        this.addComponent(new AnimatedSprite(enemiesSheet.textures([[0, 0], [1, 0]]), {animationSpeed: 300}));
        this.addComponent(new RectCollider(4, 4, 24, 16, Layers.Enemy, 0, true));
        this.addComponent(new RenderRect(4, 4, 24, 16));
    }
}

class MainScene extends Scene
{
    onAdded()
    {
        super.onAdded();

        const matrix = new CollisionMatrix();
        matrix.addCollision(Layers.Solid, Layers.Player);
        matrix.addCollision(Layers.Player, Layers.EndTrigger);
        matrix.addCollision(Layers.Solid, Layers.Bullet);
        matrix.addCollision(Layers.Solid, Layers.Enemy);
        matrix.addCollision(Layers.Enemy, Layers.Bullet);
        matrix.addCollision(Layers.Enemy, Layers.Player);

        this.addEntity(new Diagnostics("cyan", 10));

        this.addEntity(new Player(64, topY - 32));

        // Make some stuff
        this.createLevel();

        // Add the end trigger
        this.addEntity(new NextLevelTrigger(leftWallX, topY + gameHeight * 32));

        this.addSystem(new PlayerMover());
        this.addSystem(new VerticalFollowCamera());
        this.addSystem(new DetectCollisionSystem(matrix, 2));
        this.addSystem(new SimpleGravity());
        this.addSystem(new BulletMover());
        this.addSystem(new BulletShooter());
        this.addGlobalSystem(new FrameTriggerSystem());
        this.addGlobalSystem(new TimerSystem());
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

        for (let i = 2; i < gameHeight / interval; i++)
        {
            const y = i * 32 * interval + topY;
            this.addEntity(new Blob(leftWallX + MathUtil.randomRange(1, 6) * 32, y));
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
            this.getScene().getGame().setScene(() => new MainScene());
        });
    }
}

class GravityAware extends Component
{
}

class SimpleGravity extends System
{
    types(): LagomType<Component>[]
    {
        return [DetectRigidbody, GravityAware];
    }

    fixedUpdate(delta: number): void
    {
        this.runOnEntities((entity: Entity, body: DetectRigidbody) => {

            if (body.velocityY < 0.5)
            {
                body.addForce(0, 0.0005);
            }
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
    static readonly jumpForce = -0.01;

    types(): LagomType<Component>[]
    {
        return [DetectRigidbody, DetectCollider, GravityAware, PlayerControlled];
    }

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, body: DetectRigidbody, collider: DetectCollider, grav: GravityAware) => {

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

class CanShoot extends Component
{
}

class BulletShooter extends System
{
    types(): LagomType<Component>[]
    {
        return [CanShoot, DetectRigidbody, Ammo];
    }

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, canShoot: CanShoot, body: DetectRigidbody, ammo: Ammo) => {
            if (Game.keyboard.isKeyDown(Key.ArrowUp, Key.KeyW) && ammo.ammo > 0)
            {
                ammo.ammo--;

                if (body.velocityY > -0.2)
                {
                    body.addForce(0, -0.01);
                }
                entity.getScene().addEntity(new Bullet(entity.transform.x + 16, entity.transform.y + 32));
                canShoot.destroy();
                entity.addComponent(new Timer(200, null)).onTrigger.register(() => entity.addComponent(new CanShoot()));
            }
        });
    }
}

class Bullet extends Entity
{
    constructor(x: number, y: number)
    {
        super("bullet", x, y);
    }

    onAdded()
    {
        super.onAdded();
        this.addComponent(new Sprite(bulletSheet.texture(0, 0), {xAnchor: 0.5}));

        this.addComponent(new RectCollider(-4, 0, 8, 16, Layers.Bullet)).onCollisionEnter.register(() => {
            this.destroy();
        });

        this.addComponent(new DetectRigidbody());
        this.addComponent(new BulletMovement());

        this.addComponent(new Timer(300, null, false)).onTrigger.register(() => {
            this.destroy();
        });
    }
}

class BulletMovement extends Component
{
}

class BulletMover extends System
{
    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, body: DetectRigidbody) => {
            body.move(0, 0.7 * delta);
        });
    }

    types(): LagomType<Component>[]
    {
        return [DetectRigidbody, BulletMovement];
    }
}

class PlayerGUI extends GUIEntity
{
    constructor(readonly ammo: Ammo)
    {
        super("gui", 0, 0);
    }

    onAdded()
    {
        super.onAdded();
        const ammoDisp = this.addComponent(
            new TextDisp(0, 10, `Ammo: ${this.ammo.ammo}`, new PIXI.TextStyle({fill: 'red'})));
        this.ammo.onChange.register((_, num) => {
            ammoDisp.pixiObj.text = `Ammo: ${num}`
        });
    }
}

class Ammo extends Component
{
    constructor(readonly max: number)
    {
        super();
        this.ammo = max;
    }

    get ammo(): number
    {
        return this._ammo;
    }

    set ammo(value: number)
    {
        this._ammo = Math.min(this.max, value);
        this.onChange.trigger(this, value);
    }

    private _ammo: number = 0;

    readonly onChange: Observable<Ammo, number> = new Observable();
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

        const ammo = this.addComponent(new Ammo(10));
        this.getScene().addEntity(new PlayerGUI(ammo));
        this.addComponent(new PlayerControlled());
        this.addComponent(new FollowMe());
        this.addComponent(new CanShoot());
        this.addComponent(new GravityAware());

        const collider = this.addComponent(new RectCollider(8, 0, 16, 32, Layers.Player));
        this.addComponent(new RenderRect(8, 0, 16, 32));

        collider.onCollisionEnter.register(this.onHitThing.bind(this));
        collider.onTriggerEnter.register(this.onHitThing.bind(this));
    }

    onHitThing(coll: DetectCollider, res: { other: DetectCollider, result: Result })
    {
        // If we are above whatever we collided with, reset our ammo
        if (res.other.getEntity().transform.y > this.transform.y)
        {
            // Check we are actually above an entity, the other check may trigger on touching the side of walls.
            // Note this may match with something else.
            if (true /*!coll.place_free(0, 1)*/)
            {
                const ammo = this.getComponent<Ammo>(Ammo);
                if (ammo)
                {
                    ammo.ammo = ammo.max;
                }
            }

            // If we landed on an enemy, bounce and kill it
            if (res.other.layer === Layers.Enemy)
            {
                const body = this.getComponent<DetectRigidbody>(DetectRigidbody);
                if (body)
                {
                    body.velocityY = 0;
                    body.addForce(0, PlayerMover.jumpForce);
                    res.other.getEntity().destroy();
                }
            }
        }
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