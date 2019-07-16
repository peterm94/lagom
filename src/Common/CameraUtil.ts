import {System} from "../ECS/System";
import * as PIXI from "pixi.js";
import {LagomType} from "../ECS/LifecycleObject";
import {Component} from "../ECS/Component";
import {Entity} from "../ECS/Entity";

export class FollowMe extends Component
{
}

export class FollowCamera extends System
{
    private renderer!: PIXI.Renderer;

    private readonly anchorOffsetX: number;
    private readonly anchorOffsetY: number;
    private readonly lerpAmt: number;

    constructor(anchorOffsetX: number, anchorOffsetY: number, lerpAmt: number = 0.1)
    {
        super();
        this.anchorOffsetX = anchorOffsetX;
        this.anchorOffsetY = anchorOffsetY;
        this.lerpAmt = lerpAmt;
    }

    onAdded(): void
    {
        super.onAdded();

        this.renderer = this.getScene().getGame().renderer;
    }

    types(): LagomType<Component>[]
    {
        return [FollowMe];
    }

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity) => {

            // Hard follow
            // this.camera.move(entity.transform.x, entity.transform.y, 256, 256);

            // Soft follow
            this.getScene().camera.moveTowards(entity.transform.x, entity.transform.y, this.anchorOffsetX,
                                               this.anchorOffsetY, this.lerpAmt);
        });
    }
}