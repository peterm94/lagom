import {Component} from "../../ECS/Component";
import {Entity} from "../../ECS/Entity";
import {Hex} from "./Hexagons/Hex";
import {hexToWorld} from "./Hexagons/HexUtil";
import {System} from "../../ECS/System";
import {LagomType} from "../../ECS/LifecycleObject";
import {DetectRigidbody} from "../../DetectCollisions/DetectRigidbody";
import {MathUtil} from "../../Common/Util";
import {Game} from "../../ECS/Game";
import {Key} from "../../Input/Key";
import {Button} from "../../Input/Button";
import {Vector} from "../../LagomPhysics/Physics";
import {TextDisp} from "../../Common/PIXIComponents";

export class PlayerControlled extends Component
{
}

export class MoveMe extends Component
{
    len: number;
    angle: number;

    constructor(public owner: Entity, public hex: Hex)
    {
        super();

        const offVec = hexToWorld(hex);
        const xOff = offVec.x;
        const yOff = offVec.y;
        this.len = Math.sqrt(xOff * xOff + yOff * yOff);
        this.angle = Math.atan2(yOff, xOff);
    }
}

export class MoveWithPlayer extends System
{
    types(): LagomType<Component>[]
    {
        return [MoveMe, DetectRigidbody];
    }

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, moveMe: MoveMe, body: DetectRigidbody) => {
            entity.transform.rotation = moveMe.owner.transform.rotation;

            body.pendingX =
                -entity.transform.x + MathUtil.lengthDirX(moveMe.len, moveMe.owner.transform.rotation + moveMe.angle) +
                moveMe.owner.transform.x;
            body.pendingY =
                -entity.transform.y + MathUtil.lengthDirY(moveMe.len, moveMe.owner.transform.rotation + moveMe.angle) +
                moveMe.owner.transform.y;

        });
    }
}

export class Movement extends Component
{
    x = 0;
    y = 0;
    rotation = 0;
    aimX = 0;
    aimY = 0;
    shooting = false;

    move(x: number = 0, y: number = 0,)
    {
        this.x += x;
        this.y += y;
    }

    isMoving = () => this.x !== 0 || this.y !== 0;

    rotate(rotation: number)
    {
        this.rotation += rotation;
    }

    isRotating = () => this.rotation !== 0;

    clear()
    {
        this.x = 0;
        this.y = 0;
        this.rotation = 0;
        this.shooting = false;
    }

    setAim(point: PIXI.Point)
    {
        this.aimX = point.x;
        this.aimY = point.y;
    }

    constructor(readonly angSpeed: number = 0.00001, readonly angCap: number = 0.01,
                readonly linSpeed: number = 0.001, readonly linCap: number = 3)
    {
        super();
    }

    xVel = 0;
    yVel = 0;
    angVel = 0;
    readonly angDrag = 0.0002;
    readonly linDrag = 0.0005;
}

export class Mover extends System
{
    types = () => [DetectRigidbody, Movement];

    update(delta: number)
    {
        this.runOnEntities((entity: Entity, body: DetectRigidbody, movement: Movement, txt: TextDisp) => {

            // apply drag to existing motion
            movement.xVel -= movement.xVel * movement.linDrag * delta;
            movement.yVel -= movement.yVel * movement.linDrag * delta;
            movement.angVel -= movement.angVel * movement.angDrag * delta;

            const mov = new Vector(Math.sign(movement.x), Math.sign(movement.y));
            mov.normalize();
            const angMov = Math.sign(movement.rotation);

            if (mov.x)
            {
                movement.xVel = MathUtil.clamp(movement.xVel + (mov.x * movement.linSpeed * delta),
                                               -movement.linCap, movement.linCap);
            }
            if (mov.y)
            {
                movement.yVel = MathUtil.clamp(movement.yVel + (mov.y * movement.linSpeed * delta),
                                               -movement.linCap, movement.linCap);
            }

            if (angMov)
            {
                movement.angVel = MathUtil.clamp(movement.angVel + (angMov * movement.angSpeed * delta),
                                                 -movement.angCap, movement.angCap);
            }

            body.move(movement.xVel, movement.yVel);
            entity.transform.rotation += movement.angVel;
        });
    }
}

export class ClearMovement extends System
{
    types = () => [Movement];

    update(delta: number)
    {
        this.runOnEntities((entity: Entity, movement: Movement) => {
            movement.clear();
        })
    }
}

export class PlayerControls extends System
{
    readonly moveSpeed = 0.1;
    readonly rotSpeed = 0.001;

    types = () => [Movement, PlayerControlled];

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, movement: Movement) => {

            let moveVec = new Vector(0, 0);


            if (Game.keyboard.isKeyDown(Key.ArrowLeft, Key.KeyA))
            {
                moveVec.x -= 1;
            }
            if (Game.keyboard.isKeyDown(Key.ArrowRight, Key.KeyD))
            {
                moveVec.x += 1;
            }
            if (Game.keyboard.isKeyDown(Key.ArrowUp, Key.KeyW))
            {
                moveVec.y -= 1;
            }
            if (Game.keyboard.isKeyDown(Key.ArrowDown, Key.KeyS))
            {
                moveVec.y += 1;
            }

            moveVec.normalize();
            moveVec.multiply(delta * this.moveSpeed);
            movement.move(moveVec.x, moveVec.y);


            // TODO this will break collisions?? something needs to update the body position
            if (Game.keyboard.isKeyDown(Key.KeyQ))
            {
                movement.rotate(-this.rotSpeed * delta);
            }
            if (Game.keyboard.isKeyDown(Key.KeyE))
            {
                movement.rotate(this.rotSpeed * delta);
            }

            // Mouse aim
            movement.setAim(this.getScene().camera.viewToWorld(Game.mouse.getPosX(), Game.mouse.getPosY()));

            // Mouse shoot
            movement.shooting = Game.mouse.isButtonDown(Button.LEFT);
        });
    }
}

export class ConstantMotion extends Component
{
    constructor(readonly directionRad: number, readonly speed = 0.7)
    {
        super();
    }
}


export class ConstantMotionMover extends System
{
    types = () => [ConstantMotion, DetectRigidbody];

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, motion: ConstantMotion, body: DetectRigidbody) => {

            const xComp = MathUtil.lengthDirX(motion.speed * delta, motion.directionRad);
            const yComp = MathUtil.lengthDirY(motion.speed * delta, motion.directionRad);

            body.move(xComp, yComp);
        });
    }
}