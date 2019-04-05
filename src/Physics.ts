import {Component, Entity, PIXIComponent, World, WorldSystem} from "./ECS";
import {Sprite} from "./Components";
import {Observable} from "./Observer";
import {Collision} from "./Collision";

export class Rigidbody extends Component {

}

export abstract class Collider extends PIXIComponent<PIXI.Container> {

    readonly collisionEvent: Observable<Collider> = new Observable();

    protected constructor() {
        super(new PIXI.Container());
    }
}

export class BoxCollider extends Collider {
    width: number;
    height: number;


    constructor(width: number, height: number, xoff: number = 0, yoff: number = 0) {
        super();
        this.width = width;
        this.height = height;

        this.pixiObj.x += xoff;
        this.pixiObj.y += yoff;
    }

    static fromSprite(sprite: Sprite, xoff: number = 0, yoff: number = 0): BoxCollider {
        return new BoxCollider(sprite.pixiObj.width, sprite.pixiObj.height, xoff, yoff);
    }
}

export class CircleCollider extends Collider {
    radius: number;

    constructor(radius: number) {
        super();
        this.radius = radius;
    }
}

export class CollisionSystem extends WorldSystem {
    update(world: World, delta: number, entities: Entity[]): void {

        World.runOnComponents((colliders: Collider[]) => {
            for (let i = 0; i < colliders.length; i++) {
                for (let j = i + 1; j < colliders.length; j++) {
                    const c1 = colliders[i];
                    const c2 = colliders[j];

                    // Trigger the collision event, passing through 'other'.
                    if (Collision.checkCollision(c1, c2)) {
                        c1.collisionEvent.trigger(c2);
                        c2.collisionEvent.trigger(c1);
                    }
                }
            }
        }, entities, Collider as any);
    }

}

export class PhysicsSystem extends WorldSystem {
    update(world: World, delta: number, entities: Entity[]): void {
    }

}