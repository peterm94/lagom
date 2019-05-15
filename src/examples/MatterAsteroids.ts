import * as PIXI from "pixi.js";
import {World} from "../ECS/World";
import {Sprite} from "../Components";
import {Diagnostics} from "../Debug";
import spr_asteroid from './resources/asteroid.png'
import spr_asteroid2 from './resources/asteroid2.png'
import spr_asteroid3 from './resources/asteroid3.png'
import spr_ship from './resources/ship.png'
import spr_bullet from './resources/bullet.png'
import {MathUtil} from "../Util";
import {MatterEngine, MCollider} from "../MatterPhysics";
import * as Matter from "matter-js";
import {CollisionMatrix} from "../Collision";
import {Entity} from "../ECS/Entity";
import {System} from "../ECS/System";
import {Component} from "../ECS/Component";
import {ComponentType, WorldSystem} from "../ECS/WorldSystem";
import {Scene} from "../ECS/Scene";

const Keyboard = require('pixi.js-keyboard');

const loader = new PIXI.Loader();

enum CollLayers
{
    Asteroid,
    Ship,
    Bullet
}


class Inspector extends WorldSystem
{
    private readonly text: Text;

    constructor()
    {
        super();

        this.text = new Text("Inspector");
        document.body.appendChild(this.text);
    }

    update(delta: number): void
    {
        this.text.textContent = this.getScene().entities.map(
            entity => entity.name + ":\n" + entity.components.map(component => component.constructor.name).join("\n"))
                                    .join("\n")
    }

    types(): ComponentType<Component>[]
    {
        return [];
    }
}


export class MatterAsteroids extends Scene
{
    constructor()
    {
        super();

        const world = new World(this, {width: 512, height: 512, resolution: 1, backgroundColor: 0x200140});


        loader.add([spr_asteroid,
                    spr_asteroid2,
                    spr_asteroid3,
                    spr_ship,
                    spr_bullet]).load(() => {

            world.start();
        });
    }


    onAdded()
    {
        super.onAdded();

        const world = this.getWorld();

        this.addEntity(new Ship(world.renderer.screen.width / 2,
                                world.renderer.screen.height / 2));

        for (let i = 0; i < 10; i++)
        {
            this.addEntity(new Asteroid(Math.random() * world.renderer.screen.width,
                                        Math.random() * world.renderer.screen.height,
                                        3))
        }

        this.addEntity(new Diagnostics("white"));
        this.addSystem(new ShipMover());
        this.addSystem(new ConstantMover());
        this.addSystem(new ScreenWrapper());
        this.addSystem(new SpriteWrapper());
        this.addSystem(new AsteroidSplitter());
        this.addSystem(new DestroyOffScreen());

        // Set up collision rules
        const matrix = new CollisionMatrix();
        matrix.addCollision(CollLayers.Asteroid, CollLayers.Bullet);

        this.addWorldSystem(new MatterEngine(matrix));
        this.addWorldSystem(new Inspector());
    }
}

class Ship extends Entity
{
    constructor(x: number, y: number)
    {
        super("ship", x, y);
    }

    onAdded()
    {
        super.onAdded();
        this.addComponent(new WrapSprite(loader.resources[spr_ship].texture));
        this.addComponent(new PlayerControlled());
        this.addComponent(new ScreenWrap());
        this.addComponent(new MCollider(Matter.Bodies.circle(0, 0, 8),
                                        {layer: CollLayers.Ship, isSensor: true}));
    }
}

class Asteroid extends Entity
{
    readonly size: number;

    constructor(x: number, y: number, size: number)
    {
        super(`asteroid_${size}`, x, y);
        this.transform.rotation = Math.random() * 2 * Math.PI;
        this.size = size;
    }

    onAdded()
    {
        super.onAdded();

        switch (this.size)
        {
            case 3:
                this.addComponent(new WrapSprite(loader.resources[spr_asteroid].texture));
                this.addComponent(new MCollider(Matter.Bodies.circle(0, 0, 32),
                                                {layer: CollLayers.Asteroid, isSensor: true}));
                break;
            case 2:
                this.addComponent(new WrapSprite(loader.resources[spr_asteroid2].texture));
                this.addComponent(new MCollider(Matter.Bodies.circle(0, 0, 16),
                                                {layer: CollLayers.Asteroid, isSensor: true}));
                break;
            default:
                this.addComponent(new WrapSprite(loader.resources[spr_asteroid3].texture));
                this.addComponent(new MCollider(Matter.Bodies.circle(0, 0, 8),
                                                {layer: CollLayers.Asteroid, isSensor: true}));
                break;
        }

        this.addComponent(new ConstantMotion(Math.random() * 0.04 + 0.01));
        this.addComponent(new ScreenWrap());
    }
}

class Bullet extends Entity
{
    constructor(x: number, y: number, dir: number)
    {
        super("bullet", x, y);
        this.transform.rotation = dir;
    }

    onAdded()
    {
        super.onAdded();
        this.addComponent(new Sprite(loader.resources[spr_bullet].texture));
        this.addComponent(new ConstantMotion(0.5));
        const collider = this.addComponent(new MCollider(Matter.Bodies.circle(0, 0, 2),
                                                         {layer: CollLayers.Bullet, isSensor: true}));
        this.addComponent(new ScreenContained());

        collider.collisionStartEvent.register(this.onCollision.bind(this));
    }

    onCollision(caller: MCollider, other: MCollider)
    {
        this.destroy();
        other.getEntity().addComponent(new Split());
    }
}

class WrapSprite extends Sprite
{
    private static count = 0;
    xId: string = `__wrapSprite${++WrapSprite.count}`;
    yId: string = `__wrapSprite${++WrapSprite.count}`;
    xChild: PIXI.Sprite | null = null;
    yChild: PIXI.Sprite | null = null;

    onAdded(): void
    {
        super.onAdded();

        // Add 2 new sprites that shadow the real one
        this.xChild = new PIXI.Sprite(this.pixiObj.texture);
        this.xChild.name = this.xId;
        this.xChild.anchor.x = this.pixiObj.anchor.x;
        this.xChild.anchor.y = this.pixiObj.anchor.y;
        this.yChild = new PIXI.Sprite(this.pixiObj.texture);
        this.yChild.name = this.yId;
        this.yChild.anchor.x = this.pixiObj.anchor.x;
        this.yChild.anchor.y = this.pixiObj.anchor.y;
        this.getEntity().getScene().sceneNode.addChild(this.xChild, this.yChild);
    }

    onRemoved(): void
    {
        super.onRemoved();
        if (this.xChild != null && this.yChild != null)
        {
            this.getEntity().getScene().sceneNode.removeChild(this.xChild);
            this.getEntity().getScene().sceneNode.removeChild(this.yChild);
        }
    }
}

class Split extends Component
{
}

class ScreenWrap extends Component
{
}

class ScreenContained extends Component
{
}

class DestroyOffScreen extends System
{
    private readonly tolerance: number = 50;

    private renderer!: PIXI.Renderer;

    onAdded(): void
    {
        super.onAdded();

        this.renderer = this.getScene().getWorld().renderer;
    }

    types(): { new(): Component }[] | any[]
    {
        return [ScreenContained];
    }

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity) => {
            const pos = entity.transform.getGlobalPosition(<any>undefined, false);
            if (pos.x < -this.tolerance
                || pos.y < -this.tolerance
                || pos.x > this.renderer.screen.width + this.tolerance
                || pos.y > this.renderer.screen.height + this.tolerance)
            {
                entity.destroy();
            }
        })
    }
}

class AsteroidSplitter extends System
{
    types(): { new(): Component }[] | any[]
    {
        return [Split];
    }

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity) => {
            const currSize = (<Asteroid>entity).size;

            if (currSize > 1)
            {
                this.getScene().addEntity(new Asteroid(entity.transform.x, entity.transform.y, currSize - 1));
                this.getScene().addEntity(new Asteroid(entity.transform.x, entity.transform.y, currSize - 1));
            }
            entity.destroy();
        })
    }
}

class ScreenWrapper extends System
{
    private renderer!: PIXI.Renderer;

    onAdded(): void
    {
        super.onAdded();

        this.renderer = this.getScene().getWorld().renderer;
    }

    types(): { new(): Component }[] | any[]
    {
        return [MCollider, ScreenWrap];
    }

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, collider: MCollider) => {
            Matter.Body.setPosition(
                collider.body,
                Matter.Vector.create(
                    (collider.body.position.x + this.renderer.screen.width) % this.renderer.screen.width,
                    (collider.body.position.y + this.renderer.screen.height) % this.renderer.screen.height))
        })
    }
}

class SpriteWrapper extends System
{
    private renderer!: PIXI.Renderer;

    onAdded(): void
    {
        super.onAdded();

        this.renderer = this.getScene().getWorld().renderer;
    }

    types(): { new(): Component }[] | any[]
    {
        return [WrapSprite];
    }

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, sprite: WrapSprite) => {
            const xChild = this.getScene().sceneNode.getChildByName(sprite.xId);
            const yChild = this.getScene().sceneNode.getChildByName(sprite.yId);

            xChild.rotation = entity.transform.rotation;
            yChild.rotation = entity.transform.rotation;

            xChild.position.y = entity.transform.y;
            yChild.position.x = entity.transform.x;

            if (entity.transform.position.x > this.renderer.screen.width / 2)
            {
                xChild.position.x = entity.transform.position.x - this.renderer.screen.width;
            }
            else
            {
                xChild.position.x = entity.transform.position.x + this.renderer.screen.width;
            }
            if (entity.transform.position.y > this.renderer.screen.height / 2)
            {
                yChild.position.y = entity.transform.position.y - this.renderer.screen.height;
            }
            else
            {
                yChild.position.y = entity.transform.position.y + this.renderer.screen.height;
            }
        })
    }
}

class ConstantMotion extends Component
{
    speed: number;

    constructor(speed: number)
    {
        super();
        this.speed = speed;
    }
}

class ConstantMover extends System
{
    types(): { new(): Component }[] | any[]
    {
        return [ConstantMotion, MCollider];
    }

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, motion: ConstantMotion, collider: MCollider) => {

            const xcomp = MathUtil.lengthDirX(motion.speed, entity.transform.rotation) * delta;
            const ycomp = MathUtil.lengthDirY(motion.speed, entity.transform.rotation) * delta;

            Matter.Body.translate(collider.body, Matter.Vector.create(xcomp, ycomp));
        });
    }
}

class PlayerControlled extends Component
{
}

class ShipMover extends System
{
    private readonly accSpeed = 0.000002;
    private readonly rotSpeed = MathUtil.degToRad(0.24);


    types(): { new(): Component }[] | any[]
    {
        return [MCollider, PlayerControlled];
    }

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, collider: MCollider) => {

            if (Keyboard.isKeyDown('ArrowLeft', 'KeyA'))
            {
                Matter.Body.rotate(collider.body, -this.rotSpeed * delta);
            }
            if (Keyboard.isKeyDown('ArrowRight', 'KeyD'))
            {
                Matter.Body.rotate(collider.body, this.rotSpeed * delta);
            }
            if (Keyboard.isKeyDown('ArrowUp', 'KeyW'))
            {

                const xcomp = MathUtil.lengthDirX(this.accSpeed, entity.transform.rotation) * delta;
                const ycomp = MathUtil.lengthDirY(this.accSpeed, entity.transform.rotation) * delta;

                Matter.Body.applyForce(collider.body, collider.body.position,
                                       Matter.Vector.create(xcomp, ycomp));
            }

            if (Keyboard.isKeyPressed('Space'))
            {
                this.getScene().addEntity(new Bullet(entity.transform.x,
                                                     entity.transform.y,
                                                     entity.transform.rotation))
            }
        });
    }
}
