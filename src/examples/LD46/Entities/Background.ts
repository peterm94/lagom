import {SpriteSheet} from "../../../Common/Sprite/SpriteSheet";
import background from "../Art/background.png";
import {Entity} from "../../../ECS/Entity";
import {Sprite} from "../../../Common/Sprite/Sprite";
import {DrawLayers} from "../LD46";

const backgroundSheet = new SpriteSheet(background, 320, 180);

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