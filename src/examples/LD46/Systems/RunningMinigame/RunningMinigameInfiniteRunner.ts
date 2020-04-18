import {System} from "../../../../ECS/System";
import {Entity} from "../../../../ECS/Entity";
import {Sprite} from "../../../../Common/Sprite/Sprite";
import {RunningMinigamePlayer} from "../../Entities/RunningMinigame";

export class InfiniteRunner extends System {   
    public types = () => [RunningMinigamePlayer];

    public update(delta: number): void
    {
        this.runOnEntities((entity: Entity, runningPlayer: RunningMinigamePlayer) => {
            // entity.transform.position.y -= 1;
        });
    }
}