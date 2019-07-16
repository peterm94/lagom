import {Scene} from "../ECS/Scene";
import {Game} from "../ECS/Game";
import {Entity} from "../ECS/Entity";
import {CollisionMatrix} from "../LagomCollisions/CollisionMatrix";
import {
    CircleCollider,
    DetectActive,
    DetectActiveCollisionSystem,
    DetectCollider,
    DetectCollisionsSystem,
    RectCollider
} from "../DetectCollisions/DetectCollisions";
import {Component} from "../ECS/Component";
import {System} from "../ECS/System";
import {Result} from "detect-collisions";
import * as PIXI from "pixi.js";

import spr_block from './resources/block.png';
import {RenderCircle, RenderRect} from "../Common/PIXIComponents";
import {Diagnostics} from "../Common/Debug";
import {LagomType} from "../ECS/LifecycleObject";

const Keyboard = require('pixi.js-keyboard');

const loader = new PIXI.Loader();

enum Layers
{
    Layer1,
    Layer2,
    Layer3
}

export class DetectDemo extends Scene
{
    constructor()
    {
        super();

        const game = new Game(this, {width: 512, height: 512, resolution: 1, backgroundColor: 0xe0c723});

        loader.add([spr_block]).load(() => {
            game.start();
        })
    }

    onAdded()
    {
        super.onAdded();

        const collisions = new CollisionMatrix();

        collisions.addCollision(Layers.Layer1, Layers.Layer2);
        collisions.addCollision(Layers.Layer1, Layers.Layer1);

        this.addSystem(new PlayerMover());

        this.addSystem(new DetectCollisionsSystem(collisions));
        this.addSystem(new DetectActiveCollisionSystem());
        this.addEntity(new Diagnostics("blue"));
        // this.addSystem(new SolidSystem());
        // this.addGlobalSystem(new Inspector());
        this.addEntity(new Square(50, 50));
        this.addEntity(new CircleBoy(200, 200));
        this.addEntity(new Player("player", 100, 100));

    }
}

class Square extends Entity
{
    constructor(x: number, y: number)
    {
        super("square", x, y);

        // Do I need layers on the colliders if they are set in entity? hmm
        this.layer = Layers.Layer1;
    }

    onAdded(): void
    {
        super.onAdded();

        const collider = this.addComponent(new RectCollider(0, 0, 32, 32, this.layer));

        // this.addComponent(new Sprite(loader.resources[spr_block].texture));
        this.addComponent(new RenderRect(32, 32, 0, 0));
    }
}

class CircleBoy extends Entity
{
    constructor(x: number, y: number)
    {
        super("circle", x, y);

        // Do I need layers on the colliders if they are set in entity? hmm
        this.layer = Layers.Layer1;
    }

    onAdded(): void
    {
        super.onAdded();

        const collider = this.addComponent(new CircleCollider(0, 0, 100, this.layer));

        // this.addComponent(new Sprite(loader.resources[spr_block].texture));
        this.addComponent(new RenderCircle(100));
    }
}

class Player extends Entity
{
    constructor(name: string, x: number, y: number)
    {
        super(name, x, y);
        this.layer = Layers.Layer1;
    }

    onAdded(): void
    {
        super.onAdded();

        this.addComponent(new PlayerControlled());
        this.addComponent(new DetectActive());

        const collider = this.addComponent(
            new RectCollider(0, 0, 32, 32, this.layer));

        collider.onCollision.register((caller: DetectCollider,
                                       res: { other: DetectCollider, result: Result }) => {
            this.transform.x -= res.result.overlap * res.result.overlap_x;
            this.transform.y -= res.result.overlap * res.result.overlap_y;
        });
        // this.addComponent(new Sprite(loader.resources[spr_block].texture));
        this.addComponent(new RenderRect(32, 32, 0, 0));
    }
}

class PlayerControlled extends Component
{
}

class PlayerMover extends System
{
    readonly speed = 0.1;

    types(): LagomType<Component>[]
    {
        return [PlayerControlled];
    }

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity) => {
            if
            (Keyboard.isKeyDown('ArrowLeft', 'KeyA'))
            {
                entity.transform.x -= this.speed * delta;
            }
            if
            (Keyboard.isKeyDown('ArrowRight', 'KeyD'))
            {
                entity.transform.x += this.speed * delta;
            }
            if
            (Keyboard.isKeyDown('ArrowUp', 'KeyW'))
            {
                entity.transform.y -= this.speed * delta;
            }
            if
            (Keyboard.isKeyDown('ArrowDown', 'KeyS'))
            {
                entity.transform.y += this.speed * delta;
            }
        });
    }
}