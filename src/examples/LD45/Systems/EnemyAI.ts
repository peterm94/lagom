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

            const playerDir = MathUtil.pointDirection(entity.transform.x, entity.transform.y,
                                                      player.transform.x, player.transform.y);


            const playerDist = MathUtil.pointDistance(player.transform.x, player.transform.y,
                                                      entity.transform.x, entity.transform.y);

            // TODO why don't their thrusters angle correctly??

            // Aim at player
            movement.setAim(player.transform.position);

            // Shoot if in range
            if (playerDist < 600)
            {
                movement.shooting = true;
            }

            // Move towards player if not too close
            if (playerDist > 200)
            {
                const x = MathUtil.lengthDirX(1, playerDir);
                const y = -MathUtil.lengthDirY(1, playerDir); // negative why?!?

                movement.move(x * delta * this.moveSpeed, y * delta * this.moveSpeed);
            }
            // rotate towards player
            entity.transform.rotation = MathUtil.angleLerp(entity.transform.rotation, -playerDir, 0.1 * delta/1000);
        });
    }

}