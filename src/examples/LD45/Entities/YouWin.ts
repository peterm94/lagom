import {Entity} from "../../../ECS/Entity";
import {Sprite} from "../../../Common/Sprite/Sprite";
import winSpr from "../art/end.png";
import {SpriteSheet} from "../../../Common/Sprite/SpriteSheet";
import {DrawLayer, HexMainScene} from "../HexGame";
import {Key} from "../../../Input/Key";
import {Game} from "../../../ECS/Game";
const winSheet = new SpriteSheet(winSpr, 1280, 720);

export class YouWin extends Entity
{
    constructor(x: number, y: number)
    {
        super("gameOver", x - 660, y - 340, DrawLayer.GUI);
    }

    private sprite!: Sprite;

    onAdded()
    {
        super.onAdded();

        this.sprite = this.addComponent(new Sprite(winSheet.texture(0, 0), {alpha: 0}));
    }

    update(delta: number): void
    {
        super.update(delta);

        this.sprite.pixiObj.alpha += 0.0001 * delta;

        if (Game.keyboard.isKeyDown(Key.Space))
        {
            this.getScene().getGame().setScene(new HexMainScene())
        }
    }
}