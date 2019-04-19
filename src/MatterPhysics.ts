import {Component, World, WorldSystem} from "./ECS";
import * as Matter from "matter-js";
import {Log} from "./Util";
import {Observable} from "./Observer";

export class CollisionEvent {
    readonly pair: Matter.IPair;
    readonly other: Matter.Body;


    constructor(pair: Matter.IPair, other: Matter.Body) {
        this.pair = pair;
        this.other = other;
    }
}

/**
 * Physics system using a matter-js implementation.
 * This engine MUST be added to a scene before any components are created. Same frame is fine, as WorldSystems are
 * processed before Entities.
 */
export class MatterEngine extends WorldSystem {

    readonly matterEngine: Matter.Engine;

    /**
     * Create a new system. This is required to actually make use of the engine.
     * @param gravity The world gravity as a vector.
     * @param debug If enabled, a separate canvas will be rendered with the physics simulation.
     */
    constructor(gravity: Matter.Vector = Matter.Vector.create(0, 0), debug: boolean = false) {
        super();

        this.matterEngine = Matter.Engine.create();
        this.matterEngine.world.gravity.x = gravity.x;
        this.matterEngine.world.gravity.y = gravity.y;


        // Register collision handlers. This will dispatch collision events to the actual collider components in the
        // collision.
        Matter.Events.on(this.matterEngine, "collisionStart", ((event) => {
            for (let i = 0; i < event.pairs.length; i++) {

                const pair = event.pairs[i];
                const compA = (<any>pair.bodyA).lagom_component as MCollider;
                const compB = (<any>pair.bodyB).lagom_component as MCollider;

                // Call the event for both colliders.
                compA.collisionStartEvent.trigger(compA, compB);
                compB.collisionStartEvent.trigger(compB, compA);

                // TODO this exposes a lot more about the collision, we can add it in as a secondary option?
                // I think unity does something similar for event types.
                // Matter.Events.trigger(pair.bodyA, "collisionStart", <any>new CollisionEvent(pair, pair.bodyB));
                // Matter.Events.trigger(pair.bodyB, "collisionStart", <any>new CollisionEvent(pair, pair.bodyA));
            }
        }));

        Matter.Events.on(this.matterEngine, "collisionActive", ((event) => {
            for (let i = 0; i < event.pairs.length; i++) {

                const pair = event.pairs[i];
                const compA = (<any>pair.bodyA).lagom_component as MCollider;
                const compB = (<any>pair.bodyB).lagom_component as MCollider;

                compA.collisionActiveEvent.trigger(compA, compB);
                compB.collisionActiveEvent.trigger(compB, compA);
            }
        }));

        Matter.Events.on(this.matterEngine, "collisionEnd", ((event) => {
            for (let i = 0; i < event.pairs.length; i++) {

                const pair = event.pairs[i];
                const compA = (<any>pair.bodyA).lagom_component as MCollider;
                const compB = (<any>pair.bodyB).lagom_component as MCollider;

                compA.collisionEndEvent.trigger(compA, compB);
                compB.collisionEndEvent.trigger(compB, compA);
            }
        }));

        // Create the debug renderer if enabled. Not really configurable, I might remove it entirely when I am
        // confident it is working correctly.
        // TODO remove this at some point
        if (debug) {
            const render = Matter.Render.create(
                {
                    element: document.body,
                    engine: this.matterEngine,
                    options: {width: 512, height: 512}
                });
            Matter.Render.run(render);
        }
    }

    types(): { new(): Component }[] | any[] {
        return [MCollider];
    }

    update(world: World, delta: number): void {

        // TODO this delta is not fixed, it probably should be.
        // Update the physics state
        Matter.Engine.update(this.matterEngine, delta);

        // Run over all colliders
        this.runOnComponents((colliders: MCollider[]) => {
            // Update Pixi positions to the matter positions
            for (let collider of colliders) {

                const entity = collider.getEntity();
                entity.transform.y = collider.body.position.y;
                entity.transform.x = collider.body.position.x;
                entity.transform.rotation = collider.body.angle;
            }
        })
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
//             Matter.Body.setPosition(body, Matter.Vector.create(this.getEntity().transform.x,
//                                                                this.entity.transform.y));
//         })
//     }
//
//     onRemoved() {
//         super.onRemoved();
//         Matter.World.remove(World.instance.matterEngine.world, this.composite);
//     }
// }

/**
 * Collider component for matter-js physics.
 */
export class MCollider extends Component {

    /**
     * This event will trigger when a collision first occurs between this collider and another.
     */
    readonly collisionStartEvent: Observable<MCollider, MCollider> = new Observable();

    /**
     * This event will trigger when a collision ends between this collider and another.
     */
    readonly collisionEndEvent: Observable<MCollider, MCollider> = new Observable();

    /**
     * This event will trigger for every frame that a collision takes place.
     */
    readonly collisionActiveEvent: Observable<MCollider, MCollider> = new Observable();

    readonly body: Matter.Body;
    readonly debugDraw: boolean = true;
    private engine: MatterEngine | null = null;

    constructor(body: Matter.Body) {
        super();
        this.body = body;
    }

    onAdded() {
        super.onAdded();

        // Add the body to the matter system
        this.engine = World.instance.getWorldSystem<MatterEngine>(MatterEngine) as MatterEngine;
        if (this.engine != null) {
            const entity = this.getEntity();

            // Add a backref to the body for the component.
            (<any>this.body).lagom_component = this;

            // Sync the body to the current position of the entity
            Matter.Body.setPosition(this.body, {x: entity.transform.x, y: entity.transform.y});
            Matter.Body.setAngle(this.body, entity.transform.rotation);
            Matter.World.addBody(this.engine.matterEngine.world, this.body);

            if (this.debugDraw) {
                const xoff = entity.transform.getGlobalPosition().x;
                const yoff = entity.transform.getGlobalPosition().y;
                const poly = new PIXI.Graphics();
                poly.lineStyle(1, 0xFF3300, 1);
                poly.drawPolygon(this.body.vertices.flatMap((val) => {
                    return [xoff - val.x, yoff - val.y];
                }));
                // Draw the last connecting line
                poly.drawPolygon([xoff - this.body.vertices[0].x,
                                  yoff - this.body.vertices[0].y,
                                  xoff - this.body.vertices[this.body.vertices.length - 1].x,
                                  yoff - this.body.vertices[this.body.vertices.length - 1].y]);

                poly.lineStyle(1, 0xFFFFF9, 1);
                poly.drawRect(0, 0, 1, 1);
                entity.transform.addChild(poly);
            }
        } else {
            Log.warn("Could not add Collider to Matter world instance. Ensure MatterEngine System is loaded before" +
                     " creating a Collider.")
        }
    }

    onRemoved() {
        super.onRemoved();

        // Remove the physics body matter world.
        if (this.engine !== null)
            Matter.World.remove(this.engine.matterEngine.world, this.body);
    }
}