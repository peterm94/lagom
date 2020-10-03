import {Game} from "../../ECS/Game";
import {Scene} from "../../ECS/Scene";
import {Entity} from "../../ECS/Entity";
import {CollisionMatrix} from "../../Collisions/CollisionMatrix";
import {Component, PIXIComponent} from "../../ECS/Component";
import {System} from "../../ECS/System";
import spritesheet from './Art/spritesheet.png';
import tracksheet from './Art/track.png';
import {SpriteSheet} from "../../Common/Sprite/SpriteSheet";
import * as PIXI from "pixi.js";
import {MathUtil} from "../../Common/Util";
import {Sprite} from "../../Common/Sprite/Sprite";

const collisionMatrix = new CollisionMatrix();

const sprites = new SpriteSheet(spritesheet, 16, 16);
const track = new SpriteSheet(tracksheet, 16, 16);


interface Edge
{
    next(previous: Node): Node;
}

class Node
{
    edge!: Edge;

    constructor(readonly x: number, readonly y: number)
    {
    }
}

class Straight implements Edge
{
    constructor(readonly n1: Node, readonly n2: Node)
    {
    }

    next(previous: Node): Node
    {
        if (this.n1 === previous)
        {
            return this.n2;
        }
        return this.n1;
    }
}

class Junction implements Edge
{
    constructor(readonly controlEdge: Node, readonly switchEdge: Node[], public currActive = 0)
    {
    }

    next(previous: Node): Node
    {
        if (previous === this.controlEdge)
        {
            return this.switchEdge[this.currActive];
        }
        else
        {
            return this.controlEdge;
        }
    }
}

enum Layers
{
    TRAIN,
    TRACK
}

class Destination extends Component
{
    constructor(public node: Node, public edge: Edge)
    {
        super();
    }

    next(): void
    {
        this.node = this.edge.next(this.node);
        this.edge = this.node.edge;
    }
}

class Train extends Entity
{

    onAdded(): void
    {
        super.onAdded();

        this.addComponent(new Sprite(sprites.texture(1, 0, 32, 16)));
    }
}


class TrackRender extends Component
{
}


class Rope extends PIXIComponent<PIXI.SimpleRope>
{
    constructor(texture: PIXI.Texture, points: number[][])
    {
        super(new PIXI.SimpleRope(texture, Rope.convertPoints(points), 1));
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

        const points = [];
        const nodes = [];

        const radius = 100;

        for (let i = 0; i < 360; i += 1)
        {
            const gx = Math.sin(MathUtil.degToRad(i)) * radius;
            const gy = Math.cos(MathUtil.degToRad(i)) * radius;
            points.push([gx, gy]);
            nodes.push(new Node(gx + this.transform.x, gy + this.transform.y));
        }

        let prevNode = nodes[nodes.length - 1];
        for (const node of nodes)
        {
            node.edge = new Straight(prevNode, node);
            prevNode = node;
        }

        this.addComponent(new Rope(track.textureFromIndex(0), points));

        this.getScene().getEntityWithName("train")?.addComponent(new Destination(nodes[0], nodes[0].edge));
    }
}


class TrainMover extends System
{
    readonly speed = 1;

    types = () => [Destination, Sprite];

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, destination: Destination, sprite: Sprite) => {

            const targetDir = MathUtil.pointDirection(entity.transform.x, entity.transform.y,
                                                      destination.node.x, destination.node.y);
            const targetDistance = MathUtil.pointDistance(entity.transform.x, entity.transform.y,
                                                          destination.node.x, destination.node.y);

            const moveAmt = 100 * (delta / 1000);

            // close enough
            if (moveAmt > targetDistance)
            {
                destination.next();
            }

            const movecomp = MathUtil.lengthDirXY(100 * (delta / 1000), -targetDir);

            sprite.applyConfig({rotation: -targetDir});
            entity.transform.x += movecomp.x;
            entity.transform.y += movecomp.y;
        });
    }
}

class TrainsScene extends Scene
{
    onAdded(): void
    {
        super.onAdded();

        this.addEntity(new Train("train", 0, 0));
        this.addEntity(new Track("track", 250, 250));

        this.addSystem(new TrainMover());
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
                  backgroundColor: 0x90d1c7
              });

        this.setScene(new TrainsScene(this));

        collisionMatrix.addCollision(Layers.TRAIN, Layers.TRAIN);
    }
}
