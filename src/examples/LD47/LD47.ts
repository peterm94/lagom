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


class DiGraph
{
    readonly nodes: Node[] = [];
    readonly edges: [Node, Node] = [];

    addNode(node: Node) {

    };
}

enum Layers
{
    TRAIN,
    TRACK
}

class Destination extends Component
{
    constructor(readonly x: number, readonly y: number)
    {
        super();
    }
}

class Train extends Entity
{

    onAdded(): void
    {
        super.onAdded();

        this.addComponent(new Sprite(sprites.texture(1, 0, 32, 16)));
        this.addComponent(new Destination(300, 300));
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

        const radius = 100;
        for (let i = 0; i < 360; i += 10)
        {
            const x = Math.sin(MathUtil.degToRad(i)) * radius;
            const y = Math.cos(MathUtil.degToRad(i)) * radius;
            points.push([x, y]);
        }

        this.addComponent(new Rope(track.textureFromIndex(0), points));
    }
}


class TrainMover extends System
{
    readonly speed = 1;

    types = () => [Destination];

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, destination: Destination) => {

            const targetDir = MathUtil.pointDirection(entity.transform.x, entity.transform.y,
                                                      destination.x, destination.y);
            const movecomp = MathUtil.lengthDirXY(100 * (delta / 1000), -targetDir);

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

        this.addEntity(new Train("train", 10, 10));
        this.addEntity(new Track("track", 300, 300));

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
