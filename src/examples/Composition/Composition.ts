import {Game} from "../../ECS/Game";
import {Scene} from "../../ECS/Scene";
import {System} from "../../ECS/System";
import {LagomType} from "../../ECS/LifecycleObject";
import {Component} from "../../ECS/Component";
import {Entity} from "../../ECS/Entity";
import {Key} from "../../Input/Key";
import {RenderCircle, RenderRect} from "../../Common/PIXIComponents";

const Keyboard = require('pixi.js-keyboard');


class MoveMe extends Component
{
}

class Mover extends System
{
    types(): LagomType<Component>[]
    {
        return [MoveMe];
    }

    update(delta: number): void
    {
        const spd = 0.1;
        const rotSpd = 0.005;

        this.runOnEntities((entity: Entity) => {
            if (Keyboard.isKeyDown(Key.KeyA))
            {
                entity.transform.position.x -= spd * delta;
            }
            if (Keyboard.isKeyDown(Key.KeyD))
            {
                entity.transform.position.x += spd * delta;
            }
            if (Keyboard.isKeyDown(Key.KeyW))
            {
                entity.transform.position.y -= spd * delta;
            }
            if (Keyboard.isKeyDown(Key.KeyS))
            {
                entity.transform.position.y += spd * delta;
            }
            if (Keyboard.isKeyDown(Key.KeyQ))
            {
                entity.transform.rotation -= rotSpd * delta;
            }
            if (Keyboard.isKeyDown(Key.KeyE))
            {
                entity.transform.rotation += rotSpd * delta;
            }
        });
    }

}

class CompositionScene extends Scene
{
    onAdded(): void
    {
        super.onAdded();


        const e = this.addEntity(new Entity("hello", 50, 50));

        e.addComponent(new RenderCircle(0, 0, 10));
        e.addComponent(new MoveMe());

        this.addSystem(new Mover());

        const c1 = e.addChild(new Entity("c1"));
        c1.addComponent(new RenderCircle(0, 0, 5, 0x222255));
        c1.transform.position.x = 10;

    }
}

export class Composition extends Game
{
    constructor()
    {
        super({
                  width: 512,
                  height: 512,
                  resolution: 1,
                  backgroundColor: 0x200140
              });

        this.setScene(new CompositionScene(this));
    }
}
