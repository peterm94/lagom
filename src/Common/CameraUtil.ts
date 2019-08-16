import {System} from "../ECS/System";
import * as PIXI from "pixi.js";
import {LagomType} from "../ECS/LifecycleObject";
import {Component} from "../ECS/Component";
import {Entity} from "../ECS/Entity";
import {Camera} from "./Camera";

export class FollowMe extends Component
{
}

export interface CamOptions
{
    centre?: boolean;
    xOffset?: number;
    yOffset?: number;
    lerpSpeed?: number;
}

export class FollowCamera extends System
{
    private renderer!: PIXI.Renderer;
    private camera!: Camera;

    centre: boolean = true;
    xOffset: number = 0;
    yOffset: number = 0;
    lerpSpeed: number = 0.1;


    constructor(options: CamOptions | null = null)
    {
        super();

        if (options)
        {
            if (options.centre) this.centre = options.centre;
            if (options.xOffset) this.xOffset = options.xOffset;
            if (options.yOffset) this.yOffset = options.yOffset;
            if (options.lerpSpeed) this.lerpSpeed = options.lerpSpeed;
        }
    }

    onAdded(): void
    {
        super.onAdded();

        this.renderer = this.getScene().getGame().renderer;
        this.camera = this.getScene().camera;
    }

    types(): LagomType<Component>[]
    {
        return [FollowMe];
    }

    update(delta: number): void
    {
        this.runOnEntitiesWithSystem((system: FollowCamera, entity: Entity) => {

            let targetX = entity.transform.x + this.xOffset;
            let targetY = entity.transform.y + this.yOffset;

            // Calculate camera midpoint
            if (system.centre)
            {
                targetX -= system.camera.halfWidth;
                targetY -= system.camera.halfHeight;
            }

            // Soft follow
            system.camera.moveTowards(targetX, targetY, 0, 0,
                                      system.lerpSpeed * delta);
        });
    }
}