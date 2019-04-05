import * as PIXI from "pixi.js";
import {Smoothie} from "./Smoothie";
import {Util} from "./Util";

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

    private readonly entities: Entity[] = [];
    private readonly systems: System[] = [];
    private readonly worldSystems: WorldSystem[] = [];

    // Set this to true to end the game
    gameOver: boolean = false;

    readonly app: PIXI.Application;
    readonly smoothie: Smoothie;
    readonly mainTicker: PIXI.ticker.Ticker;

    readonly diag: Diag = new Diag();

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

    private gameLoop(delta: number) {

        // const delta = this.smoothie.dt;

        if (!this.gameOver) {
            // Update input event listeners
            const timeStart = Date.now();
            Keyboard.update();
            // Mouse.update();
            this.diag.inputUpdateTime = Date.now() - timeStart;

            this.update(delta);
        } else {
            this.app.stop();
        }
    }

    private update(delta: number) {
        let timeStart = Date.now();

        for (let system of this.worldSystems) {
            system.update(this, delta, this.entities);
        }

        this.diag.worldSystemUpdateTime = Date.now() - timeStart;
        timeStart = Date.now();

        for (let system of this.systems) {
            for (let entity of this.entities) {
                system.update(this, delta, entity);
            }
        }
        this.diag.systemUpdateTime = Date.now() - timeStart;
    }

    /**
     * Add a system to the World.
     * @param system The system to add
     * @returns The added system.
     */
    addSystem(system: System): System {
        this.systems.push(system);
        system.onAdded();
        return system;
    }

    /**
     * Add a world system to the World. These are not tied to entity processing.
     * @param system The system to add.
     * @returns The added system.
     */
    addWorldSystem(system: WorldSystem): WorldSystem {
        this.worldSystems.push(system);
        system.onAdded();
        return system;
    }

    /**
     * Add an entity to the World.
     * @param entity The entity to add.
     * @returns The added entity.
     */
    addEntity(entity: Entity): Entity {
        this.entities.push(entity);
        entity.onAdded();
        return entity;
    }

    /**
     * Remove a system from the world.
     * @param system The system to remove.
     */
    removeSystem(system: System) {
        system.onRemoved();
        Util.remove(this.systems, system);
    }

    /**
     * Remove a world system from the world.
     * @param system The system to remove.
     */
    removeWorldSystem(system: WorldSystem) {
        system.onRemoved();
        Util.remove(this.worldSystems, system);
    }

    /**
     * Remove an entity from the world. This will also remove any components the entity owns.
     * @param entity The entity to remove.
     */
    removeEntity(entity: Entity) {
        entity.onRemoved();
        Util.remove(this.entities, entity);
    }

    /**
     * Utility function to run on all entities that match the specified type string. This will not run if all types are
     * not matched.
     *
     * @param f A function which will handle the run call. The arguments will be an instance of every component type
     * specified in `types`.
     * @param entity The entity to run on.
     * @param types A list of type names to populate the provided function with.
     */
    static runOnEntity<T extends Component>(f: Function, entity: Entity, ...types: any[]) {

        // It's dumb, I can't constrain `types` because of the way imports work, but this works as desired.
        const inTypes: { new(): T }[] = types;

        const ret: T[] = [];
        for (let type of inTypes) {
            const comp = entity.getComponent(type);
            if (comp == null) return;

            ret.push(comp);
        }
        f(...ret);
    }

    static runOnComponents<T extends Component>(f: Function, entities: Entity[], ...types: any[]) {

        const inTypes: { new(): T }[] = types;

        const ret: Map<{ new(): T }, Component[]> = new Map();

        for (let type of inTypes) {
            ret.set(type, []);
        }

        // This is slow and bad but we can cache it one day
        for (let entity of entities) {
            for (let type of inTypes) {
                const entryMap = ret.get(type);
                if (entryMap === undefined) continue;

                for (let comp of entity.getComponentsOfType(type)) {
                    entryMap.push(comp);
                }
            }
        }

        f(...Array.from(ret.values()));
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
     * Will be called when removed from the world.
     */
    onRemoved() {
    }
}

/**
 * Component base class.
 */
export abstract class Component extends LifecycleObject {
    entity: Entity | null = null;

    id() {
        return this.constructor.name;
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
        if (this.entity != null)
            this.entity.transform.addChild(this.pixiObj);
    }

    onRemoved() {
        if (this.entity != null)
            this.entity.transform.removeChild(this.pixiObj);
    }
}

/**
 * World system base class.
 */
export abstract class WorldSystem extends LifecycleObject {

    /**
     * Update will be called every game tick.
     * @param world The world we are operating on
     * @param delta The elapsed time since the last update call.
     * @param entities All entities in this world.
     */
    abstract update(world: World, delta: number, entities: Entity[]): void;
}

/**
 * System base class. Systems should be used to run on groups of components.
 */
export abstract class System extends LifecycleObject {

    /**
     * Update will be called every game tick for every entity.
     * TODO this should do the entity checks here instead of in each system. We can cache as well.
     * @param world The World instance the system belongs to.
     * @param delta The time since the last frame.
     * @param entity The entity that is being updated.
     */
    abstract update(world: World, delta: number, entity: Entity): void;
}

/**
 * Entity base class. Raw entities can be used or subclasses can be defined similarly to prefabs.
 */
export class Entity extends LifecycleObject {

    transform: PIXI.Container;

    readonly name: string;
    private readonly components: Component[] = [];

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
        World.instance.app.stage.addChild(this.transform);
    }

    /**
     * Add a new component to the entity.
     * @param component The component to add.
     * @returns The entity.
     */
    addComponent(component: Component): Entity {
        component.entity = this;
        this.components.push(component);
        component.onAdded();
        return this;
    }

    /**
     * Get all components of a given type.
     * @param type The type of component to search for.
     * @returns An array of all matching components.
     */
    getComponentsOfType<T extends Component>(type: { new(): T }): T[] {
        return this.components.filter(value => value instanceof type) as T[];
    }

    /**
     * Get the first component of a given type.
     * @param type the type of component to search for.
     * @returns The component if found, otherwise null.
     */
    getComponent<T extends Component>(type: { new(): T }): T | null {
        const found = this.components.find(value => value instanceof type);
        return found != undefined ? found as T : null;
    }

    /**
     * Remove a component from the entity.
     * @param component The component to remove.
     */
    removeComponent(component: Component) {
        component.onRemoved();
        Util.remove(this.components, component);
    }
}