import {Util} from "../Common/Util";
import {CollisionMatrix} from "./CollisionMatrix";
import {Collisions, Result} from "detect-collisions";
import {BodyType, Collider, LagomBody} from "./Colliders";
import {GlobalSystem} from "../ECS/GlobalSystem";
import {Rigidbody} from "./Rigidbody";
import {LagomType} from "../ECS/LifecycleObject";
import {Component} from "../ECS/Component";

/**
 * Base class for collision systems.
 */
export abstract class CollisionSystem extends GlobalSystem
{
    // The inner detect system that will perform the collision checks.
    readonly detectSystem: Collisions = new Collisions();

    /**
     * Creates a new Collision System.
     * @param collisionMatrix The collision matrix used for layer checking.
     */
    constructor(readonly collisionMatrix: CollisionMatrix)
    {
        super();
    }

    /**
     * Add a body to the system.
     * @param body The body to add.
     */
    addBody(body: Collider): void
    {
        this.detectSystem.insert(body.body);
        this.detectSystem.update();
    }

    /**
     * Remove a body from the system.
     * @param body The body to remove.
     */
    removeBody(body: Collider): void
    {
        this.detectSystem.remove(body.body);
        this.detectSystem.update();
    }

    // TODO this needs a rewrite
    placeFree(collider: Collider, dx: number, dy: number): boolean
    {
        // Try moving to the destination.
        const currX = collider.body.x;
        const currY = collider.body.y;

        collider.body.x += dx;
        collider.body.y += dy;

        this.detectSystem.update();

        const potentials = collider.body.potentials();
        for (const potential of potentials)
        {
            const otherComp = (potential as unknown as LagomBody).lagomComponent as Collider;

            if (this.collisionMatrix.canCollide(collider.layer, otherComp.layer)
                && collider.body.collides(potential))
            {
                collider.body.x = currX;
                collider.body.y = currY;
                this.detectSystem.update();
                return false;
            }
        }

        collider.body.x = currX;
        collider.body.y = currY;
        this.detectSystem.update();
        return true;
    }

    /**
     * Do collision checks for the given colliders. Will fire off events if triggers occur.
     * @param colliders The colliders to do the checks for.
     */
    protected doCollisionCheck(colliders: Collider[]): void
    {
        for (const collider of colliders)
        {
            const triggersLastFrame = collider.triggersLastFrame;
            collider.triggersLastFrame = [];

            const potentials = collider.body.potentials();
            for (const potential of potentials)
            {
                const otherComp = (potential as unknown as LagomBody).lagomComponent as Collider;
                const result = new Result();

                if (this.collisionMatrix.canCollide(collider.layer, otherComp.layer)
                    && collider.body.collides(potential, result))
                {
                    if (triggersLastFrame.includes(otherComp))
                    {
                        // Still inside the trigger.
                        collider.onTrigger.trigger(collider, {other: otherComp, result: result});
                    }
                    else
                    {
                        // New event detected.
                        collider.onTriggerEnter.trigger(collider, {other: otherComp, result: result});
                    }

                    Util.remove(triggersLastFrame, otherComp);
                    collider.triggersLastFrame.push(otherComp);
                }
            }

            // Trigger all exit events for remaining objects.
            for (const pastColl of triggersLastFrame)
            {
                collider.onTriggerExit.trigger(collider, pastColl);
            }
        }
    }
}


/**
 * Discrete system, no Rigidbody required. Entities can be moved by updating the transform as usual. On FixedUpdate,
 * move all colliders to their world position.
 *
 * Avoid fast moving objects, as they will easily clip through things. use the continuous implementation if required.
 */
export class DiscreteCollisionSystem extends CollisionSystem
{
    types = (): LagomType<Component>[] => [Collider];

    update(delta: number): void
    {
        // This system operates in the fixed update.
    }

    fixedUpdate(delta: number): void
    {
        super.fixedUpdate(delta);

        this.runOnComponentsWithSystem((system: DiscreteCollisionSystem, colliders: Collider[]) => {

            // Move them all to their new positions. This uses the current transform position.
            for (const collider of colliders)
            {
                collider.updatePosition();
            }

            // Do a detect update.
            system.detectSystem.update();

            // Do collision checks.
            this.doCollisionCheck(colliders);
        });
    }
}


/**
 * Continuous system. We cannot apply movement straight away, need to increment positions and check on an interval.
 * This gets tricky, because we can have child bodies and colliders as well. Need to updated each 'body'
 * independently, cascading all effects to child components. Not sure how to deal with update order here, can think
 * about that later.
 */
export class ContinuousCollisionSystem extends CollisionSystem
{
    /**
     * Construct the collision system.
     *
     * @param collisionMatrix Matrix used for layer calculations.
     * @param step The step size used for moving objects. Make this low, but not super low or performance will be
     * greatly impacted.
     */
    constructor(collisionMatrix: CollisionMatrix, readonly step: number = 10)
    {
        super(collisionMatrix);
    }

    types = (): LagomType<Component>[] => [Rigidbody];

    update(delta: number): void
    {
        // Fixed timestep
    }

    fixedUpdate(delta: number): void
    {
        super.fixedUpdate(delta);

        this.runOnComponentsWithSystem((system: ContinuousCollisionSystem, bodies: Rigidbody[]) => {

            for (const body of bodies)
            {
                if (!body.active || body.bodyType === BodyType.Static)
                {
                    // Skip. Can't hit other statics. If something moves into me, it will trigger an event.
                }
                else if (body.bodyType === BodyType.Discrete ||
                    (body.pendingY === 0 && body.pendingX === 0 && body.pendingRotation === 0))
                {
                    // Discrete or not moving, just move to final position and do the checks.
                    // Move to final positions.
                    body.parent.transform.x += body.pendingX;
                    body.parent.transform.y += body.pendingY;
                    body.parent.transform.rotation += body.pendingRotation;
                    body.pendingX = 0;
                    body.pendingY = 0;
                    body.pendingRotation = 0;

                    // This forces the move. Otherwise, not applied until the next render frame.
                    body.parent.transform.updateTransform();

                    // Update body positions and simulation.
                    body.updateAffected();
                    system.detectSystem.update();

                    // Do checks.
                    this.doCollisionCheck(body.affectedColliders);
                }
                else
                {
                    // TODO could do this with trig instead of doing x/y independently, not sure if worth. Will slow it
                    //  down, but be more accurate for things moving off axis.
                    while (body.active && (body.pendingX !== 0 || body.pendingY !== 0 || body.pendingRotation !== 0))
                    {
                        // There is no delta usage here, we operate on a fixed timestep.
                        // Figure out the next movement. We do this in the loop so we can adapt to changes.
                        const xDir = Math.sign(body.pendingX);
                        const yDir = Math.sign(body.pendingY);
                        const rotDir = Math.sign(body.pendingRotation);

                        const dx = Math.min(Math.abs(body.pendingX), system.step) * xDir;
                        const dy = Math.min(Math.abs(body.pendingY), system.step) * yDir;
                        const dRot = Math.min(Math.abs(body.pendingRotation), system.step) * rotDir;

                        body.pendingX -= dx;
                        body.pendingY -= dy;
                        body.pendingRotation -= dRot;

                        // Move by the increment.
                        body.parent.transform.x += dx;
                        body.parent.transform.y += dy;
                        body.parent.transform.rotation += dRot;

                        // This forces the move. Otherwise, not applied until the next render frame.
                        body.parent.transform.updateTransform();

                        // Update positions for all child colliders and update the model.
                        body.updateAffected();
                        system.detectSystem.update();

                        // Check collisions for all children.
                        this.doCollisionCheck(body.affectedColliders);
                    }
                }
            }
        });
    }
}

/**
 * Debug draw for collision systems. Will render the detect-collisions state to a test canvas. A canvas needs to be
 * created with the id 'detect-render'. Ensure the canvas sizing is correct. This is *really* slow. Also, wont
 * follow the real canvas view if you move the camera.
 *
 * ```
 * <canvas id={"detect-render"} width={"512"} height={"512"} style={{border:"black", borderStyle:"solid"}}/>
 * ```
 */
export class DebugCollisionSystem extends GlobalSystem
{
    /**
     * Constructor.
     * @param system The system to draw.
     */
    constructor(readonly system: CollisionSystem)
    {
        super();
    }

    types = (): LagomType<Component>[] => [];

    update(delta: number): void
    {
        const canvas = document.getElementById("detect-render");
        if (canvas !== null)
        {
            const context = (canvas as HTMLCanvasElement).getContext("2d");
            if (context !== null)
            {
                this.system.detectSystem.draw(context);
                context.stroke();
            }
        }
    }
}
