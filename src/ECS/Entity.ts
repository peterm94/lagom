import {Observable} from "../Common/Observer";
import * as PIXI from "pixi.js";
import {Log, Util} from "../Common/Util";
import {Component} from "./Component";
import {LagomType, LifecycleObject, ObjectState} from "./LifecycleObject";
import {Scene} from "./Scene";

/**
 * Entity base class. Raw entities can be used or subclasses can be defined similarly to prefabs.
 */
export class Entity extends LifecycleObject
{
    set depth(value: number)
    {
        this._depth = value;
        this.transform.zIndex = value;
    }

    readonly componentAddedEvent: Observable<Entity, Component> = new Observable();
    readonly componentRemovedEvent: Observable<Entity, Component> = new Observable();

    readonly name: string;
    readonly components: Component[] = [];

    transform: PIXI.Container;
    layer: number = 0;
    private _depth: number = 0;

    /**
     * Create a new entity. It must be added to a Game to actually do anything.
     * @param name The name of the entity. Used for lookups.
     * @param x The starting x position.
     * @param y The starting y position.
     * @param depth Entity depth. Used for draw order.
     */
    constructor(name: string, x: number = 0, y: number = 0, depth: number = 0)
    {
        super();
        this.name = name;

        this.transform = Util.sortedContainer();
        this.transform.x = x;
        this.transform.y = y;
        this.depth = depth;
    }

    /**
     * Add a new component to the entity.
     * @param component The component to add.
     * @returns The added component.
     */
    addComponent<T extends Component>(component: T): T
    {
        // TODO remove completely
        // component.setParent(this);
        // this.toUpdate.push({state: ObjectState.PENDING_ADD, object: component});
        // return component;
        return null as any;
    }

    addComponent2<T extends Component>(creator: () => T): T
    {

        // Create the component and add the reference to the parent Entity.
        const component = creator();
        component.parent = this;

        // Add to the entity component list
        this.components.push(component);
        this.componentAddedEvent.trigger(this, component);

        return component;
    }

    /**
     * Get all components of a given type.
     * @param type The type of component to search for.
     * @returns An array of all matching components.
     */
    getComponentsOfType<T extends Component>(type: LagomType<Component>): T[]
    {
        return this.components.filter(value => value instanceof type) as T[];
    }

    /**
     * Get the first component of a given type.
     * @param type The type of component to search for.
     * @param creator An optional function that will create a component if it is not present on an entity. This will
     * also add it to the entity. It will not be available until the next game tick.
     * @returns The component if found or created, otherwise null.
     */
    getComponent<T extends Component>(type: LagomType<Component>, creator?: () => Component): T | null
    {
        const found = this.components.find(value => value instanceof type);
        if (found !== undefined)
        {
            return found as T;
        }
        else if (creator)
        {
            // TODO this won't be added in time? may cause quirks.
            return this.addComponent2(creator) as T;
        }
        else
        {
            return null;
        }
    }

    onAdded()
    {
        super.onAdded();
    }

    onRemoved()
    {
        super.onRemoved();

        const scene = this.getScene();
        Util.remove(scene.entities, this);
        scene.entityRemovedEvent.trigger(scene, this);

        // Remove the entire PIXI container
        this.rootNode().removeChild(this.transform);
    }

    destroy()
    {
        super.destroy();

        Log.debug("Entity destroy() called for:", this.name);

        // Take any components with us
        this.components.forEach((val) => val.destroy());
        // TODO handle destruction of THIS
    }

    // TODO package private?
    rootNode(): PIXI.Container
    {
        return this.getScene().sceneNode;
    }

    getScene(): Scene
    {
        // TODO this needs to change if we have nested entities.
        return this.getParent() as Scene;
    }
}

/**
 * Entity type that is not tied to a 'Game' object. Positions etc. will remain fixed and not move with the viewport
 * position. Use this to render to absolute positions on the canvas (e.g. GUI text).
 */
export class GUIEntity extends Entity
{
    rootNode(): PIXI.Container
    {
        return this.getScene().guiNode;
    }
}