import * as PIXI from "pixi.js";
import {ContainerLifecycleObject, ObjectState} from "./LifecycleObject";
import {Scene} from "./Scene";

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
    // Set this to true to end the game
    gameOver: boolean = false;

    // Main PIXI renderer
    readonly renderer: PIXI.Renderer;

    // Currently loaded scene.
    currentScene!: Scene;

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

    private updateLoop()
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
            this.renderer.render(this.currentScene.pixiStage);
            this.diag.renderTime = Date.now() - renderStart;
            this.diag.totalFrameTime = Date.now() - now;

            requestAnimationFrame(this.updateLoop.bind(this));
        }
    }

    readonly diag: Diag = new Diag();

    /**
     * Create a new World.
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
    })
    {
        super();

        this.setScene(scene);

        // Set it up in the page
        this.renderer = new PIXI.Renderer(options);
        document.body.appendChild(this.renderer.view);
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
        this.currentScene.update(delta);

        Keyboard.update();
    }

    setScene(scene: Scene)
    {
        scene.setParent(this);
        this.toUpdate.push({state: ObjectState.PENDING_ADD, object: scene});
        this.currentScene = scene;

        // TODO what happens to the old scene?
    }
}