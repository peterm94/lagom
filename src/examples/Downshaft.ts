import spr_block from './resources/block.png';
import spr_guy from './resources/guy.png';
import {Component, Entity, System, World} from "../ECS";
import {Diagnostics} from "../Debug";
import {Sprite} from "../Components";
import {BodyType, PhysicsSystem, Rigidbody, Vector} from "../Physics";
import {BoxCollider, CollisionMatrix, CollisionSystem} from "../Collision";

const Keyboard = require('pixi.js-keyboard');

const loader = PIXI.loader;


enum Layers {
    Default,
    Solid,
    Player
}


export class Downshaft {
    constructor() {

        loader.add([spr_block, spr_guy]).load(() => {

            let world = new World({width: 256, height: 256, resolution: 2}, 0xA1B1A1);

            world.addEntity(new Diagnostics("white"));

            world.addEntity(new Player(128, 50));

            for (let i = 0; i < 8; i++) {
                world.addEntity(new Block(i * 32, 200));
            }

            const collisionMatrix = new CollisionMatrix();
            collisionMatrix.addCollision(Layers.Solid, Layers.Player);

            world.addSystem(new PhysicsSystem());
            world.addSystem(new PlayerMover());

            world.addWorldSystem(new CollisionSystem(collisionMatrix));

            world.start();
        })
    }
}


class PlayerControlled extends Component {
}

class PlayerMover extends System {

    private readonly moveForce = 40;
    private readonly jumpForce = -1000;

    update(world: World, delta: number, entity: Entity): void {
        World.runOnEntity((rigidBody: Rigidbody, _: PlayerControlled) => {

            if (Keyboard.isKeyDown('ArrowLeft', 'KeyA')) {
                rigidBody.addForce(new Vector(-this.moveForce, 0));
            }
            if (Keyboard.isKeyDown('ArrowRight', 'KeyD')) {
                rigidBody.addForce(new Vector(this.moveForce, 0));
            }
            if (Keyboard.isKeyPressed('Space')) {
                rigidBody.addForce(new Vector(0, this.jumpForce));
            }
        }, entity, Rigidbody, PlayerControlled)
    }
}

class Player extends Entity {

    constructor(x: number, y: number) {
        super("player", x, y);
    }

    onAdded(): void {
        super.onAdded();

        const sprite = this.addComponent(new Sprite(loader.resources[spr_guy].texture));
        this.addComponent(BoxCollider.fromSprite(sprite));
        this.addComponent(new Rigidbody(BodyType.Dynamic));
        this.addComponent(new PlayerControlled());
    }
}

class Block extends Entity {

    constructor(x: number, y: number) {
        super("block", x, y);
    }

    onAdded(): void {
        super.onAdded();

        this.addComponent(new Sprite(loader.resources[spr_block].texture));
        this.addComponent(new Rigidbody(BodyType.Static));
    }
}