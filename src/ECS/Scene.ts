import * as PIXI from 'pixi.js';
import {ContainerLifecycleObject, ObjectState, Updatable} from "./LifecycleObject";
import {Entity} from "./Entity";
import {System} from "./System";
import {GlobalSystem} from "./GlobalSystem";
import {Observable} from "../Common/Observer";
import {Game} from "./Game";
import {LagomType} from "./LifecycleObject";
import {Camera} from "../Common/Camera";
import {Util} from "../Common/Util";

/**
 * Scene object type. Should be the main interface used for games using the framework.
 */
export class Scene extends ContainerLifecycleObject implements Updatable
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

    camera!: Camera;

    constructor()
    {
        super();
        this.pixiStage = Util.sortedContainer();

        // set up the nodes for the ECS to interact with and add them to PIXI.
        this.sceneNode = Util.sortedContainer();
        this.sceneNode.name = "scene";
        this.guiNode = Util.sortedContainer();
        this.guiNode.name = "gui";
        this.pixiStage.addChild(this.sceneNode, this.guiNode);
    }

    onAdded()
    {
        super.onAdded();
        this.camera = new Camera(this);
    }

    update(delta: number): void
    {
        super.update(delta);

        // Update global systems
        this.globalSystems.forEach(system => system.update(delta));

        // Resolve updates for entities
        this.entities.forEach(entity => entity.update(delta));

        // Update normal systems
        this.systems.forEach(system => system.update(delta));
    }

    fixedUpdate(delta: number): void
    {
        super.fixedUpdate(delta);

        // Update global systems
        this.globalSystems.forEach(system => system.fixedUpdate(delta));

        // Resolve updates for entities
        this.entities.forEach(entity => entity.fixedUpdate(delta));

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
        system.setParent(this);
        this.toUpdate.push({state: ObjectState.PENDING_ADD, object: system});
        return system;
    }

    /**
     * Add a global system to the Scene. These are not tied to entity processing.
     * @param system The system to add.
     * @returns The added system.
     */
    addGlobalSystem<T extends GlobalSystem>(system: T): T
    {
        system.setParent(this);
        this.toUpdate.push({state: ObjectState.PENDING_ADD, object: system});
        return system;
    }

    /**
     * Add an entity to the Scene.
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
    getSystem<T extends System>(type: LagomType<System>): T | null
    {
        const found = this.systems.find(value => value instanceof type);
        return found != undefined ? found as T : null;
    }

    /**
     * Get a GlobalSystem of the provided type.
     * @param type The type of system to search for.
     * @returns The found system or null.
     */
    getGlobalSystem<T extends GlobalSystem>(type: LagomType<GlobalSystem>): T | null
    {
        const found = this.globalSystems.find(value => value instanceof type);
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

    /**
     * Return the Game object that this Scene belongs to.
     * @returns The parent Game.
     */
    getGame(): Game
    {
        return this.getParent() as Game;
    }
}