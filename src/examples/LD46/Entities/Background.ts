import {SpriteSheet} from "../../../Common/Sprite/SpriteSheet";
import background from "../Art/background.png";
import {Entity} from "../../../ECS/Entity";
import {Sprite} from "../../../Common/Sprite/Sprite";

const backgroundSheet = new SpriteSheet(background, 320, 180);

export class Background extends Entity
{
    constructor()
    {
        super("background", 0, 0, 100);
    }

    onAdded()
    {
        super.onAdded();
        this.addComponent(new Sprite(backgroundSheet.textureFromIndex(0)));
    }
}
