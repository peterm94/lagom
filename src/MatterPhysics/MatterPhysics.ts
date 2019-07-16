import * as PIXI from "pixi.js";
import * as Matter from "matter-js";
import {Log} from "../Common/Util";
import {Observable} from "../Common/Observer";
import {CollisionMatrix} from "../LagomCollisions/CollisionMatrix";
import {GlobalSystem} from "../ECS/GlobalSystem";
import {Component} from "../ECS/Component";
import {LagomType} from "../ECS/LifecycleObject";

export class CollisionEvent
{
    readonly pair: Matter.IPair;
    readonly other: Matter.Body;

    constructor(pair: Matter.IPair, other: Matter.Body)
    {
        this.pair = pair;
        this.other = other;
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

    /**
     * Create a new system. This is required to actually make use of the engine.
     * @param collisionMatrix The collision matrix defining collision rules for layers.
     * @param gravity The world gravity as a vector.
     * @param debug If enabled, a separate canvas will be rendered with the physics simulation.
     */
    constructor(collisionMatrix: CollisionMatrix,
                gravity: Matter.Vector = Matter.Vector.create(0, 0),
                debug: boolean = false)
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
            for (let i = 0; i < event.pairs.length; i++)
            {
                const pair = event.pairs[i];
                const compA = (<any>pair.bodyA).lagom_component as MCollider;
                const compB = (<any>pair.bodyB).lagom_component as MCollider;

                compA.collisionActiveEvent.trigger(compA, compB);
                compB.collisionActiveEvent.trigger(compB, compA);
            }
        }));

        Matter.Events.on(this.matterEngine, "collisionEnd", ((event) => {
            for (let i = 0; i < event.pairs.length; i++)
            {
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
        if (debug)
        {
            const render = Matter.Render.create(
                {
                    element: document.body,
                    engine: this.matterEngine,
                    options: {width: 512, height: 512}
                });
            Matter.Render.run(render);
        }
    }

    update(delta: number): void
    {

        // TODO this can be optimized to not run on static colliders
        // Update the physics state
        Matter.Engine.update(this.matterEngine, delta);

        // Run over all colliders
        this.runOnComponents((colliders: MCollider[]) => {
            // Update Pixi positions to the matter positions
            for (let collider of colliders)
            {
                const entity = collider.getEntity();
                entity.transform.x = collider.body.position.x - collider.xOffset;
                entity.transform.y = collider.body.position.y - collider.yOffset;
                entity.transform.rotation = collider.body.angle;
            }
        })
    }

    types(): LagomType<Component>[]
    {
        return [MCollider];
    }
}

/**
 * Collider component for matter-js physics.
 */
export class MCollider extends Component
{

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

    readonly debugDraw: boolean = true;
    private engine: MatterEngine | null = null;
    private readonly layer: number;

    /**
     *
     * @param body The matter-js physics body. If providing options, collisionFilter and isSensor should be omitted
     * in favour of the constructor arguments.
     * @param options Options for the body. Includes the layer that this collider is on, if the body is a sensor or
     * a real object, and if the body is static or not.
     */
    constructor(readonly body: Matter.Body, readonly xOffset: number, readonly yOffset: number,
                options: { layer: number, isSensor?: boolean, isStatic?: boolean })
    {
        super();
        this.body.isSensor = options.isSensor || false;
        this.body.isStatic = options.isStatic || false;

        // layer settings are delegated to onAdded()
        this.layer = options.layer;
    }

    onAdded()
    {
        super.onAdded();

        // Add the body to the matter system
        const scene = this.getEntity().getScene();
        this.engine = scene.getGlobalSystem<MatterEngine>(MatterEngine) as MatterEngine;

        if (this.engine != null)
        {
            const entity = this.getEntity();

            // Set up the collision filter for the Body
            this.body.collisionFilter = {
                // If this is not 0, different collision rules apply.
                group: 0,
                // Get the internal layer for the object, set the bit layer.
                category: 1 << CollisionMatrix.layerInternal(this.layer),
                // Collision mask for this object, taken from the engine.
                mask: this.engine.collisionMatrix.maskFor(this.layer)
            };

            // Add a backref to the body for the component.
            (<any>this.body).lagom_component = this;

            // Sync the body to the current position of the entity
            Matter.Body.setStatic(this.body, this.body.isStatic);
            Matter.Body.setPosition(this.body,
                                    {x: entity.transform.x + this.xOffset, y: entity.transform.y + this.yOffset});
            Matter.Body.setAngle(this.body, entity.transform.rotation);
            Matter.World.addBody(this.engine.matterEngine.world, this.body);

            // TODO this is broken
            if (this.debugDraw && false)
            {
                const xoff = entity.transform.getGlobalPosition(<any>undefined, false).x + this.xOffset;
                const yoff = entity.transform.getGlobalPosition(<any>undefined, false).y + this.yOffset;

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
        }
        else
        {
            Log.warn("Could not add Collider to Matter world instance. Ensure MatterEngine System is loaded before" +
                         " creating a Collider.")
        }
    }

    onRemoved()
    {
        super.onRemoved();

        // Remove the physics body matter world.
        if (this.engine !== null)
        {
            Matter.World.remove(this.engine.matterEngine.world, this.body);
        }
    }
}

export class MCircleCollider extends MCollider
{
    constructor(radius: number, xOff: number, yOff: number,
                options: { layer: number; isSensor?: boolean; isStatic?: boolean })
    {
        super(Matter.Bodies.circle(0, 0, radius), xOff, yOff, options);
    }
}

export class MRectCollider extends MCollider
{
    constructor(xOff: number, yOff: number, width: number, height: number,
                options: { layer: number; isSensor?: boolean; isStatic?: boolean })
    {
        super(Matter.Bodies.rectangle(0, 0, width, height), xOff, yOff, options);
    }
}