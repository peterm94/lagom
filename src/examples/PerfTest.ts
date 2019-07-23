import * as PIXI from "pixi.js";

import {Game} from "../ECS/Game";
import {Diagnostics} from "../Common/Debug";
import {MatterEngine} from "../MatterPhysics/MatterPhysics";
import {Vector} from "matter-js";

import spr_block from './resources/block.png';
import {Sprite} from "../Common/PIXIComponents";
import * as Matter from "matter-js";
import {CollisionMatrix} from "../LagomCollisions/CollisionMatrix";
import {Entity} from "../ECS/Entity";
import {Scene} from "../ECS/Scene";
import {MCollider} from "../MatterPhysics/MatterColliders";

const loader = new PIXI.Loader();

export class PerfTest extends Scene
{

    constructor()
    {
        super();

        const game = new Game(this, {width: 1024, height: 700, resolution: 1, backgroundColor: 0xA1B1A1});

        loader.add([spr_block]).load(() => {

            this.addEntity(new Diagnostics("white"));

            for (let i = 0; i < 50; i++)
            {
                for (let j = 0; j < 10; j++)
                {
                    this.addEntity(new Block(i * 32, j * 32));
                }
            }

            this.addGlobalSystem(new MatterEngine(new CollisionMatrix(), Vector.create(0, 0.15)));

            game.start();
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
                                                                sprite.pixiObj.height), 0, 0,
                                        {layer: 0, isStatic: true}));
    }
}
