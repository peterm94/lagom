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
                        const otherComp = (<any>potential).lagom_component;
                        const result = new Result();

                        // Check layers, then do actual collision check
                        if (this.collisionMatrix.canCollide(collider.layer, otherComp.layer)
                            && collider.body.collides(potential, result))
                        {
                            // Move out of the collision, we are done in this direction.
                            collider.body.x -= result.overlap_x * result.overlap;
                            xMag = 0;
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
                        }
                    }
                    yMag -= dy;
                }
            }

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

        return;


        // TODO we may be able to do this more efficiently?
        // Step 1, move everything in the engine
        this.runOnEntities((entity: Entity, collider: DetectCollider, body: DetectActive) => {

            body.pendingY = 0.1 * delta;

            body.lastX = Math.round(collider.body.x - collider.xOff);
            body.lastY = Math.round(collider.body.y - collider.yOff);

            // TODO We may have desynced from the actual entity pos if something else interfered.
            collider.body.x += Math.round(body.pendingX);
            collider.body.y += Math.round(body.pendingY);

            // TODO handle angles as above for rotation changes. can circles rotate? i think so.
            body.lastPendingX = body.pendingX;
            body.lastPendingY = body.pendingY;

            body.pendingX = 0;
            body.pendingY = 0;
        });

        // Update positions in the engine.
        this.detectSystem.update();

        // Step 2, detect collisions
        this.runOnEntities((entity: Entity, collider: DetectCollider, body: DetectActive) => {

            const collidersLastFrame = collider.collidersLastFrame;
            collider.collidersLastFrame = [];

            const potentials = collider.body.potentials();
            for (let potential of potentials)
            {
                const otherComp = (<any>potential).lagom_component;
                const result = new Result();

                // Check layers, then do actual collision check
                if (this.collisionMatrix.canCollide(collider.layer, otherComp.layer)
                    && collider.body.collides(potential, result))
                {
                    this.resolveCollision(collider, body, {other: otherComp, result: result});
                    // Continuous collision
                    if (collidersLastFrame.includes(otherComp))
                    {
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
            }

            // Trigger the exist event for anything that is no longer colliding
            collidersLastFrame.forEach(val => collider.onCollisionExit.trigger(collider, val));
        });

        // Step 4, move entities to resolved locations
        this.runOnEntities((entity: Entity, collider: DetectCollider) => {
            entity.transform.x = collider.body.x - collider.xOff;
            entity.transform.y = collider.body.y - collider.yOff;
        });

        // Update again with final positions.
        this.detectSystem.update();
    }

    addBody(body: DetectCollider)
    {
        this.detectSystem.insert(body.body);
        // body.onCollision.register(this.resolveCollision.bind(this));
    }

    removeBody(body: DetectCollider)
    {
        this.detectSystem.remove(body.body);
        // body.onCollision.deregister(this.resolveCollision.bind(this));
    }

    resolveCollision(caller: DetectCollider, body: DetectActive, data: { other: DetectCollider, result: Result })
    {
        // Step 3, resolve collisions
        caller.body.x -= data.result.overlap_x * data.result.overlap;
        caller.body.y -= data.result.overlap_y * data.result.overlap;


        // TODO retry? do x and y independently, make sure it doesnt try again for ever though
        // in the line above, only subtract in the smaller direction, then do the coll detection again for the other
        // movement. inline it, i don't want to affect the rest of the run if possible...... this is kinda crazy and
        // possibly wrong.
        this.detectSystem.update();
    }

    update(delta: number): void
    {
        // We don't do this around here.
    }
}

