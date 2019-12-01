import {Entity, GUIEntity} from "../../../ECS/Entity";
import {Sprite} from "../../../Common/Sprite/Sprite";
import loseSpr from "../art/lose.png";
import {SpriteSheet} from "../../../Common/Sprite/SpriteSheet";
import {DrawLayer, HexMainScene} from "../HexGame";
import {Key} from "../../../Input/Key";
import {Game} from "../../../ECS/Game";
import {System} from "../../../ECS/System";
import {Component} from "../../../ECS/Component";

const loseSheet = new SpriteSheet(loseSpr, 1280, 720);

export class GameOverComp extends Component
{
}

export class GameOver extends GUIEntity
{
    constructor()
    {
        super("gameOver", 0, 0, DrawLayer.GUI);
    }

    onAdded()
    {
        super.onAdded();

        this.addComponent(new Sprite(loseSheet.texture(0, 0), {alpha: 0}));
        this.addComponent(new GameOverComp());
    }
}

export class GameOverListener extends System
{
    types = () => [Sprite, GameOverComp];

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