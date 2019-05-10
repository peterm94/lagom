import {Entity} from "./Entity";
import {System} from "./System";
import {WorldSystem} from "./WorldSystem";
import * as PIXI from "pixi.js";
import {Observable} from "../Observer";
import {ContainerLifecycleObject, ObjectState} from "./LifecycleObject";

// https://www.npmjs.com/package/pixi.js-keyboard
// keys: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code#Code_values
const Keyboard = require('pixi.js-keyboard');

// const Mouse = require('pixi.js-mouse');


class Diag
{
    renderTime: number = 0;
    ecsUpdateTime: number = 0;
    totalFrameTime: number = 0;
}


/**
 * Entire Scene instance Access via World.instance after creation.
 */
export class World extends ContainerLifecycleObject
{
    static instance: World;

    // TODO can these be sets? need unique, but update order needs to be defined :/ i need a comparator for each
    // type that can define it's order.
    readonly entities: Entity[] = [];
    readonly systems: System[] = [];
    readonly worldSystems: WorldSystem[] = [];

    // Set this to true to end the game
    gameOver: boolean = false;

    // Main PIXI renderer
    readonly renderer: PIXI.Renderer;

    // Top level PIXI Container that will be passed to the renderer.
    readonly stage: PIXI.Container;

    // Node for scene objects. This can be offset to simulate camera movement.
    readonly sceneNode: PIXI.Container;

    // GUI top level node. This node should not be offset, allowing for static GUI elements.
    readonly guiNode: PIXI.Container;

    // Track total time
    private timeMs = 0;

    // Time since last frame was triggered
    private lastFrameTime = Date.now();

    // Accumulated time since the last update. Used to keep the framerate fixed independently of the elapsed time.
    private elapsedSinceUpdate = 0;

    // Fixed timestep rate for logic updates (60hz)
    private readonly dtMs = 1000 / 60;

    // Delta since the last frame update. This is *not* the delta of the ECS update, but the render loop.
    deltaTime = 0;

    updateLoop()
    {
        if (!this.gameOver)
        {
            const now = Date.now();
            this.deltaTime = now - this.lastFrameTime;
            this.lastFrameTime = now;

            this.elapsedSinceUpdate += this.deltaTime;

            while (this.elapsedSinceUpdate >= this.dtMs)
            {
                // Update the ECS
                this.update(this.dtMs);
                this.diag.ecsUpdateTime = Date.now() - now;

                this.elapsedSinceUpdate -= this.dtMs;
                this.timeMs += this.dtMs;
            }

            const renderStart = Date.now();
            this.renderer.render(this.stage);
            this.diag.renderTime = Date.now() - renderStart;
            this.diag.totalFrameTime = Date.now() - now;

            requestAnimationFrame(this.updateLoop.bind(this));
        }
    }

    readonly diag: Diag = new Diag();

    readonly entityAddedEvent: Observable<World, Entity> = new Observable();
    readonly entityRemovedEvent: Observable<World, Entity> = new Observable();

    /**
     * Create a new World.
     * @param options Options for the PIXI Renderer.
     */
    constructor(options?: {
        width?: number;
        height?: number;
        view?: HTMLCanvasElement;
        transparent?: boolean;
        autoDensity?: boolean;
        antialias?: boolean;
        forceFXAA?: boolean;
        resolution?: number;
        clearBeforeRender?: boolean;
        preserveDrawingBuffer?: boolean;
        backgroundColor?: number;
        powerPreference?: string;
        context?: any;
    })
    {
        super();

        World.instance = this;

        // Set it up in the page
        this.renderer = new PIXI.Renderer(options);
        document.body.appendChild(this.renderer.view);

        this.stage = new PIXI.Container();

        // set up the nodes for the ECS to interact with and add them to PIXI.
        this.sceneNode = new PIXI.Container();
        this.sceneNode.name = "scene";
        this.guiNode = new PIXI.Container();
        this.guiNode.name = "gui";
        this.stage.addChild(this.sceneNode, this.guiNode);
    }

    /**
     * Start the game loop.
     */
    start()
    {
        // Start the update loop
        this.lastFrameTime = Date.now();
        this.updateLoop()
    }

    update(delta: number): void
    {
        super.update(delta);

        // Mouse.update();

        // Update world systems
        this.worldSystems.forEach(system => system.update(this, delta));

        // Resolve updates for entities
        this.entities.forEach(entity => entity.update(delta));

        // Update normal systems
        this.systems.forEach(system => system.update(this, delta));

        Keyboard.update();
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
}