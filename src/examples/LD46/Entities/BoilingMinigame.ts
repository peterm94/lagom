import {Entity} from "../../../ECS/Entity";
import {System} from "../../../ECS/System";
import {Component} from "../../../ECS/Component";
import {Timer} from "../../../Common/Timer";
import {MathUtil} from "../../../Common/Util";
import { Game } from "../../../ECS/Game";

export class BoilingMinigame extends Entity 
{
    boilingAmount: number = 0;

    onAdded(): void
    {
        super.onAdded();
 
        const timer = this.addComponent(new Timer(MathUtil.randomRange(3000, 5000), null, true))
        timer.onTrigger.register((caller) => 
        {
            if (this.boilingAmount <= 75)
            {
                this.boilingAmount += 25;
            }

            // Reset.
            caller.remainingMS = MathUtil.randomRange(3000, 5000);
        });
    }
}

class BoilingPot extends Component 
{

}

class BoilingSystem extends System 
{
    types = () => [BoilingPot]

    update(delta: number): void 
    {
        this.runOnEntities((entity: Entity) => 
        {
            if (Game.mouse.isButtonPressed()) 
            {
                if (Game.mouse.getPosX() > 110 && Game.mouse.getPosX() < 320 && Game.mouse.getPosY() > 0 && Game.mouse.getPosY() < 90)
                {
                }
            }
        }
    }
}