import {Observable} from "../Common/Observer";
import {Log, Util} from "../Common/Util";
import {Component} from "./Component";
import {LagomType, LifecycleObject} from "./LifecycleObject";
import {Scene} from "./Scene";
import * as PIXI from "pixi.js";

/**
 * Entity base class. Raw entities can be used or subclasses can be defined similarly to prefabs.
 */
export class Entity extends LifecycleObject
{
    /**
     * Set the depth of the entity. Used for update and draw order.
     * @param value The depth to set.
     */
    set depth(value: number)
    {
        this._depth = value;
        this.transform.zIndex = value;
    }

    /**
     * Event that is fired when a component is added to this entity.
     */
    readonly componentAddedEvent: Observable<Entity, Component> = new Observable();

    /**
     * Event for a component being removed from this entity.
     */
    readonly componentRemovedEvent: Observable<Entity, Component> = new Observable();

    /**
     * Event for a child entity being added.
     */
    readonly childAdded: Observable<Entity, Entity> = new Observable();

    /**
     * Event for a child entity being removed.
     */
    readonly childRemoved: Observable<Entity, Entity> = new Observable();

    /**
     * Entity name. Not unique, can be searched on.
     */
    readonly name: string;

    /**
     * Unique entity ID.
     */
    readonly id: string;

    /**
     * Components that this entity manages.
     */
    readonly components: Component[] = [];

    layer = 0;

    private _depth = 0;
    private static _next_id = 0;

    /**
     * Scene object that this entity belongs to.
     */
    scene!: Scene;

    /**
     * Parent entity. This should only be null for a tree root (i.e. the scene root nodes).
     */
    parent: Entity | null = null;

    /**
     * Child entities.
     */
    children: Entity[] = [];

    /**
     * The transform for this entity. All children transforms will be relative to this one.
     */
    transform: PIXI.Container = Util.sortedContainer();

    /**
     * Create a new entity. It must be added to a Game to actually do anything.
     * @param name The name of the entity. Used for lookups.
     * @param x The starting x position.
     * @param y The starting y position.
     * @param depth Entity depth. Used for draw order.
     */
    constructor(name: string, x = 0, y = 0, depth = 0)
    {
        super();
        this.name = name;
        this.id = (Entity._next_id++).toString(16);

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
        component.parent = this;

        // Add to the entity component list
        this.components.push(component);
        this.componentAddedEvent.trigger(this, component);

        component.onAdded();

        return component;
    }

    /**
     * Remove a component from this entity.
     * @param component The component to remove.
     * @param doRemove TODO investigate why this is a thing.
     */
    removeComponent(component: Component, doRemove: boolean): void
    {
        Log.trace("Removing component from entity.", component);

        if (doRemove && !Util.remove(this.components, component))
        {
            Log.warn("Attempting to remove Component that does not exist on Entity.", component, this);
        }
        this.componentRemovedEvent.trigger(this, component);

        component.onRemoved();
    }

    /**
     * Get all components of a given type.
     * @param type The type of component to search for.
     * @param checkChildren Set to true if child entities should be checked as well. This will recurse to the bottom
     * of the entity tree.
     * @returns An array of all matching components.
     */
    getComponentsOfType<T extends Component>(type: LagomType<Component>, checkChildren = false): T[]
    {
        const components = this.components.filter(value => value instanceof type) as T[];

        if (checkChildren)
        {
            // Check all children and add to result set.
            this.children.forEach(child => {
                const childComps = child.getComponentsOfType<T>(type, true);
                for (const childComp of childComps)
                {
                    components.push(childComp);
                }
            });
        }

        return components;
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
            return this.addComponent(creator()) as T;
        }
        else
        {
            return null;
        }
    }

    onRemoved(): void
    {
        super.onRemoved();

        Log.trace("Destroying ", this.components);

        // Take any components with us
        while (this.components.length > 0)
        {
            const val = this.components.pop();
            if (val !== undefined) this.removeComponent(val, false);
        }

        // Destroy any observers looking at us
        this.componentAddedEvent.releaseAll();
        this.componentRemovedEvent.releaseAll();
        this.childAdded.releaseAll();
        this.childRemoved.releaseAll();
    }

    destroy(): void
    {
        super.destroy();

        // Destroy the entity.
        if (this.parent !== null)
        {
            this.parent.removeChild(this);
        }
    }

    getScene(): Scene
    {
        return this.scene;
    }

    /**
     * Remove a child entity from this entity.
     * @param child The child entity to remove.
     */
    removeChild(child: Entity): void
    {
        Log.trace("Removing child object.", child);

        if (!Util.remove(this.children, child))
        {
            // TODO check this return, it is a pretty significant behaviour change.
            Log.warn("Attempting to remove child that does not exist in container.", child, this);
            return;
        }

        Util.remove(this.scene.entities, child);

        this.childRemoved.trigger(this, child);
        this.scene.entityRemovedEvent.trigger(this.scene, child);

        this.transform.removeChild(child.transform);

        child.onRemoved();
    }

    /**
     * Add an child to the container.
     * @param child The child to add.
     * @returns The added child.
     */
    addChild<T extends Entity>(child: T): T
    {
        Log.debug("Adding new child object.", child);
        child.parent = this;
        child.scene = this.scene;

        this.scene.entities.push(child);
        this.children.push(child);
        this.childAdded.trigger(this, child);
        this.scene.entityAddedEvent.trigger(this.scene, child);

        // Add the PIXI container to my node.
        this.transform.addChild(child.transform);

        child.onAdded();

        return child;
    }

    /**
     * Find a child entity with the given name. This will traverse down the entity tree.
     * @param name The name of the entity to search for.
     * @returns The first matching entity if found, or null otherwise.
     */
    findChildWithName<T extends Entity>(name: string): T | null
    {
        const found = this.children.find(value => value.name === name);
        if (found !== undefined)
        {
            return found as T;
        }

        // Check children of children
        for (const child of this.children)
        {
            const inner = child.findChildWithName(name);
            if (inner !== null)
            {
                return inner as T;
            }
        }
        return null;
    }
}
