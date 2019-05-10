import {Entity} from "./Entity";
import {Log} from "../Util";
import {LifecycleObject} from "./LifecycleObject";

/**
 * Component base class.
 */
export abstract class Component extends LifecycleObject
{
    private entity: Entity | null = null;

    /**
     * For internal use only.
     * Set the entity for this component. Please don't call this, ts doesn't have friend classes.
     * @param entity The parent entity.
     */
    setEntity(entity: Entity)
    {
        this.entity = entity;
    }

    /**
     * Get the entity that owns this component.
     * @returns The entity that this component is attached to.
     */
    getEntity(): Entity
    {
        if (this.entity === null)
        {
            Log.error("Entity referenced before Component added to scene. Use onAdded() for initialization instead" +
                          " of the constructor.");
            // TODO do we throw here? this is a real problemo.
            return <any>null;
        }
        else
        {
            return this.entity;
        }
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
