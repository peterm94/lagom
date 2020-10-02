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
 * Scene object type. Contains the root nodes for the entity trees, and runs all Systems and GlobalSystems..
 */
export class Scene extends LifecycleObject implements Updatable
{
    /**
     * Event for an entity being added to the scene.
     */
    readonly entityAddedEvent: Observable<Scene, Entity> = new Observable();

    /**
     * Event for an entity being removed from the scene.
     */
    readonly entityRemovedEvent: Observable<Scene, Entity> = new Observable();

    // Top level scene node.
    readonly pixiStage: PIXI.Container;

    // Node for scene objects. This can be offset to simulate camera movement.
    readonly sceneNode: Entity;

    // GUI top level node. This node should not be offset, allowing for static GUI elements.
    readonly guiNode: Entity;

    // TODO I don't know if I want this to stick around forever. Need systems to be able to see all entities.
    readonly entities: Entity[] = [];

    // TODO can these be sets? need unique, but update order needs to be defined :/ i need a comparator for each
    //  type that can define it's order.
    readonly systems: System[] = [];
    readonly globalSystems: GlobalSystem[] = [];

    // Milliseconds
    readonly updateWarnThreshold = 5;

    /**
     * The main camera for this scene. Can be interacted with to move the viewport.
     */
    readonly camera: Camera;

    /**
     * Construct a new scene.
     * @param game The game to add the scene to.
     */
    constructor(readonly game: Game)
    {
        super();

        // Root pixi container for the entire scene.
        this.pixiStage = Util.sortedContainer();

        // set up the root nodes for the ECS.
        this.sceneNode = new Entity("SceneNode");
        this.sceneNode.scene = this;
        this.sceneNode.transform.name = "scene";
        this.guiNode = new Entity("GUINode");
        this.guiNode.transform.name = "gui";
        this.guiNode.scene = this;

        // Add them to the pixi stage.
        this.pixiStage.addChild(this.sceneNode.transform, this.guiNode.transform);

        // Add a camera
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
        this.globalSystems.forEach(system => {
            const now = Date.now();
            system.fixedUpdate(delta);
            const time = Date.now() - now;
            if (time > this.updateWarnThreshold)
            {
                Log.warn(`System fixedUpdate took ${time}ms`, system);
            }
        });

        // Update normal systems
        this.systems.forEach(system => {
            const now = Date.now();
            system.fixedUpdate(delta);
            const time = Date.now() - now;
            if (time > this.updateWarnThreshold)
            {
                Log.warn(`System fixedUpdate took ${time}ms`, system);
            }
        });
    }

    /**
     * Add a system to the Game.
     * @param system The system to add.
     * @returns The added system.
     */
    addSystem<T extends System>(system: T): T
    {
        system.scene = this;

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
        system.scene = this;

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
     * Add a new entity to the scene.
     * @param entity The entity to add to the scene.
     * @returns The added entity.
     */
    addEntity<T extends Entity>(entity: T): T
    {
        return this.sceneNode.addChild(entity);
    }

    /**
     * Remove an entity from the scene.
     * @param entity The entity to remove.
     */
    removeEntity(entity: Entity): void
    {
        this.sceneNode.removeChild(entity);
    }

    /**
     * Add a entity to the scene. This will keep the entity anchored to the top left of the camera view. Good for
     * GUI elements.
     * @param entity The entity to add.
     * @returns The added entity.
     */
    addGUIEntity<T extends Entity>(entity: T): T
    {
        return this.guiNode.addChild(entity);
    }

    /**
     * Remove an entity from the scene that was added with addGUIEntity.
     * @param entity The entity to remove.
     */
    removeGUIEntity(entity: Entity): void
    {
        this.guiNode.removeChild(entity);
    }

    /**
     * Get an Entity with the given name. If multiple instances have the same name, only the first found will be
     * returned. Will not recurse. Use sceneNode.findChildWithName() directly if recursion is required.
     *
     * @param name The name of the Entity to search for.
     * @returns The found Entity or null.
     */
    getEntityWithName<T extends Entity>(name: string): T | null
    {
        // Check the scene node first.
        const node = this.sceneNode.findChildWithName(name);

        // If not found, check GUI nodes, otherwise just return the found one.
        return (node === null) ? this.guiNode.findChildWithName(name) : node as T;
    }

    /**
     * Return the Game object that this Scene belongs to.
     * @returns The parent Game.
     */
    getGame(): Game
    {
        return this.game;
    }

    onRemoved(): void
    {
        super.onRemoved();

        this.entityAddedEvent.releaseAll();
        this.entityRemovedEvent.releaseAll();
    }
}
