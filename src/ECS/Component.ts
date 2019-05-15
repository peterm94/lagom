import {Entity} from "./Entity";
import {Util} from "../Util";
import {LifecycleObject, ObjectState} from "./LifecycleObject";

/**
 * Component base class.
 */
export abstract class Component extends LifecycleObject
{
    /**
     * Get the entity that owns this component.
     * @returns The entity that this component is attached to.
     */
    getEntity(): Entity
    {
        return this.getParent() as Entity;
    }

    onAdded()
    {
        super.onAdded();
        const parent = this.getEntity();
        parent.components.push(this);
        parent.componentAddedEvent.trigger(parent, this);
    }

    onRemoved()
    {
        super.onRemoved();
        const parent = this.getEntity();
        Util.remove(parent.components, this);
        parent.componentRemovedEvent.trigger(parent, this);
    }

    destroy()
    {
        super.destroy();
        this.getEntity().toUpdate.push({state: ObjectState.PENDING_REMOVE, object: this});
    }
}

/**
 * PIXI Component base class. More for convenience than anything else, will add to the PIXI tree.
 */
export abstract class PIXIComponent<T extends PIXI.DisplayObject> extends Component
{
    readonly pixiObj: T;

    protected constructor(pixiComp: T)
    {
        super();
        this.pixiObj = pixiComp;
    }

    onAdded()
    {
        super.onAdded();
        this.getEntity().transform.addChild(this.pixiObj);
    }

    onRemoved()
    {
        super.onRemoved();
        this.getEntity().transform.removeChild(this.pixiObj);
    }
}

/**
 * Type for Components. Allows for abstract constructor types.
 * https://stackoverflow.com/questions/52349758/how-does-type-constructort-function-prototype-t-apply-to-abstract-c
 */
export type ComponentType<T> = Function & { prototype: T }