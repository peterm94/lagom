import {System} from "../../../../ECS/System";
import {Entity} from "../../../../ECS/Entity";
import {Sprite} from "../../../../Common/Sprite/Sprite";
import {Key} from "../../../../Input/Key";
import {Game} from "../../../../ECS/Game";
import {RunningMinigamePlayer} from "../../Entities/RunningMinigame";

export class RunningMinigameJump extends System {   
    public types = () => [RunningMinigamePlayer];

    public update(delta: number): void
    {
        this.runOnEntities((entity: Entity, runningPlayer: RunningMinigamePlayer) => {
            if (Game.keyboard.isKeyReleased(Key.Space)) {
                    // do animation  
            }
        });
    }
}