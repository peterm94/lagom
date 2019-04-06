import spr_block from './resources/block.png';
import spr_guy from './resources/guy.png';
import {Component, Entity, System, World} from "../ECS";
import {Diagnostics} from "../Debug";
import {Sprite} from "../Components";
import {MatterEngine, MCollider} from "../MatterPhysics";
import * as Matter from "matter-js";

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

            world.addSystem(new PlayerMover());
            world.addSystem(new MatterEngine());

            world.start();
        })
    }
}


class PlayerControlled extends Component {
}

class PlayerMover extends System {

    private readonly moveForce = 3;
    private readonly jumpForce = -0.5;

    update(world: World, delta: number, entity: Entity): void {
        World.runOnEntity((collider: MCollider) => {

            if (Keyboard.isKeyDown('ArrowLeft', 'KeyA')) {
                Matter.Body.translate(collider.body, {x: -this.moveForce, y: 0});
            }
            if (Keyboard.isKeyDown('ArrowRight', 'KeyD')) {
                Matter.Body.translate(collider.body, {x: this.moveForce, y: 0});
            }
            if (Keyboard.isKeyPressed('Space')) {
                Matter.Body.applyForce(collider.body, {
                    x: collider.body.position.x,
                    y: collider.body.position.y
                }, {x: 0, y: this.jumpForce});
            }
        }, entity, MCollider, PlayerControlled)
    }
}

class Player extends Entity {

    constructor(x: number, y: number) {
        super("player", x, y);
    }

    onAdded(): void {
        super.onAdded();

        const sprite = this.addComponent(new Sprite(loader.resources[spr_guy].texture));
        this.addComponent(new PlayerControlled());
        this.addComponent(new MCollider(Matter.Bodies.rectangle(0, 0, sprite.pixiObj.width,
                                                                sprite.pixiObj.height)))
    }
}

class Block extends Entity {

    constructor(x: number, y: number) {
        super("block", x, y);
    }

    onAdded(): void {
        super.onAdded();

        const sprite = this.addComponent(new Sprite(loader.resources[spr_block].texture));
        this.addComponent(new MCollider(Matter.Bodies.rectangle(0, 0, sprite.pixiObj.width,
                                                                sprite.pixiObj.height, {isStatic: true})));
    }
}