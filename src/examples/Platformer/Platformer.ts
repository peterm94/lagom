import {Scene} from "../../ECS/Scene";
import {Game} from "../../ECS/Game";
import spriteSheet from './resources/spritesheet.png';

import * as PIXI from "pixi.js";

import {RenderCircle, VeryAnimatedSprite} from "../../Common/PIXIComponents";
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
import {FrameTriggerSystem} from "../../Common/FrameTrigger";

const Keyboard = require('pixi.js-keyboard');
const sprites = new SpriteSheet(spriteSheet, 16, 16);
const collisionMatrix = new CollisionMatrix();


enum Layers
{
    PLAYER,
    ENEMY,
    SOLIDS
}

export class Platformer extends Game
{
    constructor()
    {
        super(new MainScene(), {
            width: 256,
            height: 128,
            resolution: 3,
            backgroundColor: 0x212B4F,
            antialias: false
        });

        collisionMatrix.addCollision(Layers.PLAYER, Layers.SOLIDS);
        collisionMatrix.addCollision(Layers.ENEMY, Layers.SOLIDS);
        collisionMatrix.addCollision(Layers.PLAYER, Layers.ENEMY);
    }
}

class MainScene extends Scene
{
    onAdded(): void
    {
        super.onAdded();

        this.addEntity(new Diagnostics("white", 2));

        // this.addGlobalSystem(new MatterEngine(collisionMatrix, Vector.create(0, 1), true));

        this.addSystem(new PlayerMover());
        this.addSystem(new PlayerAnimationSystem());
        // this.addSystem(new PhysicsSystem());
        this.addSystem(new PlatformerPhysics());
        this.addSystem(new DetectCollisionsSystem(collisionMatrix));
        this.addSystem(new DetectActiveCollisionSystem());
        this.addSystem(new PlatformerPhysicsPost());
        this.addGlobalSystem(new FrameTriggerSystem());

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

enum PlayerAnimationStates
{
    IDLE,
    WALK,
    FALLING,
    JUMP,
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
        const sprite = this.addComponent(new VeryAnimatedSprite(PlayerAnimationStates.IDLE));
        sprite.addAnimation(PlayerAnimationStates.IDLE,
                            sprites.animatedConfig([[0, 16], [2, 16]], 350, 8, 8));
        sprite.addAnimation(PlayerAnimationStates.WALK,
                            sprites.animatedConfig(
                                [[0, 17], [1, 17], [2, 17], [3, 17], [4, 17], [5, 17], [6, 17], [7, 17]],
                                70));
        sprite.addAnimation(PlayerAnimationStates.FALLING,
                            sprites.animatedConfig([[6, 17]], 0 ));
        sprite.addAnimation(PlayerAnimationStates.JUMP,
                            sprites.animatedConfig([[5, 17]], 0 ));
        this.addComponent(new RenderCircle(10));
        const collider = this.addComponent(new RectCollider(-4, -8, 8, 16, Layers.PLAYER));

        collider.onCollision.register((caller: DetectCollider,
                                       data: { other: DetectCollider, result: Result }) => {

            const xMove = -data.result.overlap_x * data.result.overlap;
            const yMove = -data.result.overlap_y * data.result.overlap;

            const vars = (this.getComponent(PhysicsVars) as PhysicsVars);

            if (Math.abs(vars.pushX) < Math.abs(xMove))
            {
                vars.pushX = xMove;
            }
            if (Math.abs(vars.pushY) < Math.abs(yMove))
            {
                vars.pushY = yMove;
            }

            // Log.debug(vars.pushX, vars.pushY);


        });

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

class PlayerAnimationSystem extends System
{
    types(): LagomType<Component>[]
    {
        return [PhysicsVars, VeryAnimatedSprite];
    }

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, body: PhysicsVars, sprite: VeryAnimatedSprite) => {
            if (sprite.currentSprite && sprite.currentSprite.sprite)
            {
                // We are on the ground.
                if (body.xVelocity > 0)
                {
                    // Moving right
                    sprite.setAnimation(PlayerAnimationStates.WALK);
                    sprite.currentSprite.sprite.xScale = 1;
                }
                else if (body.xVelocity < 0)
                {
                    // Moving left
                    sprite.setAnimation(PlayerAnimationStates.WALK);
                    sprite.currentSprite.sprite.xScale = -1;
                }
                else
                {
                    // Idle
                    sprite.setAnimation(PlayerAnimationStates.IDLE);
                }
                // We are in the air.
                if (body.yVelocity > 0)
                {
                    sprite.setAnimation(PlayerAnimationStates.FALLING);
                }
                else if (body.yVelocity < 0)
                {
                    sprite.setAnimation(PlayerAnimationStates.JUMP);
                }
            }
        });
    }

}


class PlayerMover extends System
{
    readonly mSpeed = 0.07;
    readonly jumpPower = Vector.create(0, -0.004);

    types(): LagomType<Component>[]
    {
        return [PhysicsVars, PlayerControlled];
    }

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, body: PhysicsVars) => {

            body.xVelocity = 0;

            if (Keyboard.isKeyDown('ArrowLeft', 'KeyA'))
            {
                body.xVelocity = -this.mSpeed;
            }
            if (Keyboard.isKeyDown('ArrowRight', 'KeyD'))
            {
                body.xVelocity = this.mSpeed;

            }
            if (Keyboard.isKeyPressed('ArrowUp', 'KeyW'))
            {
                // TODO if grounded
                body.yVelocity = -0.15;
            }
        });
    }
}