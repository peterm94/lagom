import * as PIXI from "pixi.js";
import {GUIEntity} from "../ECS/Entity";
import {TextDisp} from "./PIXIComponents";
import {WorldSystem} from "../ECS/WorldSystem";
import {Entity} from "../ECS/Entity";
import {System} from "../ECS/System";
import {Component} from "../ECS/Component";
import {World} from "../ECS/World";
import {LagomType} from "../ECS/LifecycleObject";

const Keyboard = require('pixi.js-keyboard');

/**
 * Entity that adds FPS information to the canvas.
 */
export class Diagnostics extends GUIEntity
{
    private readonly textCol: string;

    onAdded()
    {
        super.onAdded();

        this.addComponent(new FpsTracker());
        this.addComponent(new TextDisp("", new PIXI.TextStyle({fontSize: 10, fill: this.textCol})));

        const scene = this.getScene();
        scene.addSystem(new FpsUpdater());
        scene.addWorldSystem(new DebugKeys());
    }

    constructor(textCol: string)
    {
        super("diagnostics");
        this.textCol = textCol;
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
}

class FpsUpdater extends System
{
    printFrame: number = 10;
    frameCount: number = 0;

    private world!: World;

    private avgUpdateDt = 0;
    private avgAnimDt = 0;
    private avgUpdate = 0;
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

    update(delta: number): void
    {
        this.frameCount++;

        this.avgUpdateDt = this.rollAverage(this.avgUpdateDt, 1000 / delta);
        this.avgAnimDt = this.rollAverage(this.avgAnimDt, 1000 / this.world.deltaTime);
        this.avgUpdate = this.rollAverage(this.avgUpdate, this.world.diag.ecsUpdateTime);
        this.avgRender = this.rollAverage(this.avgRender, this.world.diag.renderTime);
        this.avgFrame = this.rollAverage(this.avgFrame, this.world.diag.totalFrameTime);

        if ((this.frameCount % this.printFrame) === 0)
        {
            this.runOnEntities((entity: Entity, text: TextDisp) => {
                {
                    text.pixiObj.text = `UpdateDelta: ${delta.toFixed(2)}ms // ${(1000 / delta).toFixed(
                        2)} // ${this.avgUpdateDt.toFixed(2)}`
                        + `\nAnimationDelta: ${(this.world.deltaTime).toFixed(2)}ms // ${(1000 /
                            this.world.deltaTime).toFixed(2)} // ${this.avgAnimDt.toFixed(2)}`
                        +
                        `\nECSUpdateTime: ${this.world.diag.ecsUpdateTime.toFixed(2)}ms // ${this.avgUpdate.toFixed(2)}`
                        + `\nRenderTime: ${this.world.diag.renderTime.toFixed(2)}ms // ${this.avgRender.toFixed(2)}`
                        + `\nTotalFrameTime: ${this.world.diag.totalFrameTime.toFixed(2)}ms // ${this.avgFrame.toFixed(
                            2)}`
                }
            });
        }
    }

    types(): LagomType<Component>[]
    {
        return [TextDisp, FpsTracker];
    }
}
