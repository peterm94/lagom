import * as Matter from "matter-js";
import {CollisionMatrix} from "../LagomCollisions/CollisionMatrix";
import {GlobalSystem} from "../ECS/GlobalSystem";
import {Component} from "../ECS/Component";
import {LagomType} from "../ECS/LifecycleObject";
import {MCollider} from "./MatterColliders";

export class CollisionEvent
{
    constructor(readonly pair: Matter.IPair, readonly other: Matter.Body)
    {
    }
}

/**
 * Physics system using a matter-js implementation.
 * This engine MUST be added to a scene before any components are created. Same frame is fine, as WorldSystems are
 * processed before Entities.
 */
export class MatterEngine extends GlobalSystem
{
    readonly matterEngine: Matter.Engine;
    readonly collisionMatrix: CollisionMatrix;
    private debugRender: Matter.Render | null = null;

    /**
     * Create a new system. This is required to actually make use of the engine.
     * @param collisionMatrix The collision matrix defining collision rules for layers.
     * @param gravity The world gravity as a vector.
     * @param debug If enabled, a separate canvas will be rendered with the physics simulation.
     */
    constructor(collisionMatrix: CollisionMatrix,
                gravity: Matter.Vector = Matter.Vector.create(0, 0),
                debug = false)
    {
        super();

        this.collisionMatrix = collisionMatrix;
        this.matterEngine = Matter.Engine.create();
        this.matterEngine.world.gravity.x = gravity.x;
        this.matterEngine.world.gravity.y = gravity.y;


        // Register collision handlers. This will dispatch collision events to the actual collider components in the
        // collision.
        Matter.Events.on(this.matterEngine, "collisionStart", ((event) => {
            for (let i = 0; i < event.pairs.length; i++)
            {
                const pair = event.pairs[i];
                const compA = (pair.bodyA as any).lagomComponent as MCollider;
                const compB = (pair.bodyB as any).lagomComponent as MCollider;

                // Call the event for both colliders.
                compA.onCollisionEnter.trigger(compA, compB);
                compB.onCollisionEnter.trigger(compB, compA);

                // TODO this exposes a lot more about the collision, we can add it in as a secondary option?
                // I think unity does something similar for event types.
                // Matter.Events.trigger(pair.bodyA, "collisionStart", <any>new CollisionEvent(pair, pair.bodyB));
                // Matter.Events.trigger(pair.bodyB, "collisionStart", <any>new CollisionEvent(pair, pair.bodyA));
            }
        }));

        Matter.Events.on(this.matterEngine, "collisionActive", ((event) => {
            for (let i = 0; i < event.pairs.length; i++)
            {
                const pair = event.pairs[i];
                const compA = (pair.bodyA as any).lagomComponent as MCollider;
                const compB = (pair.bodyB as any).lagomComponent as MCollider;

                compA.onCollision.trigger(compA, compB);
                compB.onCollision.trigger(compB, compA);
            }
        }));

        Matter.Events.on(this.matterEngine, "collisionEnd", ((event) => {
            for (let i = 0; i < event.pairs.length; i++)
            {
                const pair = event.pairs[i];
                const compA = (pair.bodyA as any).lagomComponent as MCollider;
                const compB = (pair.bodyB as any).lagomComponent as MCollider;

                compA.onCollisionExit.trigger(compA, compB);
                compB.onCollisionExit.trigger(compB, compA);
            }
        }));

        // Create the debug renderer if enabled. Not really configurable, I might remove it entirely when I am
        // confident it is working correctly.
        // TODO remove this at some point
        if (debug)
        {
            this.debugRender = Matter.Render.create(
                {
                    element: document.body,
                    engine: this.matterEngine,
                    options: {width: 512, height: 512}
                });
        }
    }

    update()
    {
        // Not required.
    }

    fixedUpdate(delta: number): void
    {
        // Update the physics state
        Matter.Engine.update(this.matterEngine, delta, 1);

        // TODO this can be optimized to not run on static colliders
        // Run over all colliders
        this.runOnComponents((colliders: MCollider[]) => {
            // Update Pixi positions to the matter positions
            for (const collider of colliders)
            {
                const entity = collider.getEntity();
                entity.transform.x = collider.body.position.x - collider.xOffset;
                entity.transform.y = collider.body.position.y - collider.yOffset;
                entity.transform.rotation = collider.body.angle;
            }
        });

        if (this.debugRender)
        {
            Matter.Render.world(this.debugRender);
        }
    }

    types(): LagomType<Component>[]
    {
        return [MCollider];
    }
}

