import * as PIXI from "pixi.js";
import {Game} from "../ECS/Game";
import {Diagnostics} from "../Common/Debug";
import asteroidSheet from './resources/asteroid_sheet.png';
import {Log, MathUtil} from "../Common/Util";
import {Entity} from "../ECS/Entity";
import {System} from "../ECS/System";
import {Component} from "../ECS/Component";
import {Scene} from "../ECS/Scene";
import {LagomType} from "../ECS/LifecycleObject";
import {CollisionMatrix} from "../LagomCollisions/CollisionMatrix";
import {Sprite} from "../Common/Sprite/Sprite";
import {SpriteSheet} from "../Common/Sprite/SpriteSheet";
import {CollisionSystem, ContinuousCollisionSystem} from "../Collisions/CollisionSystems";
import {Rigidbody} from "../Collisions/Rigidbody";
import {BodyType, CircleCollider, Collider, RectCollider} from "../Collisions/Colliders";
import {SimplePhysics, SimplePhysicsBody} from "../LagomPhysics/SimplePhysics";
import {Result} from "detect-collisions";
import {Key} from "../Input/Key";

const Keyboard = require('pixi.js-keyboard');

const sprites = new SpriteSheet(asteroidSheet, 16, 16);

enum Layers
{
    Default,
    Bullet,
    Ship,
    Asteroid
}


class Split extends Component
{
}

class ScreenWrap extends Component
{
}

class ScreenContained extends Component
{
}

class PlayerControlled extends Component
{
}

class WrapSprite extends Sprite
{

    private static count = 0;
    xId = `__wrapSprite${++WrapSprite.count}`;
    yId = `__wrapSprite${++WrapSprite.count}`;
    xChild: PIXI.Sprite | null = null;
    yChild: PIXI.Sprite | null = null;

    onAdded(): void
    {
        super.onAdded();

        // Add 2 new sprites that shadow the real one
        this.xChild = new PIXI.Sprite(this.pixiObj.texture);
        this.xChild.name = this.xId;
        this.xChild.anchor.x = this.pixiObj.anchor.x;
        this.xChild.anchor.y = this.pixiObj.anchor.y;
        this.yChild = new PIXI.Sprite(this.pixiObj.texture);
        this.yChild.name = this.yId;
        this.yChild.anchor.x = this.pixiObj.anchor.x;
        this.yChild.anchor.y = this.pixiObj.anchor.y;
        this.getEntity().getScene().sceneNode.transform.addChild(this.xChild, this.yChild);
    }

    onRemoved(): void
    {
        super.onRemoved();
        if (this.xChild != null && this.yChild != null)
        {
            this.getEntity().getScene().sceneNode.transform.removeChild(this.xChild);
            this.getEntity().getScene().sceneNode.transform.removeChild(this.yChild);
        }
    }
}

class Ship extends Entity
{
    constructor(x: number, y: number)
    {
        super("ship", x, y);
        this.layer = Layers.Ship;
    }

    onAdded(): void
    {
        super.onAdded();
        this.addComponent(new WrapSprite(sprites.texture(5, 2, 16, 16),
                                         {xOffset: -8, yOffset: -8}));
        this.addComponent(new PlayerControlled());
        this.addComponent(new ScreenWrap());
        this.addComponent(new Rigidbody(BodyType.Discrete));

        // We are in space, but still want to slow a little
        this.addComponent(new SimplePhysicsBody({angCap: 0.05, angDrag: 0.005, linDrag: 0.0008}));
        this.addComponent(new RectCollider(this.scene.getGlobalSystem(CollisionSystem) as CollisionSystem,
                                           {
                                               layer: Layers.Ship, width: 16, height: 16,
                                               rotation: 0, xOff: -8, yOff: -8
                                           }));
    }
}


class ConstantMotion extends Component
{
    constructor(readonly speed: number, readonly  dir: number)
    {
        super();
    }
}

class Asteroid extends Entity
{
    readonly size: number;

    constructor(x: number, y: number, size: number)
    {
        super(`asteroid_${size}`, x, y);
        this.layer = Layers.Asteroid;
        this.size = size;
    }

    onAdded(): void
    {
        super.onAdded();

        const system = this.scene.getGlobalSystem<CollisionSystem>(CollisionSystem);

        if (system === null)
        {
            Log.error("Could not load CollisionSystem");
            return;
        }

        this.addComponent(new Rigidbody(BodyType.Discrete));
        this.transform.rotation = Math.random() * 2 * Math.PI;

        switch (this.size)
        {
            case 3:
                this.addComponent(new WrapSprite(sprites.texture(0, 0, 64, 64), {xOffset: -32, yOffset: -32}));
                this.addComponent(new CircleCollider(system,
                                                     {radius: 32, layer: Layers.Asteroid}));
                break;
            case 2:
                this.addComponent(new WrapSprite(sprites.texture(4, 0, 32, 32), {xOffset: -16, yOffset: -16}));
                this.addComponent(new CircleCollider(system,
                                                     {radius: 16, layer: Layers.Asteroid}));
                break;
            default:
                this.addComponent(new WrapSprite(sprites.texture(4, 2, 16, 16), {xOffset: -8, yOffset: -8}));
                this.addComponent(new CircleCollider(system,
                                                     {radius: 8, layer: Layers.Asteroid}));
                break;
        }

        this.addComponent(new ConstantMotion(Math.random() * 0.03 + 0.01, this.transform.rotation));
        this.addComponent(new ScreenWrap());
    }
}

class Bullet extends Entity
{
    constructor(x: number, y: number, dir: number)
    {
        super("bullet", x, y);
        this.transform.rotation = dir;
        this.layer = Layers.Bullet;
    }

    onAdded(): void
    {
        super.onAdded();

        const system = this.scene.getGlobalSystem<CollisionSystem>(CollisionSystem);

        this.addComponent(new Rigidbody(BodyType.Continuous));

        if (system === null)
        {
            Log.error("Could not load CollisionSystem");
            return;
        }

        this.addComponent(new Sprite(sprites.texture(4, 3, 4, 4), {xOffset: -2, yOffset: -2}));
        this.addComponent(new ConstantMotion(0.4, this.transform.rotation));
        this.addComponent(new CircleCollider(system, {radius: 2, layer: Layers.Bullet}))
            .onTriggerEnter.register(Bullet.onHit);
        this.addComponent(new ScreenContained());
    }

    private static onHit(caller: Collider, other: { other: Collider; result: Result }): void
    {
        const otherEntity = other.other.getEntity();
        if (otherEntity instanceof Asteroid)
        {
            caller.getEntity().destroy();
            otherEntity.addComponent(new Split());
        }
    }
}


class DestroyOffScreen extends System
{
    private readonly tolerance: number = 50;
    private renderer!: PIXI.Renderer;

    onAdded(): void
    {
        super.onAdded();

        this.renderer = this.getScene().getGame().renderer;
    }

    types(): LagomType<Component>[]
    {
        return [ScreenContained];
    }

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity) => {
            const pos = new PIXI.Point();
            entity.transform.getGlobalPosition(pos, false);
            if (pos.x < -this.tolerance
                || pos.y < -this.tolerance
                || pos.x > this.renderer.screen.width + this.tolerance
                || pos.y > this.renderer.screen.height + this.tolerance)
            {
                entity.destroy();
            }
        });
    }
}

class AsteroidSplitter extends System
{
    types(): LagomType<Component>[]
    {
        return [Split];
    }

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity) => {

            const currSize = (entity as Asteroid).size;

            if (currSize > 1)
            {
                this.getScene().addEntity(
                    new Asteroid(entity.transform.x, entity.transform.y, currSize - 1));
                this.getScene().addEntity(
                    new Asteroid(entity.transform.x, entity.transform.y, currSize - 1));
            }
            entity.destroy();
        });
    }

}

class ScreenWrapper extends System
{
    private renderer!: PIXI.Renderer;

    onAdded(): void
    {
        super.onAdded();

        this.renderer = this.getScene().getGame().renderer;
    }

    types(): LagomType<Component>[]
    {
        return [ScreenWrap];
    }

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity) => {
            entity.transform.x =
                (entity.transform.x + this.renderer.screen.width) % this.renderer.screen.width;
            entity.transform.y =
                (entity.transform.y + this.renderer.screen.height) % this.renderer.screen.height;
        });
    }
}

class SpriteWrapper extends System
{
    private renderer!: PIXI.Renderer;

    onAdded(): void
    {
        super.onAdded();

        this.renderer = this.getScene().getGame().renderer;
    }

    types(): LagomType<Component>[]
    {
        return [WrapSprite];
    }

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, sprite: WrapSprite) => {

            const xChild = sprite.xChild as PIXI.Sprite;
            const yChild = sprite.yChild as PIXI.Sprite;

            xChild.rotation = entity.transform.rotation;
            yChild.rotation = entity.transform.rotation;

            xChild.position.y = entity.transform.y;
            yChild.position.x = entity.transform.x;

            if (entity.transform.position.x > this.renderer.screen.width / 2)
            {
                xChild.position.x = entity.transform.position.x - this.renderer.screen.width;
            }
            else
            {
                xChild.position.x = entity.transform.position.x + this.renderer.screen.width;
            }
            if (entity.transform.position.y > this.renderer.screen.height / 2)
            {
                yChild.position.y = entity.transform.position.y - this.renderer.screen.height;
            }
            else
            {
                yChild.position.y = entity.transform.position.y + this.renderer.screen.height;
            }
        });
    }
}


class ConstantMover extends System
{
    types(): LagomType<Component>[]
    {
        return [Rigidbody, ConstantMotion];
    }

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, body: Rigidbody, motion: ConstantMotion) => {
            const vector = MathUtil.lengthDirXY(motion.speed * delta, motion.dir);
            body.move(vector.x, vector.y);
        });
    }
}


class ShipMover extends System
{

    private readonly accSpeed = 0.0001;
    private readonly rotSpeed = MathUtil.degToRad(2);

    types(): LagomType<Component>[]
    {
        return [SimplePhysicsBody, PlayerControlled];
    }

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, props: SimplePhysicsBody) => {
            if (Keyboard.isKeyDown(Key.ArrowLeft, Key.KeyA))
            {
                props.rotate(-this.rotSpeed * delta);
            }
            if (Keyboard.isKeyDown(Key.ArrowRight, Key.KeyD))
            {
                props.rotate(this.rotSpeed * delta);
            }
            if (Keyboard.isKeyDown(Key.ArrowUp, Key.KeyW))
            {
                const vector = MathUtil.lengthDirXY(this.accSpeed * delta, entity.transform.rotation);
                props.move(vector.x, vector.y);
            }

            if (Keyboard.isKeyPressed(Key.Space))
            {
                this.getScene().addEntity(
                    new Bullet(entity.transform.x, entity.transform.y, entity.transform.rotation));
            }
        });
    }
}

class AsteroidsScene extends Scene
{
    onAdded(): void
    {
        super.onAdded();

        const game = this.getGame();

        this.addSystem(new ShipMover());
        this.addSystem(new ConstantMover());
        this.addSystem(new ScreenWrapper());
        this.addSystem(new SpriteWrapper());
        this.addSystem(new AsteroidSplitter());
        this.addSystem(new DestroyOffScreen());
        this.addSystem(new SimplePhysics());

        const collisions = new CollisionMatrix();
        collisions.addCollision(Layers.Bullet, Layers.Asteroid);

        this.addGlobalSystem(new ContinuousCollisionSystem(collisions, 10));

        this.addEntity(new Ship(game.renderer.screen.width / 2,
                                game.renderer.screen.height / 2));

        for (let i = 0; i < 10; i++)
        {
            this.addEntity(new Asteroid(Math.random() * game.renderer.screen.width,
                                        Math.random() * game.renderer.screen.height, 3));
        }

        this.addGUIEntity(new Diagnostics("white"));
    }
}

export class Asteroids extends Game
{
    constructor()
    {
        super({
                  width: 512,
                  height: 512,
                  resolution: 1,
                  backgroundColor: 0x200140
              });

        this.setScene(new AsteroidsScene(this));
    }
}
