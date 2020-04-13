import {System} from "../ECS/System";
import {Entity} from "../ECS/Entity";
import {MathUtil} from "../Common/Util";
import {Rigidbody} from "../Collisions/Rigidbody";
import {Component} from "../ECS/Component";
import {LagomType} from "../ECS/LifecycleObject";

/**
 * Properties interface for SimplePhysics module.
 */
export interface SimplePhysicsProps
{
    /**
     * Angular velocity cap.
     */
    angCap?: number;

    /**
     * Linear velocity cap.
     */
    linCap?: number;

    /**
     * Angular drag.
     */
    angDrag?: number;

    /**
     * Linear drag.
     */
    linDrag?: number;
}

/**
 * Component type for the SimplePhysics system to run on.
 */
export class SimplePhysicsBody extends Component
{
    // Requested movement. This will be cleared on frame end.
    x = 0;
    y = 0;
    rotation = 0;

    // Movement inner properties. These are actual values, will persist between frames.
    xVel = 0;
    yVel = 0;
    angVel = 0;

    // Physics properties of the body
    angCap: number;
    linCap: number;
    angDrag: number;
    linDrag: number;

    /**
     * Move the body by the requested amount.
     * @param x Amount to move on the x axis.
     * @param y Amount to move on the y axis.
     */
    move(x = 0, y = 0): void
    {
        this.x += x;
        this.y += y;
    }

    /**
     * Rotate the body.
     * @param rotation Rotation in radians.
     */
    rotate(rotation: number): void
    {
        this.rotation += rotation;
    }

    /**
     * Clear the input state. Should only be called by the SimplePhysics system.
     */
    clearInput(): void
    {
        this.x = 0;
        this.y = 0;
        this.rotation = 0;
    }

    /**
     * Create a new SimplePhysicsBody.
     * @param props Optional physics property overrides.
     */
    constructor(readonly props: SimplePhysicsProps = {})
    {
        super();

        this.angCap = props.angCap === undefined ? 0.01 : props.angCap;
        this.linCap = props.linCap === undefined ? 3 : props.linCap;
        this.angDrag = props.angDrag === undefined ? 0.0002 : props.angDrag;
        this.linDrag = props.linDrag === undefined ? 0.0005 : props.linDrag;
    }
}

/**
 * Basic physics implementation. Has the concept of drag and velocity caps. No mass or momentum calculations are
 * taken into account yet, this can be simulated by tweaking drag and managing acceleration externally.
 */
export class SimplePhysics extends System
{
    types = (): LagomType<Component>[] => [Rigidbody, SimplePhysicsBody];

    update(delta: number): void
    {
        // Fixed system.
    }

    fixedUpdate(delta: number): void
    {
        this.runOnEntities((entity: Entity, body: Rigidbody, movement: SimplePhysicsBody) => {

            // apply drag to existing motion.
            movement.xVel -= movement.xVel * movement.linDrag * delta;
            movement.yVel -= movement.yVel * movement.linDrag * delta;
            movement.angVel -= movement.angVel * movement.angDrag * delta;

            // Apply movement, keeping within limits.
            if (movement.x)
            {
                movement.xVel = MathUtil.clamp(movement.xVel + (movement.x * delta),
                                               -movement.linCap, movement.linCap);
            }
            if (movement.y)
            {
                movement.yVel = MathUtil.clamp(movement.yVel + (movement.y * delta),
                                               -movement.linCap, movement.linCap);
            }
            if (movement.rotation)
            {
                movement.angVel = MathUtil.clamp(movement.angVel + (movement.rotation * delta),
                                                 -movement.angCap, movement.angCap);
            }

            // Reset the input state.
            movement.clearInput();

            // Apply the movement and rotation to the actual body for this frame.
            body.move(movement.xVel, movement.yVel);
            body.rotateRad(movement.angVel);
        });
    }
}
