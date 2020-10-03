import {Game} from "../../ECS/Game";
import {Scene} from "../../ECS/Scene";
import {Entity} from "../../ECS/Entity";
import {CollisionMatrix} from "../../Collisions/CollisionMatrix";
import {Component, PIXIComponent} from "../../ECS/Component";
import {System} from "../../ECS/System";
import trainsheet from './Art/train1.png';
import tracksheet from './Art/track3.png';
import {SpriteSheet} from "../../Common/Sprite/SpriteSheet";
import * as PIXI from "pixi.js";
import {MathUtil} from "../../Common/Util";
import {Sprite} from "../../Common/Sprite/Sprite";

const collisionMatrix = new CollisionMatrix();

const trains = new SpriteSheet(trainsheet, 16, 32);
const track = new SpriteSheet(tracksheet, 3, 8);


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

interface Edge
{
    next(previous: Node): Node;
}

class Node
{
    edge: Edge = new Straight(this, this);

    constructor(readonly x: number, readonly y: number)
    {
    }
}

enum Layers
{
    TRACK,
    TRAIN
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

        this.addComponent(new Sprite(trains.texture(3, 0), {xAnchor: 0.5, yAnchor: 0.5}));
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
    makeStraightTrack(points: number[][]): Node[]
    {
        const nodes: Node[] = [];
        points.forEach(x => nodes.push(new Node(x[0] + this.transform.x, x[1] + this.transform.y)));

        let prevNode = null;

        for (const node of nodes)
        {
            if (prevNode !== null)
            {
                prevNode.edge = new Straight(prevNode, node);
            }
            prevNode = node;
        }

        return nodes;
    }

    onAdded(): void
    {
        super.onAdded();

        this.addComponent(new TrackRender());

        const points: number[][] = [];

        const radius = 100;

        for (let i = 0; i < 90; i += 1)
        {
            const gx = Math.sin(MathUtil.degToRad(i)) * radius;
            const gy = Math.cos(MathUtil.degToRad(i)) * radius;
            points.push([gx, gy]);
        }


        points.push([220, 0]);

        const nodes = this.makeStraightTrack(points);


        // FORK
        // branch 1
        const points1: number[][] = [];
        points1.push([240, -10]);
        points1.push([340, -10]);

        const nodes1 = this.makeStraightTrack(points1);


        // branch 2
        const points2: number[][] = [];
        points2.push([240, 50]);
        points2.push([340, 50]);

        const nodes2 = this.makeStraightTrack(points2);

        // link it
        nodes[nodes.length - 1].edge = new Junction(nodes[nodes.length - 1], [nodes1[0], nodes2[0]], 0);


        points1.reverse().push(points[points.length - 1]);
        points1.reverse();
        points2.reverse().push(points[points.length - 1]);
        points2.reverse();

        this.addComponent(new Rope(track.textureFromIndex(0), points));
        this.addComponent(new Rope(track.textureFromIndex(0), points1));
        this.addComponent(new Rope(track.textureFromIndex(0), points2));


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

            const movecomp = MathUtil.lengthDirXY(moveAmt, -targetDir);

            sprite.applyConfig({rotation: -targetDir + MathUtil.degToRad(90)});
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

        this.addEntity(new Train("train", 0, 0, Layers.TRAIN));
        this.addEntity(new Track("track", 250, 250, Layers.TRACK));

        this.addSystem(new TrainMover());
    }
}

export class LD47 extends Game
{
    constructor()
    {
        super({
                  width: 920,
                  height: 500,
                  resolution: 2,
                  backgroundColor: 0x263238
              });

        this.setScene(new TrainsScene(this));

        collisionMatrix.addCollision(Layers.TRAIN, Layers.TRAIN);
    }
}
