import {Entity} from "../../../ECS/Entity";
import {Sprite} from "../../../Common/Sprite/Sprite";
import loseSpr from "../art/lose.png";
import {SpriteSheet} from "../../../Common/Sprite/SpriteSheet";
import {DrawLayer} from "../HexGame";
const loseSheet = new SpriteSheet(loseSpr, 1280, 720);

export class GameOver extends Entity
{
    constructor(x: number, y: number)
    {
        super("gameOver", x - 660, y - 340, DrawLayer.GUI);
    }

    private sprite!: Sprite;

    onAdded()
    {
        super.onAdded();

        this.sprite = this.addComponent(new Sprite(loseSheet.texture(0, 0), {alpha: 0}));
    }

    update(delta: number): void
    {
        super.update(delta);

        this.sprite.pixiObj.alpha += 0.0001 * delta;
    }
}