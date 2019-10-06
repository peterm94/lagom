import * as PIXI from "pixi.js";
import {ContainerLifecycleObject, ObjectState} from "./LifecycleObject";
import {Scene} from "./Scene";

// https://www.npmjs.com/package/pixi.js-keyboard
// keys: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code#Code_values
const Keyboard = require('pixi.js-keyboard');

// https://www.npmjs.com/package/pixi.js-mouse
const Mouse = require('pixi.js-mouse');

class Diag
{
    renderTime: number = 0;
    fixedUpdateTime: number = 0;
    updateTime: number = 0;
    totalFrameTime: number = 0;
}

/**
 * Game class, containing all high level framework references. Sets up the render window and controls updating the ECS.
 */
export class Game extends ContainerLifecycleObject
{
    static mouse = Mouse;
    static keyboard = Keyboard;

    // Set this to true to end the game
    gameOver: boolean = false;

    // Main PIXI renderer
    readonly renderer: PIXI.Renderer;

    // PIXI interaction manager
    readonly manager: PIXI.interaction.InteractionManager;

    // Currently loaded scene.
    currentScene!: Scene;

    // Track total time
    private timeMs = 0;

    // Time since last frame was triggered
    private lastFrameTime = Date.now();

    // Accumulated time since the last update. Used to keep the framerate fixed independently of the elapsed time.
    private elapsedSinceUpdate = 0;

    // Fixed timestep rate for logic updates (60hz)
    private readonly fixedDeltaMS = 1000 / 60;

    // Delta since the last frame update. This is *not* the delta of the ECS update, but the render loop.
    deltaTime = 0;

    private updateLoop()
    {
        if (!this.gameOver)
        {
            let now = Date.now();
            const totalUpdateStart = now;
            this.deltaTime = now - this.lastFrameTime;
            this.lastFrameTime = now;

            this.elapsedSinceUpdate += this.deltaTime;

            while (this.elapsedSinceUpdate >= this.fixedDeltaMS)
            {
                // call FixedUpdate() for the ECS
                this.fixedUpdate(this.fixedDeltaMS);

                this.elapsedSinceUpdate -= this.fixedDeltaMS;
                this.timeMs += this.fixedDeltaMS;
            }
            this.diag.fixedUpdateTime = Date.now() - now;
            // Call update() for the ECS
            now = Date.now();
            this.update(this.deltaTime);
            this.diag.updateTime = Date.now() - now;

            now = Date.now();
            this.renderer.render(this.currentScene.pixiStage);
            this.diag.renderTime = Date.now() - now;
            this.diag.totalFrameTime = Date.now() - totalUpdateStart;

            requestAnimationFrame(this.updateLoop.bind(this));
        }
    }

    readonly diag: Diag = new Diag();

    /**
     * Create a new Game.
     * @param scene The first scene to load.
     * @param options Options for the PIXI Renderer.
     */
    constructor(scene: Scene, options?: {
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
    }, private readonly loader?: PIXI.Loader)
    {
        super();

        this.setScene(scene);

        // Set it up in the page
        this.renderer = new PIXI.Renderer(options);

        this.manager = new PIXI.interaction.InteractionManager(this.renderer);

        // If we just want to run it raw, we can enable this again.
        // document.body.appendChild(this.renderer.view);
    }

    /**
     * Start the game loop.
     */
    start()
    {
        // TODO remove this whole concept and do it like the platformer does.
        // If we need to load additional resources, do that.
        if (this.loader)
        {
            this.loader.load(() => {
                this.startInternal();
            })
        }
        else
        {
            this.startInternal();
        }
    }

    private startInternal()
    {
        // Start the update loop
        this.lastFrameTime = Date.now();
        this.updateLoop()
    }

    update(delta: number): void
    {
        super.update(delta);

        this.currentScene.update(delta);

        // TODO this is fine here, but we should document it. If something in fixedUpdate() is looking for keyboard
        //  events it is going to have a bad time.
        Game.keyboard.update();
        Game.mouse.update();
    }

    fixedUpdate(delta: number): void
    {
        super.fixedUpdate(delta);

        this.currentScene.fixedUpdate(delta);
    }

    /**
     * Set a scene to load. Will be started instantly.
     * @param scene The Scene to load.
     */
    setScene(scene: Scene)
    {
        scene.setParent(this);
        this.toUpdate.push({state: ObjectState.PENDING_ADD, object: scene});
        this.currentScene = scene;

        // TODO what happens to the old scene?
    }
}