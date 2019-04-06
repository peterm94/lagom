import {Component, Entity, System, World} from "./ECS";
import * as Matter from "matter-js";

export class MatterEngine extends System {
    update(world: World, delta: number, entity: Entity): void {

        World.runOnEntity((collider: MCollider) => {
            entity.transform.x = collider.body.position.x;
            entity.transform.y = collider.body.position.y;
            entity.transform.rotation = collider.body.angle;
        }, entity, MCollider);
    }
}

// TODO handle multiple colliders on an entity... use a composite and be smart?
// class MComposite extends Component {
//     private readonly composite: Matter.Composite;
//
//     constructor(composite: Matter.Composite) {
//         super();
//         this.composite = composite;
//     }
//
//     onAdded() {
//         super.onAdded();
//         Matter.World.addComposite(World.instance.matterEngine.world, this.composite);
//         Matter.Composite.allBodies(this.composite).forEach((body) => {
//             // @ts-ignore
//             Matter.Body.setPosition(body, Matter.Vector.create(this.entity.transform.x, this.entity.transform.y));
//         })
//     }
//
//     onRemoved() {
//         super.onRemoved();
//         Matter.World.remove(World.instance.matterEngine.world, this.composite);
//     }
// }

export class MCollider extends Component {
    readonly body: Matter.Body;

    constructor(body: Matter.Body) {
        super();
        this.body = body;
    }

    onAdded() {
        super.onAdded();

        // Sync the body to the current position of the entity

        // @ts-ignore
        Matter.Body.setPosition(this.body, {x: this.entity.transform.x, y: this.entity.transform.y});
        // @ts-ignore
        Matter.Body.setAngle(this.body, this.entity.transform.rotation);

        // Add the body to the matter system
        Matter.World.addBody(World.instance.matterEngine.world, this.body);
    }

    onRemoved() {
        super.onRemoved();

        // Matter.World.remove(this.body);
    }
}