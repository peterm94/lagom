import {Log, Util} from "../Util";
import {World} from "./World";
import {Entity} from "./Entity";
import {Component} from "./Component";
import {LifecycleObject} from "./LifecycleObject";

/**
 * World system base class. Designed to run on batches of Components.
 */
export abstract class WorldSystem extends LifecycleObject
{
    private readonly runOn: Map<{ new(): Component }, Component[]> = new Map();

    /**
     * Update will be called every game tick.
     * @param world The world we are operating on.
     * @param delta The elapsed time since the last update call.
     */
    abstract update(world: World, delta: number): void;

    /**
     * An array of types that this WorldSystem will run on. This should remain static.
     * @returns An array of component types to run on during update().
     */
    abstract types(): { new(): Component }[] | any[]

    /**
     * Call this in update() to retrieve the collection of components to run on.
     * @param f A function which accepts the a parameter for each type returned by in types(). For example, if
     * types() returns [Sprite, Collider], the function will be passed two arrays, (sprites: Sprite[], colliders:
     * Collider[]).
     */
    protected runOnComponents(f: Function)
    {
        f(...Array.from(this.runOn.values()));
    }

    private onComponentAdded(entity: Entity, component: Component)
    {
        // Check if we care about this type at all
        const type = this.types().find((val) => {
            return component instanceof val;
        });

        if (type === undefined) return;

        let compMap = this.runOn.get(type);

        if (compMap === undefined)
        {
            Log.warn("Expected component map does not exist on WorldSystem.", this, type);
            compMap = [];
            this.runOn.set(type, compMap);
        }
        compMap.push(component);
    }

    private onComponentRemoved(entity: Entity, component: Component)
    {
        // Check if we care about this type at all
        const type = this.types().find((val) => {
            return component instanceof val;
        });

        if (type === undefined) return;

        let components = this.runOn.get(type);

        // Nothing registered, return
        if (components === undefined) return;

        // Get it out of the list if it is in it
        Util.remove(components, component);
    }

    private onEntityAdded(caller: World, entity: Entity)
    {
        // Register for component changes
        entity.componentAddedEvent.register(this.onComponentAdded.bind(this));
        entity.componentRemovedEvent.register(this.onComponentRemoved.bind(this));
    }

    private onEntityRemoved(caller: World, entity: Entity)
    {
        entity.componentAddedEvent.deregister(this.onComponentAdded.bind(this));
        entity.componentRemovedEvent.deregister(this.onComponentRemoved.bind(this));
    }

    onAdded()
    {
        super.onAdded();

        // make each component map
        this.types().forEach(type => {
            this.runOn.set(type, []);
        });

        World.instance.entityAddedEvent.register(this.onEntityAdded.bind(this));
        World.instance.entityRemovedEvent.register(this.onEntityRemoved.bind(this));

        // We need to scan everything that already exists
        World.instance.entities.forEach((entity: Entity) => {
            // Register listener for entity
            this.onEntityAdded(World.instance, entity);

            // Add any existing components
            entity.components.forEach((component) => {
                this.onComponentAdded(entity, component);
            })
        })
    }

    onRemoved()
    {
        super.onRemoved();
        World.instance.entityAddedEvent.deregister(this.onEntityAdded.bind(this));
        World.instance.entityRemovedEvent.deregister(this.onEntityRemoved.bind(this));
    }
}