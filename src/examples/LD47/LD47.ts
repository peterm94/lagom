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
import {MathUtil, MultiMap} from "../../Common/Util";
import {Sprite} from "../../Common/Sprite/Sprite";

const collisionMatrix = new CollisionMatrix();

const trains = new SpriteSheet(trainsheet, 16, 32);
const track = new SpriteSheet(tracksheet, 3, 8);


class Node
{
    constructor(readonly graph: DiGraph, readonly x: number, readonly y: number)
    {
    }

    next(): Node
    {
        return this.graph.edges.get(this)[1];
    }
}

class DiGraph
{
    readonly nodes: Node[] = [];
    readonly edges: MultiMap<Node, Node> = new MultiMap<Node, Node>();


    addNode(node: Node): void
    {
        this.nodes.push(node);
    };

    addConnectedNode(node: Node, incoming: Node[], outgoing: Node[]): void
    {
        this.addNode(node);

        for (const inc of incoming)
        {
            this.addConnection(inc, node);
        }

        for (const out of outgoing)
        {
            this.addConnection(node, out);
        }
    }

    addConnection(node: Node, dest: Node): void
    {
        this.edges.put(node, dest);
    }
}

enum Layers
{
    TRAIN,
    TRACK
}

class Destination extends Component
{
    constructor(public node: Node)
    {
        super();
    }

    next(): void
    {
        this.node = this.node.next();
    }
}

class Train extends Entity
{

    onAdded(): void
    {
        super.onAdded();

        this.addComponent(new Sprite(trains.texture(3, 0)));
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
        const graph = new DiGraph();

        const radius = 100;
        let prevNode: Node | undefined;

        for (let i = 0; i < 360; i += 10)
        {
            const gx = Math.sin(MathUtil.degToRad(i)) * radius;
            const gy = Math.cos(MathUtil.degToRad(i)) * radius;
            points.push([gx, gy]);

            const node = new Node(graph, gx + /*radius*/ +this.transform.x, gy + /*radius*/ +this.transform.y);

            if (prevNode !== undefined)
            {
                graph.addConnectedNode(node, [prevNode], [prevNode]);
            }

            prevNode = node;
        }

        graph.addConnection(prevNode as Node, graph.nodes[0]);
        graph.addConnection(graph.nodes[0], prevNode as Node);

        this.addComponent(new Rope(track.textureFromIndex(0), points));

        this.getScene().getEntityWithName("train")?.addComponent(new Destination(graph.nodes[0]));
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
                  width: 920,
                  height: 500,
                  resolution: 2,
                  backgroundColor: 0x263238
              });

        this.setScene(new TrainsScene(this));

        collisionMatrix.addCollision(Layers.TRAIN, Layers.TRAIN);
    }
}
