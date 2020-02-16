import {Component} from "../ECS/Component";
import {Collider, BodyType} from "./Colliders";
import {Entity} from "../ECS/Entity";
import {MathUtil, Util} from "../Common/Util";

export class Rigidbody extends Component
{
    affectedColliders: Collider[] = [];

    pendingX = 0;
    pendingY = 0;
    // Radians
    pendingRotation = 0;

    constructor(readonly bodyType: BodyType = BodyType.Discrete)
    {
        super();
    }

    stop(): void
    {
        this.pendingX = 0;
        this.pendingY = 0;
    }

    move(x: number, y: number): void
    {
        this.pendingX += x;
        this.pendingY += y;
    }

    rotateDeg(degrees: number): void
    {
        this.pendingRotation += MathUtil.degToRad(degrees);
    }

    rotateRad(radians: number): void
    {
        this.pendingRotation += radians;
    }

    onAdded(): void
    {
        super.onAdded();

        // Find any existing sibling or descendant colliders.
        this.affectedColliders = this.parent.getComponentsOfType(Collider, true);

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
        if (component instanceof Collider)
        {
            this.affectedColliders.push(component);
        }
    }

    private childRem(entity: Entity, child: Entity): void
    {
        const childColls = child.getComponentsOfType<Collider>(Collider, true);
        for (const childColl of childColls)
        {
            Util.remove(this.affectedColliders, childColl);
        }
    }

    private compRem(entity: Entity, component: Component): void
    {
        if (component instanceof Collider)
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
