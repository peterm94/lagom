import {Component} from "../ECS/Component";
import {Util} from "../Common/Util";
import {CollisionMatrix} from "../LagomCollisions/CollisionMatrix";
import {Collisions, Result} from "detect-collisions";
import {LagomType} from "../ECS/LifecycleObject";
import {System} from "../ECS/System";
import {Entity} from "../ECS/Entity";
import {DetectCollider2} from "./DetectColliders";
import {DetectRigidbody} from "./DetectRigidbody";
import {GlobalSystem} from "../ECS/GlobalSystem";

// Discrete system, no Rigidbody required. Entities can be moved by updating the transform as usual.
// On Update, move all colliders to their world position.
export class DiscreteCollisionSystem extends GlobalSystem
{
    readonly detectSystem: Collisions = new Collisions();

    types = () => [DetectCollider2];

    constructor(readonly collisionMatrix: CollisionMatrix)
    {
        super();
    }

    // TODO move this to fixed update
    update(delta: number): void
    {
        this.runOnComponentsWithSystem((system: DiscreteCollisionSystem, colliders: DetectCollider2[]) => {

            // Move them all to their new positions.
            for (const collider of colliders)
            {
                collider.updatePosition();
            }

            // Do a detect update.
            system.detectSystem.update();

            for (const collider of colliders)
            {
                const triggersLastFrame = collider.triggersLastFrame;
                collider.triggersLastFrame = [];

                const potentials = collider.body.potentials();
                for (const potential of potentials)
                {
                    const otherComp = (potential as any).lagomComponent as DetectCollider2;
                    const result = new Result();

                    if (system.collisionMatrix.canCollide(collider.layer, otherComp.layer)
                        && collider.body.collides(potential, result))
                    {
                        if (triggersLastFrame.includes(otherComp))
                        {
                            // Still inside the trigger.
                            collider.onTrigger.trigger(collider, {other:otherComp, result: result});
                        }
                        else
                        {
                            // New event detected.
                            collider.onTriggerEnter.trigger(collider, {other:otherComp, result: result});
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
        });
    }

    addBody(body: DetectCollider2): void
    {
        this.detectSystem.insert(body.body);
        this.detectSystem.update();
    }

    removeBody(body: DetectCollider2): void
    {
        this.detectSystem.remove(body.body);
        this.detectSystem.update();
    }

    // TODO this needs a rewrite
    placeFree(collider: DetectCollider2, dx: number, dy: number): boolean
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
            const otherComp = (potential as any).lagomComponent as DetectCollider2;

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
}
