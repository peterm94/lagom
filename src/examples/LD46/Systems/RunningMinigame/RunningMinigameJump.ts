import {System} from "../../../../ECS/System";
import {Entity} from "../../../../ECS/Entity";
import {Sprite} from "../../../../Common/Sprite/Sprite";
import {RunningMinigameBackground} from "../../Entities/RunningMinigame";

export class RunningMinigameJump extends System {   
    public types = () => [RunningMinigameBackground];

    public update(delta: number): void
    {
        this.runOnEntities((entity: Entity, runningBackground: RunningMinigameBackground) => {
            entity.transform.position.y -= 1;
        });
    }
}