import {System} from "../../../../ECS/System";
import {Entity} from "../../../../ECS/Entity";
import {Sprite} from "../../../../Common/Sprite/Sprite";
import {RunningMinigameBackground} from "../../Entities/RunningMinigame";
import {Game} from "../../../../ECS/Game";
import {Key} from "../../../../Input/Key";

export class RunningMinigameInfiniteRunner extends System {   
    public types = () => [RunningMinigameBackground];

    public update(delta: number): void
    {
        this.runOnEntities((entity: Entity, runningPlayer: RunningMinigameBackground) => {
            entity.transform.position.y += 0.2;
            if (Game.keyboard.isKeyReleased(Key.Space)) {
                    // do animation  
                    entity.transform.position.y += 1;      
            }
        });
    }
}