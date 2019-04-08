import {Component, Entity, World, WorldSystem} from "./ECS";
import * as Matter from "matter-js";
import {Vector} from "matter-js";
import {Log} from "./Util";
import {instanceOf} from "prop-types";

export class MatterEngine extends WorldSystem {

    readonly matterEngine: Matter.Engine;

    constructor(gravity: Vector = Vector.create(0, 0)) {
        super();

        this.matterEngine = Matter.Engine.create();
        this.matterEngine.world.gravity.x = gravity.x;
        this.matterEngine.world.gravity.y = gravity.y;

        const render = Matter.Render.create({
                                              element: document.body,
                                              engine: this.matterEngine,
                                              options: {width: 512, height: 512}
                                          });
        Matter.Render.run(render);
    }

    onAdded() {
        super.onAdded();
    }

    update(world: World, delta: number, entities: Entity[]): void {

        // TODO check the delta here...
        // Update the physics state
        Matter.Engine.update(this.matterEngine, world.mainTicker.elapsedMS);

        // Update Pixi positions to the matter positions
        World.runOnComponents((colliders: MCollider[]) => {
            for (let collider of colliders) {

                if (collider.entity != null) {
                    collider.entity.transform.x = collider.body.position.x;
                    collider.entity.transform.y = collider.body.position.y;
                    collider.entity.transform.rotation = collider.body.angle;
                }
            }
        }, entities, MCollider);
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
        const engine = World.instance.getWorldSystem<MatterEngine>(MatterEngine);
        if (engine != null) {
            Matter.World.addBody(engine.matterEngine.world, this.body);

            // @ts-ignore
            const width = this.body.bounds.max.x - this.body.bounds.min.x;
            // @ts-ignore
            const height = this.body.bounds.max.y - this.body.bounds.min.y;

            const rect = new PIXI.Graphics();
            rect.lineStyle(1, 0xFF3300, 1);
            rect.drawRect(0, 0, width, height);
            rect.lineStyle(1, 0x0033FF, 1);

            // @ts-ignore
            rect.drawRect(0, 0, 1, 1);

            // @ts-ignore
            this.entity.transform.addChild(rect);
        } else {
            Log.warn("Could not add collider to Matter world instance. Ensure MatterEngine System is loaded before" +
                     " creating a collider.")
        }
    }

    onRemoved() {
        super.onRemoved();

        // Matter.World.remove(this.body);
    }
}