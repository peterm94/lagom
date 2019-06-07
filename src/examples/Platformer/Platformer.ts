import {Scene} from "../../ECS/Scene";
import {World} from "../../ECS/World";
import spriteSheet from './resources/spritesheet.png';

import * as PIXI from "pixi.js";

import {RenderCircle, RenderRect} from "../../Common/PIXIComponents";
import {Entity} from "../../ECS/Entity";
import {SpriteSheet} from "../../Common/SpriteSheet";
import {
    DetectActive, DetectActiveCollisionSystem,
    DetectCollider,
    DetectCollisionsSystem,
    RectCollider
} from "../../DetectCollisions/DetectCollisions";
import {CollisionMatrix} from "../../LagomCollisions/CollisionMatrix";
import {Component} from "../../ECS/Component";
import {LagomType} from "../../ECS/LifecycleObject";
import {System} from "../../ECS/System";
import {Result} from "detect-collisions";
import {TiledMapLoader} from "../../Common/TiledMapLoader";
import world1 from "./resources/World1.json";
import {Log} from "../../Common/Util";
import {Diagnostics} from "../../Common/Debug";
import {Vector} from "matter-js";
import {MatterEngine, MCircleCollider, MCollider, MRectCollider} from "../../MatterPhysics/MatterPhysics";
import * as Matter from "matter-js";

const Keyboard = require('pixi.js-keyboard');
const loader = new PIXI.Loader();
const sprites = new SpriteSheet(spriteSheet, 16, 16);
const collisionMatrix = new CollisionMatrix();


enum Layers
{
    PLAYER,
    ENEMY,
    SOLIDS
}

class MatterPlatformerSystem extends System
{
    constructor(private readonly matterEngine: MatterEngine)
    {
        super();
    }

    types(): LagomType<Component>[]
    {
        return [MCollider];
    }

    update(delta: number): void
    {
        // this.runOnEntities((entity: Entity, collider: MCollider) => {
        //     collider.body.
        // })
    }
}

export class Platformer extends Scene
{
    constructor()
    {
        super();

        const world = new World(this, {
            width: 256,
            height: 128,
            resolution: 3,
            backgroundColor: 0x212B4F,
            antialias: false
        });

        loader.load(() => {
            world.start();
        });

        collisionMatrix.addCollision(Layers.PLAYER, Layers.SOLIDS);
        collisionMatrix.addCollision(Layers.ENEMY, Layers.SOLIDS);
        collisionMatrix.addCollision(Layers.PLAYER, Layers.ENEMY);
    }

    onAdded(): void
    {
        super.onAdded();

        // this.addEntity(new Diagnostics("white", 2));

        // this.addWorldSystem(new MatterEngine(collisionMatrix, Vector.create(0, 1), true));

        this.addSystem(new PlayerMover());
        const matterEngine = this.addWorldSystem(new MatterEngine(collisionMatrix, Vector.create(0, 0.5), true));
        this.addSystem(new MatterPlatformerSystem(matterEngine));
        // this.addSystem(new PhysicsSystem());
        // this.addSystem(new PlatformerPhysics());
        // this.addSystem(new DetectCollisionsSystem(collisionMatrix));
        // this.addSystem(new DetectActiveCollisionSystem());
        // this.addSystem(new PlatformerPhysicsPost());

        const world1Map = new TiledMapLoader(world1);
        const mapLoader: Map<number, (x: number, y: number) => void> = new Map();
        mapLoader.set(12, (x, y) => {
            this.addEntity(new Block(x, y, 12));
        });
        mapLoader.set(13, (x, y) => {
            this.addEntity(new Block(x, y, 13));
        });

        mapLoader.set(14, (x, y) => {
            this.addEntity(new Block(x, y, 14));
        });

        mapLoader.set(15, (x, y) => {
            this.addEntity(new Block(x, y, 15));
        });
        mapLoader.set(512, (x, y) => {
            this.addEntity(new Player(x, y));
        });

        world1Map.load(this, mapLoader);
    }
}

class Block extends Entity
{
    private readonly tileId: number;

    constructor(x: number, y: number, tileId: number)
    {
        super("block", x, y);
        this.tileId = tileId;
        this.layer = Layers.SOLIDS;
    }

    onAdded(): void
    {
        super.onAdded();
        this.addComponent(sprites.sprite(this.tileId, 0)).setOffset(0.5, 0.5);
        this.addComponent(new MRectCollider(0, 0, 16, 16, {
            isStatic: true, isSensor: false,
            layer: this.layer
        }, {chamfer: {radius:1}}));
        // this.addComponent(new RectCollider(0, 0, 16, 16, Layers.SOLIDS));
    }
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
        this.addComponent(new PlayerControlled());
        this.addComponent(new PhysicsVars());
        this.addComponent(sprites.sprite(0, 16)).setOffset(0.5, 0.5);
        this.addComponent(new RenderCircle(1));
        // this.addComponent(new RenderCircle(8));
        this.addComponent(new RenderRect(16, 16, -8, -8));
        this.addComponent(new MRectCollider(0, 0, 16, 16, {layer: Layers.PLAYER}));

        this.addComponent(new DetectActive());
    }
}

class PhysicsVars extends Component
{
    constructor(public grounded: boolean = false, public xVelocity: number = 0, public yVelocity: number = 0,
                public pushX: number = 0, public pushY: number = 0)
    {
        super();
    }
}

class PlatformerPhysicsPost extends System
{
    types(): LagomType<Component>[]
    {
        return [PhysicsVars];
    }

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, vars: PhysicsVars) => {

            // Resolve the new position for our entity. There is quite a bit going on here.
            // First, check if we are getting pushed out and if we are moving on that axis.
            // If our velocity is in the wrong direction, we want to zero it out (we hit a wall/floor)
            // Finally, move the entity the push amount to unstick it.
            if (vars.pushX !== 0 && vars.xVelocity !== 0)
            {
                if (Math.sign(vars.xVelocity) !== Math.sign(vars.pushX))
                {
                    vars.xVelocity = 0;
                }
                entity.transform.x += vars.pushX;
            }
            if (vars.pushY !== 0 && vars.yVelocity !== 0)
            {
                if (Math.sign(vars.yVelocity) !== Math.sign(vars.pushY))
                {
                    vars.yVelocity = 0;
                }
                entity.transform.y += vars.pushY;
            }

            // Reset push amount for next frame
            vars.pushX = 0;
            vars.pushY = 0;
        });
    }
}

class PlatformerPhysics extends System
{
    readonly gravity = 0.5;
    readonly xDrag = 0.1;
    readonly yDrag = 0.1;


    types(): LagomType<Component>[]
    {
        return [PhysicsVars, PlayerControlled];
    }

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, physicsVars: PhysicsVars) => {

            physicsVars.yVelocity += this.gravity * (delta / 1000);

            // do the other velocity things
            // Reduce velocity by drag amount
            physicsVars.xVelocity -= physicsVars.xVelocity * (this.xDrag * (delta / 1000));
            physicsVars.yVelocity -= physicsVars.yVelocity * (this.yDrag * (delta / 1000));

            // Apply movement
            entity.transform.x += physicsVars.xVelocity * delta;
            entity.transform.y += physicsVars.yVelocity * delta;
        });
    }
}

class PlayerControlled extends Component
{
}

class PlayerMover extends System
{
    readonly mSpeed = 0.07;
    readonly jumpPower = -2.4;

    types(): LagomType<Component>[]
    {
        return [MCollider, PlayerControlled];
    }

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, body: MCollider) => {

            const input = Keyboard.isKeyDown('ArrowRight', 'KeyD') - Keyboard.isKeyDown('ArrowLeft', 'KeyA');

            Matter.Body.translate(body.body, Vector.create(input * this.mSpeed * delta, 0));

            // This stops sticking to walls
            body.body.friction = 0;
            Matter.Body.setInertia(body.body, Infinity);

            Matter.Body.setVelocity(body.body, Vector.create(0, body.body.velocity.y));

            if (Keyboard.isKeyPressed('ArrowUp', 'KeyW'))
            {
                // TODO if grounded
                Matter.Body.setVelocity(body.body, Vector.create(body.body.velocity.x, this.jumpPower));
            }
        });
    }
}