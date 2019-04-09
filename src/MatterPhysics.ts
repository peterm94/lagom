import {Component, Entity, World, WorldSystem} from "./ECS";
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

export class MatterEngine extends WorldSystem {

    readonly matterEngine: Matter.Engine;

    constructor(gravity: Matter.Vector = Matter.Vector.create(0, 0)) {
        super();

        this.matterEngine = Matter.Engine.create();
        this.matterEngine.world.gravity.x = gravity.x;
        this.matterEngine.world.gravity.y = gravity.y;


        // Register collision handlers. This will dispatch collision events to the actual collider in the collision.
        // Matterjs is dumb and doesn't do it itself.
        Matter.Events.on(this.matterEngine, "collisionStart", ((event) => {
            for (let i = 0; i < event.pairs.length; i++) {

                const pair = event.pairs[i];
                Log.debug("Collisiona event", pair, pair.bodyB);
                // @ts-ignore TODO make this happy
                Matter.Events.trigger(pair.bodyA, "collisionStart", new CollisionEvent(pair, pair.bodyB));
                // @ts-ignore
                Matter.Events.trigger(pair.bodyB, "collisionStart", new CollisionEvent(pair, pair.bodyA));
            }
        }));

        Matter.Events.on(this.matterEngine, "collisionActive", ((event) => {
            for (let i = 0; i < event.pairs.length; i++) {

                const pair = event.pairs[i];
                // @ts-ignore
                Matter.Events.trigger(pair.bodyA, "collisionEnd", {pair: pair});
            }
        }));

        Matter.Events.on(this.matterEngine, "collisionEnd", ((event) => {
            for (let i = 0; i < event.pairs.length; i++) {

                const pair = event.pairs[i];
                // @ts-ignore
                Matter.Events.trigger(pair.bodyA, "collisionEnd", {pair: pair});
            }
        }));

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
                    collider.entity.transform.y = collider.body.position.y;
                    collider.entity.transform.x = collider.body.position.x;
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

    readonly collisionEvent: Observable<MCollider, MCollider> = new Observable();

    readonly body: Matter.Body;
    readonly debugDraw: boolean = true;
    // @ts-ignore
    private engine: MatterEngine;

    constructor(body: Matter.Body) {
        super();
        this.body = body;
    }

    onAdded() {
        super.onAdded();

        // Sync the body to the current position of the entity

        // Add the body to the matter system
        this.engine = World.instance.getWorldSystem<MatterEngine>(MatterEngine) as MatterEngine;
        if (this.engine != null && this.entity != null) {
            Matter.Body.setPosition(this.body, {x: this.entity.transform.x, y: this.entity.transform.y});
            Matter.Body.setAngle(this.body, this.entity.transform.rotation);
            Matter.World.addBody(this.engine.matterEngine.world, this.body);

            if (this.debugDraw) {
                const xoff = this.entity.transform.getGlobalPosition().x;
                const yoff = this.entity.transform.getGlobalPosition().y;
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
                this.entity.transform.addChild(poly);
            }
        } else {
            Log.warn("Could not add collider to Matter world instance. Ensure MatterEngine System is loaded before" +
                     " creating a collider.")
        }

        // @ts-ignore TODO this is so dirty, is there a better way?
        this.body.entity = this.entity;
    }

    onRemoved() {
        super.onRemoved();
        Matter.World.remove(this.engine.matterEngine.world, this.body);
    }
}