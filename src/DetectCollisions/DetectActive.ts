import {Component} from "../ECS/Component";

export class DetectActive extends Component
{
    pendingX = 0;
    pendingY = 0;

    dxLastFrame = 0;
    dyLastFrame = 0;

    lastPendingX = 0;
    lastPendingY = 0;

    lastX: number = 0;
    lastY: number = 0;

    move(x: number, y: number)
    {
        this.pendingX += x;
        this.pendingY += y;
    }
}