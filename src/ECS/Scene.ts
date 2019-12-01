import * as PIXI from 'pixi.js';
import {LifecycleObject, Updatable} from "./LifecycleObject";
import {Entity} from "./Entity";
import {System} from "./System";
import {GlobalSystem} from "./GlobalSystem";
import {Observable} from "../Common/Observer";
import {Game} from "./Game";
import {LagomType} from "./LifecycleObject";
import {Camera} from "../Common/Camera";
import {Log, Util} from "../Common/Util";

/**
 * Scene object type. Should be the main interface used for games using the framework.
 */
export class Scene extends LifecycleObject implements Updatable
{
    // Some fancy entity events for anything that cares.
    readonly entityAddedEvent: Observable<Scene, Entity> = new Observable();
    readonly entityRemovedEvent: Observable<Scene, Entity> = new Observable();

    // Top level scene node.
    readonly pixiStage: PIXI.Container;

    // Node for scene objects. This can be offset to simulate camera movement.
    readonly sceneNode: PIXI.Container;

    // GUI top level node. This node should not be offset, allowing for static GUI elements.
    readonly guiNode: PIXI.Container;

    // TODO can these be sets? need unique, but update order needs to be defined :/ i need a comparator for each
    // type that can define it's order.
    readonly entities: Entity[] = [];
    readonly systems: System[] = [];
    readonly globalSystems: GlobalSystem[] = [];

    // Milliseconds
    readonly updateWarnThreshold = 5;

    readonly camera: Camera;

    constructor(readonly game: Game)
    {
        super();
        this.pixiStage = Util.sortedContainer();

        // set up the nodes for the ECS to interact with and add them to PIXI.
        this.sceneNode = Util.sortedContainer();
        this.sceneNode.name = "scene";
        this.guiNode = Util.sortedContainer();
        this.guiNode.name = "gui";
        this.pixiStage.addChild(this.sceneNode, this.guiNode);

        this.camera = new Camera(this);
    }

    update(delta: number): void
    {
        // Update global systems
        this.globalSystems.forEach(system => {
            const now = Date.now();
            system.update(delta);
            const time = Date.now() - now;
            if (time > this.updateWarnThreshold)
            {
                Log.warn(`GlobalSystem update took ${time}ms`, system);
            }
        });

        // Update normal systems
        this.systems.forEach(system => {
            const now = Date.now();
            system.update(delta);
            const time = Date.now() - now;
            if (time > this.updateWarnThreshold)
            {
                Log.warn(`System update took ${time}ms`, system);
            }
        });
    }

    fixedUpdate(delta: number): void
    {
        // Update global systems
        this.globalSystems.forEach(system => system.fixedUpdate(delta));

        // Update normal systems
        this.systems.forEach(system => system.fixedUpdate(delta));
    }

    /**
     * Add a system to the Game.
     * @param system The system to add.
     * @returns The added system.
     */
    addSystem<T extends System>(system: T): T
    {
        system.parent = this;

        this.systems.push(system);
        system.addedToScene(this);

        system.onAdded();

        return system;
    }

    /**
     * Get a System of the provided type.
     * @param type The type of system to search for.
     * @returns The found system or null.
     */
    getSystem<T extends System>(type: LagomType<System>): T | null
    {
        const found = this.systems.find(value => value instanceof type);
        return found !== undefined ? found as T : null;
    }

    /**
     * Add a global system to the Scene. These are not tied to entity processing.
     * @param system The system to add.
     * @returns The added system.
     */
    addGlobalSystem<T extends GlobalSystem>(system: T): T
    {
        system.parent = this;

        this.globalSystems.push(system);
        system.addedToScene(this);

        system.onAdded();

        return system;
    }

    /**
     * Get a GlobalSystem of the provided type.
     * @param type The type of system to search for.
     * @returns The found system or null.
     */
    getGlobalSystem<T extends GlobalSystem>(type: LagomType<GlobalSystem>): T | null
    {
        const found = this.globalSystems.find(value => value instanceof type);
        return found !== undefined ? found as T : null;
    }


    /**
     * Add an entity to the Scene.
     * @param entity The entity to add.
     * @returns The added entity.
     */
    addEntity<T extends Entity>(entity: T): T
    {
        Log.debug("Adding entity to scene.", entity);
        entity.parent = this;

        this.entities.push(entity);
        this.entityAddedEvent.trigger(this, entity);

        // Add this PIXI container under the correct root node.
        entity.rootNode().addChild(entity.transform);

        entity.onAdded();

        return entity;
    }

    removeEntity(entity: Entity): void
    {
        Log.trace("Removing entity from scene.", entity.name);

        if (!Util.remove(this.entities, entity))
        {
            Log.warn("Attempting to remove Entity that does not exist in Scene.", entity, this);
        }

        this.entityRemovedEvent.trigger(this, entity);

        // Remove the entire PIXI container
        entity.rootNode().removeChild(entity.transform);

        entity.onRemoved();
    }

    /**
     * Get an Entity with the given name. If multiple instances have the same name, only the first found will be
     * returned.
     * @param name The name of the Entity to search for.
     * @returns The found Entity or null.
     */
    getEntityWithName<T extends Entity>(name: string): T | null
    {
        const found = this.entities.find(value => value.name === name);
        return found !== undefined ? found as T : null;
    }

    /**
     * Return the Game object that this Scene belongs to.
     * @returns The parent Game.
     */
    getGame(): Game
    {
        return this.game;
    }
}