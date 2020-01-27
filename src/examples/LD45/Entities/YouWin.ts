import {Entity} from "../../../ECS/Entity";
import {Sprite} from "../../../Common/Sprite/Sprite";
import winSpr from "../art/end.png";
import {SpriteSheet} from "../../../Common/Sprite/SpriteSheet";
import {DrawLayer, HexMainScene} from "../HexGame";
import {Key} from "../../../Input/Key";
import {Game} from "../../../ECS/Game";
import {Component} from "../../../ECS/Component";
import {System} from "../../../ECS/System";

const winSheet = new SpriteSheet(winSpr, 1280, 720);

export class YouWinComp extends Component
{
}

export class YouWin extends Entity
{
    constructor()
    {
        super("gameOver", 0, 0, DrawLayer.GUI);
    }

    onAdded()
    {
        super.onAdded();

        this.addComponent(new Sprite(winSheet.texture(0, 0), {alpha: 0}));
        this.addComponent(new YouWinComp());
    }
}

export class YouWinListener extends System
{
    types = () => [Sprite, YouWinComp];

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, sprite: Sprite) => {
            sprite.pixiObj.alpha += 0.0001 * delta;

            if (Game.keyboard.isKeyDown(Key.Space))
            {
                entity.getScene().getGame().setScene(new HexMainScene(entity.getScene().getGame()));
            }
        });
    }

}
