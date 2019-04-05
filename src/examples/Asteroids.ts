import {Component, Entity, System, World} from "../ECS";
import {Sprite} from "../Components";
import {Diagnostics} from "../Debug";
import spr_asteroid from './resources/asteroid.png'
import spr_ship from './resources/ship.png'
import spr_bullet from './resources/bullet.png'
import {MathUtil, Util} from "../Util";

const Keyboard = require('pixi.js-keyboard');

const loader = PIXI.loader;

export class Asteroids {
    constructor() {

        loader.add([spr_asteroid, spr_ship, spr_bullet]).load(() => {

            let world = new World({width: 256, height: 256, resolution: 2}, 0x200140);

            let player = world.addEntity(new Entity("player", 0, 50));
            player.addComponent(new WrapSprite(loader.resources[spr_ship].texture)).pixiObj.anchor.set(0.5, 0.5);
            player.addComponent(new PlayerControlled());
            player.addComponent(new ScreenWrap());

            for (let i = 0; i < 10; i++) {
                world.addEntity(new Asteroid(Math.random() * world.app.screen.width,
                                             Math.random() * world.app.screen.height))
            }

            world.addEntity(new Diagnostics());

            world.addSystem(new ShipMover());
            world.addSystem(new ConstantMover());
            world.addSystem(new SpriteWrapper());
            world.addSystem(new ScreenWrapper());
            world.start();
        });
    }
}

class Asteroid extends Entity {

    constructor(x: number, y: number) {
        super("asteroid_big", x, y);
        this.transform.rotation = Math.random() * 2 * Math.PI;
    }

    onAdded() {
        super.onAdded();
        this.addComponent(new WrapSprite(loader.resources[spr_asteroid].texture)).pixiObj.anchor.set(0.5, 0.5);
        this.addComponent(new ConstantMotion(Math.random() * 0.5));
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
        this.addComponent(new Sprite(loader.resources[spr_bullet].texture)).pixiObj.anchor.set(0.5, 0.5);
        this.addComponent(new ConstantMotion(5));
    }
}

class WrapSprite extends Sprite {

    private static count = 0;
    xId: string = `__wrapSprite${++WrapSprite.count}`;
    yId: string = `__wrapSprite${++WrapSprite.count}`;

    onAdded(): void {
        super.onAdded();

        if (this.entity != null) {
            // Add 2 new sprites that shadow the real one
            const xChild = new PIXI.Sprite(this.pixiObj.texture);
            xChild.name = this.xId;
            xChild.anchor.x = this.pixiObj.anchor.x;
            xChild.anchor.y = this.pixiObj.anchor.y;
            const yChild = new PIXI.Sprite(this.pixiObj.texture);
            yChild.name = this.yId;
            yChild.anchor.x = this.pixiObj.anchor.x;
            yChild.anchor.y = this.pixiObj.anchor.y;
            World.instance.app.stage.addChild(xChild, yChild);
        }
    }
}

class ScreenWrap extends Component {
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

// class ScreenWrap extends Component {
//
//     onAdded() {
//         super.onAdded();
//         if (this.entity != null) {
//             this.entity.componentAdd.register(this.sprAdded);
//
//             // Get any sprite that already exist
//             for (let spr of this.entity.getComponentsOfType(Sprite)) {
//                 this.sprAdded(spr);
//             }
//         }
//
//     }
//
//
//     onRemoved() {
//         super.onRemoved();
//         if (this.entity != null)
//             this.entity.componentAdd.deregister(this.sprAdded);
//     }
//
//     private sprAdded(data: Component) {
//         // This gets all components, check for Sprite specifically
//         if (data instanceof Sprite) {
//             // Create a 'shadow' sprite
//             const spr = new PIXI.Sprite(data.pixiObj.texture);
//             spr.anchor.x = data.pixiObj.anchor.x;
//             spr.anchor.y = data.pixiObj.anchor.y;
//         }
//     }
// }

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
        World.runOnEntity(() => {

            if (Keyboard.isKeyDown('ArrowLeft', 'KeyA')) {
                entity.transform.rotation -= this.rotSpeed * delta;
            }
            if (Keyboard.isKeyDown('ArrowRight', 'KeyD')) {
                entity.transform.rotation += this.rotSpeed * delta;
            }
            if (Keyboard.isKeyDown('ArrowUp', 'KeyW')) {
                Util.move(entity, this.accSpeed * delta);
            }

            if (Keyboard.isKeyPressed('Space')) {
                world.addEntity(new Bullet(entity.transform.x, entity.transform.y, entity.transform.rotation))
            }
        }, entity, PlayerControlled)
    }
}
