import * as PIXI from "pixi.js";
import {Scene} from "../ECS/Scene";
import {MathUtil} from "./Util";

/**
 * Camera class for interacting with the viewport.
 */
export class Camera
{
    angle = 0;
    readonly scene: Scene;
    readonly width: number;
    readonly height: number;
    readonly halfWidth: number;
    readonly halfHeight: number;

    /**
     * Parent scene for this camera.
     * @param scene The scene to register for this camera.
     */
    constructor(scene: Scene)
    {
        this.scene = scene;

        this.width = scene.game.renderer.screen.width;
        this.height = scene.game.renderer.screen.height;
        this.halfHeight = this.height / 2;
        this.halfWidth = this.width / 2;
    }

    /**
     * Translate a view position to a world position.
     * @param x The x position on the view.
     * @param y The y position on the view.
     * @returns The world position.
     */
    viewToWorld(x: number, y: number): PIXI.Point
    {
        const point = new PIXI.Point();
        this.scene.getGame().manager.mapPositionToPoint(point, x, y);

        point.x -= this.scene.sceneNode.transform.position.x;
        point.y -= this.scene.sceneNode.transform.position.y;

        return point;
    }

    /**
     * Position of the camera in the world.
     * @returns A Point for the position of the camera.
     */
    position(): PIXI.Point
    {
        return new PIXI.Point(-this.scene.sceneNode.transform.position.x, -this.scene.sceneNode.transform.position.y);
    }

    /**
     * Move the camera to a specific location.
     * @param x X point to move to.
     * @param y Y point to move to.
     * @param offsetX Offset X amount.
     * @param offsetY Offset Y amount.
     */
    move(x: number, y: number, offsetX = 0, offsetY = 0): void
    {
        // Move the scene the change amount
        this.scene.sceneNode.transform.position.x = -x + offsetX;
        this.scene.sceneNode.transform.position.y = -y + offsetY;
    }

    /**
     * Move the camera towards a specific location.
     * @param x X point to move to.
     * @param y Y point to move to.
     * @param lerpAmt The liner interpolation percentage to move.
     */
    moveTowards(x: number, y: number, lerpAmt = 0.5): void
    {
        const xdist = x + this.scene.sceneNode.transform.position.x;
        const ydist = y + this.scene.sceneNode.transform.position.y;

        this.translate(MathUtil.lerp(0, xdist, lerpAmt),
                       MathUtil.lerp(0, ydist, lerpAmt));
    }

    /**
     * Translate the camera position.
     * @param x X amount to move the camera.
     * @param y Y amount to move the camera.
     */
    translate(x: number, y: number): void
    {
        // Move the scene the change amount
        this.scene.sceneNode.transform.position.x -= x;
        this.scene.sceneNode.transform.position.y -= y;
    }

    /**
     * Rotate the viewport. The rotation will be applied from the top left corner.
     * @param angle Angle in degrees to set the rotation to.
     */
    rotate(angle: number): void
    {
        this.scene.sceneNode.transform.angle = angle;
        this.angle = angle;
    }

    /**
     * TODO Remove this if it doesn't work. I think i was trying to rotate around the centre point instead of top left.
     * @param angle
     */
    rotate2(angle: number): void
    {
        const rads = MathUtil.degToRad(angle);

        // Translate to top left corner (origin)
        const transX = -this.halfWidth;
        const transY = -this.halfWidth;

        // Rotate
        this.scene.sceneNode.transform.angle += angle;
        this.scene.sceneNode.transform.position.x += transX * Math.cos(rads) - transY * Math.sin(rads) + this.halfWidth;
        this.scene.sceneNode.transform.position.y += transX * Math.sin(rads) + transY * Math.cos(rads) + this.halfHeight;

        // Move it back.
        // this.scene.sceneNode.position.x += this.halfWidth;
        // this.scene.sceneNode.position.y += this.halfHeight;
    }

    /**
     * Rotate the viewport around a specific point.
     * @param angle The angle in degrees to set the rotation to.
     * @param offsetX The X offset from the top left corner.
     * @param offsetY The Y offset from the top left corner.
     */
    rotateAround(angle: number, offsetX = 0, offsetY = 0): void
    {
        // TODO this does not work if the camera moves at all.
        this.scene.sceneNode.transform.pivot.set(offsetX, offsetY);
        this.scene.sceneNode.transform.angle = angle;
        this.angle = this.scene.sceneNode.transform.angle;

        this.scene.sceneNode.transform.position.x = offsetX;
        this.scene.sceneNode.transform.position.y = offsetY;
    }
}
