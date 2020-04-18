import {SpriteSheet} from "../../../Common/Sprite/SpriteSheet";
import background from "../Art/background.png";
import {Entity} from "../../../ECS/Entity";
import {Sprite} from "../../../Common/Sprite/Sprite";
import {DrawLayers} from "../LD46";

const backgroundSheet = new SpriteSheet(background, 320, 180);

export class Background extends Entity
{
    constructor()
    {
        super("background", 0, 0, DrawLayers.BACKGROUND);
    }

    onAdded()
    {
        super.onAdded();
        this.addComponent(new Sprite(backgroundSheet.textureFromIndex(0)));
    }
}
