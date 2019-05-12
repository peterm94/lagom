import {Scene} from "../ECS/Scene";
import {World} from "../ECS/World";
import {Entity} from "../ECS/Entity";
import {CollisionMatrix} from "../Collision";
import {DetectCollider, DetectCollisionsSystem} from "../DetectCollisions";
import {Component} from "../ECS/Component";
import {System} from "../ECS/System";
import {Polygon} from "detect-collisions";

const Keyboard = require('pixi.js-keyboard');

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
    }


    onAdded()
    {
        super.onAdded();

        const collisions = new CollisionMatrix();

        collisions.addCollision(Layers.Layer1, Layers.Layer2);

        this.addWorldSystem(new DetectCollisionsSystem(collisions, true));
        this.addEntity(new Square(0, 0));
    }
}

class Square extends Entity
{
    constructor(x: number, y: number)
    {
        super("square", x, y);

        // Do I need layers on the colliders if they are set in entity? hmm
        this.layer = Layers.Layer2;
    }

    onAdded(): void
    {
        super.onAdded();

        this.addComponent(new DetectCollider(new Polygon(0, 0, [[0, 0], [0, 10], [10, 10], [10, 0]]),
                                             this.layer));
        this.addComponent(new PlayerControlled());
    }
}

class PlayerControlled extends Component
{
}

class PlayerMover extends System
{
    readonly speed = 4;

    types(): { new(): Component }[] | any[]
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