import {System} from "../../../ECS/System";
import {Movement} from "../Movement";
import {ThrusterAnimationStates, ThrusterTag} from "../Entities/Thruster";
import {AnimatedSpriteController} from "../../../Common/Sprite/AnimatedSpriteController";
import {HexEntity} from "../HexEntity";
import {MathUtil} from "../../../Common/Util";

export class ThrusterAnimationSystem extends System
{
    types = () => [AnimatedSpriteController, ThrusterTag];

    update(delta: number)
    {
        this.runOnEntities((entity: HexEntity, sprite: AnimatedSpriteController) => {

            const movement = entity.owner.getEntity().getComponent<Movement>(Movement);

            if (movement && movement.isMoving())
            {
                sprite.setAnimation(ThrusterAnimationStates.ON);

                const rotation = MathUtil.pointDirection(0, 0, -Math.sign(movement.x), Math.sign(movement.y)) -
                    entity.transform.rotation - (Math.PI / 2);

                if (sprite.sprite!.pixiObj.rotation - rotation)
                {
                    sprite.applyConfig(
                        {rotation: MathUtil.angleLerp(sprite.sprite!.pixiObj.rotation, rotation, (delta / 1000) * 4)});
                }
            }
            else
            {
                sprite.setAnimation(ThrusterAnimationStates.OFF)
            }
        })
    }
}

