import {Game} from "../../ECS/Game";
import {Scene} from "../../ECS/Scene";
import {Diagnostics} from "../../Common/Debug";
import {CollisionMatrix} from "../../Collisions/CollisionMatrix";
import { RunningMinigame } from "./Entities/RunningMinigame";
import {Entity} from "../../ECS/Entity";
import {RenderRect} from "../../Common/PIXIComponents";
import {LobsterMinigame} from "./Entities/LobsterMinigame";
import {TimerSystem} from "../../Common/Timer";
import { DiscreteCollisionSystem } from "../../Collisions/CollisionSystems";

const collisionMatrix = new CollisionMatrix();

export enum Layers
{
    LAYER1,
    LAYER2
}

class MainScene extends Scene
{
    onAdded(): void
    {
        super.onAdded();

        // Collisions
        collisionMatrix.addCollision(Layers.LAYER1, Layers.LAYER1);
        this.addGlobalSystem(new DiscreteCollisionSystem(collisionMatrix));

        this.addGUIEntity(new Diagnostics("black", 8));

        // Put any init stuff here
        this.addEntity(new RunningMinigame());
        this.addEntity(new Divider());
        // timer
        this.addGlobalSystem(new TimerSystem());
        this.addEntity(new LobsterMinigame("lobstergame", 0, 64))

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
                  backgroundColor: 0x88965d,
                  antialias: false
              });

        this.setScene(new MainScene(this));
    }
}
