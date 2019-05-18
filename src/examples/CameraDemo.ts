import {Scene} from "../ECS/Scene";
import {World} from "../ECS/World";
import {Entity} from "../ECS/Entity";
import {CollisionMatrix} from "../Collision";
import {CircleCollider, DetectActive, DetectCollider, DetectCollisionsSystem, RectCollider} from "../DetectCollisions";
import {Component} from "../ECS/Component";
import {System} from "../ECS/System";
import {Result} from "detect-collisions";
import * as PIXI from "pixi.js";

import spr_block from './resources/block.png';
import {RenderCircle, RenderRect} from "../Components";
import {Log} from "../Util";
import {Diagnostics} from "../Debug";
import {LagomType} from "../ECS/LifecycleObject";
import {WorldSystem} from "../ECS/WorldSystem";

const Keyboard = require('pixi.js-keyboard');

const loader = new PIXI.Loader();

enum Layers
{
    Layer1,
    Layer2,
    Layer3
}

class DrawTLC extends Entity
{
    onAdded(): void
    {
        super.onAdded();

        this.addComponent(new RenderCircle(4));
    }
}

class DrawBounds extends Entity
{
    onAdded(): void
    {
        super.onAdded();

        this.addComponent(new RenderRect(0, 0, 512, 512));
        this.addComponent(new RenderRect(0, 0, 256, 256));
        this.addComponent(new RenderRect(256, 256, 256, 256));
        this.addComponent(new RenderRect(0, 256, 256, 256));
        this.addComponent(new RenderRect(256, 0, 256, 256));
    }
}

class ScreenShake extends Component
{
    readonly intensity: number;
    readonly duration: number;

    constructor(intensity: number, durationMS: number)
    {
        super();
        this.intensity = intensity;
        this.duration = durationMS;
    }
}

class ScreenShaker extends WorldSystem
{
    intensity: number = 0;
    duration: number = 0;

    types(): LagomType<Component>[]
    {
        return [ScreenShake];
    }

    update(delta: number): void
    {
        this.runOnComponents((shakers: ScreenShake[]) => {
            for (let shaker of shakers)
            {
                // TODO this isn't perfect, if more than 1 are called, the will be combined
                this.intensity = shaker.intensity > this.intensity ? shaker.intensity : this.intensity;
                this.duration = shaker.duration > this.duration ? shaker.duration : this.duration;
                shaker.destroy();
            }
        });

        if (this.duration > 0)
        {
            this.getScene().camera.rotate(Math.random() * (this.intensity + this.intensity) - this.intensity);
            this.duration -= delta;
        }
        else
        {
            this.getScene().camera.rotate(0);
            this.intensity = 0;
        }
    }
}

export class CameraDemo extends Scene
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
        this.addWorldSystem(new ScreenShaker());
        this.addEntity(new Diagnostics("blue"));
        // this.addSystem(new SolidSystem());
        // this.addWorldSystem(new Inspector());
        this.addEntity(new Square(50, 50));
        this.addEntity(new CircleBoy(200, 200));
        this.addEntity(new Player("player", 256, 256));

        this.addSystem(new FollowCamera());

        this.addEntity(new DrawTLC(""));
        this.addEntity(new DrawTLC("", 256, 256));
        this.addEntity(new DrawBounds(""))

    }
}

class FollowMe extends Component
{
}

class FollowCamera extends System
{
    private readonly mSpeed = 0.1;
    private renderer!: PIXI.Renderer;
    private angle = 0;

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
        this.angle += delta * 0.01;
        this.runOnEntities((entity: Entity) => {

            // Hard follow
            // this.camera.move(entity.transform.x, entity.transform.y, 256, 256);

            // Soft follow
            this.getScene().camera.moveTowards(entity.transform.x, entity.transform.y, 256, 256, 0.1);
        });
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
        this.addComponent(new DetectActive());
        this.addComponent(new FollowMe());
        this.addComponent(new ScreenShake(5, 1));

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
            if (Keyboard.isKeyDown('ArrowLeft', 'KeyA'))
            {
                entity.transform.x -= this.speed * delta;
            }
            if (Keyboard.isKeyDown('ArrowRight', 'KeyD'))
            {
                entity.transform.x += this.speed * delta;
            }
            if (Keyboard.isKeyDown('ArrowUp', 'KeyW'))
            {
                entity.transform.y -= this.speed * delta;
            }
            if (Keyboard.isKeyDown('ArrowDown', 'KeyS'))
            {
                entity.transform.y += this.speed * delta;
            }

            if (Keyboard.isKeyDown('Space'))
            {
                entity.addComponent(new ScreenShake(2, 800));
            }
        });
    }
}