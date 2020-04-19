import {SpriteSheet} from "../../../Common/Sprite/SpriteSheet";
import background from "../Art/background.png";
import adkeys from "../Art/adkeys.png";
import space from "../Art/space.png";
import {Entity} from "../../../ECS/Entity";
import {Sprite} from "../../../Common/Sprite/Sprite";
import {DrawLayers} from "../LD46";
import {AnimatedSprite, AnimationEnd} from "../../../Common/Sprite/AnimatedSprite";

const backgroundSheet = new SpriteSheet(background, 320, 180);
const adkeysSpriteSheet = new SpriteSheet(adkeys, 64, 32);
const spaceSpriteSheet = new SpriteSheet(space, 64, 32);

export class ADKeys extends Entity
{
    constructor()
    {
        super("adkeys", 215, -2, DrawLayers.BOTTOM_FRAME);
    }

    onAdded()
    {
        super.onAdded();
        this.addComponent(new AnimatedSprite(adkeysSpriteSheet.textures([[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0]]),
                    {animationEndAction: AnimationEnd.LOOP, animationSpeed: 200, xOffset: -20}));
    }
}

export class SpaceKey extends Entity
{
    constructor()
    {
        super("spacekey",  60, -2, DrawLayers.BOTTOM_FRAME);
    }

    onAdded()
    {
        super.onAdded();
        this.addComponent(new AnimatedSprite(spaceSpriteSheet.textures([[0, 0], [1, 0], [2, 0], [3, 0]]),
            {animationEndAction: AnimationEnd.LOOP, animationSpeed: 200, xOffset: -20}));
    }
}

export class TopFrame extends Entity
{
    constructor()
    {
        super("frame", 0, 0, DrawLayers.FRAME);
    }

    onAdded()
    {
        super.onAdded();
        this.addComponent(new Sprite(backgroundSheet.texture(3, 0)));
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
        this.addComponent(new Sprite(backgroundSheet.texture(2, 0)));
    }
}

export class MinigamePanes extends Entity
{
    constructor()
    {
        super("minigamePanes", 0, 0, DrawLayers.MINIGAME_PANES);
    }

    onAdded()
    {
        super.onAdded();
        this.addComponent(new Sprite(backgroundSheet.texture(0, 0)));
        this.addComponent(new Sprite(backgroundSheet.texture(1, 0)));
    }
}