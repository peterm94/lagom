import {Component, Entity, System, World} from "../ECS";
import {Sprite} from "../Components";
import {Diagnostics} from "../Debug";
import spr_asteroid from './resources/asteroid.png'
import spr_asteroid2 from './resources/asteroid2.png'
import spr_asteroid3 from './resources/asteroid3.png'
import spr_ship from './resources/ship.png'
import spr_bullet from './resources/bullet.png'
import {Log, MathUtil, Util} from "../Util";
import {CollisionEvent, MatterEngine, MCollider} from "../MatterPhysics";
import * as Matter from "matter-js";

const Keyboard = require('pixi.js-keyboard');

const loader = PIXI.loader;

export class MatterAsteroids {
    constructor() {

        loader.add([spr_asteroid,
                    spr_asteroid2,
                    spr_asteroid3,
                    spr_ship,
                    spr_bullet]).load(() => {

            let world = new World({width: 512, height: 512, resolution: 1}, 0x200140);

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

            world.addWorldSystem(new MatterEngine());
            world.start();
        });
    }
}

class Ship extends Entity {

    constructor(x: number, y: number) {
        super("ship", x, y);
    }

    onAdded() {
        super.onAdded();
        this.addComponent(new WrapSprite(loader.resources[spr_ship].texture));
        this.addComponent(new PlayerControlled());
        this.addComponent(new ScreenWrap());
        this.addComponent(new MCollider(Matter.Bodies.circle(0, 0, 8, {isSensor: true})));
    }
}

class Asteroid extends Entity {
    readonly size: number;

    constructor(x: number, y: number, size: number) {
        super(`asteroid_${size}`, x, y);
        this.transform.rotation = Math.random() * 2 * Math.PI;
        this.size = size;
    }

    onAdded() {
        super.onAdded();

        const collOptions = {
            isSensor: true,
            collisionFilter: {
                group: 0,
                category: CollLayers.Asteroid,
                mask: CollLayers.Bullet
            }
        };

        switch (this.size) {
            case 3:
                this.addComponent(new WrapSprite(loader.resources[spr_asteroid].texture));
                this.addComponent(new MCollider(Matter.Bodies.circle(0, 0, 32, collOptions)));
                break;
            case 2:
                this.addComponent(new WrapSprite(loader.resources[spr_asteroid2].texture));
                this.addComponent(new MCollider(Matter.Bodies.circle(0, 0, 16, collOptions)));
                break;
            default:
                this.addComponent(new WrapSprite(loader.resources[spr_asteroid3].texture));
                this.addComponent(new MCollider(Matter.Bodies.circle(0, 0, 8, collOptions)));
                break;
        }

        this.addComponent(new ConstantMotion(Math.random() * 0.04 + 0.01));
        this.addComponent(new ScreenWrap());
    }
}

class Bullet extends Entity {
    constructor(x: number, y: number, dir: number) {
        super("bullet", x, y);
        this.transform.rotation = dir;
    }

    onAdded() {
        super.onAdded();
        this.addComponent(new Sprite(loader.resources[spr_bullet].texture));
        this.addComponent(new ConstantMotion(0.5));
        const collider = this.addComponent(new MCollider(Matter.Bodies.circle(0, 0, 2,
                                                                              {
                                                                                  isSensor: true,
                                                                                  collisionFilter: {
                                                                                      group: 0,
                                                                                      category: CollLayers.Bullet,
                                                                                      mask: CollLayers.Asteroid
                                                                                  }
                                                                              })));
        this.addComponent(new ScreenContained());

        // @ts-ignore
        Matter.Events.on(collider.body, "collisionStart", (event: CollisionEvent) => {
            this.destroy();

            // @ts-ignore
            event.other.entity.addComponent(new Split());
        });
    }

    // private static onHit(pair: Matter.IPair) {
    //     // Figure out which is which
    //     if (pair.bodyA === )
    //     if (other.entity instanceof Asteroid) {
    //         // @ts-ignore
    //         caller.entity.destroy();
    //         // @ts-ignore
    //         other.entity.addComponent(new Split());
    //     }
    // }
}

enum CollLayers {
    Asteroid = 1 << 1,
    Ship     = 1 << 2,
    Bullet   = 1 << 3
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
            World.instance.sceneNode.addChild(this.xChild, this.yChild);
        }
    }

    onRemoved(): void {
        super.onRemoved();
        if (this.xChild != null && this.yChild != null) {
            World.instance.sceneNode.removeChild(this.xChild);
            World.instance.sceneNode.removeChild(this.yChild);
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

    types(): { new(): Component }[] | any[] {
        return [ScreenContained];
    }

    update(world: World, delta: number): void {
        this.runOnEntities((entity: Entity) => {
            const pos = entity.transform.getGlobalPosition();
            if (pos.x < -this.tolerance
                || pos.y < -this.tolerance
                || pos.x > world.app.screen.width + this.tolerance
                || pos.y > world.app.screen.height + this.tolerance) {
                entity.destroy();
            }
        })
    }
}

class AsteroidSplitter extends System {
    types(): { new(): Component }[] | any[] {
        return [Split];
    }

    update(world: World, delta: number): void {
        this.runOnEntities((entity: Entity) => {
            const currSize = (<Asteroid>entity).size;

            if (currSize > 1) {
                world.addEntity(new Asteroid(entity.transform.x, entity.transform.y, currSize - 1));
                world.addEntity(new Asteroid(entity.transform.x, entity.transform.y, currSize - 1));
            }
            entity.destroy();
        })
    }
}

class ScreenWrapper extends System {
    types(): { new(): Component }[] | any[] {
        return [MCollider, ScreenWrap];
    }

    update(world: World, delta: number): void {
        this.runOnEntities((entity: Entity, collider: MCollider) => {
            Matter.Body.setPosition(
                collider.body,
                Matter.Vector.create((collider.body.position.x + world.app.screen.width) % world.app.screen.width,
                                     (collider.body.position.y + world.app.screen.height) % world.app.screen.height))
        })
    }
}

class SpriteWrapper extends System {
    types(): { new(): Component }[] | any[] {
        return [WrapSprite];
    }

    update(world: World, delta: number): void {
        this.runOnEntities((entity: Entity, sprite: WrapSprite) => {
            const xChild = world.sceneNode.getChildByName(sprite.xId);
            const yChild = world.sceneNode.getChildByName(sprite.yId);

            if (!xChild)
            {
                Log.warn("HOW")
            }

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
        })
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

    types(): { new(): Component }[] | any[] {
        return [ConstantMotion, MCollider];
    }

    update(world: World, delta: number): void {
        const ddelta = world.mainTicker.elapsedMS;

        this.runOnEntities((entity: Entity, motion: ConstantMotion, collider: MCollider) => {

            const xcomp = MathUtil.lengthDirX(motion.speed, entity.transform.rotation) * ddelta;
            const ycomp = MathUtil.lengthDirY(motion.speed, entity.transform.rotation) * ddelta;

            Matter.Body.translate(collider.body, Matter.Vector.create(xcomp, ycomp));
        });
    }
}

class PlayerControlled extends Component {
}

class ShipMover extends System {

    private readonly accSpeed = 0.000002;
    private readonly rotSpeed = MathUtil.degToRad(0.24);


    types(): { new(): Component }[] | any[] {
        return [MCollider, PlayerControlled];
    }

    update(world: World, delta: number): void {
        const ddelta = world.mainTicker.elapsedMS;

        this.runOnEntities((entity: Entity, collider: MCollider) => {

            if (Keyboard.isKeyDown('ArrowLeft', 'KeyA')) {
                Matter.Body.rotate(collider.body, -this.rotSpeed * ddelta);
            }
            if (Keyboard.isKeyDown('ArrowRight', 'KeyD')) {
                Matter.Body.rotate(collider.body, this.rotSpeed * ddelta);
            }
            if (Keyboard.isKeyDown('ArrowUp', 'KeyW')) {

                const xcomp = MathUtil.lengthDirX(this.accSpeed, entity.transform.rotation) * ddelta;
                const ycomp = MathUtil.lengthDirY(this.accSpeed, entity.transform.rotation) * ddelta;

                Matter.Body.applyForce(collider.body, collider.body.position,
                                       Matter.Vector.create(xcomp, ycomp));
            }

            if (Keyboard.isKeyPressed('Space')) {
                world.addEntity(new Bullet(entity.transform.x, entity.transform.y, entity.transform.rotation))
            }
        });
    }
}
