import {SpriteSheet} from "../../../Common/Sprite/SpriteSheet";
import background from "../Art/background.png";
import leftBlackout from "../Art/left_blackout.png";
import rightBlackout from "../Art/right_blackout.png";
import adkeys from "../Art/adkeys.png";
import space from "../Art/space.png";
import mouse from "../Art/mouse.png";
import {Entity} from "../../../ECS/Entity";
import {Sprite} from "../../../Common/Sprite/Sprite";
import {DrawLayers} from "../LD46";
import {AnimatedSprite, AnimationEnd} from "../../../Common/Sprite/AnimatedSprite";

import bg from '../Art/bgkitchen.png'
import bg2 from '../Art/bgkitchen2.png'
import {System} from "../../../ECS/System";
import {GameState} from "../Systems/StartedSystem";
import {Component} from "../../../ECS/Component";
import {Timer} from "../../../Common/Timer";

const bgsheet = new SpriteSheet(bg, 320, 180);
const bg2sheet = new SpriteSheet(bg2, 320, 180);
export const backgroundSheet = new SpriteSheet(background, 320, 180);
const arrowKeysSpritesheet = new SpriteSheet(adkeys, 64, 32);
const spaceSpriteSheet = new SpriteSheet(space, 64, 32);
const mouseSpriteSheet = new SpriteSheet(mouse, 32, 32);
const leftBlackoutSheet = new SpriteSheet(leftBlackout, 320, 180);
const rightBlackoutSheet = new SpriteSheet(rightBlackout, 320, 180);

export class MoverComponent extends Component
{
}

export class FrameMoverSystem extends System
{
    types = () => [MoverComponent]

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity) => {
            if (GameState.GameRunning != "SYNC-UP" && GameState.GameRunning != "RUNNING")
            {
                entity.transform.position.y = -145;
            }

            if (GameState.GameRunning != "SYNC-UP") return;
            if (entity.transform.position.y >= 0)
            {
                entity.transform.position.y = 0;
                return;
            }

            entity.transform.position.y += (delta / 1000) * 144;
        });
    }
}

export class ArrowKeys extends Entity
{
    constructor()
    {
        super("adkeys", 215, 0, DrawLayers.BOTTOM_FRAME);
    }

    onAdded()
    {
        super.onAdded();

        this.addComponent(new Timer(100, null, true)).onTrigger.register(caller =>
        {
            // Wait for sync up trigger, then wait 40 seconds for the minigame to load
            if (GameState.GameRunning == "SYNC-UP")
            {
                caller.remainingMS = 42000;

                return;
            }

            if (GameState.GameRunning != "RUNNING")
            {
                caller.remainingMS = 100;

                return;
            }

            this.addComponent(new MoverComponent());
            this.addComponent(
                new AnimatedSprite(arrowKeysSpritesheet.textures([[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0]]),
                                   {animationEndAction: AnimationEnd.LOOP, animationSpeed: 200, xOffset: -20, yOffset: -2}));

            caller.destroy();
        });
    }
}

export class SpaceKey extends Entity
{
    constructor()
    {
        super("spacekey", 20, 0, DrawLayers.BOTTOM_FRAME);
    }

    onAdded()
    {
        super.onAdded();

        this.addComponent(new Timer(100, null, true)).onTrigger.register(caller => {
            // Wait for sync up trigger, then wait 40 seconds for the minigame to load
            if (GameState.GameRunning == "SYNC-UP")
            {
                caller.remainingMS = 22000;

                return;
            }

            if (GameState.GameRunning != "RUNNING")
            {
                caller.remainingMS = 100;

                return;
            }

            this.addComponent(new MoverComponent());
            this.addComponent(new AnimatedSprite(spaceSpriteSheet.textures([[0, 0], [1, 0], [2, 0], [3, 0]]),
                {
                    animationEndAction: AnimationEnd.LOOP, animationSpeed: 200,
                    xOffset: -20,
                    yOffset: 110
                }));

            caller.destroy();
        });
    }
}

export class MouseAnimation extends Entity
{
    constructor()
    {
        super("mouse", 80, 0, DrawLayers.BOTTOM_FRAME);
    }

    onAdded()
    {
        super.onAdded();

        this.addComponent(new MoverComponent());
        this.addComponent(new AnimatedSprite(mouseSpriteSheet.textures([[0, 0], [1, 0], [2, 0]]),
                                             {
                                                 animationEndAction: AnimationEnd.LOOP, animationSpeed: 200,
                                                 xOffset: 80,
                                                 yOffset: 50
                                             }));
    }
}

export class TopFrame extends Entity
{
    constructor()
    {
        super("frame", 0, 0, DrawLayers.TOP_FRAME);
    }

    private createDestroyer = (time: number, sprite: Sprite) =>
    {
        this.addComponent(new Timer(100, null, true)).onTrigger.register(caller =>
        {
            // Wait for sync up trigger, then wait 20 seconds for the minigame to load
            if (GameState.GameRunning == "SYNC-UP")
            {
                caller.remainingMS = time;

                return;
            }

            if (GameState.GameRunning != "RUNNING")
            {
                caller.remainingMS = 100;

                return;
            }

            sprite.destroy();
            caller.destroy();
        });
    }

    onAdded()
    {
        super.onAdded();

        this.addComponent(new MoverComponent());
        // Coloured stroke.
        this.addComponent(new Sprite(backgroundSheet.texture(2, 0)));

        // Black frame.
        this.addComponent(new Sprite(backgroundSheet.texture(4, 0)));

        const leftSprite = new Sprite(leftBlackoutSheet.texture(0, 0));
        this.addComponent(leftSprite);
        this.createDestroyer(22000, leftSprite);

        const rightSprite = new Sprite(rightBlackoutSheet.texture(0, 0));
        this.addComponent(rightSprite);
        this.createDestroyer(42000, rightSprite);
    }
}

export class BottomFrame extends Entity
{
    constructor()
    {
        super("frame", 0, 0, DrawLayers.BOTTOM_FRAME);
    }

    onAdded()
    {
        super.onAdded();

        // Bottom 2px border.
        this.addComponent(new Sprite(backgroundSheet.texture(3, 0)));
    }
}

export class MinigameBackgrounds extends Entity
{
    constructor()
    {
        super("minigamePanes", 0, 0, DrawLayers.MINIGAME_BACKGROUND);
    }

    onAdded()
    {
        super.onAdded();

        this.addComponent(new MoverComponent());
        this.addComponent(new Sprite(backgroundSheet.texture(1, 0)));
    }
}

export class Background extends Entity
{
    constructor()
    {
        super("frame", 0, 0, DrawLayers.BACKGROUND);
    }

    onAdded()
    {
        super.onAdded();

        this.addComponent(new Sprite(bgsheet.texture(0, 0)));
    }
}

export class Background2 extends Entity
{
    constructor()
    {
        super("frame", 0, 0, DrawLayers.BACKGROUND2);
    }

    onAdded()
    {
        super.onAdded();

        this.addComponent(new Sprite(bg2sheet.texture(0, 0)));
    }
}