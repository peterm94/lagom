import {Component} from "../ECS/Component";
import {Log, Util} from "../Common/Util";
import {CollisionMatrix} from "../LagomCollisions/CollisionMatrix";
import {Collisions, Result} from "detect-collisions";
import {LagomType} from "../ECS/LifecycleObject";
import {System} from "../ECS/System";
import {Entity} from "../ECS/Entity";
import {DetectCollider} from "./Colliders";
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
        // TODO we may be able to do this more efficiently?
        // Step 1, move everything in the engine
        this.runOnEntities((entity: Entity, collider: DetectCollider, body: DetectActive) => {

            body.lastX = collider.body.x - collider.xOff;
            body.lastY = collider.body.y - collider.yOff;

            // TODO We may have desynced from the actual entity pos if something else interfered.
            collider.body.x += body.pendingX;
            collider.body.y += body.pendingY;

            // TODO handle angles as above for rotation changes. can circles rotate? i think so.

            body.pendingX = 0;
            body.pendingY = 0;
        });

        // Update positions in the engine.
        this.detectSystem.update();

        // Step 2, detect collisions
        this.runOnEntities((entity: Entity, collider: DetectCollider) => {

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
        body.onCollision.register(this.resolveCollision.bind(this));
    }

    removeBody(body: DetectCollider)
    {
        this.detectSystem.remove(body.body);
        body.onCollision.deregister(this.resolveCollision.bind(this));
    }

    resolveCollision(caller: DetectCollider, data: { other: DetectCollider, result: Result })
    {
        Log.warn("DING");
        // Step 3, resolve collisions
        caller.body.x -= data.result.overlap_x * data.result.overlap;
        caller.body.y -= data.result.overlap_y * data.result.overlap;
        this.detectSystem.update();
    }

    update(delta: number): void
    {
        // We don't do this around here.
    }
}

export class DetectActive extends Component
{
    pendingX = 0;
    pendingY = 0;

    lastX: number = 0;
    lastY: number = 0;

    move(x: number, y: number)
    {
        this.pendingX += x;
        this.pendingY += y;
    }

    dir()
    {
        const pos = this.getEntity().transform.position;
        return [pos.x - this.lastX, pos.y - this.lastY];
    }
}

