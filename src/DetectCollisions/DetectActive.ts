import {Component} from "../ECS/Component";

export class DetectActive extends Component
{
    // Next frame movement
    pendingX = 0;
    pendingY = 0;

    dxLastFrame = 0;
    dyLastFrame = 0;

    velocityX = 0;
    velocityY = 0;

    mass = 1;

    forceX = 0;
    forceY = 0;

    move(x: number, y: number)
    {
        this.pendingX += x;
        this.pendingY += y;
    }

    stop()
    {
        this.pendingX = 0;
        this.pendingY = 0;
    }

    addForce(x: number, y: number)
    {
        // F = ma -> a = F/m
        this.forceX += x;
        this.forceY += y;
    }

    setImpulse(x: number, y: number)
    {
        this.velocityX = x;
        this.velocityY = y;
    }

    applyForce(delta: number)
    {
        // Linear acceleration
        const accX = this.forceX / this.mass;
        const accY = this.forceY / this.mass;

        this.velocityX += accX * delta;
        this.velocityY += accY * delta;

        // Apply movement
        this.pendingX += this.velocityX * delta;
        this.pendingY += this.velocityY * delta;

        // Reset applied force
        this.forceX = 0;
        this.forceY = 0;
    }
}