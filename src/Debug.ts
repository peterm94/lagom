import {Component, Entity, System, World} from "./ECS";
import {TextDisp} from "./Components";

/**
 * Entity that adds FPS information to the canvas.
 */
export class Diagnostics extends Entity {

    onAdded() {
        super.onAdded();

        this.addComponent(new FpsTracker());
        this.addComponent(new TextDisp("", {fontSize: 5}));
        World.instance.addSystem(new FpsUpdater());
    }

    constructor() {
        super("diagnostics");
    }
}

class FpsTracker extends Component {
}

class FpsUpdater extends System {

    lastFpsAvg: number = 1;
    lastDtAvg: number = 1;
    samples: number = 100;

    printFrame: number = 1;
    frameCount: number = 0;

    constructor() {
        super();
    }

    update(world: World, delta: number, entity: Entity): void {

        const fpsAvg = this.lastFpsAvg * (this.samples - 1) / this.samples + world.mainTicker.FPS / this.samples;
        this.lastFpsAvg = fpsAvg;
        const dtAvg = this.lastDtAvg * (this.samples - 1) / this.samples + world.mainTicker.deltaTime / this.samples;
        this.lastDtAvg = dtAvg;

        this.frameCount++;
        if (this.frameCount % this.printFrame === 0) {
            World.runOnEntity((_: FpsTracker, text: TextDisp) => {
                // text.pixiObj.text = world.app.ticker.FPS.toString();
                text.pixiObj.text = `FPS: ${fpsAvg.toFixed(2)}\tdt:${dtAvg.toFixed(2)}\tscale: ${world.mainTicker.speed}`;
                // text.pixiObj.text += `\ninputTime: ${world.diag.inputUpdateTime.toFixed(2)}\tsysUpdateTime:
                // ${world.diag.systemUpdateTime.toFixed(2)}\tworldSysUpdateTime:
                // ${world.diag.worldSystemUpdateTime.toFixed(2)}`
            }, entity, FpsTracker, TextDisp)
        }
    }
}
