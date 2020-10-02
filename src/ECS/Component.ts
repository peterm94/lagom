import {Entity} from "./Entity";
import {LifecycleObject} from "./LifecycleObject";
import {Scene} from "./Scene";

/**
 * Component base class.
 */
export abstract class Component extends LifecycleObject
{
    parent!: Entity;

    /**
     * Get the entity that owns this component.
     * @returns The entity that this component is attached to.
     */
    getEntity(): Entity
    {
        return this.parent;
    }

    /**
     * Get the scene that the parent entity is part of.
     * @returns The parent scene.
     */
    getScene(): Scene
    {
        return this.getEntity().getScene();
    }

    destroy(): void
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

    onAdded(): void
    {
        super.onAdded();
        this.getEntity().transform.addChild(this.pixiObj);
    }

    onRemoved(): void
    {
        super.onRemoved();
        this.getEntity().transform.removeChild(this.pixiObj);
    }

    /**
     * Get the global (world) position of this component. This will not take the view positioning into account.
     * @param skipUpdate True to skip the PIXI positional update.
     * @returns The calculated point.
     */
    globalPos(skipUpdate = false): PIXI.Point
    {
        // This function is scary, it takes into account view changes, as does getGlobalPosition().
        // We need to offset the camera position, because it actually shifts everything in the scene.
        return this.pixiObj.toGlobal(this.getScene().camera.position(), undefined, skipUpdate);
    }
}

