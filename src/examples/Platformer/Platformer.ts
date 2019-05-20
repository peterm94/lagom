import {Scene} from "../../ECS/Scene";
import {World} from "../../ECS/World";
import spriteSheet from './resources/spritesheet.png';

import * as PIXI from "pixi.js";
import {RenderCircle} from "../../Common/PIXIComponents";
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

export class Platformer extends Scene
{
    constructor()
    {
        super();

        const world = new World(this, {
            width: 256,
            height: 128,
            resolution: 7,
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

        this.addEntity(new Diagnostics("white", 2));
        this.addSystem(new DetectCollisionsSystem(collisionMatrix));
        this.addSystem(new PlayerMover());

        // this.addSystem(new PhysicsSystem());
        this.addSystem(new PlatformerPhysics());

        this.addSystem(new DetectActiveCollisionSystem());

        this.addSystem(new PlatformerPhysicsPost());

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
        this.addComponent(sprites.sprite(this.tileId, 0));
        this.addComponent(new RectCollider(0, 0, 16, 16, Layers.SOLIDS));
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
        this.addComponent(new PhysicsVars(true));
        this.addComponent(sprites.sprite(0, 16));
        this.addComponent(new RenderCircle(1));

        const collider = this.addComponent(new RectCollider(0, 0, 16, 16, Layers.PLAYER));

        collider.onCollision.register((caller: DetectCollider,
                                            res: { other: DetectCollider, result: Result }) => {
            this.transform.x -= res.result.overlap * res.result.overlap_x;
            this.transform.y -= res.result.overlap * res.result.overlap_y;

            const vars = caller.getEntity().getComponent<PhysicsVars>(PhysicsVars);
            if (vars !== null)
            {
                if (res.result.overlap_y != 0)
                    vars.yVelocity = 0;
                if (res.result.overlap_x != 0)
                    vars.xVelocity = 0;
            }
        });

        this.addComponent(new DetectActive());
    }
}

class PhysicsVars extends Component
{
    constructor(public grounded: boolean = false, public xVelocity: number = 0, public yVelocity: number = 0)
    {
        super();
    }
}

class PlatformerPhysicsPost extends System
{
    private collSystem!: DetectCollisionsSystem;

    onAdded(): void
    {
        super.onAdded();

        const collSys = this.getScene().getSystem<DetectCollisionsSystem>(DetectCollisionsSystem);

        if (collSys === null)
        {
            Log.warn("PlatformerPhysicsPost must be added after DetectCollisionsSystem.")
        }
        else
        {
            this.collSystem = collSys;
        }
    }

    types(): LagomType<Component>[]
    {
        return [PhysicsVars];
    }

    update(delta: number): void
    {
        this.collSystem.detectSystem.update();
        this.runOnEntities((entity: Entity, physicsVars: PhysicsVars) => {
            // TODO this collides with the layer as we are moving upwards (if the layer isn't set. Bad.
            physicsVars.grounded =
                this.collSystem.instanceAt(entity.transform.x + 8, entity.transform.y + 16.1, Layers.SOLIDS);
        });
    }
}

class PlatformerPhysics extends System
{
    readonly gravity = 0.7;
    readonly xDrag = 0.1;
    readonly yDrag = 0.1;


    types(): LagomType<Component>[]
    {
        return [PhysicsVars, PlayerControlled];
    }

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, physicsVars: PhysicsVars) => {
            if (!physicsVars.grounded)
            {
                physicsVars.yVelocity += this.gravity * (delta / 1000);
            }

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
    readonly jumpPower = -0.2;

    types(): LagomType<Component>[]
    {
        return [PhysicsVars, PlayerControlled];
    }

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, physicsVars: PhysicsVars) => {

            if (Keyboard.isKeyDown('ArrowLeft', 'KeyA'))
            {
                entity.transform.x -= this.mSpeed * delta;
            }
            if (Keyboard.isKeyDown('ArrowRight', 'KeyD'))
            {
                entity.transform.x += this.mSpeed * delta;
            }
            if (Keyboard.isKeyPressed('ArrowUp', 'KeyW'))
            {
                if (physicsVars.grounded)
                {
                    physicsVars.yVelocity = this.jumpPower;
                }
            }
        });
    }
}