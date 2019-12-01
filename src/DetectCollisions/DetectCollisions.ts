import {Component} from "../ECS/Component";
import {Log, Util} from "../Common/Util";
import {CollisionMatrix} from "../LagomCollisions/CollisionMatrix";
import {Collisions, Result} from "detect-collisions";
import {LagomType} from "../ECS/LifecycleObject";
import {System} from "../ECS/System";
import {Entity} from "../ECS/Entity";
import {DetectCollider} from "./DetectColliders";
import {DetectRigidbody} from "./DetectRigidbody";

export class DetectCollisionSystem extends System
{
    readonly detectSystem: Collisions = new Collisions();

    constructor(readonly collisionMatrix: CollisionMatrix, private readonly step: number = 10)
    {
        super();
    }

    onAdded(): void
    {
        super.onAdded();
    }

    types(): LagomType<Component>[]
    {
        return [DetectCollider, DetectRigidbody];
    }

    update(delta: number): void
    {
        // We don't do this around here.
    }

    fixedUpdate(delta: number): void
    {
        // New thing. Move incrementally, alternating x/y until we are either at the destination or have hit something.
        this.runOnEntitiesWithSystem((system: DetectCollisionSystem, entity: Entity, collider: DetectCollider, body: DetectRigidbody) => {

            // Skip updating static bodies. They should not be moved. We may add kinematic bodies later that allow
            // movement that aren't affected by physics.
            if (body.isStatic) return;

            body.applyForce(delta);

            const collidersLastFrame = collider.collidersLastFrame;
            const triggersLastFrame = collider.triggersLastFrame;

            collider.collidersLastFrame = [];
            collider.triggersLastFrame = [];

            // TODO this is dirty, do it properly. Probably best to bundle up all events and do them at the end of
            //  the processing frame. This also has the advantage of not messing with anything while movement is in
            //  progress.
            const collidersThisFrame: DetectCollider[] = [];
            const triggersThisFrame: DetectCollider[] = [];

            const xDir = Math.sign(body.pendingX);
            let xMag = Math.abs(body.pendingX);
            const yDir = Math.sign(body.pendingY);
            let yMag = Math.abs(body.pendingY);

            while (xMag > 0 || yMag > 0)
            {

                // TODO I am not sure where to do this, but we need to stop looping if the thing was destroyed
                //  during iteration (which is likely on a collision frame)
                if (!entity.active || !body.active || !collider.active ) return;

                if (xMag > 0)
                {
                    const dx = Math.min(xMag, system.step);
                    collider.body.x += dx * xDir;

                    // Do collision check + resolution
                    system.detectSystem.update();

                    // TODO I am not sure where to do this, but we need to stop looping if the thing was destroyed
                    //  during iteration (which is likely on a collision frame)
                    if (!entity.active || !body.active || !collider.active ) return;
                    const potentials = collider.body.potentials();
                    for (let potential of potentials)
                    {
                        const otherComp = (potential as any).lagom_component as DetectCollider;
                        const result = new Result();

                        // Check layers, then do actual collision check
                        if (system.collisionMatrix.canCollide(collider.layer, otherComp.layer)
                            && collider.body.collides(potential, result))
                        {
                            // Check if we are a trigger. If we are, don't move out of the collision.
                            if (!collider.isTrigger && !otherComp.isTrigger)
                            {
                                // Move out of the collision, we are done in this direction.
                                collider.body.x -= result.overlap_x * result.overlap;
                                xMag = 0;
                                body.velocityX = 0;

                                if (!collidersThisFrame.includes(otherComp))
                                {
                                    collidersThisFrame.push(otherComp);

                                    DetectCollisionSystem.fireCollisionEvents(collidersLastFrame,
                                                                              otherComp, collider, result);
                                    // DetectCollisionSystem.fireCollisionEvents(collidersLastFrame,
                                    //                                           collider, otherComp, result);
                                }
                            }
                            else
                            {
                                if (!triggersThisFrame.includes(otherComp))
                                {
                                    triggersThisFrame.push(otherComp);
                                    DetectCollisionSystem.fireTriggerEvents(triggersLastFrame,
                                                                            otherComp, collider, result);
                                    // DetectCollisionSystem.fireTriggerEvents(triggersLastFrame,
                                    //                                         collider, otherComp, result);
                                }
                            }
                        }
                    }
                    xMag -= dx;
                }

                if (yMag > 0)
                {
                    const dy = Math.min(yMag, system.step);
                    collider.body.y += dy * yDir;

                    // Do collision check + resolution
                    system.detectSystem.update();

                    // TODO I am not sure where to do this, but we need to stop looping if the thing was destroyed
                    //  during iteration (which is likely on a collision frame)
                    if (!entity.active || !body.active || !collider.active ) return;
                    const potentials = collider.body.potentials();
                    for (let potential of potentials)
                    {
                        const otherComp = (potential as any).lagom_component;
                        const result = new Result();

                        // Check layers, then do actual collision check
                        if (system.collisionMatrix.canCollide(collider.layer, otherComp.layer)
                            && collider.body.collides(potential, result))
                        {
                            // Check if we are a trigger. If we are, don't move out of the collision.
                            if (!collider.isTrigger && !otherComp.isTrigger)
                            {
                                // Move out of the collision, we are done in this direction.
                                collider.body.y -= result.overlap_y * result.overlap;
                                yMag = 0;
                                body.velocityY = 0;

                                if (!collidersThisFrame.includes(otherComp))
                                {
                                    collidersThisFrame.push(otherComp);
                                    DetectCollisionSystem.fireCollisionEvents(collidersLastFrame,
                                                                              otherComp, collider, result);
                                    // DetectCollisionSystem.fireCollisionEvents(collidersLastFrame,
                                    //                                           collider, otherComp, result);
                                }
                            }
                            else
                            {
                                if (!triggersThisFrame.includes(otherComp))
                                {
                                    triggersThisFrame.push(otherComp);
                                    DetectCollisionSystem.fireTriggerEvents(triggersLastFrame,
                                                                            otherComp, collider, result);
                                    // DetectCollisionSystem.fireTriggerEvents(triggersLastFrame,
                                    //                                         collider, otherComp, result);
                                }
                            }
                        }
                    }
                    yMag -= dy;
                }
            }

            // Trigger the exist event for anything that is no longer colliding
            collidersLastFrame.forEach(val => collider.onCollisionExit.trigger(collider, val));
            triggersLastFrame.forEach(val => collider.onTriggerExit.trigger(collider, val));

            // Do a final update of the system.
            system.detectSystem.update();

            // Update the body properties.
            body.pendingY = 0;
            body.pendingX = 0;
            body.dxLastFrame = (collider.body.x - collider.xOff) - entity.transform.x;
            body.dyLastFrame = (collider.body.y - collider.yOff) - entity.transform.y;

            // Update the entity position.
            entity.transform.x = collider.body.x - collider.xOff;
            entity.transform.y = collider.body.y - collider.yOff;
        });
    }

    private static fireCollisionEvents(collidersLastFrame: DetectCollider[], otherComp: DetectCollider,
                                       collider: DetectCollider, result: Result)
    {
        if (collidersLastFrame.includes(otherComp))
        {
            // Continuous collision
            collider.onCollision.trigger(collider, {other: otherComp, result: result});
        }
        else
        {
            // New collision
            collider.onCollisionEnter.trigger(collider, {other: otherComp, result: result});
        }
        Util.remove(collidersLastFrame, otherComp);
        collider.collidersLastFrame.push(otherComp);
    }

    private static fireTriggerEvents(triggersLastFrame: DetectCollider[], otherComp: DetectCollider,
                                     collider: DetectCollider, result: Result)
    {
        if (triggersLastFrame.includes(otherComp))
        {
            // Continuous collision
            collider.onTrigger.trigger(collider, {other: otherComp, result: result});
        }
        else
        {
            // New collision
            collider.onTriggerEnter.trigger(collider, {other: otherComp, result: result});
        }
        Util.remove(triggersLastFrame, otherComp);
        collider.triggersLastFrame.push(otherComp);
    }

    addBody(body: DetectCollider)
    {
        this.detectSystem.insert(body.body);
        this.detectSystem.update();
    }

    removeBody(body: DetectCollider)
    {
        this.detectSystem.remove(body.body);
        this.detectSystem.update();
    }

    place_free(collider: DetectCollider, dx: number, dy: number): boolean
    {
        // Try moving to the destination.
        const currX = collider.body.x;
        const currY = collider.body.y;

        collider.body.x += dx;
        collider.body.y += dy;

        this.detectSystem.update();

        const potentials = collider.body.potentials();
        for (let potential of potentials)
        {
            const otherComp = (potential as any).lagom_component as DetectCollider;

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

