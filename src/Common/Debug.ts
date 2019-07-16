import * as PIXI from "pixi.js";
import {GUIEntity} from "../ECS/Entity";
import {TextDisp} from "./PIXIComponents";
import {WorldSystem} from "../ECS/WorldSystem";
import {Entity} from "../ECS/Entity";
import {System} from "../ECS/System";
import {Component} from "../ECS/Component";
import {World} from "../ECS/World";
import {LagomType} from "../ECS/LifecycleObject";
import {Log} from "./Util";

const Keyboard = require('pixi.js-keyboard');

/**
 * Entity that adds FPS information to the canvas.
 */
export class Diagnostics extends GUIEntity
{
    onAdded()
    {
        super.onAdded();

        this.addComponent(new FpsTracker(this.verbose));
        this.addComponent(new TextDisp("", new PIXI.TextStyle({fontSize: this.textSize, fill: this.textCol})));

        const scene = this.getScene();
        scene.addSystem(new FpsUpdater());
        scene.addWorldSystem(new DebugKeys());
    }

    constructor(private readonly textCol: string,
                private readonly textSize: number = 10,
                private verbose: boolean = false)
    {
        super("diagnostics");
    }
}

class DebugKeys extends WorldSystem
{
    update(delta: number): void
    {
        if (Keyboard.isKeyPressed('KeyT'))
        {
            console.log(this.getScene().entities.map((e) => e.name));
        }
        if (Keyboard.isKeyPressed('KeyY'))
        {
            console.log(this.getScene().getWorld());
        }
    }

    types(): LagomType<Component>[]
    {
        return [];
    }
}

class FpsTracker extends Component
{
    constructor(readonly verbose: boolean)
    {
        super();
    }
}

class FpsUpdater extends System
{
    printFrame: number = 10;
    frameCount: number = 0;

    private world!: World;

    private avgFixedUpdateDt = 0;
    private fixedDt = 0;
    private avgUpdateDt = 0;
    private avgUpdate = 0;
    private avgFixedUpdate = 0;
    private avgRender = 0;
    private avgFrame = 0;

    private readonly samples = 100;

    onAdded(): void
    {
        super.onAdded();
        this.world = this.getScene().getWorld();
    }

    private rollAverage(prevAvg: number, newVal: number): number
    {
        return (prevAvg * (this.samples - 1) + newVal) / this.samples
    }

    fixedUpdate(delta: number): void
    {
        this.avgFixedUpdateDt = this.rollAverage(this.avgFixedUpdateDt, 1000 / delta);
        this.fixedDt = delta;
    }

    update(delta: number): void
    {
        this.frameCount++;

        this.avgUpdateDt = this.rollAverage(this.avgUpdateDt, 1000 / delta);
        this.avgUpdate = this.rollAverage(this.avgUpdate, this.world.diag.updateTime);
        this.avgFixedUpdate = this.rollAverage(this.avgFixedUpdate, this.world.diag.fixedUpdateTime);
        this.avgRender = this.rollAverage(this.avgRender, this.world.diag.renderTime);
        this.avgFrame = this.rollAverage(this.avgFrame, this.world.diag.totalFrameTime);

        if ((this.frameCount % this.printFrame) === 0)
        {
            this.runOnEntities((entity: Entity, text: TextDisp, tracker: FpsTracker) => {
                {
                    text.pixiObj.text = `${this.avgUpdateDt.toFixed(2)}`;

                    if (tracker.verbose)
                    {
                        text.pixiObj.text =
                            `U: ${delta.toFixed(2)}ms `
                            + `// ${(1000 / delta).toFixed(2)}hz `
                            + `// ${this.avgUpdateDt.toFixed(2)}hz`
                            + `\nFixedU: ${this.fixedDt.toFixed(2)}ms `
                            + `// ${(1000 / this.fixedDt).toFixed(2)}hz `
                            + `// ${this.avgFixedUpdateDt.toFixed(2)}hz`
                            + `\nUpdateTime: ${this.world.diag.updateTime.toFixed(2)}ms `
                            + `// ${this.avgUpdate.toFixed(2)}ms`
                            + `\nFixedUpdateTime: ${this.world.diag.fixedUpdateTime.toFixed(2)}ms `
                            + `// ${this.avgFixedUpdate.toFixed(2)}ms`
                            + `\nRenderTime: ${this.world.diag.renderTime.toFixed(2)}ms `
                            + `// ${this.avgRender.toFixed(2)}ms`
                            + `\nTotalFrameTime: ${this.world.diag.totalFrameTime.toFixed(2)}ms `
                            + `// ${this.avgFrame.toFixed(2)}ms`
                    }
                }
            });
        }
    }

    types(): LagomType<Component>[]
    {
        return [TextDisp, FpsTracker];
    }
}
