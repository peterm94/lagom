import {Component} from "../ECS/Component";
import {DetectCollider} from "./DetectColliders";

enum CollisionMode
{
    Discrete,
    Continuous
}

export class Rigidbody extends Component
{
    colliders: DetectCollider[] = [];

    pendingX = 0;
    pendingY = 0;

    constructor(readonly isStatic: boolean = false, readonly collisionMode: CollisionMode= CollisionMode.Discrete)
    {
        super();
    }

    move(x: number, y: number): void
    {
        this.pendingX += x;
        this.pendingY += y;
    }

    // TODO rotate?
}

export class DetectRigidbody extends Component
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

    constructor(readonly isStatic: boolean = false)
    {
        super();
    }

    move(x: number, y: number): void
    {
        this.pendingX += x;
        this.pendingY += y;
    }

    stop(): void
    {
        this.pendingX = 0;
        this.pendingY = 0;
    }

    addForce(x: number, y: number): void
    {
        // F = ma -> a = F/m
        this.forceX += x;
        this.forceY += y;
    }

    setImpulse(x: number, y: number): void
    {
        this.velocityX = x;
        this.velocityY = y;
    }

    applyForce(delta: number): void
    {
        // Linear acceleration
        const accX = this.forceX / this.mass;
        const accY = this.forceY / this.mass;

        // TODO there is a double delta multiplication here, problems?
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
