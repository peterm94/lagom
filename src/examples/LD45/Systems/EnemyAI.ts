import {System} from "../../../ECS/System";
import {EnemyTag} from "../Entities/Enemy";
import {Movement} from "../Movement";
import {Entity} from "../../../ECS/Entity";
import {MathUtil} from "../../../Common/Util";
import {Player} from "../Entities/Player";

export class EnemyAI extends System
{
    private readonly moveSpeed = 0.02;

    types = () => [Movement, EnemyTag];

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, movement: Movement) => {

            const player = this.getScene().getEntityWithName("player") as Player;

            const dir = MathUtil.pointDirection(entity.transform.x, entity.transform.y,
                                                player.transform.x, player.transform.y);

            const x = MathUtil.lengthDirX(1, dir);
            const y = -MathUtil.lengthDirY(1, dir);

            movement.move(x * delta * this.moveSpeed, y * delta * this.moveSpeed);

            // TODO why don't their thrusters angle correctly??
        })
    }

}