import {Component, Entity, PIXIComponent, World, WorldSystem} from "./ECS";
import {Sprite} from "./Components";
import {Observable} from "./Observer";
import {Collision} from "./Collision";

export class Rigidbody extends Component {

}

export abstract class Collider extends PIXIComponent<PIXI.Container> {

    readonly collisionEvent: Observable<Collider, Collider> = new Observable();

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
    private readonly collisionMatrix: CollisionMatrix;

    constructor(collisions: CollisionMatrix) {
        super();
        this.collisionMatrix = collisions;
    }

    update(world: World, delta: number, entities: Entity[]): void {

        World.runOnComponents((colliders: Collider[]) => {
            for (let i = 0; i < colliders.length; i++) {
                for (let j = i + 1; j < colliders.length; j++) {
                    const c1 = colliders[i];
                    const c2 = colliders[j];

                    // check layers can intersect, exit if they cannot
                    // @ts-ignore
                    if (!this.collisionMatrix.canCollide(c1.entity.layer, c2.entity.layer)) continue;

                    // Trigger the collision event, passing through 'other'.
                    if (Collision.checkCollision(c1, c2)) {
                        c1.collisionEvent.trigger(c1, c2);
                        c2.collisionEvent.trigger(c2, c1);
                    }
                }
            }
        }, entities, Collider);
    }
}

export class PhysicsSystem extends WorldSystem {
    update(world: World, delta: number, entities: Entity[]): void {
    }
}

export class CollisionMatrix {

    // Nothing collides with anything by default.
    readonly layers: Map<number, number> = new Map();

    addCollision(layer1: number, layer2: number) {
        let l1 = this.layers.get(layer1);
        l1 = l1 === undefined ? 0 : l1;
        this.layers.set(layer1, l1 | 1 << layer2);

        let l2 = this.layers.get(layer2);
        l2 = l2 === undefined ? 0 : l2;
        this.layers.set(layer2, l2 | 1 << layer1);
    }

    canCollide(layer1: number, layer2: number): boolean {
        const layerMask = this.layers.get(layer1);
        if (layerMask === undefined) return false;
        return (layerMask & 1 << layer2) != 0;
    }
}