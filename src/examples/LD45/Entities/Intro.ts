import {Entity} from "../../../ECS/Entity";
import {Sprite} from "../../../Common/Sprite/Sprite";
import introSpr from "../art/intro.png";
import {SpriteSheet} from "../../../Common/Sprite/SpriteSheet";
import {DrawLayer} from "../HexGame";
import {Component} from "../../../ECS/Component";
import {System} from "../../../ECS/System";

const introSheet = new SpriteSheet(introSpr, 1280, 720);

export class IntroComp extends Component
{
}

export class Intro extends Entity
{
    constructor()
    {
        super("intro", 0, 0, DrawLayer.GUI);
    }

    onAdded()
    {
        super.onAdded();

        this.addComponent(new Sprite(introSheet.texture(0, 0)));
        this.addComponent(new IntroComp());
    }
}

export class IntroListener extends System
{
    types = () => [Sprite, IntroComp];

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, sprite: Sprite) => {
            sprite.pixiObj.alpha -= 0.0001 * delta;

            if (sprite.pixiObj.alpha <= 0)
            {
                entity.destroy();
            }
        });
    }
}