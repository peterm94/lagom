import {Game} from "../../ECS/Game";
import {Scene} from "../../ECS/Scene";
import {Entity} from "../../ECS/Entity";
import {CollisionMatrix} from "../../Collisions/CollisionMatrix";
import {RenderRect} from "../../Common/PIXIComponents";
import {Component, PIXIComponent} from "../../ECS/Component";
import {System} from "../../ECS/System";
import trackSheet from './Art/track.png';
import {SpriteSheet} from "../../Common/Sprite/SpriteSheet";
import * as PIXI from "pixi.js";
import {MathUtil} from "../../Common/Util";

const collisionMatrix = new CollisionMatrix();

const sprites = new SpriteSheet(trackSheet, 8, 8);

enum Layers
{
    TRAIN,
    TRACK
}

class Train extends Entity
{

    onAdded(): void
    {
        super.onAdded();

        this.addComponent(new RenderRect(0, 0, 10, 10));
    }
}

class Node extends Component
{
    constructor(readonly x: number, readonly y: number)
    {
        super();
    }
}

class TrackRender extends Component
{
}


class Rope extends PIXIComponent<PIXI.SimpleRope>
{
    constructor(texture: PIXI.Texture, points: number[][])
    {
        super(new PIXI.SimpleRope(texture, Rope.convertPoints(points)));
    }

    private static convertPoints(points: number[][]): PIXI.Point[]
    {
        const pixiPoints = [];
        for (const point of points)
        {
            pixiPoints.push(new PIXI.Point(point[0], point[1]));
        }

        return pixiPoints;
    }
}

class Track extends Entity
{
    onAdded(): void
    {
        super.onAdded();

        this.addComponent(new TrackRender());
        this.addComponent(new Node(10, 10));
        this.addComponent(new Node(20, 50));
        this.addComponent(new Node(50, 80));
        this.addComponent(new Node(30, 50));

        const points = [];

        const radius = 100;
        for (let i = 0; i < 360; i += 10)
        {
            const x = Math.sin(MathUtil.degToRad(i)) * radius;
            const y = Math.cos(MathUtil.degToRad(i)) * radius;
            points.push([x, y]);
        }

        this.addComponent(new Rope(sprites.textureFromIndex(0), points));
    }
}


class TrackRenderSystem extends System
{
    types = () => [TrackRender];

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity) => {

            const nodes = entity.getComponentsOfType<Node>(Node);

        });
    }
}

class TrainsScene extends Scene
{
    onAdded(): void
    {
        super.onAdded();

        this.addEntity(new Train("train", 10, 10));
        this.addEntity(new Track("track", 300, 300));
    }
}

export class LD47 extends Game
{
    constructor()
    {
        super({
                  width: 1280,
                  height: 720,
                  resolution: 1,
                  backgroundColor: 0x200140
              });

        this.setScene(new TrainsScene(this));

        collisionMatrix.addCollision(Layers.TRAIN, Layers.TRAIN);
    }
}
