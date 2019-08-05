import {Component} from "../ECS/Component";

export class DetectActive extends Component
{
    // Next frame movement
    pendingX = 0;
    pendingY = 0;

    dxLastFrame = 0;
    dyLastFrame = 0;

    move(x: number, y: number)
    {
        this.pendingX += x;
        this.pendingY += y;
    }
}