import {Observable} from "../Observer";
import * as PIXI from "pixi.js";
import {Log, Util} from "../Util";
import {World} from "./World";
import {Component} from "./Component";
import {LifecycleObject} from "./LifecycleObject";

/**
 * Entity base class. Raw entities can be used or subclasses can be defined similarly to prefabs.
 */
export class Entity extends LifecycleObject
{
    private componentsInit: Set<Component> = new Set();
    private componentsDestroy: Set<Component> = new Set();

    readonly componentAddedEvent: Observable<Entity, Component> = new Observable();
    readonly componentRemovedEvent: Observable<Entity, Component> = new Observable();

    transform: PIXI.Container;
    layer: number = 0;

    readonly name: string;
    readonly components: Component[] = [];

    private addPending()
    {

        const componentsInit = new Set(this.componentsInit);
        this.componentsInit.clear();

        componentsInit.forEach((val) => {
            this.components.push(val);
        });

        componentsInit.forEach((val) => {
            val.onAdded();
            Log.trace("Component Added", val);
            this.componentAddedEvent.trigger(this, val);
        });
    }

    private removePending()
    {
        const componentsDestroy = new Set(this.componentsDestroy);
        this.componentsDestroy.clear();

        componentsDestroy.forEach((val) => {
            val.onRemoved();
            Log.trace("Component Removed", val);
            this.componentRemovedEvent.trigger(this, val);
        });

        componentsDestroy.forEach((val) => {
            Util.remove(this.components, val);
        });
    }

    internalUpdate()
    {
        this.addPending();
        this.removePending();
    }

    /**
     * Create a new entity. It must be added to a World to actually do anything.
     * @param name The name of the entity. Used for lookups.
     * @param x The starting x position.
     * @param y The starting y position.
     */
    constructor(name: string, x: number = 0, y: number = 0)
    {
        super();
        this.name = name;

        this.transform = new PIXI.Container();
        this.transform.x = x;
        this.transform.y = y;
        this.addToScene();
    }

    protected addToScene()
    {
        World.instance.sceneNode.addChild(this.transform);
    }

    protected removeFromScene()
    {
        World.instance.sceneNode.removeChild(this.transform);
    }

    /**
     * Add a new component to the entity.
     * @param component The component to add.
     * @returns The added component.
     */
    addComponent<T extends Component>(component: T): T
    {
        this.componentsInit.add(component);
        component.setEntity(this);
        return component;
    }

    /**
     * Get all components of a given type.
     * @param type The type of component to search for.
     * @returns An array of all matching components.
     */
    getComponentsOfType<T extends Component>(type: any | { new(): T }): T[]
    {
        return this.components.filter(value => value instanceof type) as T[];
    }

    /**
     * Get the first component of a given type.
     * @param type the type of component to search for.
     * @returns The component if found, otherwise null.
     */
    getComponent<T extends Component>(type: any | { new(): T }): T | null
    {
        const found = this.components.find(value => value instanceof type);
        return found != undefined ? found as T : null;
    }

    /**
     * Remove a component from the entity.
     * @param component The component to remove.
     */
    removeComponent(component: Component)
    {
        Log.trace("Component removal scheduled for:", component);
        this.componentsDestroy.add(component);
    }

    onAdded()
    {
        super.onAdded();
        this.addPending();
    }

    onRemoved()
    {
        super.onRemoved();
        this.removePending();

        // Remove the entire PIXI container
        this.removeFromScene()
    }

    /**
     * Destroy the Entity and all components on it.
     */
    destroy()
    {
        Log.trace("Entity destroy() called for:", this);
        this.components.forEach((val) => this.removeComponent(val));
        World.instance.removeEntity(this);
    }
}

/**
 * Entity type that is not tied to a 'world' object. Positions etc. will remain fixed and not move with the viewport
 * position. Use this to render to absolute positions on the canvas (e.g. GUI text).
 */
export class GUIEntity extends Entity
{
    protected addToScene(): void
    {
        // Override addToScene(), add to the GUI node instead of the normal node. This will not move with the camera.
        World.instance.guiNode.addChild(this.transform);
    }

    protected removeFromScene(): void
    {
        World.instance.guiNode.removeChild(this.transform);
    }
}