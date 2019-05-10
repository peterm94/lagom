import * as PIXI from "pixi.js";

import {World} from "../ECS/World";
import {Diagnostics} from "../Debug";
import {MatterEngine, MCollider} from "../MatterPhysics";
import {Vector} from "matter-js";

import spr_block from './resources/block.png';
import {Sprite} from "../Components";
import * as Matter from "matter-js";
import {CollisionMatrix} from "../Collision";
import {Entity} from "../ECS/Entity";

const loader = new PIXI.Loader();

export class PerfTest
{

    constructor()
    {
        loader.add([spr_block]).load(() => {

            let world = new World({width: 1024, height: 700, resolution: 1, backgroundColor: 0xA1B1A1});

            world.addEntity(new Diagnostics("white"));

            for (let i = 0; i < 50; i++)
            {
                for (let j = 0; j < 10; j++)
                {
                    world.addEntity(new Block(i * 32, j * 32));
                }
            }

            world.addWorldSystem(new MatterEngine(new CollisionMatrix(), Vector.create(0, 0.15)));

            world.start();
        })
    }
}


class Block extends Entity
{
    constructor(x: number, y: number)
    {
        super("block", x, y);
    }

    onAdded(): void
    {
        super.onAdded();

        const sprite = this.addComponent(new Sprite(loader.resources[spr_block].texture));
        this.addComponent(new MCollider(Matter.Bodies.rectangle(0, 0, sprite.pixiObj.width,
                                                                sprite.pixiObj.height), {layer: 0, isStatic: true}));
    }
}
