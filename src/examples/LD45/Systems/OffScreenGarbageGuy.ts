import {System} from "../../../ECS/System";
import {Entity} from "../../../ECS/Entity";
import {MathUtil} from "../../../Common/Util";
import {Component} from "../../../ECS/Component";

export class OffScreenGarbageGuy extends System
{
    types = () => [Garbage];

    update(delta: number): void
    {
        const camera = this.getScene().camera;
        const cameraPos = camera.position();
        this.runOnEntities((entity: Entity) => {

            if (MathUtil.pointDistance(cameraPos.x + camera.halfWidth, cameraPos.y + camera.halfHeight,
                                       entity.transform.x, entity.transform.y) > 5000)
            {
                entity.destroy();
            }
        });
    }
}

export class Garbage extends Component
{
}