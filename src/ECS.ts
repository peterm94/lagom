import * as PIXI from "pixi.js";
import {Smoothie} from "./Smoothie";
import {Log, Util} from "./Util";
import {Observable} from "./Observer";

// https://www.npmjs.com/package/pixi.js-keyboard
// keys: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code#Code_values
const Keyboard = require('pixi.js-keyboard');

// const Mouse = require('pixi.js-mouse');

class Diag {
    inputUpdateTime: number = 0;
    systemUpdateTime: number = 0;
    worldSystemUpdateTime: number = 0;
}

/**
 * Entire Scene instance Access via World.instance after creation.
 */
export class World {

    static instance: World;

    private entitiesInit: Set<Entity> = new Set();
    private entitiesDestroy: Set<Entity> = new Set();
    private systemsInit: Set<System> = new Set();
    private systemsDestroy: Set<System> = new Set();
    private worldSystemsInit: Set<WorldSystem> = new Set();
    private worldSystemsDestroy: Set<WorldSystem> = new Set();

    // TODO can these be sets? need unique, but update order needs to be defined :/ i need a comparator for each
    // type that can define it's order.
    readonly entities: Entity[] = [];
    private readonly systems: System[] = [];
    private readonly worldSystems: WorldSystem[] = [];

    // Set this to true to end the game
    gameOver: boolean = false;

    readonly app: PIXI.Application;
    readonly sceneNode: PIXI.Container;
    readonly guiNode: PIXI.Container;
    readonly smoothie: Smoothie;
    readonly mainTicker: PIXI.ticker.Ticker;

    readonly diag: Diag = new Diag();

    readonly entityAddedEvent: Observable<World, Entity> = new Observable();
    readonly entityRemovedEvent: Observable<World, Entity> = new Observable();

    /**
     * Create a new World.
     * @param options Options for PIXI.
     * @param backgroundCol The canvas background colour.
     */
    constructor(options: PIXI.ApplicationOptions, backgroundCol: number) {

        World.instance = this;

        this.app = new PIXI.Application(options);

        this.smoothie = new Smoothie(this.app.renderer, this.app.stage,
                                     this.gameLoop.bind(this), true, 144, -1);

        // Set it up in the page
        this.app.renderer.backgroundColor = backgroundCol;
        document.body.appendChild(this.app.view);

        // set up the nodes for the ECS to interact with and add them to PIXI.
        this.sceneNode = new PIXI.Container();
        this.sceneNode.name = "scene";
        this.guiNode = new PIXI.Container();
        this.guiNode.name = "gui";
        this.app.stage.addChild(this.sceneNode, this.guiNode);

        this.mainTicker = this.app.ticker.add(delta => {
            return this.gameLoop(delta);
        });
        this.mainTicker.stop();
    }

    /**
     * Start the game loop.
     */
    start() {

        // this.smoothie.start();
        this.mainTicker.start();
    }

    private addPending() {
        // Copy the lists so any new things additions/removals triggered get in for the next frame.
        const entitiesInit = new Set(this.entitiesInit);
        const systemsInit = new Set(this.systemsInit);
        const worldSystemsInit = new Set(this.worldSystemsInit);

        this.entitiesInit.clear();
        this.systemsInit.clear();
        this.worldSystemsInit.clear();

        worldSystemsInit.forEach((val) => {
            this.worldSystems.push(val);
        });

        // Add them in
        entitiesInit.forEach((val) => {
            this.entities.push(val);
        });

        systemsInit.forEach((val) => {
            this.systems.push(val);
        });

        worldSystemsInit.forEach((val) => {
            val.onAdded();
        });

        // Trigger the onAdded() function
        entitiesInit.forEach((val) => {
            val.onAdded();
            Log.trace("Entity Added", val);
            this.entityAddedEvent.trigger(this, val);
        });

        systemsInit.forEach((val) => {
            val.onAdded();
        });
    }

    private removePending() {

        // Copy the lists so any new things additions/removals triggered get in for the next frame.
        const entitiesDestroy = new Set(this.entitiesDestroy);
        const systemsDestroy = new Set(this.systemsDestroy);
        const worldSystemsDestroy = new Set(this.worldSystemsDestroy);

        this.entitiesDestroy.clear();
        this.systemsDestroy.clear();
        this.worldSystemsDestroy.clear();


        // Trigger the onRemoved() function
        entitiesDestroy.forEach((val) => {
            val.onRemoved();
            Log.trace("Entity Removed", val);
            this.entityRemovedEvent.trigger(this, val);
        });

        systemsDestroy.forEach((val) => {
            val.onRemoved();
        });

        worldSystemsDestroy.forEach((val) => {
            val.onRemoved();
        });


        // Actually remove them
        entitiesDestroy.forEach((val) => {
            Util.remove(this.entities, val);
        });

        systemsDestroy.forEach((val) => {
            Util.remove(this.systems, val);
        });

        worldSystemsDestroy.forEach((val) => {
            Util.remove(this.worldSystems, val);
        });
    }

    private gameLoop(delta: number) {

        if (!this.gameOver) {

            this.addPending();
            this.removePending();

            const timeStart = Date.now();
            // Mouse.update();
            this.diag.inputUpdateTime = Date.now() - timeStart;

            // We will be using the elapsed milliseconds as the delta.
            // The deltaTime property is kinda wacky
            this.updateECS(this.mainTicker.elapsedMS * this.mainTicker.deltaTime);

            Keyboard.update();

        } else {
            this.app.stop();
        }
    }

    private updateECS(delta: number) {

        // Update world systems
        for (let system of this.worldSystems) {
            system.update(this, delta);
        }

        // Update entities
        for (let entity of this.entities) {
            entity.internalUpdate();
        }

        // Update normal systems
        for (let system of this.systems) {
            system.update(this, delta);
        }
    }

    /**
     * Add a system to the World.
     * @param system The system to add
     * @returns The added system.
     */
    addSystem<T extends System>(system: T): T {
        this.systemsInit.add(system);
        return system;
    }

    /**
     * Add a world system to the World. These are not tied to entity processing.
     * @param system The system to add.
     * @returns The added system.
     */
    addWorldSystem<T extends WorldSystem>(system: T): T {
        this.worldSystemsInit.add(system);
        return system;
    }

    /**
     * Add an entity to the World.
     * @param entity The entity to add.
     * @returns The added entity.
     */
    addEntity<T extends Entity>(entity: T): T {
        this.entitiesInit.add(entity);
        return entity;
    }

    /**
     * Remove a system from the world.
     * @param system The system to remove.
     */
    removeSystem(system: System) {
        this.systemsDestroy.add(system);
    }

    /**
     * Remove a world system from the world.
     * @param system The system to remove.
     */
    removeWorldSystem(system: WorldSystem) {
        this.worldSystemsDestroy.add(system);
    }

    /**
     * Remove an entity from the world. This will also remove any components the entity owns.
     * @param entity The entity to remove.
     */
    removeEntity(entity: Entity) {
        Log.trace("Entity removal scheduled for:", entity);
        this.entitiesDestroy.add(entity);
    }

    /**
     * Get a System of the provided type.
     * @param type The type of system to search for.
     * @returns The found system or null.
     */
    getSystem<T extends System>(type: any | { new(): T }): T | null {
        const found = this.systems.find(value => value instanceof type);
        return found != undefined ? found as T : null;
    }

    /**
     * Get a WorldSystem of the provided type.
     * @param type The type of system to search for.
     * @returns The found system or null.
     */
    getWorldSystem<T extends WorldSystem>(type: any | { new(): T }): T | null {
        const found = this.worldSystems.find(value => value instanceof type);
        return found != undefined ? found as T : null;
    }

    /**
     * Get an Entity with the given name. If multiple instances have the same name, only the first found will be
     * returned.
     * @param name The name of the Entity to search for.
     * @returns The found Entity or null.
     */
    getEntityWithName<T extends Entity>(name: string): T | null {
        const found = this.entities.find(value => value.name === name);
        return found != undefined ? found as T : null;
    }
}

/**
 * Base class for any lifecycle-aware object.
 */
export abstract class LifecycleObject {

    /**
     * Will be called when added to the World.
     */
    onAdded() {
    }

    /**
     * Will be called once per frame.
     */
    internalUpdate() {
    }

    /**
     * Will be called when removed from the world.
     */
    onRemoved() {
    }
}

/**
 * Component base class.
 */
export abstract class Component extends LifecycleObject {

    private entity: Entity | null = null;

    /**
     * For internal use only.
     * Set the entity for this component. Please don't call this, ts doesn't have friend classes.
     * @param entity The parent entity.
     */
    setEntity(entity: Entity) {
        this.entity = entity;
    }

    /**
     * Get the entity that owns this component.
     * @returns The entity that this component is attached to.
     */
    getEntity(): Entity {
        if (this.entity === null) {
            Log.error("Entity referenced before Component added to scene. Use onAdded() for initialization instead" +
                      " of the constructor.");
            // TODO do we throw here? this is a real problemo.
            return <any>null;
        } else {
            return this.entity;
        }
    }
}

/**
 * PIXI Component base class. More for convenience than anything else, will add to the PIXI tree.
 */
export abstract class PIXIComponent<T extends PIXI.DisplayObject> extends Component {
    readonly pixiObj: T;

    protected constructor(pixiComp: T) {
        super();
        this.pixiObj = pixiComp;
    }

    onAdded() {
        super.onAdded();
        this.getEntity().transform.addChild(this.pixiObj);
    }

    onRemoved() {
        super.onRemoved();
        this.getEntity().transform.removeChild(this.pixiObj);
    }
}

/**
 * World system base class. Designed to run on batches of Components.
 */
export abstract class WorldSystem extends LifecycleObject {

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
    protected runOnComponents(f: Function) {
        f(...Array.from(this.runOn.values()));
    }

    private onComponentAdded(entity: Entity, component: Component) {
        // Check if we care about this type at all
        const type = this.types().find((val) => {
            return component instanceof val;
        });

        if (type === undefined) return;

        let compMap = this.runOn.get(type);

        if (compMap === undefined) {
            Log.warn("Expected component map does not exist on WorldSystem.", this, type);
            compMap = [];
            this.runOn.set(type, compMap);
        }
        compMap.push(component);
    }

    private onComponentRemoved(entity: Entity, component: Component) {
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

    private onEntityAdded(caller: World, entity: Entity) {
        // Register for component changes
        entity.componentAddedEvent.register(this.onComponentAdded.bind(this));
        entity.componentRemovedEvent.register(this.onComponentRemoved.bind(this));
    }

    private onEntityRemoved(caller: World, entity: Entity) {
        entity.componentAddedEvent.deregister(this.onComponentAdded.bind(this));
        entity.componentRemovedEvent.deregister(this.onComponentRemoved.bind(this));
    }

    onAdded() {
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

    onRemoved() {
        super.onRemoved();
        World.instance.entityAddedEvent.deregister(this.onEntityAdded.bind(this));
        World.instance.entityRemovedEvent.deregister(this.onEntityRemoved.bind(this));
    }
}

/**
 * Entity base class. Raw entities can be used or subclasses can be defined similarly to prefabs.
 */
export class Entity
    extends LifecycleObject {

    private componentsInit: Set<Component> = new Set();
    private componentsDestroy: Set<Component> = new Set();

    readonly componentAddedEvent: Observable<Entity, Component> = new Observable();
    readonly componentRemovedEvent: Observable<Entity, Component> = new Observable();

    transform: PIXI.Container;
    layer: number = 0;

    readonly name: string;
    readonly components: Component[] = [];


    private addPending() {

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

    private removePending() {
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

    internalUpdate() {
        this.addPending();
        this.removePending();
    }

    /**
     * Create a new entity. It must be added to a World to actually do anything.
     * @param name The name of the entity. Used for lookups.
     * @param x The starting x position.
     * @param y The starting y position.
     */
    constructor(name: string, x: number = 0, y: number = 0) {
        super();
        this.name = name;

        this.transform = new PIXI.Container();
        this.transform.x = x;
        this.transform.y = y;
        this.addToScene();
    }

    protected addToScene() {
        World.instance.sceneNode.addChild(this.transform);
    }

    protected removeFromScene() {
        World.instance.sceneNode.removeChild(this.transform);
    }

    /**
     * Add a new component to the entity.
     * @param component The component to add.
     * @returns The added component.
     */
    addComponent<T extends Component>(component: T): T {
        this.componentsInit.add(component);
        component.setEntity(this);
        return component;
    }

    /**
     * Get all components of a given type.
     * @param type The type of component to search for.
     * @returns An array of all matching components.
     */
    getComponentsOfType<T extends Component>(type: any | { new(): T }): T[] {
        return this.components.filter(value => value instanceof type) as T[];
    }

    /**
     * Get the first component of a given type.
     * @param type the type of component to search for.
     * @returns The component if found, otherwise null.
     */
    getComponent<T extends Component>(type: any | { new(): T }): T | null {
        const found = this.components.find(value => value instanceof type);
        return found != undefined ? found as T : null;
    }

    /**
     * Remove a component from the entity.
     * @param component The component to remove.
     */
    removeComponent(component: Component) {
        Log.trace("Component removal scheduled for:", component);
        this.componentsDestroy.add(component);
    }

    onAdded() {
        super.onAdded();
        this.addPending();
    }

    onRemoved() {
        super.onRemoved();
        this.removePending();

        // Remove the entire PIXI container
        this.removeFromScene()
    }

    /**
     * Destroy the Entity and all components on it.
     */
    destroy() {
        Log.trace("Entity destroy() called for:", this);
        this.components.forEach((val) => this.removeComponent(val));
        World.instance.removeEntity(this);
    }
}

/**
 * System base class. Systems should be used to run on groups of components.
 * Note that this will only trigger if every component type is represented on an entity. Partial matches will not run.
 */
export abstract class System extends LifecycleObject {
    private readonly runOn: Map<Entity, Component[]> = new Map();

    private onComponentAdded(entity: Entity, component: Component) {

        // Check if we care about this type at all
        if (this.types().find((val) => {
            return component instanceof val;
        }) === undefined) return;

        // Compute if we can run on this updated entity
        let entry = this.runOn.get(entity);

        // We already have an entry, nothing to do!
        if (entry !== undefined) return;

        // Check if we are now able to run on this entity
        const ret = this.findComponents(entity);
        if (ret === null) return;

        // Can run, add to update list
        this.runOn.set(entity, ret);
    }

    private findComponents(entity: Entity): Component[] | null {
        // It's dumb, I can't constrain `types` because of the way imports work, but this works as desired.
        const inTypes: { new(): Component }[] = this.types();
        const ret: Component[] = [];
        for (let type of inTypes) {
            const comp = entity.getComponent(type);
            if (comp == null) return null;
            ret.push(comp);
        }

        return ret;
    }

    private onComponentRemoved(entity: Entity, component: Component) {
        // Check if we care about this type at all
        if (this.types().find((val) => {
            return component instanceof val;
        }) === undefined) return;

        let entry = this.runOn.get(entity);

        // Not actually registered, return
        if (entry === undefined) return;

        // Recompute if we can run on this entity, remove if we cannot
        const ret = this.findComponents(entity);
        if (ret === null) {
            // Can't run, remove entry
            this.runOn.delete(entity);
        } else {
            // Can run, update runOn
            this.runOn.set(entity, ret);
        }
    }

    private onEntityAdded(caller: World, entity: Entity) {
        // Register for component changes
        entity.componentAddedEvent.register(this.onComponentAdded.bind(this));
        entity.componentRemovedEvent.register(this.onComponentRemoved.bind(this));
    }

    private onEntityRemoved(caller: World, entity: Entity) {
        entity.componentAddedEvent.deregister(this.onComponentAdded.bind(this));
        entity.componentRemovedEvent.deregister(this.onComponentRemoved.bind(this));

        // Remove the entity from this System's run pool if it is registered.
        this.runOn.delete(entity);
    }

    onAdded() {
        super.onAdded();
        World.instance.entityAddedEvent.register(this.onEntityAdded.bind(this));
        World.instance.entityRemovedEvent.register(this.onEntityRemoved.bind(this));

        // We need to scan everything that already exists
        World.instance.entities.forEach(entity => {
            // Register listener for entity
            this.onEntityAdded(World.instance, entity);

            // Check it, add if ready.
            const ret = this.findComponents(entity);
            if (ret != null) {
                this.runOn.set(entity, ret);
            }
        })
    }

    onRemoved() {
        super.onRemoved();
        World.instance.entityAddedEvent.deregister(this.onEntityAdded.bind(this));
        World.instance.entityRemovedEvent.deregister(this.onEntityRemoved.bind(this));
    }

    /**
     * Update will be called every game tick for every entity.
     * @param world The World instance the system belongs to.
     * @param delta The time since the last frame.
     */
    abstract update(world: World, delta: number): void;

    /**
     * Component types that this System runs on.
     * @returns A list of Component types.
     */
    abstract types(): { new(): Component }[] | any[]

    /**
     * Call this from update() to run on the requested component instances.
     * @param f A function that will be called with the requested components passed through as parameters. The
     * owning entity will always be the first parameter, followed by each component in the order defined by types().
     * For example, if types() is [Sprite, MCollider], the function arguments would look as follows: (entity:
     * Entity, sprite: Sprite, collider: MCollider).
     */
    protected runOnEntities(f: Function) {
        this.runOn.forEach((value: Component[], key: Entity) => {
            f(key, ...value);
        })
    }
}

/**
 * Entity type that is not tied to a 'world' object. Positions etc. will remain fixed and not move with the viewport
 * position. Use this to render to absolute positions on the canvas (e.g. GUI text).
 */
export class GUIEntity extends Entity {
    protected addToScene(): void {
        // Override addToScene(), add to the GUI node instead of the normal node. This will not move with the camera.
        World.instance.guiNode.addChild(this.transform);
    }

    protected removeFromScene(): void {
        World.instance.guiNode.removeChild(this.transform);
    }
}