import {Scene} from "../ECS/Scene";
import {Game} from "../ECS/Game";
import {Entity} from "../ECS/Entity";
import {CollisionMatrix} from "../Collisions/CollisionMatrix";
import {Component} from "../ECS/Component";
import {System} from "../ECS/System";
import {Result} from "detect-collisions";
import * as PIXI from "pixi.js";
import {RenderCircle, RenderRect} from "../Common/PIXIComponents";
import {Diagnostics} from "../Common/Debug";
import {LagomType} from "../ECS/LifecycleObject";
import {ScreenShake, ScreenShaker} from "../Common/Screenshake";
import {FollowCamera, FollowMe} from "../Common/CameraUtil";
import {CircleCollider, DetectCollider, RectCollider} from "../DetectCollisions/DetectColliders";
import {DetectRigidbody} from "../DetectCollisions/DetectRigidbody";
import {Key} from "../Input/Key";

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

        this.addComponent(new RenderCircle(0, 0, 4));
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

class PlayerControlled extends Component
{
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

        this.addComponent(new RectCollider(0, 0, 32, 32, this.layer));

        // this.addComponent(new Sprite(loader.resources[spr_block].texture));
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

        this.addComponent(new CircleCollider(0, 0, 100, this.layer));

        // this.addComponent(new Sprite(loader.resources[spr_block].texture));
        this.addComponent(new RenderCircle(0, 0, 100));
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
        this.addComponent(new DetectRigidbody());
        this.addComponent(new FollowMe());
        this.addComponent(new ScreenShake(5, 1));

        this.addComponent(new RectCollider(0, 0, 32, 32, this.layer))
            .onCollision.register((caller: DetectCollider,
                                   res: { other: DetectCollider; result: Result }) => {
            this.transform.x -= res.result.overlap * res.result.overlap_x;
            this.transform.y -= res.result.overlap * res.result.overlap_y;
        });

        this.addComponent(new RenderRect(0, 0, 32, 32));
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
            if (Game.keyboard.isKeyDown(Key.ArrowLeft, Key.KeyA))
            {
                entity.transform.x -= this.speed * delta;
            }
            if (Game.keyboard.isKeyDown(Key.ArrowRight, Key.KeyD))
            {
                entity.transform.x += this.speed * delta;
            }
            if (Game.keyboard.isKeyDown(Key.ArrowUp, Key.KeyW))
            {
                entity.transform.y -= this.speed * delta;
            }
            if (Game.keyboard.isKeyDown(Key.ArrowDown, Key.KeyS))
            {
                entity.transform.y += this.speed * delta;
            }
            if (Game.keyboard.isKeyDown(Key.Space))
            {
                entity.addComponent(new ScreenShake(2, 800));
            }
        });
    }
}

export class CameraDemoScene extends Scene
{
    onAdded(): void
    {
        super.onAdded();

        const collisions = new CollisionMatrix();

        collisions.addCollision(Layers.Layer1, Layers.Layer2);
        collisions.addCollision(Layers.Layer1, Layers.Layer1);

        this.addSystem(new PlayerMover());

        this.addGlobalSystem(new ScreenShaker());
        this.addGUIEntity(new Diagnostics("blue"));
        this.addEntity(new Square(50, 50));
        this.addEntity(new CircleBoy(200, 200));
        this.addEntity(new Player("player", 256, 256));

        this.addSystem(new FollowCamera({xOffset: 256, yOffset: 256}));

        this.addEntity(new DrawTLC(""));
        this.addEntity(new DrawTLC("", 256, 256));
        this.addEntity(new DrawBounds(""));
    }
}

export class CameraDemo extends Game
{
    constructor()
    {
        super({width: 512, height: 512, resolution: 1, backgroundColor: 0xe0c723});

        this.setScene(new CameraDemoScene(this));
    }
}
