import {Component, Entity, System, World} from "../ECS";
import {Sprite} from "../Components";
import {Diagnostics} from "../Debug";
import spr_asteroid from './resources/asteroid.png'
import spr_asteroid2 from './resources/asteroid2.png'
import spr_asteroid3 from './resources/asteroid3.png'
import spr_ship from './resources/ship.png'
import spr_bullet from './resources/bullet.png'
import {Log, MathUtil, Util} from "../Util";
import {CircleCollider, Collider, CollisionMatrix, CollisionSystem} from "../Collision";
import {BodyType, PhysicsSystem, Rigidbody, Vector} from "../Physics";

const Keyboard = require('pixi.js-keyboard');

const loader = PIXI.loader;

export class Asteroids {
    constructor() {

        loader.add([spr_asteroid,
                    spr_asteroid2,
                    spr_asteroid3,
                    spr_ship,
                    spr_bullet]).load(() => {

            let world = new World({width: 256, height: 256, resolution: 2}, 0x200140);

            world.addEntity(new Ship(world.app.screen.width / 2, world.app.screen.height / 2));

            for (let i = 0; i < 10; i++) {
                world.addEntity(new Asteroid(Math.random() * world.app.screen.width,
                                             Math.random() * world.app.screen.height, 3))
            }

            world.addEntity(new Diagnostics("white"));
            world.addSystem(new ShipMover());
            world.addSystem(new ConstantMover());
            world.addSystem(new ScreenWrapper());
            world.addSystem(new SpriteWrapper());
            world.addSystem(new AsteroidSplitter());
            world.addSystem(new DestroyOffScreen());
            world.addSystem(new PhysicsSystem(Vector.zero()));

            const collisions = new CollisionMatrix();
            collisions.addCollision(Layers.Bullet, Layers.Asteroid);

            Log.debug(collisions);

            world.addWorldSystem(new CollisionSystem(collisions));

            world.start();
        });
    }
}

class Ship extends Entity {

    constructor(x: number, y: number) {
        super("ship", x, y);
        this.layer = Layers.Ship;
    }

    onAdded() {
        super.onAdded();
        this.addComponent(new WrapSprite(loader.resources[spr_ship].texture)).pixiObj.anchor.set(0.5, 0.5);
        this.addComponent(new PlayerControlled());
        this.addComponent(new ScreenWrap());
        const body = this.addComponent(new Rigidbody(BodyType.Dynamic));

        // We are in space, but still want to slow a little
        body.xDrag = 0.010;
        body.yDrag = 0.010;
    }
}

enum Layers {
    Default,
    Bullet,
    Ship,
    Asteroid
}

class Asteroid extends Entity {
    readonly size: number;

    constructor(x: number, y: number, size: number) {
        super(`asteroid_${size}`, x, y);
        this.transform.rotation = Math.random() * 2 * Math.PI;
        this.layer = Layers.Asteroid;
        this.size = size;
    }

    onAdded() {
        super.onAdded();

        switch (this.size) {
            case 3:
                this.addComponent(new WrapSprite(loader.resources[spr_asteroid].texture)).pixiObj.anchor.set(0.5, 0.5);
                this.addComponent(new CircleCollider(32));
                break;
            case 2:
                this.addComponent(new WrapSprite(loader.resources[spr_asteroid2].texture)).pixiObj.anchor.set(0.5, 0.5);
                this.addComponent(new CircleCollider(16));
                break;
            default:
                this.addComponent(new WrapSprite(loader.resources[spr_asteroid3].texture)).pixiObj.anchor.set(0.5, 0.5);
                this.addComponent(new CircleCollider(8));
                break;
        }

        this.addComponent(new ConstantMotion(Math.random() * 0.4 + 0.1));
        this.addComponent(new ScreenWrap());
    }
}

class Bullet extends Entity {
    constructor(x: number, y: number, dir: number) {
        super("bullet", x, y);
        this.transform.rotation = dir;
        this.layer = Layers.Bullet;
    }

    onAdded() {
        super.onAdded();
        this.addComponent(new Sprite(loader.resources[spr_bullet].texture)).pixiObj.anchor.set(0.5, 0.5);
        this.addComponent(new ConstantMotion(5));
        this.addComponent(new CircleCollider(2)).collisionEvent.register(Bullet.onHit);
        this.addComponent(new ScreenContained());
    }

    private static onHit(caller: Collider, other: Collider) {
        if (other.entity instanceof Asteroid) {
            // @ts-ignore
            caller.entity.destroy();
            // @ts-ignore
            other.entity.addComponent(new Split());
        }
    }
}

class WrapSprite extends Sprite {

    private static count = 0;
    xId: string = `__wrapSprite${++WrapSprite.count}`;
    yId: string = `__wrapSprite${++WrapSprite.count}`;
    xChild: PIXI.Sprite | null = null;
    yChild: PIXI.Sprite | null = null;

    onAdded(): void {
        super.onAdded();

        if (this.entity != null) {
            // Add 2 new sprites that shadow the real one
            this.xChild = new PIXI.Sprite(this.pixiObj.texture);
            this.xChild.name = this.xId;
            this.xChild.anchor.x = this.pixiObj.anchor.x;
            this.xChild.anchor.y = this.pixiObj.anchor.y;
            this.yChild = new PIXI.Sprite(this.pixiObj.texture);
            this.yChild.name = this.yId;
            this.yChild.anchor.x = this.pixiObj.anchor.x;
            this.yChild.anchor.y = this.pixiObj.anchor.y;
            World.instance.app.stage.addChild(this.xChild, this.yChild);
        }
    }

    onRemoved(): void {
        super.onRemoved();
        if (this.xChild != null && this.yChild != null) {
            World.instance.app.stage.removeChild(this.xChild);
            World.instance.app.stage.removeChild(this.yChild);
        }
    }
}

class Split extends Component {
}

class ScreenWrap extends Component {
}

class ScreenContained extends Component {
}

class DestroyOffScreen extends System {

    private readonly tolerance: number = 50;

    update(world: World, delta: number, entity: Entity): void {
        World.runOnEntity((_: ScreenContained) => {
            const pos = entity.transform.getGlobalPosition();
            if (pos.x < -this.tolerance
                || pos.y < -this.tolerance
                || pos.x > world.app.screen.width + this.tolerance
                || pos.y > world.app.screen.height + this.tolerance) {
                entity.destroy();
            }
        }, entity, ScreenContained);
    }
}

class AsteroidSplitter extends System {
    update(world: World, delta: number, entity: Entity): void {
        World.runOnEntity((_: Split) => {

            const currSize = (<Asteroid>entity).size;

            if (currSize > 1) {
                world.addEntity(new Asteroid(entity.transform.x, entity.transform.y, currSize - 1));
                world.addEntity(new Asteroid(entity.transform.x, entity.transform.y, currSize - 1));
            }
            entity.destroy();
        }, entity, Split);
    }

}

class ScreenWrapper extends System {
    update(world: World, delta: number, entity: Entity): void {
        World.runOnEntity((_: ScreenWrap) => {

            entity.transform.x = (entity.transform.x + world.app.screen.width) % world.app.screen.width;
            entity.transform.y = (entity.transform.y + world.app.screen.height) % world.app.screen.height;

        }, entity, ScreenWrap);
    }
}

class SpriteWrapper extends System {
    update(world: World, delta: number, entity: Entity): void {
        World.runOnEntity((sprite: WrapSprite) => {

            const xChild = world.app.stage.getChildByName(sprite.xId);
            const yChild = world.app.stage.getChildByName(sprite.yId);

            xChild.rotation = entity.transform.rotation;
            yChild.rotation = entity.transform.rotation;

            xChild.position.y = entity.transform.y;
            yChild.position.x = entity.transform.x;

            if (entity.transform.position.x > world.app.screen.width / 2) {
                xChild.position.x = entity.transform.position.x - world.app.screen.width;
            } else {
                xChild.position.x = entity.transform.position.x + world.app.screen.width;
            }
            if (entity.transform.position.y > world.app.screen.height / 2) {
                yChild.position.y = entity.transform.position.y - world.app.screen.height;
            } else {
                yChild.position.y = entity.transform.position.y + world.app.screen.height;
            }
        }, entity, WrapSprite);
    }
}

class ConstantMotion extends Component {
    speed: number;

    constructor(speed: number) {
        super();
        this.speed = speed;
    }
}

class ConstantMover extends System {
    update(world: World, delta: number, entity: Entity): void {
        World.runOnEntity((motion: ConstantMotion) => {
            Util.move(entity, motion.speed * delta)
        }, entity, ConstantMotion);
    }
}

class PlayerControlled extends Component {
}

class ShipMover extends System {

    private readonly accSpeed = 2;
    private readonly rotSpeed = MathUtil.degToRad(4);

    update(world: World, delta: number, entity: Entity): void {
        World.runOnEntity((body: Rigidbody) => {

            if (Keyboard.isKeyDown('ArrowLeft', 'KeyA')) {
                entity.transform.rotation -= this.rotSpeed * delta;
            }
            if (Keyboard.isKeyDown('ArrowRight', 'KeyD')) {
                entity.transform.rotation += this.rotSpeed * delta;
            }
            if (Keyboard.isKeyDown('ArrowUp', 'KeyW')) {
                // Util.move(entity, this.accSpeed * delta);
                body.addForceLocal(new Vector(7, 0));
            }

            if (Keyboard.isKeyPressed('Space')) {
                world.addEntity(new Bullet(entity.transform.x, entity.transform.y, entity.transform.rotation))
            }
        }, entity, Rigidbody, PlayerControlled)
    }
}
