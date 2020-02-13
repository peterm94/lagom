import {Util} from "../Common/Util";
import {CollisionMatrix} from "../LagomCollisions/CollisionMatrix";
import {Collisions, Result} from "detect-collisions";
import {Collider, CollisionType} from "./Colliders";
import {GlobalSystem} from "../ECS/GlobalSystem";
import {Rigidbody} from "./Rigidbody";

export abstract class CollisionSystem extends GlobalSystem
{
    readonly detectSystem: Collisions = new Collisions();

    constructor(readonly collisionMatrix: CollisionMatrix)
    {
        super();
    }

    addBody(body: Collider): void
    {
        this.detectSystem.insert(body.body);
        this.detectSystem.update();
    }

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
            const otherComp = (potential as any).lagomComponent as Collider;

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

    protected doCollisionCheck(colliders: Collider[]): void
    {
        for (const collider of colliders)
        {
            const triggersLastFrame = collider.triggersLastFrame;
            collider.triggersLastFrame = [];

            const potentials = collider.body.potentials();
            for (const potential of potentials)
            {
                const otherComp = (potential as any).lagomComponent as Collider;
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
    types = () => [Collider];

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
    constructor(collisionMatrix: CollisionMatrix, readonly step: number)
    {
        super(collisionMatrix);
    }

    types = () => [Rigidbody];

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
                // Discrete or not moving, just move to final position and do the checks.
                if (body.collType === CollisionType.Discrete ||
                    (body.pendingY === 0 && body.pendingX === 0 && body.pendingAngRotation === 0))
                {
                    // Move to final positions.
                    body.parent.transform.x += body.pendingX;
                    body.parent.transform.y += body.pendingY;
                    body.parent.transform.angle += body.pendingAngRotation;
                    body.pendingX = 0;
                    body.pendingY = 0;
                    body.pendingAngRotation = 0;

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
                    //  down, but be more accurate for things moving diagonally.
                    while (body.active && (body.pendingX !== 0 || body.pendingY !== 0 || body.pendingAngRotation !== 0))
                    {
                        // There is no delta usage here, we operate on a fixed timestep.
                        // Figure out the next movement. We do this in the loop so we can adapt to changes.
                        const xDir = Math.sign(body.pendingX);
                        const yDir = Math.sign(body.pendingY);
                        const rotDir = Math.sign(body.pendingAngRotation);

                        const dx = Math.min(Math.abs(body.pendingX), system.step) * xDir;
                        const dy = Math.min(Math.abs(body.pendingY), system.step) * yDir;
                        const dRot = Math.min(Math.abs(body.pendingAngRotation), system.step) * rotDir;

                        body.pendingX -= dx;
                        body.pendingY -= dy;
                        body.pendingAngRotation -= dRot;


                        // Move by the increment.
                        body.parent.transform.x += dx;
                        body.parent.transform.y += dy;
                        body.parent.transform.angle += dRot;

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
