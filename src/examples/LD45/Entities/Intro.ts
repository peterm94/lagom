import {Entity} from "../../../ECS/Entity";
import {Sprite} from "../../../Common/Sprite/Sprite";
import introSpr from "../art/intro.png";
import {SpriteSheet} from "../../../Common/Sprite/SpriteSheet";
import {MathUtil} from "../../../Common/Util";
import {DrawLayer} from "../HexGame";

const introSheet = new SpriteSheet(introSpr, 1280, 720);

export class Intro extends Entity
{
    constructor() {
        super("intro", -380, -100, DrawLayer.GUI)
    }

    private sprite?: Sprite;

    onAdded()
    {
        super.onAdded();

        this.sprite = this.addComponent(new Sprite(introSheet.texture(0, 0)));
    }

    update(delta: number): void
    {
        super.update(delta);

        this.sprite!.pixiObj.alpha -= 0.0001 * delta;

        if (this.sprite!.pixiObj.alpha <= 0)
        {
            this.destroy();
        }
    }
}