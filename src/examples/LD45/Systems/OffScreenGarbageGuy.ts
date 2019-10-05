import {System} from "../../../ECS/System";
import {Entity} from "../../../ECS/Entity";
import {MathUtil} from "../../../Common/Util";

export class OffScreenGarbageGuy extends System
{
    types = () => [];

    update(delta: number): void
    {
        const camera = this.getScene().camera.position();
        this.runOnEntities((entity: Entity) => {
            if (MathUtil.pointDistance(camera.x, camera.y, entity.transform.x, entity.transform.y) > 10000)
            {
                entity.destroy();
            }
        });
    }
}