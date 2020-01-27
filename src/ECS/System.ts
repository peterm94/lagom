import {Entity} from "./Entity";
import {Component} from "./Component";
import {LagomType, LifecycleObject, Updatable} from "./LifecycleObject";
import {Util} from "../Common/Util";
import {Scene} from "./Scene";

/**
 * System base class. Systems should be used to run on groups of components.
 * Note that this will only trigger if every component type is represented on an entity. Partial matches will not run.
 */
export abstract class System extends LifecycleObject implements Updatable
{
    private readonly runOn: Map<Entity, Component[]> = new Map();

    scene !: Scene;

    private onComponentAdded(entity: Entity, component: Component): void
    {
        // Check if we care about this type at all
        if (this.types().find((val) => {
            return component instanceof val;
        }) === undefined)
        {
            return;
        }

        // Compute if we can run on this updated entity
        const entry = this.runOn.get(entity);

        // We already have an entry, nothing to do!
        if (entry !== undefined) return;

        // Check if we are now able to run on this entity
        const ret = this.findComponents(entity);
        if (ret === null) return;

        // Can run, add to update list
        this.runOn.set(entity, ret);
    }

    private findComponents(entity: Entity): Component[] | null
    {
        const inTypes = this.types();
        const ret: Component[] = [];

        for (const type of inTypes)
        {
            const comp = entity.getComponent(type);
            if (comp == null) return null;
            ret.push(comp);
        }

        return ret;
    }

    private onComponentRemoved(entity: Entity, component: Component): void
    {
        // Check if we care about this type at all
        if (this.types().find((val) => {
            return component instanceof val;
        }) === undefined)
        {
            return;
        }

        const entry = this.runOn.get(entity);

        // Not actually registered, return
        if (entry === undefined) return;

        // Recompute if we can run on this entity, remove if we cannot
        const ret = this.findComponents(entity);
        if (ret === null)
        {
            // Can't run, remove entry
            this.runOn.delete(entity);
        }
        else
        {
            // Can run, update runOn
            this.runOn.set(entity, ret);
        }
    }

    private onEntityAdded(caller: Scene, entity: Entity): void
    {
        // Register for component changes
        entity.componentAddedEvent.register(this.onComponentAdded.bind(this));
        entity.componentRemovedEvent.register(this.onComponentRemoved.bind(this));
    }

    private onEntityRemoved(caller: Scene, entity: Entity): void
    {
        entity.componentAddedEvent.deregister(this.onComponentAdded.bind(this));
        entity.componentRemovedEvent.deregister(this.onComponentRemoved.bind(this));

        // Remove the entity from this System's run pool if it is registered.
        this.runOn.delete(entity);
    }

    addedToScene(scene: Scene): void
    {
        scene.entityAddedEvent.register(this.onEntityAdded.bind(this));
        scene.entityRemovedEvent.register(this.onEntityRemoved.bind(this));

        // We need to scan everything that already exists
        scene.entities.forEach(entity => {
            // Register listener for entity
            this.onEntityAdded(scene, entity);

            // Check it, add if ready.
            const ret = this.findComponents(entity);
            if (ret != null)
            {
                this.runOn.set(entity, ret);
            }
        });
    }

    onRemoved(): void
    {
        super.onRemoved();

        const scene = this.getScene();
        Util.remove(scene.systems, this);

        scene.entityAddedEvent.deregister(this.onEntityAdded.bind(this));
        scene.entityRemovedEvent.deregister(this.onEntityRemoved.bind(this));
    }

    /**
     * Update will be called every game tick.
     * @param delta The elapsed time since the last update call.
     */
    abstract update(delta: number): void;

    fixedUpdate(delta: number): void
    {
        // Default empty implementation.
    }

    /**
     * Component types that this System runs on.
     * @returns A list of Component types.
     */
    abstract types(): LagomType<Component>[];

    /**
     * Call this from update() to run on the requested component instances.
     * @param f A function that will be called with the requested components passed through as parameters. The
     * owning entity will always be the first parameter, followed by each component in the order defined by types().
     * For example, if types() is [Sprite, MCollider], the function arguments would look as follows: (entity:
     * Entity, sprite: Sprite, collider: MCollider).
     */
    protected runOnEntities(f: Function): void
    {
        this.runOn.forEach((value: Component[], key: Entity) => {
            f(key, ...value);
        });
    }

    protected runOnEntitiesWithSystem(f: Function): void
    {
        this.runOn.forEach((value: Component[], key: Entity) => {
            f(this, key, ...value);
        });
    }

    /**
     * Return the Scene object that this system belongs to.
     * @returns The parent Scene.
     */
    getScene(): Scene
    {
        return this.scene;
    }
}
