import {Game} from "../../ECS/Game";
import {Scene} from "../../ECS/Scene";
import {Diagnostics} from "../../Common/Debug";
import {CollisionMatrix} from "../../Collisions/CollisionMatrix";
import { RunningMinigame } from "./Entities/RunningMinigame";
import {TypingMinigame} from "./Entities/TypingMinigame";
import {TextTyper} from "./Entities/TypingMinigame";
import {TypingDirector} from "./Systems/TypingMinigame/TypingDirector";
import {Entity} from "../../ECS/Entity";
import {RenderRect} from "../../Common/PIXIComponents";

const collisionMatrix = new CollisionMatrix();

enum Layers
{
    LAYER1,
    LAYER2
}

class MainScene extends Scene
{
    onAdded(): void
    {
        super.onAdded();

        this.addGUIEntity(new Diagnostics("white", 8));

        // Put any init stuff here
        this.addEntity(new RunningMinigame());
        this.addEntity(new Divider());
        this.addEntity(new TypingMinigame());
    }
}

export class Divider extends Entity
{
    constructor()
    {
        super("Divider", 159, 0);
    }

    public onAdded()
    {
        super.onAdded();

        this.addComponent(new RenderRect(0, 0, 1, 320, null, 0x000));
    }
}

export class LD46 extends Game
{
    constructor()
    {
        super({
                  width: 320,
                  height: 180,
                  resolution: 4,
                  backgroundColor: 0xfff9ba,
                  antialias: false
              });

        this.setScene(new MainScene(this));

        // Do collisions here
        collisionMatrix.addCollision(Layers.LAYER1, Layers.LAYER2);
    }
}
