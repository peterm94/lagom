import {Log, Util} from "../Common/Util";
import {Entity} from "./Entity";
import {Component} from "./Component";
import {LagomType, LifecycleObject, Updatable} from "./LifecycleObject";
import {Scene} from "./Scene";

/**
 * World system base class. Designed to run on batches of Components.
 */
export abstract class WorldSystem extends LifecycleObject implements Updatable
{
    // TODO the key type is technically wrong, but it works because types aren't real
    private readonly runOn: Map<{ new(): Component }, Component[]> = new Map();

    /**
     * Update will be called every game tick.
     * @param delta The elapsed time since the last update call.
     */
    abstract update(delta: number): void;

    /**
     * An array of types that this WorldSystem will run on. This should remain static.
     * @returns An array of component types to run on during update().
     */
    abstract types(): LagomType<Component>[]

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

        let compMap = this.runOn.get(type.prototype);

        if (compMap === undefined)
        {
            Log.warn("Expected component map does not exist on WorldSystem.", this, type.prototype);
            compMap = [];
            this.runOn.set(type.prototype, compMap);
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

        let components = this.runOn.get(type.prototype);

        // Nothing registered, return
        if (components === undefined) return;

        // Get it out of the list if it is in it
        Util.remove(components, component);
    }

    private onEntityAdded(caller: Scene, entity: Entity)
    {
        // Register for component changes
        entity.componentAddedEvent.register(this.onComponentAdded.bind(this));
        entity.componentRemovedEvent.register(this.onComponentRemoved.bind(this));
    }

    private onEntityRemoved(caller: Scene, entity: Entity)
    {
        entity.componentAddedEvent.deregister(this.onComponentAdded.bind(this));
        entity.componentRemovedEvent.deregister(this.onComponentRemoved.bind(this));
    }

    onAdded()
    {
        super.onAdded();

        const scene = this.getScene();
        scene.worldSystems.push(this);

        // make each component map
        this.types().forEach(type => {
            this.runOn.set(type.prototype, []);
        });

        scene.entityAddedEvent.register(this.onEntityAdded.bind(this));
        scene.entityRemovedEvent.register(this.onEntityRemoved.bind(this));

        // We need to scan everything that already exists
        scene.entities.forEach((entity: Entity) => {
            // Register listener for entity
            this.onEntityAdded(scene, entity);

            // Add any existing components
            entity.components.forEach((component) => {
                this.onComponentAdded(entity, component);
            })
        })
    }

    onRemoved()
    {
        super.onRemoved();

        const scene = this.getScene();
        Util.remove(scene.worldSystems, this);

        scene.entityAddedEvent.deregister(this.onEntityAdded.bind(this));
        scene.entityRemovedEvent.deregister(this.onEntityRemoved.bind(this));
    }

    /**
     * Return the Scene object that this system belongs to.
     * @returns The parent Scene.
     */
    getScene(): Scene
    {
        return this.getParent() as Scene;
    }
}