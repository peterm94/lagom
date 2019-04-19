import spr_block from './resources/block.png';
import spr_guy from './resources/guy.png';
import {Component, Entity, System, World} from "../ECS";
import {Diagnostics} from "../Debug";
import {Sprite} from "../Components";
import {MatterEngine, MCollider} from "../MatterPhysics";
import * as Matter from "matter-js";
import {Vector} from "matter-js";
import {CollisionMatrix} from "../Collision";

const Keyboard = require('pixi.js-keyboard');

const loader = PIXI.loader;


enum Layers {
    Solid,
    Player
}


export class Downshaft {
    constructor() {

        loader.add([spr_block, spr_guy]).load(() => {

            let world = new World({width: 512, height: 512, resolution: 1}, 0xA1B1A1);

            world.addEntity(new Diagnostics("white"));

            world.addEntity(new Player(128, 50));

            // Make the vertical walls
            const height = 250;
            for (let i = 0; i < height; i++) {
                world.addEntity(new Block(96, i * 32));
                world.addEntity(new Block(416, i * 32));
            }

            world.addSystem(new PlayerMover());
            world.addSystem(new FollowCamera());

            const matrix = new CollisionMatrix();
            matrix.addCollision(Layers.Solid, Layers.Player);

            world.addWorldSystem(new MatterEngine(matrix, Vector.create(0, 0.15)));

            world.start();
        })
    }
}

class PlayerControlled extends Component {
}

class PlayerMover extends System {

    private readonly moveForce = 3;
    private readonly jumpForce = -0.01;

    types(): { new(): Component }[] | any[] {
        return [MCollider, PlayerControlled];
    }

    update(world: World, delta: number): void {
        this.runOnEntities((entity: Entity, collider: MCollider) => {

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

            // Reset rotation, we don't want to fall over
            Matter.Body.setAngle(collider.body, 0);
        });
    }
}

class FollowMe extends Component {
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
                                                                sprite.pixiObj.height), {layer: Layers.Player}));
        this.addComponent(new FollowMe());
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
                                                                sprite.pixiObj.height),
                                        {layer: Layers.Solid, isStatic: true}));
    }
}

class FollowCamera extends System {

    mSpeed = 0.1;

    types(): { new(): Component }[] | any[] {
        return [FollowMe];
    }

    update(world: World, delta: number): void {
        this.runOnEntities((entity: Entity) => {

            const worldPos = world.sceneNode.position;
            const midX = world.app.view.width / 2 - worldPos.x;
            const midY = world.app.view.height / 2 - worldPos.y;

            const dx = midX - entity.transform.x;
            const dy = midY - entity.transform.y;

            worldPos.x += Math.min(dx, this.mSpeed * delta);
            worldPos.y += Math.min(dy, this.mSpeed * delta);
        });
    }
}