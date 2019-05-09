import * as PIXI from "pixi.js";
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
        this.addComponent(new TextDisp("", new PIXI.TextStyle({fontSize: 10, fill: this.textCol})));
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

    printFrame: number = 10;
    frameCount: number = 0;

    constructor() {
        super();
    }

    update(world: World, delta: number): void {
        this.frameCount++;
        if ((this.frameCount % this.printFrame) === 0) {
            this.runOnEntities((entity: Entity, text: TextDisp) => {
                {
                    // text.pixiObj.text = `FPS: ${world.mainTicker.FPS.toFixed(2)}` +
                    //                     `\tdt:${world.mainTicker.deltaTime.toFixed(2)}` +
                    //                     `\tspeed: ${world.mainTicker.speed}` +
                    //                     `\telapsed:${world.mainTicker.elapsedMS.toFixed(2)}` +
                    //                     `\tcalcDt:${delta.toFixed(2)}` +
                    //                     `\ttarg:${PIXI.settings.TARGET_FPMS}`;
                }
            });
        }
    }

    types(): { new(): Component }[] | any[] {
        return [TextDisp, FpsTracker];
    }
}
