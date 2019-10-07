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
        this.runOnEntities((entity: Entity, movement: Movement, tag: EnemyTag) => {

            const player = this.getScene().getEntityWithName("player") as Player;

            const targetDir = MathUtil.pointDirection(entity.transform.x, entity.transform.y,
                                                      player.transform.x + tag.where.x,
                                                      player.transform.y + tag.where.y);


            const targetDist = MathUtil.pointDistance(player.transform.x, player.transform.y,
                                                      entity.transform.x + tag.where.x,
                                                      entity.transform.y + tag.where.y);

            // TODO why don't their thrusters angle correctly??

            // Aim at player
            movement.setAim(player.transform.position);

            // Shoot if in range
            if (targetDist < 450)
            {
                movement.shooting = true;
            }

            // Move towards player if not too close
            if (targetDist > 350)
            {
                const x = MathUtil.lengthDirX(1, targetDir);
                const y = -MathUtil.lengthDirY(1, targetDir); // negative why?!?

                movement.move(x * delta * this.moveSpeed, y * delta * this.moveSpeed);
            }
            // rotate towards player
            entity.transform.rotation = MathUtil.angleLerp(entity.transform.rotation, -targetDir, 0.1 * delta / 1000);
        });
    }

}