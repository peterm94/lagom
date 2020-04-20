import {Entity} from "../../../ECS/Entity";
import {System} from "../../../ECS/System";
import {Timer} from "../../../Common/Timer";
import {MathUtil, Util} from "../../../Common/Util";
import {Game} from "../../../ECS/Game";
import {AnimatedSprite, AnimationEnd} from "../../../Common/Sprite/AnimatedSprite";
import {SpriteSheet} from "../../../Common/Sprite/SpriteSheet";
import lobsterSoupSprite from "../Art/lobster_soup.png";
import burn from "../Art/burn.png";
import {backgroundSheet, MoverComponent} from "./Background";
import {ConveyorMoveSystem} from "./LobsterMinigame";
import {Button} from "../../../Input/Button";
import {ScreenShake} from "../../../Common/Screenshake";
import {SoundManager} from "./SoundManager";

const soupSpriteSheet = new SpriteSheet(lobsterSoupSprite, 80, 71);
const burnSpriteSheet = new SpriteSheet(burn, 32, 32);

export class BoilingMinigame extends Entity
{
    boilingAmount: number = 0;

    onAdded(): void
    {
        super.onAdded();

        this.addComponent(new MoverComponent());

        this.addChild(new Pot("pot", 0, 10))

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

        this.scene.addSystem(new BoilingSystem());
    }
}

class BurnIndicator extends AnimatedSprite
{
    constructor()
    {
        super(burnSpriteSheet.textureSliceFromRow(0, 0, 1),
              {animationSpeed: 100, animationEndAction: AnimationEnd.LOOP, xOffset: 28, yOffset: 18});
    }
}

class Soup extends AnimatedSprite
{
    constructor()
    {
        super(soupSpriteSheet.textureSliceFromRow(0, 0, 9),
              {animationSpeed: 200, animationEndAction: AnimationEnd.LOOP});
    }
}

class PotSelected extends Entity
{
    constructor()
    {
        super("potSelected", 0, 0, 1);
    }

    onAdded(): void
    {
        super.onAdded();

        this.addComponent(new AnimatedSprite(soupSpriteSheet.textureSliceFromRow(0, 15, 15),
                                             {animationSpeed: 200, animationEndAction: AnimationEnd.LOOP}));
    }
}

class Overflow extends Entity
{
    constructor()
    {
        super("overflow", 0, 0, 2);
    }

    onAdded(): void
    {
        super.onAdded();

        this.addComponent(new AnimatedSprite(soupSpriteSheet.textureSliceFromRow(0, 10, 14),
                                             {animationSpeed: 200, animationEndAction: AnimationEnd.LOOP}));
    }
}

class Heat extends Entity
{
    constructor()
    {
        super("heat", 0, 0, 3);
    }

    onAdded(): void
    {
        super.onAdded();

        this.addComponent(new AnimatedSprite(soupSpriteSheet.textureSliceFromRow(0, 16, 16),
                                             {animationSpeed: 200, animationEndAction: AnimationEnd.LOOP}));
        this.addComponent(new BurnIndicator());
    }
}

class Pot extends Entity
{
    onAdded(): void
    {
        super.onAdded();

        this.addComponent(new Soup());
    }
}

class BoilingSystem extends System
{
    types = () => [Soup]

    update(delta: number): void
    {
        this.runOnEntities((entity: Pot) => {
            const minigame = entity.parent as BoilingMinigame

            const overflow = entity.findChildWithName<Overflow>("overflow");
            const heat = entity.findChildWithName<Overflow>("heat");

            if (minigame.boilingAmount >= 50)
            {
                if (overflow == null)
                {
                    entity.addChild(new Overflow());
                }
            }
            else
            {
                overflow?.destroy();
            }

            if (minigame.boilingAmount >= 75)
            {
                if (heat == null)
                {
                    entity.addChild(new Heat());
                }
            }
            else
            {
                heat?.destroy();
            }

            if (minigame.boilingAmount == 100)
            {
                const flash = new AnimatedSprite(backgroundSheet.textureSliceFromRow(0, 7, 7), {
                    animationSpeed: 1000,
                    animationEndAction: AnimationEnd.STOP,
                    xOffset: -110
                });

                entity.parent?.addComponent(flash)

                entity.addComponent(new Timer(500, null, false)).onTrigger.register(_ => {
                    entity.parent?.removeComponent(flash, true);
                });

                entity.addComponent(new ScreenShake(0.25, 500));

                (this.scene.getEntityWithName("audio") as SoundManager).playSound(
                    Util.choose("hurt1", "hurt2", "hurt3"));

                ConveyorMoveSystem.increaseConveyor();
                minigame.boilingAmount = 0;
            }

            const mouse = this.scene.game.renderer.plugins.interaction.mouse;
            const x = mouse.global.x;
            const y = mouse.global.y;
            const mouseDown = Game.mouse.isButtonPressed(Button.LEFT)
            const potSelected = entity.findChildWithName<PotSelected>("potSelected");

            if (x > 120 && x < 182 && y > 28.5 && y < 72)
            {
                if (potSelected == null)
                {
                    entity.addChild(new PotSelected());
                }

                if (mouseDown)
                {
                    minigame.boilingAmount = 0
                }
            }
            else
            {
                potSelected?.destroy()
            }
        })
    }
}