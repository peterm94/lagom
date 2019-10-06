import {Component} from "../../ECS/Component";
import {Entity} from "../../ECS/Entity";
import {Hex} from "./Hexagons/Hex";
import {hexToWorld} from "./Hexagons/HexUtil";
import {System} from "../../ECS/System";
import {LagomType} from "../../ECS/LifecycleObject";
import {DetectRigidbody} from "../../DetectCollisions/DetectRigidbody";
import {Log, MathUtil} from "../../Common/Util";
import {FollowCamera} from "../../Common/CameraUtil";
import {Game} from "../../ECS/Game";
import {Key} from "../../Input/Key";
import {Button} from "../../Input/Button";
import {Vector} from "../../LagomPhysics/Physics";


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
}

export class Mover extends System
{
    types = () => [DetectRigidbody, Movement];

    update(delta: number)
    {
        this.runOnEntities((entity: Entity, body: DetectRigidbody, movement: Movement) => {
            body.move(movement.x, movement.y);
            entity.transform.rotation += movement.rotation;
        })
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
        this.runOnEntitiesWithSystem((system: FollowCamera, entity: Entity, movement: Movement) => {

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
                // body.move(0, this.moveSpeed * delta);
            }
            if (Game.keyboard.isKeyDown(Key.KeyE))
            {
                movement.rotate(this.rotSpeed * delta);
                // body.move(0, this.moveSpeed * delta);
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