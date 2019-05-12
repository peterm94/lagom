import {WorldSystem} from "./ECS/WorldSystem";
import {Component} from "./ECS/Component";
import {Log} from "./Util";
import {Observable} from "./Observer";
import {CollisionMatrix} from "./Collision";
import {Collisions, Polygon, Body} from "detect-collisions";


export class DetectCollisionsSystem extends WorldSystem
{
    readonly detectSystem: Collisions;
    readonly collisionMatrix: CollisionMatrix;
    private readonly continuous: boolean;

    constructor(collisionMatrix: CollisionMatrix, continuous: boolean = true)
    {
        super();
        this.collisionMatrix = collisionMatrix;
        this.continuous = continuous;
        this.detectSystem = new Collisions();
    }

    types(): { new(): Component }[] | any[]
    {
        return [DetectCollider];
    }

    update(delta: number): void
    {
        // Move all entities to their new positions
        this.runOnComponents((colliders: DetectCollider[]) => {
            for (let collider of colliders)
            {
                const entity = collider.getEntity();
                collider.body.x = entity.transform.x;
                collider.body.y = entity.transform.y;

                // Polygons can rotate
                if (collider.body instanceof Polygon)
                {
                    collider.body.angle = entity.transform.angle;
                }
            }
        });

        // We don't need a delta, this is a pure collision checking system. No physics.
        // Allow the system to process the changes.
        this.detectSystem.update();

        // If we have enabled continuous checks, do the collision checking.
        if (this.continuous)
        {
            this.runOnComponents((colliders: DetectCollider[]) => {
                for (let collider of colliders)
                {
                    const potentials = collider.body.potentials();
                    for (let potential of potentials)
                    {
                        const otherComp = (<any>potential).lagom_comonent;

                        // Check layers, then do actual collision check
                        if (this.collisionMatrix.canCollide(collider.layer, otherComp.layer)
                            && collider.body.collides(potential))
                        {
                            // Trigger collision for each
                            collider.collisionEvent.trigger(collider, otherComp);
                            otherComp.collisionEvent.trigger(otherComp, collider);
                        }
                    }
                }
            });
        }
    }
}

export class DetectCollider extends Component
{
    private engine: DetectCollisionsSystem | null = null;
    readonly collisionEvent: Observable<DetectCollider, DetectCollider> = new Observable();
    readonly body: Body;
    readonly layer: number;

    constructor(body: Body, layer: number)
    {
        super();

        this.body = body;
        this.layer = layer;

        // Add a backref
        (<any>this.body).lagom_component = this;
    }

    onAdded(): void
    {
        super.onAdded();

        this.engine = this.getEntity().getScene().getWorldSystem(DetectCollisionsSystem);

        if (this.engine == null)
        {
            Log.warn("A DetectCollisionsSystem must be added to the Scene before a Collider is added.");
            return;
        }

        this.engine.detectSystem.insert(this.body);
    }

    onRemoved(): void
    {
        super.onRemoved();

        if (this.engine !== null)
        {
            this.engine.detectSystem.remove(this.body);
        }
    }
}