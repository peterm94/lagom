import * as PIXI from "pixi.js";
import {GUIEntity} from "../ECS/Entity";
import {TextDisp} from "./PIXIComponents";
import {Entity} from "../ECS/Entity";
import {System} from "../ECS/System";
import {Component} from "../ECS/Component";
import {Game} from "../ECS/Game";
import {LagomType} from "../ECS/LifecycleObject";


/**
 * Entity that adds FPS information to the canvas.
 */
export class Diagnostics extends GUIEntity
{
    onAdded()
    {
        super.onAdded();

        this.addComponent(new FpsTracker(this.verbose));
        this.addComponent(new TextDisp(0, 0, "", new PIXI.TextStyle({fontSize: this.textSize, fill: this.textCol})));

        const scene = this.getScene();
        scene.addSystem(new FpsUpdater());
    }

    constructor(private readonly textCol: string,
                private readonly textSize: number = 10,
                private verbose: boolean = false)
    {
        super("diagnostics");
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

    private game!: Game;

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
        this.game = this.getScene().getGame();
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
        this.avgUpdate = this.rollAverage(this.avgUpdate, this.game.diag.updateTime);
        this.avgFixedUpdate = this.rollAverage(this.avgFixedUpdate, this.game.diag.fixedUpdateTime);
        this.avgRender = this.rollAverage(this.avgRender, this.game.diag.renderTime);
        this.avgFrame = this.rollAverage(this.avgFrame, this.game.diag.totalFrameTime);

        if ((this.frameCount % this.printFrame) === 0)
        {
            this.runOnEntities((entity: Entity, text: TextDisp, tracker: FpsTracker) => {

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
                        + `\nUpdateTime: ${this.game.diag.updateTime.toFixed(2)}ms `
                        + `// ${this.avgUpdate.toFixed(2)}ms`
                        + `\nFixedUpdateTime: ${this.game.diag.fixedUpdateTime.toFixed(2)}ms `
                        + `// ${this.avgFixedUpdate.toFixed(2)}ms`
                        + `\nRenderTime: ${this.game.diag.renderTime.toFixed(2)}ms `
                        + `// ${this.avgRender.toFixed(2)}ms`
                        + `\nTotalFrameTime: ${this.game.diag.totalFrameTime.toFixed(2)}ms `
                        + `// ${this.avgFrame.toFixed(2)}ms`
                }
            });
        }
    }

    types(): LagomType<Component>[]
    {
        return [TextDisp, FpsTracker];
    }
}
