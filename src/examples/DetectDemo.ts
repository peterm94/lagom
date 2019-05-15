import {Scene} from "../ECS/Scene";
import {World} from "../ECS/World";
import {Entity} from "../ECS/Entity";
import {CollisionMatrix} from "../Collision";
import {CircleCollider, DetectCollider, DetectCollisionsSystem, RectCollider} from "../DetectCollisions";
import {Component} from "../ECS/Component";
import {System} from "../ECS/System";
import {Result} from "detect-collisions";
import * as PIXI from "pixi.js";

import spr_block from './resources/block.png';
import {RenderCircle, RenderRect} from "../Components";
import {Log} from "../Util";
import {Diagnostics} from "../Debug";
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

        const world = new World(this, {width: 512, height: 512, resolution: 1, backgroundColor: 0xe0c723});

        loader.add([spr_block]).load(() => {
            world.start();
        })
    }

    onAdded()
    {
        super.onAdded();

        const collisions = new CollisionMatrix();

        collisions.addCollision(Layers.Layer1, Layers.Layer2);
        collisions.addCollision(Layers.Layer1, Layers.Layer1);

        this.addSystem(new PlayerMover());

        this.addWorldSystem(new DetectCollisionsSystem(collisions));
        this.addEntity(new Diagnostics("blueaaw"));
        // this.addSystem(new SolidSystem());
        // this.addWorldSystem(new Inspector());
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
        this.addComponent(new Solid());
        this.addComponent(new RenderRect(0, 0, 32, 32));
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
        this.addComponent(new Solid());
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

        const collider = this.addComponent(
            new RectCollider(0, 0, 32, 32, this.layer));

        collider.collisionEvent.register((caller: DetectCollider,
                                          res: { other: DetectCollider, result: Result }) => {
            this.transform.x -= res.result.overlap * res.result.overlap_x;
            this.transform.y -= res.result.overlap * res.result.overlap_y;
        });
        // this.addComponent(new Sprite(loader.resources[spr_block].texture));
        this.addComponent(new RenderRect(0, 0, 32, 32));
    }
}

class PlayerControlled extends Component
{
}

class Solid extends Component
{
}

/**
 * We can do it like this instead of the continuous way.
 */
class SolidSystem extends System
{
    types(): LagomType<Component>[]
    {
        return [DetectCollider, Solid];
    }

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, collider: DetectCollider) => {
            Log.warn(entity);

            const potentials = collider.body.potentials();

            for (let potential of potentials)
            {
                let result = new Result();
                if (collider.body.collides(potential, result))
                {
                    const other = ((<any>potential).lagom_component) as DetectCollider;
                    other.getEntity().transform.x += result.overlap_x * result.overlap;
                    other.getEntity().transform.y += result.overlap_y * result.overlap;
                }
            }
        });
    }
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