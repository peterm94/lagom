import {Component, Entity, GUIEntity, System, World, WorldSystem} from "./ECS";
import {TextDisp} from "./Components";

const Keyboard = require('pixi.js-keyboard');

/**
 * Entity that adds FPS information to the canvas.
 */
export class Diagnostics extends GUIEntity {
    private readonly textCol: string;

    onAdded() {
        super.onAdded();

        this.addComponent(new FpsTracker());
        this.addComponent(new TextDisp("", {fontSize: 10, fill: this.textCol}));
        World.instance.addSystem(new FpsUpdater());
        World.instance.addWorldSystem(new DebugKeys());
    }

    constructor(textCol: string) {
        super("diagnostics");
        this.textCol = textCol;
    }
}

class DebugKeys extends WorldSystem {
    update(world: World, delta: number): void {
        if (Keyboard.isKeyPressed('KeyT')) {
            console.log(world.entities.map((e) => e.name));
        }
    }

    types(): { new(): Component }[] | any[] {
        return [];
    }
}

class FpsTracker extends Component {
}

class FpsUpdater extends System {

    lastFpsAvg: number = 1;
    lastDtAvg: number = 1;
    lastMsAvg: number = 1;

    samples: number = 100;
    printFrame: number = 10;
    frameCount: number = 0;

    constructor() {
        super();
    }

    update(world: World, delta: number): void {

        const fpsAvg = this.lastFpsAvg * (this.samples - 1) / this.samples + world.mainTicker.FPS / this.samples;
        this.lastFpsAvg = fpsAvg;
        const dtAvg = this.lastDtAvg * (this.samples - 1) / this.samples + world.mainTicker.deltaTime / this.samples;
        this.lastDtAvg = dtAvg;
        const msAvg = this.lastMsAvg * (this.samples - 1) / this.samples + world.mainTicker.elapsedMS / this.samples;
        this.lastMsAvg = msAvg;

        this.frameCount++;
        if ((this.frameCount % this.printFrame) === 0) {
            this.runOnEntities((entity: Entity, text: TextDisp) => {
                {
                    // text.pixiObj.text = world.app.ticker.FPS.toString();
                    // text.pixiObj.text = `FPS: ${fpsAvg.toFixed(2)}` +
                    //                     `\tdt:${dtAvg.toFixed(2)}` +
                    //                     `\tspeed: ${world.mainTicker.speed}` +
                    //                     `\telapsed:${msAvg.toFixed(2)}`;
                    // text.pixiObj.text += `\ninputTime: ${world.diag.inputUpdateTime.toFixed(2)}\tsysUpdateTime:
                    // ${world.diag.systemUpdateTime.toFixed(2)}\tworldSysUpdateTime:
                    // ${world.diag.worldSystemUpdateTime.toFixed(2)}`


                    text.pixiObj.text = `FPS: ${world.mainTicker.FPS.toFixed(2)}` +
                                        `\tdt:${world.mainTicker.deltaTime.toFixed(2)}` +
                                        `\tspeed: ${world.mainTicker.speed}` +
                                        `\telapsed:${world.mainTicker.elapsedMS.toFixed(2)}` +
                                        `\tcalcDt:${delta.toFixed(2)}` +
                                        `\ttarg:${PIXI.settings.TARGET_FPMS}`;
                }
            });
        }
    }

    types(): { new(): Component }[] | any[] {
        return [TextDisp, FpsTracker];
    }
}
