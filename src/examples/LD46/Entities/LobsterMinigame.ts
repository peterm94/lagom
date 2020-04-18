import {SpriteSheet} from "../../../Common/Sprite/SpriteSheet";

import cookingSpr from '../Art/cooking_sheet.png'
import {Entity} from "../../../ECS/Entity";
import {Sprite} from "../../../Common/Sprite/Sprite";
import {Component} from "../../../ECS/Component";
import {System} from "../../../ECS/System";

const cookingSheet = new SpriteSheet(cookingSpr, 1, 1);


class Chef extends Entity
{
    onAdded(): void
    {
        super.onAdded();

        this.addComponent(new Sprite(cookingSheet.texture(0, 0, 96, 80)));
    }
}

class BumpMoveSystem extends System
{
    types = () => [BumpMove]

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity) => {
            entity.transform.position.x = (entity.transform.position.x + delta / 40) % 480;
        });
    }
}

class BumpMove extends Component
{
}

class ConveyorBump extends Entity
{
    onAdded(): void
    {
        super.onAdded();

        this.addComponent(new BumpMove());
        this.addComponent(new Sprite(cookingSheet.texture(0, 128, 2, 32)));
    }
}

class Conveyor extends Entity
{
    onAdded(): void
    {
        super.onAdded();
        this.addComponent(new Sprite(cookingSheet.texture(0, 96, 320, 32)));

        for (let i = 0; i < 20; i++)
        {
            this.addChild(new ConveyorBump("bump", i * 24 + 1));
        }
    }
}

export class LobsterMinigame extends Entity
{
    onAdded(): void
    {
        super.onAdded();

        this.addChild(new Chef("chef", 320 - 100));

        this.addChild(new Conveyor("conveyor", 0, 75));

        this.scene.addSystem(new BumpMoveSystem());
    }
}
