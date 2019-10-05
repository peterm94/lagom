import {Component} from "../../ECS/Component";
import {Entity} from "../../ECS/Entity";
import {Hex} from "./Hexagons/Hex";
import {hexToWorld} from "./Hexagons/HexUtil";
import {System} from "../../ECS/System";
import {LagomType} from "../../ECS/LifecycleObject";
import {DetectRigidbody} from "../../DetectCollisions/DetectRigidbody";
import {MathUtil} from "../../Common/Util";
import {FollowCamera} from "../../Common/CameraUtil";
import {Game} from "../../ECS/Game";
import {Key} from "../../Input/Key";


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

export class PlayerMover extends System
{
    readonly moveSpeed = 0.2;
    readonly rotSpeed = 0.002;

    types(): LagomType<Component>[]
    {
        return [DetectRigidbody, PlayerControlled];
    }

    update(delta: number): void
    {
        this.runOnEntitiesWithSystem((system: FollowCamera, entity: Entity, body: DetectRigidbody) => {

            if (Game.keyboard.isKeyDown(Key.ArrowLeft, Key.KeyA))
            {
                body.move(-this.moveSpeed * delta, 0);
            }
            if (Game.keyboard.isKeyDown(Key.ArrowRight, Key.KeyD))
            {
                body.move(this.moveSpeed * delta, 0);
            }
            if (Game.keyboard.isKeyDown(Key.ArrowUp, Key.KeyW))
            {
                body.move(0, -this.moveSpeed * delta);
            }
            if (Game.keyboard.isKeyDown(Key.ArrowDown, Key.KeyS))
            {
                body.move(0, this.moveSpeed * delta);
            }

            // TODO this will break collisions?? something needs to update the body position
            if (Game.keyboard.isKeyDown(Key.KeyQ))
            {
                entity.transform.rotation -= this.rotSpeed * delta;
                // body.move(0, this.moveSpeed * delta);
            }
            if (Game.keyboard.isKeyDown(Key.KeyE))
            {
                entity.transform.rotation += this.rotSpeed * delta;
                // body.move(0, this.moveSpeed * delta);
            }
        });
    }
}