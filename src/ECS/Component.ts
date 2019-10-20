import {Entity} from "./Entity";
import {Util} from "../Common/Util";
import {LifecycleObject} from "./LifecycleObject";
import {Scene} from "./Scene";

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

    /**
     * Get the scene that the parent entity is part of.
     * @returns The parent scene.
     */
    getScene(): Scene
    {
        return this.getEntity().getScene();
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

        // We add to the scene here, not the entity, as the entity may have been destroyed before the component. If
        // this is the case, the entity update() will not trigger, and the component will not be removed.
        // this.getScene().toUpdate.push({state: ObjectState.PENDING_REMOVE, object: this});
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

