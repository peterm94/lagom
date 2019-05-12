import * as PIXI from "pixi.js";
import {ContainerLifecycleObject, ObjectState, Updatable} from "./LifecycleObject";
import {Entity} from "./Entity";
import {System} from "./System";
import {WorldSystem} from "./WorldSystem";
import {Observable} from "../Observer";
import {World} from "./World";


export class Scene extends ContainerLifecycleObject implements Updatable
{
    // Some fancy events
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
    readonly worldSystems: WorldSystem[] = [];

    constructor()
    {
        super();
        this.pixiStage = new PIXI.Container();

        // set up the nodes for the ECS to interact with and add them to PIXI.
        this.sceneNode = new PIXI.Container();
        this.sceneNode.name = "scene";
        this.guiNode = new PIXI.Container();
        this.guiNode.name = "gui";
        this.pixiStage.addChild(this.sceneNode, this.guiNode);
    }

    update(delta: number): void
    {
        super.update(delta);

        // Update world systems
        this.worldSystems.forEach(system => system.update(delta));

        // Resolve updates for entities
        this.entities.forEach(entity => entity.update(delta));

        // Update normal systems
        this.systems.forEach(system => system.update(delta));
    }

    /**
     * Add a system to the World.
     * @param system The system to add
     * @returns The added system.
     */
    addSystem<T extends System>(system: T): T
    {
        system.setParent(this);
        this.toUpdate.push({state: ObjectState.PENDING_ADD, object: system});
        return system;
    }

    /**
     * Add a world system to the World. These are not tied to entity processing.
     * @param system The system to add.
     * @returns The added system.
     */
    addWorldSystem<T extends WorldSystem>(system: T): T
    {
        system.setParent(this);
        this.toUpdate.push({state: ObjectState.PENDING_ADD, object: system});
        return system;
    }

    /**
     * Add an entity to the World.
     * @param entity The entity to add.
     * @returns The added entity.
     */
    addEntity<T extends Entity>(entity: T): T
    {
        entity.setParent(this);
        this.toUpdate.push({state: ObjectState.PENDING_ADD, object: entity});
        return entity;
    }

    /**
     * Get a System of the provided type.
     * @param type The type of system to search for.
     * @returns The found system or null.
     */
    getSystem<T extends System>(type: any | { new(): T }): T | null
    {
        const found = this.systems.find(value => value instanceof type);
        return found != undefined ? found as T : null;
    }

    /**
     * Get a WorldSystem of the provided type.
     * @param type The type of system to search for.
     * @returns The found system or null.
     */
    getWorldSystem<T extends WorldSystem>(type: any | { new(): T }): T | null
    {
        const found = this.worldSystems.find(value => value instanceof type);
        return found != undefined ? found as T : null;
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
        return found != undefined ? found as T : null;
    }

    getWorld(): World
    {
        return this.getParent() as World;
    }
}