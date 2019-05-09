import {Component, Entity, System, World, WorldSystem} from "./ECS";
import {Collider, Collision} from "./Collision";

export enum BodyType
{
    Dynamic,
    Static
}

export class Vector
{
    x: number;
    y: number;

    constructor(x: number, y: number)
    {
        this.x = x;
        this.y = y;
    }

    static zero(): Vector
    {
        return new Vector(0, 0)
    };

    static left(): Vector
    {
        return new Vector(-1, 0)
    };

    static right(): Vector
    {
        return new Vector(1, 0)
    };

    static up(): Vector
    {
        return new Vector(0, -1)
    };

    static down(): Vector
    {
        return new Vector(0, 1)
    };

    add(other: Vector): Vector
    {
        this.x += other.x;
        this.y += other.y;
        return this;
    }

    sub(other: Vector): Vector
    {
        this.x -= other.x;
        this.y -= other.y;
        return this;
    }

    length(): number
    {
        return Math.sqrt((this.x * this.x) + (this.y * this.y));
    }

    normalized(): Vector
    {
        const len = this.length();
        return new Vector(this.x / len, this.y / len);
    }

    normalize(): Vector
    {
        const len = this.length();
        this.divide(len);
        return this;
    }

    divide(scalar: number): Vector
    {
        this.x /= scalar;
        this.y /= scalar;
        return this;
    }

    multiply(scalar: number): Vector
    {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }
}

export class Rigidbody extends Component
{
    readonly type: BodyType;
    mass: number = 100;

    // linear only for now
    velocity: Vector = Vector.zero();

    // linear xDrag coefficient
    xDrag: number = 0.1;
    yDrag: number = 0.1;

    // how affected by gravity are we?
    gravityScale: number = 1;


    constructor(type: BodyType)
    {
        super();
        this.type = type;
    }

    addForce(force: Vector, impulse: boolean = false)
    {
        // No mass calculation
        if (impulse)
        {
            this.velocity.add(force);
        }
        else
        {
            // a = F/m
            this.velocity.add(force.divide(this.mass));
        }
    }

    /**
     * Add a force, taking local rotation/position into account.
     * @param vector
     * @param impulse
     */
    addForceLocal(vector: Vector, impulse: boolean = false)
    {
        const angle = this.getEntity().transform.rotation;

        const x2 = vector.x * Math.cos(angle) - vector.y * Math.sin(angle);
        const y2 = vector.x * Math.sin(angle) + vector.y * Math.cos(angle);
        const force = new Vector(x2, y2);

        // No mass calculation
        if (impulse)
        {
            this.velocity.add(force);
        }
        else
        {
            // a = F/m
            this.velocity.add(force.divide(this.mass));
        }
    }
}

export class PhysicsSystem extends WorldSystem
{
    gravityDir: Vector;

    constructor(gravityDir: Vector = new Vector(0, 9.8))
    {
        super();
        this.gravityDir = gravityDir;
    }

    update(world: World, delta: number): void
    {
    }

    // TODO this is very broken
    //
    //     /* We need to do 3 things here.
    //      - Calculate new positions
    //      - Check for collisions
    //      - Resolve collisions, bumping things if necessary
    //      */
    //         World.runOnEntity((body: Rigidbody) => {
    //
    //             // Add gravity force if the object is dynamic
    //             if (body.type === BodyType.Dynamic) {
    //                 const gravForce = new Vector(this.gravityDir.x, this.gravityDir.y);
    //                 gravForce.multiply(body.gravityScale * delta);
    //                 body.addForce(gravForce);
    //             }
    //
    //             let myColliders = entity.getComponentsOfType<Collider>(Collider);
    //             myColliders = myColliders.filter((v) => {
    //                 return !v.isTrigger
    //             });
    //
    //             // Apply movement
    //             entity.transform.x += body.velocity.x * delta;
    //             entity.transform.y += body.velocity.y * delta;
    //
    //             // TODO instead of this, push out. We still want to slide along surfaces....
    //             this.checkIfWeNeedToGoBack(entity, myColliders, body, delta, entities);
    //
    //             // Reduce velocity by xDrag amount for the next frame
    //             body.velocity.x -= body.velocity.x * body.xDrag;
    //             body.velocity.y -= body.velocity.y * body.yDrag;
    //
    //         }, entity, Rigidbody);
    //
    // }
    //
    // private checkIfWeNeedToGoBack(entity: Entity, myColliders: Collider[],
    //                               body: Rigidbody, delta: number) {
    //     this.runOnComponents((colliders: Collider[]) => {
    //         for (let myCol of myColliders) {
    //             for (let collider of colliders) {
    //                 if (collider.entity !== entity && !collider.isTrigger) {
    //                     if (Collision.checkCollision(collider, myCol)) {
    //                         // We hit something, go back!
    //                         entity.transform.x -= body.velocity.x * delta;
    //                         entity.transform.y -= body.velocity.y * delta;
    //                         return;
    //                     }
    //                 }
    //             }
    //         }
    //     });
    // }

    types(): { new(): Component }[] | any[]
    {
        return [Collider];
    }
}