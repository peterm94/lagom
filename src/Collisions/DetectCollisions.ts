import {Log, Util} from "../Common/Util";
import {CollisionMatrix} from "../LagomCollisions/CollisionMatrix";
import {Collisions, Result} from "detect-collisions";
import {DetectCollider2} from "./DetectColliders";
import {GlobalSystem} from "../ECS/GlobalSystem";
import {Component} from "../ECS/Component";
import {Entity} from "../ECS/Entity";

export abstract class CollisionSystem extends GlobalSystem
{
    readonly detectSystem: Collisions = new Collisions();

    constructor(readonly collisionMatrix: CollisionMatrix)
    {
        super();
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

    protected doCollisionCheck(colliders: DetectCollider2[]): void
    {
        for (const collider of colliders)
        {
            const triggersLastFrame = collider.triggersLastFrame;
            collider.triggersLastFrame = [];

            const potentials = collider.body.potentials();
            for (const potential of potentials)
            {
                const otherComp = (potential as any).lagomComponent as DetectCollider2;
                const result = new Result();

                if (this.collisionMatrix.canCollide(collider.layer, otherComp.layer)
                    && collider.body.collides(potential, result))
                {
                    if (triggersLastFrame.includes(otherComp))
                    {
                        // Still inside the trigger.
                        Log.trace("onTrigger");
                        collider.onTrigger.trigger(collider, {other: otherComp, result: result});
                    }
                    else
                    {
                        // New event detected.
                        Log.trace("onTriggerEnter");
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


// Discrete system, no Rigidbody required. Entities can be moved by updating the transform as usual.
// On Update, move all colliders to their world position.
export class DiscreteCollisionSystem extends CollisionSystem
{
    types = () => [DetectCollider2];

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

            this.doCollisionCheck(colliders);
        });
    }
}


export class Rigidbody extends Component
{
    affectedColliders: DetectCollider2[] = [];

    pendingX = 0;
    pendingY = 0;

    move(x: number, y: number): void
    {
        this.pendingX += x;
        this.pendingY += y;
    }

    onAdded(): void
    {
        super.onAdded();

        // Find any existing sibling or descendant colliders.
        this.affectedColliders = this.parent.getComponentsOfType(DetectCollider2, true);

        // Register event listeners for the whole tree from our parent down.
        this.childAdd(this.parent, this.parent);
    }

    private childAdd(entity: Entity, child: Entity): void
    {
        // We need to watch the tree from this node down. Any new colliders need to be detected and added to this array.
        child.componentAddedEvent.register(this.compAdd.bind(this));
        child.childAdded.register(this.childAdd.bind(this));

        // We also need to remove them when destroyed.
        child.componentRemovedEvent.register(this.compRem.bind(this));
        child.childRemoved.register(this.childRem.bind(this));
    }

    private compAdd(entity: Entity, component: Component): void
    {
        if (component instanceof DetectCollider2)
        {
            this.affectedColliders.push(component);
        }
    }

    private childRem(entity: Entity, child: Entity): void
    {
        const childColls = child.getComponentsOfType<DetectCollider2>(DetectCollider2, true);
        for (const childColl of childColls)
        {
            Util.remove(this.affectedColliders, childColl);
        }
    }

    private compRem(entity: Entity, component: Component): void
    {
        if (component instanceof DetectCollider2)
        {
            Util.remove(this.affectedColliders, component);
        }
    }

    updateAffected(): void
    {
        for (const affectedCollider of this.affectedColliders)
        {
            affectedCollider.updatePosition();
        }
    }
}

// Continuous system. We cannot apply movement straight away, need to increment positions and check on an interval.
// This gets tricky, because we can have child bodies and colliders as well. Need to updated each 'body'
// independently, cascading all effects to child components. Not sure how to deal with update order here, can think
// about that later.
export class ContinuousCollisionSystem extends CollisionSystem
{
    readonly step = 10;

    types = () => [Rigidbody];

    update(delta: number): void
    {
        this.runOnComponentsWithSystem((system: ContinuousCollisionSystem, bodies: Rigidbody[]) => {

            for (const body of bodies)
            {
                // TODO could do this with trig instead of doing x/y independently, not sure if worth. Will slow it
                //  down, but be more accurate for things moving diagonally.
                while (body.active && (body.pendingX !== 0 || body.pendingY !== 0))
                {
                    // Figure out the next movement. We do this in the loop so we can adapt to changes.
                    const xDir = Math.sign(body.pendingX);
                    const yDir = Math.sign(body.pendingY);
                    const dx = Math.min(Math.abs(body.pendingX), system.step) * xDir;
                    const dy = Math.min(Math.abs(body.pendingY), system.step) * yDir;

                    body.pendingX -= dx;
                    body.pendingY -= dy;

                    // Move by the increment.
                    body.parent.transform.x += dx;
                    body.parent.transform.y += dy;

                    // Update positions for all child colliders and update the model.
                    body.updateAffected();
                    system.detectSystem.update();

                    // Check collisions for all children.
                    this.doCollisionCheck(body.affectedColliders);
                }
                this.doCollisionCheck(body.affectedColliders);
            }
        });
    }
}
