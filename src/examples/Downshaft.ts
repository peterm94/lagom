import * as PIXI from "pixi.js";

import spr_block from './resources/block.png';
import spr_guy from './resources/guy.png';
import {World} from "../ECS/World";
import {Diagnostics} from "../Common/Debug";
import {Sprite} from "../Common/PIXIComponents";
import {MatterEngine, MCollider} from "../MatterPhysics/MatterPhysics";
import * as Matter from "matter-js";
import {Vector} from "matter-js";
import {CollisionMatrix} from "../LagomCollisions/CollisionMatrix";
import {Entity} from "../ECS/Entity";
import {System} from "../ECS/System";
import {Component} from "../ECS/Component";
import {Scene} from "../ECS/Scene";
import {LagomType} from "../ECS/LifecycleObject";

const Keyboard = require('pixi.js-keyboard');

const loader = new PIXI.Loader();


enum Layers
{
    Solid,
    Player
}


export class Downshaft extends Scene
{
    constructor()
    {
        super();

        const world = new World(this, {width: 512, height: 512, resolution: 1, backgroundColor: 0xA1B1A1});

        loader.add([spr_block, spr_guy]).load(() => {

            world.start();
        })
    }


    onAdded()
    {
        super.onAdded();

        this.addEntity(new Diagnostics("white"));

        this.addEntity(new Player(128, 50));

        // Make the vertical walls
        const height = 250;
        for (let i = 0; i < height; i++)
        {
            this.addEntity(new Block(96, i * 32));
            this.addEntity(new Block(416, i * 32));
        }

        this.addSystem(new PlayerMover());
        this.addSystem(new FollowCamera());

        const matrix = new CollisionMatrix();
        matrix.addCollision(Layers.Solid, Layers.Player);

        this.addWorldSystem(new MatterEngine(matrix, Vector.create(0, 0.15)));
    }
}

class PlayerControlled extends Component
{
}

class PlayerMover extends System
{
    private readonly moveForce = 3;
    private readonly jumpForce = -0.01;

    types(): LagomType<Component>[]
    {
        return [MCollider, PlayerControlled];
    }

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, collider: MCollider) => {

            if (Keyboard.isKeyDown('ArrowLeft', 'KeyA'))
            {
                Matter.Body.translate(collider.body, {x: -this.moveForce, y: 0});
            }
            if (Keyboard.isKeyDown('ArrowRight', 'KeyD'))
            {
                Matter.Body.translate(collider.body, {x: this.moveForce, y: 0});
            }
            if (Keyboard.isKeyPressed('Space'))
            {
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

class FollowMe extends Component
{
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

        const sprite = this.addComponent(new Sprite(loader.resources[spr_guy].texture));
        this.addComponent(new PlayerControlled());
        this.addComponent(new MCollider(Matter.Bodies.rectangle(0, 0, sprite.pixiObj.width,
                                                                sprite.pixiObj.height), 0, 0,{layer: Layers.Player}));
        this.addComponent(new FollowMe());
    }
}

class Block extends Entity
{
    constructor(x: number, y: number)
    {
        super("block", x, y);
    }

    onAdded(): void
    {
        super.onAdded();

        const sprite = this.addComponent(new Sprite(loader.resources[spr_block].texture));
        this.addComponent(new MCollider(Matter.Bodies.rectangle(0, 0, sprite.pixiObj.width,
                                                                sprite.pixiObj.height),0,0,
                                        {layer: Layers.Solid, isStatic: true}));
    }
}

class FollowCamera extends System
{
    mSpeed = 0.1;

    private renderer!: PIXI.Renderer;

    onAdded(): void
    {
        super.onAdded();

        this.renderer = this.getScene().getWorld().renderer;
    }

    types(): LagomType<Component>[]
    {
        return [FollowMe];
    }

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity) => {

            const worldPos = this.getScene().sceneNode.position;
            const midX = this.renderer.view.width / 2 - worldPos.x;
            const midY = this.renderer.view.height / 2 - worldPos.y;

            const dx = midX - entity.transform.x;
            const dy = midY - entity.transform.y;

            worldPos.x += Math.min(dx, this.mSpeed * delta);
            worldPos.y += Math.min(dy, this.mSpeed * delta);
        });
    }
}