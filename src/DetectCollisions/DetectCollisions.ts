import {Component} from "../ECS/Component";
import {Log, Util} from "../Common/Util";
import {CollisionMatrix} from "../LagomCollisions/CollisionMatrix";
import {Collisions, Result} from "detect-collisions";
import {LagomType} from "../ECS/LifecycleObject";
import {System} from "../ECS/System";
import {Entity} from "../ECS/Entity";
import {DetectCollider} from "./Colliders";
import {DetectActive} from "./DetectActive";
// TODO -- add trigger types, use the events
// TODO -- add a static property to optimise checks? might not need this.
export class DetectActiveCollisionSystem extends System
{
    readonly detectSystem: Collisions;
    readonly collisionMatrix: CollisionMatrix;

    constructor(collisionMatrix: CollisionMatrix)
    {
        super();
        this.collisionMatrix = collisionMatrix;
        this.detectSystem = new Collisions();
    }

    onAdded(): void
    {
        super.onAdded();
    }

    types(): LagomType<Component>[]
    {
        return [DetectCollider, DetectActive];
    }

    fixedUpdate(delta: number): void
    {
        // New thing. Move incrementally, alternating x/y until we are either at the destination or have hit something.
        this.runOnEntities((entity: Entity, collider: DetectCollider, body: DetectActive) => {

            const collidersLastFrame = collider.collidersLastFrame;
            collider.collidersLastFrame = [];

            // TODO gravity extracted
            body.pendingY = 0.1 * delta;

            const xDir = Math.sign(body.pendingX);
            let xMag = Math.abs(body.pendingX);
            const yDir = Math.sign(body.pendingY);
            let yMag = Math.abs(body.pendingY);

            while (xMag > 0 || yMag > 0)
            {
                if (xMag > 0)
                {
                    const dx = Math.min(xMag, 1);
                    collider.body.x += dx * xDir;

                    // Do collision check + resolution
                    this.detectSystem.update();
                    const potentials = collider.body.potentials();
                    for (let potential of potentials)
                    {
                        const otherComp = (<any>potential).lagom_component as DetectCollider;
                        const result = new Result();

                        // Check layers, then do actual collision check
                        if (this.collisionMatrix.canCollide(collider.layer, otherComp.layer)
                            && collider.body.collides(potential, result))
                        {
                            // Move out of the collision, we are done in this direction.
                            collider.body.x -= result.overlap_x * result.overlap;
                            xMag = 0;

                            DetectActiveCollisionSystem.fireCollisionEvents(collidersLastFrame,
                                                                            otherComp, collider, result);
                        }
                    }
                    xMag -= dx;
                }

                if (yMag > 0)
                {
                    const dy = Math.min(yMag, 1);
                    collider.body.y += dy * yDir;

                    // Do collision check + resolution
                    this.detectSystem.update();
                    const potentials = collider.body.potentials();
                    for (let potential of potentials)
                    {
                        const otherComp = (<any>potential).lagom_component;
                        const result = new Result();

                        // Check layers, then do actual collision check
                        if (this.collisionMatrix.canCollide(collider.layer, otherComp.layer)
                            && collider.body.collides(potential, result))
                        {
                            // Move out of the collision, we are done in this direction.
                            collider.body.y -= result.overlap_y * result.overlap;
                            yMag = 0;

                            DetectActiveCollisionSystem.fireCollisionEvents(collidersLastFrame,
                                                                            otherComp, collider, result);
                        }
                    }
                    yMag -= dy;
                }
            }

            // Trigger the exist event for anything that is no longer colliding
            collidersLastFrame.forEach(val => collider.onCollisionExit.trigger(collider, val));

            // Do a final update of the system.
            this.detectSystem.update();

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

    addBody(body: DetectCollider)
    {
        this.detectSystem.insert(body.body);
    }

    removeBody(body: DetectCollider)
    {
        this.detectSystem.remove(body.body);
    }

    update(delta: number): void
    {
        // We don't do this around here.
    }
}

