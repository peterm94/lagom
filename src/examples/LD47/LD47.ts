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
import {Log, MathUtil} from "../../Common/Util";
import {Sprite} from "../../Common/Sprite/Sprite";
import {RenderRect, TextDisp} from "../../Common/PIXIComponents";
import {CollisionSystem, DiscreteCollisionSystem} from "../../Collisions/CollisionSystems";
import {CircleCollider, RectCollider} from "../../Collisions/Colliders";
import {GlobalSystem} from "../../ECS/GlobalSystem";
import {LagomType} from "../../ECS/LifecycleObject";
import {Timer, TimerSystem} from "../../Common/Timer";

const Mouse = require('pixi.js-mouse');

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
    TRAIN,
    BUTTON,
    MOUSE_COLL
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

class MouseColl extends Entity
{
    onAdded(): void
    {
        super.onAdded();

        const sys = this.getScene().getGlobalSystem<CollisionSystem>(CollisionSystem);
        if (sys !== null)
        {
            this.addComponent(new CircleCollider(sys, {layer: Layers.MOUSE_COLL, radius: 5}));
        }
        this.addComponent(new Timer(60, null, false)).onTrigger.register(caller => {
            caller.getEntity().destroy();
        });
    }
}

class MouseEventSystem extends GlobalSystem
{
    types(): LagomType<Component>[]
    {
        return [];
    }

    update(delta: number): void
    {
        if (Mouse.isButtonPressed(0))
        {
            const where = this.scene.camera.viewToWorld(Mouse.getPosX(), Mouse.getPosY());
            this.getScene().addEntity(new MouseColl("mouse", where.x, where.y));
        }
    }
}

class SwitchJunction extends Component
{
}

class JunctionHolder extends Component
{
    constructor(readonly junction: Junction)
    {
        super();
    }
}

class JunctionSwitcher extends System
{
    types(): LagomType<Component>[]
    {
        return [JunctionHolder, SwitchJunction, TextDisp];
    }

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, junctionHolder: JunctionHolder, switchJunc: SwitchJunction,
                            txt: TextDisp) => {
            junctionHolder.junction.currActive = junctionHolder.junction.currActive === 1 ? 0 : 1;
            txt.pixiObj.text = junctionHolder.junction.currActive.toString();
            switchJunc.destroy();
        });
    }
}

class JunctionButton extends Entity
{
    constructor(readonly junction: Junction)
    {
        super("junction", -1000, -1000);
    }

    onAdded(): void
    {
        super.onAdded();
        if (this.parent !== null)
        {
            this.transform.x = this.junction.controlEdge.x - this.parent.transform.x;
            this.transform.y = this.junction.controlEdge.y - this.parent.transform.y;
        }
        this.addComponent(new JunctionHolder(this.junction));
        this.addComponent(new RenderRect(0, 0, 50, 50, 0x0));
        this.addComponent(new TextDisp(0, 0, "0", new PIXI.TextStyle({fill: 0xFFFFFF})));
        const sys = this.getScene().getGlobalSystem<CollisionSystem>(CollisionSystem);
        if (sys !== null)
        {
            const coll = this.addComponent(new RectCollider(sys, {width: 50, height: 50, layer: Layers.BUTTON}));
            coll.onTriggerEnter.register(caller => {
                caller.getEntity().addComponent(new SwitchJunction());
                Log.info("switching");
            });
        }
    }
}

class Train extends Entity
{
    private carriages: Entity[] = [];

    constructor(x: number, y: number, readonly carriage: number = 0, readonly front: boolean)
    {
        super("train", x, y, Layers.TRAIN);
    }

    onAdded(): void
    {
        super.onAdded();

        if (this.carriage !== 0)
        {
            this.carriages.push(this.scene.addEntity(new Train(this.transform.x - 35,
                                                               this.transform.y, this.carriage - 1, false)));
        }
        this.addComponent(new Sprite(trains.texture(3, this.front ? 0 : 1), {xAnchor: 0.5, yAnchor: 0.5}));
    }
}


// TODO move this to core
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
    private makeStraightTrack(points: number[][]): Node[]
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

        this.addChild(new JunctionButton(nodes[nodes.length - 1].edge as Junction));

        points1.reverse().push(points[points.length - 1]);
        points1.reverse();
        points2.reverse().push(points[points.length - 1]);
        points2.reverse();

        this.addComponent(new Rope(track.textureFromIndex(0), points));
        this.addComponent(new Rope(track.textureFromIndex(0), points1));
        this.addComponent(new Rope(track.textureFromIndex(0), points2));


        this.getScene().entities.filter(x => x.name === "train")
            .forEach(x => x.addComponent(new Destination(nodes[0], nodes[0].edge)));
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

        this.addGlobalSystem(new DiscreteCollisionSystem(collisionMatrix));
        this.addGlobalSystem(new MouseEventSystem());
        this.addGlobalSystem(new TimerSystem());

        this.addSystem(new JunctionSwitcher());

        this.addEntity(new Train(150, 350, 4, true));
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
        collisionMatrix.addCollision(Layers.MOUSE_COLL, Layers.BUTTON);
    }
}
