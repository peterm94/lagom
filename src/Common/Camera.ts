import * as PIXI from "pixi.js";
import {Scene} from "../ECS/Scene";
import {MathUtil} from "./Util";

/**
 * Camera class for interacting with the viewport.
 */
export class Camera
{
    angle: number = 0;
    readonly scene: Scene;
    readonly width: number;
    readonly height: number;
    readonly halfWidth: number;
    readonly halfHeight: number;

    /**
     * Parent scene for this camera.
     * @param scene
     */
    constructor(scene: Scene)
    {
        this.scene = scene;

        this.width = scene.getGame().renderer.screen.width;
        this.height = scene.getGame().renderer.screen.height;
        this.halfHeight = this.height / 2;
        this.halfWidth = this.width / 2;
    }

    /**
     * Position of the camera in the world.
     * @returns A Point for the position of the camera.
     */
    position(): PIXI.Point
    {
        return new PIXI.Point(-this.scene.sceneNode.position.x, -this.scene.sceneNode.position.y);
    }

    /**
     * Move the camera to a specific location.
     * @param x X point to move to.
     * @param y Y point to move to.
     * @param offsetX Offset X amount.
     * @param offsetY Offset Y amount.
     */
    move(x: number, y: number, offsetX: number = 0, offsetY: number = 0)
    {
        // Move the scene the change amount
        this.scene.sceneNode.position.x = -x + offsetX;
        this.scene.sceneNode.position.y = -y + offsetY;
    }

    /**
     * Move the camera towards a specific location.
     * @param x X point to move to.
     * @param y Y point to move to.
     * @param offsetX Offset X amount.
     * @param offsetY Offset Y amount.
     * @param lerpAmt The liner interpolation percentage to move.
     */
    moveTowards(x: number, y: number, offsetX: number = 0, offsetY: number = 0, lerpAmt: number = 0.5)
    {
        const xdist = x + this.scene.sceneNode.position.x - offsetX;
        const ydist = y + this.scene.sceneNode.position.y - offsetY;

        this.translate(MathUtil.lerp(0, xdist, lerpAmt),
                       MathUtil.lerp(0, ydist, lerpAmt));
    }

    /**
     * Translate the camera position.
     * @param x X amount to move the camera.
     * @param y Y amount to move the camera.
     */
    translate(x: number, y: number)
    {
        // Move the scene the change amount
        this.scene.sceneNode.position.x -= x;
        this.scene.sceneNode.position.y -= y;
    }

    /**
     * Rotate the viewport. The rotation will be applied from the top left corner.
     * @param angle Angle in degrees to set the rotation to.
     */
    rotate(angle: number)
    {
        this.scene.sceneNode.angle = angle;
        this.angle = angle;
    }

    /**
     * Rotate the viewport around a specific point.
     * @param angle The angle in degrees to set the rotation to.
     * @param offsetX The X offset from the top left corner.
     * @param offsetY The Y offset from the top left corner.
     */
    rotateAround(angle: number, offsetX: number = 0, offsetY: number = 0)
    {
        // TODO this does not work if the camera moves at all.
        this.scene.sceneNode.pivot.set(offsetX, offsetY);
        this.scene.sceneNode.angle = angle;
        this.angle = this.scene.sceneNode.angle;

        this.scene.sceneNode.position.x = offsetX;
        this.scene.sceneNode.position.y = offsetY;
    }
}