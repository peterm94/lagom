import {Component} from "../ECS/Component";
import {BodyType, Collider} from "./Colliders";
import {Entity} from "../ECS/Entity";
import {MathUtil, Util} from "../Common/Util";

/**
 * Rigidbody type to be used as part of collisions and physics.
 */
export class Rigidbody extends Component
{
    affectedColliders: Collider[] = [];

    // Radians
    pendingRotation = 0;
    pendingX = 0;
    pendingY = 0;

    /**
     * Creates a new Rigidbody.
     * @param bodyType The type of body. Will impact how the collision system updates this component.
     */
    constructor(readonly bodyType: BodyType = BodyType.Discrete)
    {
        super();
    }

    /**
     * Stop the movement of the Rigidbody.
     */
    stop(): void
    {
        this.pendingX = 0;
        this.pendingY = 0;
    }

    /**
     * Move the rigidbody, relative to the given values.
     * @param x Amount to move on the X axis.
     * @param y Amount to move on the Y axis.
     */
    move(x: number, y: number): void
    {
        this.pendingX += x;
        this.pendingY += y;
    }

    /**
     * Rotate the body by the given degrees.
     * @param degrees Angle in degrees to rotate by.
     */
    rotateDeg(degrees: number): void
    {
        this.pendingRotation += MathUtil.degToRad(degrees);
    }

    /**
     * Rotate the body by the angle given in radians.
     * @param radians Angle in radians to rotate by.
     */
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

    /**
     * Updated affected controllers. For internal engine use only.
     */
    updateAffected(): void
    {
        for (const affectedCollider of this.affectedColliders)
        {
            affectedCollider.updatePosition();
        }
    }
}
