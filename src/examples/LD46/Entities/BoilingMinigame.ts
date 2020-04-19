import {Entity} from "../../../ECS/Entity";
import {System} from "../../../ECS/System";
import {Component} from "../../../ECS/Component";
import {Timer} from "../../../Common/Timer";
import {MathUtil} from "../../../Common/Util";
import { Game } from "../../../ECS/Game";
import {AnimatedSprite, AnimationEnd} from "../../../Common/Sprite/AnimatedSprite";
import {SpriteSheet} from "../../../Common/Sprite/SpriteSheet";
import lobsterSoupSprite from "../Art/lobster_soup.png";
import {MoverComponent} from "./Background";

const soupSpriteSheet = new SpriteSheet(lobsterSoupSprite, 76, 71);

export class BoilingMinigame extends Entity 
{
    boilingAmount: number = 0;

    onAdded(): void
    {
        super.onAdded();

        this.addComponent(new MoverComponent());

        this.addChild(new Pot("boilingPot", 0, 10))
 
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

class Pot extends Entity
{
    onAdded(): void
    {
        super.onAdded();

        this.addComponent(new AnimatedSprite(soupSpriteSheet.textureSliceFromRow(0, 0, 9),
                                             {animationSpeed: 200, animationEndAction: AnimationEnd.LOOP}));
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
        })
    }
}