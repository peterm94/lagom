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
import {PhysicsSystem, Rigidbody, Vector} from "../../LagomPhysics/Physics";

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

        loader.add(spriteSheet).load(() => {
            world.start();
        });

        collisionMatrix.addCollision(Layers.PLAYER, Layers.SOLIDS);
        collisionMatrix.addCollision(Layers.ENEMY, Layers.SOLIDS);
        collisionMatrix.addCollision(Layers.PLAYER, Layers.ENEMY);
    }

    onAdded(): void
    {
        super.onAdded();

        this.addSystem(new PlayerMover());
        this.addSystem(new PhysicsSystem());

        this.addSystem(new DetectCollisionsSystem(collisionMatrix));
        this.addSystem(new DetectActiveCollisionSystem());
        // this.addSystem(new PlatformerPhysics());

        this.addEntity(new Player(64, 80));
        this.addEntity(new Block(64, 96));
        this.addEntity(new Block(48, 80));
    }
}

class Block extends Entity
{
    constructor(x: number, y: number)
    {
        super("block", x, y);
        this.layer = Layers.SOLIDS;
    }

    onAdded(): void
    {
        super.onAdded();
        this.addComponent(sprites.sprite(13, 0));
        this.addComponent(new RectCollider(0, 0, 16, 16, Layers.SOLIDS));
    }
}

class Grounded extends Component
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
        this.addComponent(new PlayerControlled());
        this.addComponent(new Rigidbody());
        this.addComponent(sprites.sprite(0, 16));
        this.addComponent(new RenderCircle(1));

        const collider = this.addComponent(new RectCollider(0, 0, 16, 16, Layers.PLAYER));

        collider.onCollision.register((caller: DetectCollider,
                                       res: { other: DetectCollider, result: Result }) => {
            this.transform.x -= res.result.overlap * res.result.overlap_x;
            this.transform.y -= res.result.overlap * res.result.overlap_y;
        });

        collider.onCollisionEnter.register((caller: DetectCollider,
                                            res: { other: DetectCollider, result: Result }) => {
            if (res.other.layer === Layers.SOLIDS)
            {
                this.getComponent<Grounded>(Grounded) || this.addComponent(new Grounded());
            }
        });

        collider.onCollisionExit.register((caller: DetectCollider, other: DetectCollider) => {
            if (other.layer === Layers.SOLIDS)
            {
                const grounded = this.getComponent<Grounded>(Grounded);

                if (grounded !== null)
                {
                    grounded.destroy();
                }
            }
        });

        this.addComponent(new DetectActive());
    }
}

class PlatformerPhysics extends System
{
    readonly gravity = 0.1;

    types(): LagomType<Component>[]
    {
        return [DetectActive];
    }

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity) => {
            entity.transform.y += delta * this.gravity;
        });
    }
}

class PlayerControlled extends Component
{
}

class PlayerMover extends System
{
    readonly mSpeed = 0.07;

    types(): LagomType<Component>[]
    {
        return [Rigidbody, PlayerControlled];
    }

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, body: Rigidbody) => {

            if (Keyboard.isKeyDown('ArrowLeft', 'KeyA'))
            {
                entity.transform.x -= this.mSpeed * delta;
            }
            if (Keyboard.isKeyDown('ArrowRight', 'KeyD'))
            {
                entity.transform.x += this.mSpeed * delta;
            }
            if (Keyboard.isKeyDown('ArrowUp', 'KeyW') && entity.getComponent(Grounded) !== null)
            {
                body.addForce(Vector.up().multiply(0.1), true);
            }
        });
    }
}