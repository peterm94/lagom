import {Game} from "../../ECS/Game";
import {Scene} from "../../ECS/Scene";
import {Diagnostics} from "../../Common/Debug";
import {CollisionMatrix} from "../../Collisions/CollisionMatrix";
import { RunningMinigame } from "./Entities/RunningMinigame";
import {TypingMinigame} from "./Entities/TypingMinigame";
import {TypingDirector} from "./Systems/TypingMinigame/TypingDirector";

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
        this.addEntity(new TypingMinigame());
        this.addSystem(new TypingDirector());
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
