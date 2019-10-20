import {Entity} from "./Entity";
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

    destroy()
    {
        super.destroy();
        this.getEntity().removeComponent(this, true);
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

