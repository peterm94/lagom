import {Observable} from "../Observer";
import * as PIXI from "pixi.js";
import {Log, Util} from "../Util";
import {World} from "./World";
import {Component} from "./Component";
import {ContainerLifecycleObject, ObjectState} from "./LifecycleObject";

/**
 * Entity base class. Raw entities can be used or subclasses can be defined similarly to prefabs.
 */
export class Entity extends ContainerLifecycleObject
{
    readonly componentAddedEvent: Observable<Entity, Component> = new Observable();
    readonly componentRemovedEvent: Observable<Entity, Component> = new Observable();

    transform: PIXI.Container;
    layer: number = 0;

    readonly name: string;
    readonly components: Component[] = [];

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
    }

    /**
     * Add a new component to the entity.
     * @param component The component to add.
     * @returns The added component.
     */
    addComponent<T extends Component>(component: T): T
    {
        component.setParent(this);
        this.toUpdate.push({state: ObjectState.PENDING_ADD, object: component});
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

    onAdded()
    {
        super.onAdded();

        // Add to the scene
        const world = this.getParent() as World;
        world.entities.push(this);
        world.entityAddedEvent.trigger(world, this);

        // Add this PIXI container
        this.rootNode().addChild(this.transform);
    }

    onRemoved()
    {
        super.onRemoved();

        const world = this.getParent() as World;
        Util.remove(world.entities, this);
        world.entityRemovedEvent.trigger(world, this);

        // Remove the entire PIXI container
        this.rootNode().removeChild(this.transform);
    }

    destroy()
    {
        super.destroy();

        Log.trace("Entity destroy() called for:", this);
        (this.getParent() as World).toUpdate.push({state: ObjectState.PENDING_REMOVE, object: this});

        // Take any components with us
        this.components.forEach((val) => val.destroy());
    }

    rootNode(): PIXI.Container
    {
        return (this.getParent() as World).sceneNode;
    }
}

/**
 * Entity type that is not tied to a 'world' object. Positions etc. will remain fixed and not move with the viewport
 * position. Use this to render to absolute positions on the canvas (e.g. GUI text).
 */
export class GUIEntity extends Entity
{
    rootNode(): PIXI.Container
    {
        return (this.getParent() as World).guiNode;
    }
}