import {Component, PIXIComponent, WorldSystem} from "./ECS";
import {Sprite} from "./Components";
import Rectangle = PIXI.Rectangle;

export class Rigidbody extends Component {

}

export abstract class Collider extends PIXIComponent<PIXI.Container> {
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

export class PhysicsSystem extends WorldSystem {
    update(delta: number): void {
    }
}