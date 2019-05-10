import * as PIXI from "pixi.js";
import {GUIEntity} from "./ECS/Entity";
import {TextDisp} from "./Components";
import {WorldSystem} from "./ECS/WorldSystem";
import {Entity} from "./ECS/Entity";
import {System} from "./ECS/System";
import {Component} from "./ECS/Component";
import {World} from "./ECS/World";

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
        World.instance.addSystem(new FpsUpdater());
        World.instance.addWorldSystem(new DebugKeys());
    }

    constructor(textCol: string)
    {
        super("diagnostics");
        this.textCol = textCol;
    }
}

class DebugKeys extends WorldSystem
{
    update(world: World, delta: number): void
    {
        if (Keyboard.isKeyPressed('KeyT'))
        {
            console.log(world.entities.map((e) => e.name));
        }
        if (Keyboard.isKeyPressed('KeyY'))
        {
            console.log(world);
        }
    }

    types(): { new(): Component }[] | any[]
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

    constructor()
    {
        super();
    }

    update(world: World, delta: number): void
    {
        this.frameCount++;
        if ((this.frameCount % this.printFrame) === 0)
        {
            this.runOnEntities((entity: Entity, text: TextDisp) => {
                {
                    text.pixiObj.text = `UpdateDelta: ${delta.toFixed(2)}ms // ${(1000 / delta).toFixed(2)}`
                        + `\nAnimationDelta: ${(world.deltaTime).toFixed(2)}ms // ${(1000 / world.deltaTime).toFixed(2)}`
                        + `\nECSUpdateTime: ${world.diag.ecsUpdateTime.toFixed(2)}ms`
                        + `\nRenderTime: ${world.diag.renderTime.toFixed(2)}ms`
                        + `\nTotalFrameTime: ${world.diag.totalFrameTime.toFixed(2)}ms`
                }
            });
        }
    }

    types(): { new(): Component }[] | any[]
    {
        return [TextDisp, FpsTracker];
    }
}
