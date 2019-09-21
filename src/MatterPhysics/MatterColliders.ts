import * as Matter from "matter-js";
import {Component} from "../ECS/Component";
import {Observable} from "../Common/Observer";
import {CollisionMatrix} from "../LagomCollisions/CollisionMatrix";
import {Log} from "../Common/Util";
import {MatterEngine} from "./MatterPhysics";
import {IChamferableBodyDefinition} from "matter-js";

/**
 * Collider component for matter-js physics.
 */
export class MCollider extends Component
{
    /**
     * This event will trigger when a collision first occurs between this collider and another.
     */
    readonly onCollisionEnter: Observable<MCollider, MCollider> = new Observable();

    /**
     * This event will trigger when a collision ends between this collider and another.
     */
    readonly onCollisionExit: Observable<MCollider, MCollider> = new Observable();

    /**
     * This event will trigger for every frame that a collision takes place.
     */
    readonly onCollision: Observable<MCollider, MCollider> = new Observable();

    readonly debugDraw: boolean = true;
    engine: MatterEngine | null = null;
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
            (this.body as any).lagom_component = this;

            // Sync the body to the current position of the entity in real space.
            Matter.Body.setStatic(this.body, this.body.isStatic);
            Matter.Body.setPosition(this.body,
                                    {
                                        x: entity.transform.x + this.xOffset,
                                        y: entity.transform.y + this.yOffset
                                    });

            // TODO not sure what we do with rotation here.....
            Matter.Body.setAngle(this.body, entity.transform.rotation);

            // Matter.Body.setInertia(this.body, Infinity);

            // Add the body to the world.
            Matter.World.addBody(this.engine.matterEngine.world, this.body);
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
                options: { layer: number; isSensor?: boolean; isStatic?: boolean },
                rectOptions?: IChamferableBodyDefinition)
    {
        super(Matter.Bodies.rectangle(0, 0, width, height, rectOptions), xOff, yOff, options);
    }
}