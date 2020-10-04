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
import {RenderRect, TextDisp} from "../../Common/PIXIComponents";
import {CollisionSystem, DiscreteCollisionSystem} from "../../Collisions/CollisionSystems";
import {CircleCollider, RectCollider} from "../../Collisions/Colliders";
import {GlobalSystem} from "../../ECS/GlobalSystem";
import {LagomType} from "../../ECS/LifecycleObject";
import {Timer, TimerSystem} from "../../Common/Timer";
import {TrackBuilder} from "./TrackBuilder";
import {Diagnostics} from "../../Common/Debug";
import {Node, TrackGraph} from "./TrackGraph";

const Mouse = require('pixi.js-mouse');

const collisionMatrix = new CollisionMatrix();

const trains = new SpriteSheet(trainsheet, 16, 32);
const track = new SpriteSheet(tracksheet, 3, 8);

enum Layers
{
    BUTTON,
    TRACK,
    TRAIN,
    GOAL,
    MOUSE_COLL
}


class AddScore extends Component
{
}

class Goal extends Entity
{
    constructor(x: number, y: number, readonly trainId: number)
    {
        super("goal", x, y);
    }

    onAdded(): void
    {
        super.onAdded();

        // TODO real sprite, pick colour based on trainId
        this.addComponent(new Sprite(trains.texture(0, 0, 16, 16), {xAnchor: 0.5, yAnchor: 0.5}));

        const sys = this.getScene().getGlobalSystem<CollisionSystem>(CollisionSystem);
        if (sys === null) return;

        const coll = this.addComponent(new CircleCollider(sys, {layer: Layers.GOAL, radius: 8, xOff: 8, yOff: 8}));

        coll.onTriggerEnter.register((caller, data) => {
            if (data.other.layer !== Layers.TRAIN) return;

            // check that the train is the right one
            const trainId = (data.other.parent as Train).trainId;
            if (trainId != this.trainId) return;

            // TODO add a point to something
            caller.getScene().getEntityWithName("manager")?.addComponent(new AddScore());

            const track = caller.getScene().getEntityWithName<Track>("track");

            if (track !== null)
            {
                track.spawnGoal(trainId);
            }

            // destroy this goal
            caller.getEntity().destroy();
        });
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
    constructor(readonly graph: TrackGraph, readonly junction: Node)
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
            const curr = junctionHolder.graph.switchJunction(junctionHolder.junction);
            txt.pixiObj.text = curr.toString();
            switchJunc.destroy();
        });
    }
}

class Score extends Component
{
    constructor(public score: number)
    {
        super();
    }
}

class GameManager extends Entity
{
    constructor()
    {
        super("manager", 100, 100);
    }

    onAdded(): void
    {
        super.onAdded();

        this.addComponent(new Score(0));
        this.addComponent(new TextDisp(0, 0, "", new PIXI.TextStyle({fontSize: 24, fill: "white"})));
    }
}


class DenySwitch extends Component
{
}

class JunctionButton extends Entity
{
    constructor(readonly trackGraph: TrackGraph, readonly junction: Node)
    {
        super("junction", -1000, -1000, Layers.BUTTON);
    }

    onAdded(): void
    {
        super.onAdded();
        if (this.parent !== null)
        {
            this.transform.x = this.junction.x - this.parent.transform.x - 25;
            this.transform.y = this.junction.y - this.parent.transform.y - 25;
        }
        // this.addComponent(new JunctionHolder(this.junction));
        this.addComponent(new RenderRect(0, 0, 50, 50, 0x0));
        this.addComponent(new TextDisp(0, 0, "0", new PIXI.TextStyle({fill: 0xFFFFFF})));
        this.addComponent(new JunctionHolder(this.trackGraph, this.junction));
        const sys = this.getScene().getGlobalSystem<CollisionSystem>(CollisionSystem);
        if (sys !== null)
        {
            const coll = this.addComponent(new RectCollider(sys, {width: 50, height: 50, layer: Layers.BUTTON}));
            coll.onTriggerEnter.register((caller, data) => {
                if (data.other.layer === Layers.MOUSE_COLL &&
                    caller.getEntity().getComponent<DenySwitch>(DenySwitch) === null)
                {
                    caller.getEntity().addComponent(new SwitchJunction());
                }
                else if (data.other.layer === Layers.TRAIN)
                {
                    caller.getEntity().addComponent(new DenySwitch());
                }
            });
            coll.onTriggerExit.register((caller, other) => {
                if (other.layer === Layers.TRAIN)
                {
                    caller.getEntity().getComponent<DenySwitch>(DenySwitch)?.destroy();
                }
            });
        }
    }
}

class Train extends Entity
{
    constructor(x: number, y: number, readonly trainId: number, readonly carriage: number = 0, readonly front: boolean)
    {
        super("train", x, y, Layers.TRAIN);
    }

    onAdded(): void
    {
        super.onAdded();

        if (this.carriage !== 0)
        {
            this.scene.addEntity(new Train(this.transform.x - 35,
                                           this.transform.y, this.trainId, this.carriage - 1,
                                           false));
        }
        this.addComponent(new Sprite(trains.texture(this.trainId, this.front ? 0 : 1), {xAnchor: 0.5, yAnchor: 0.5}));
        const sys = this.getScene().getGlobalSystem<CollisionSystem>(CollisionSystem);

        if (sys !== null)
        {
            this.addComponent(new RectCollider(sys, {
                layer: Layers.TRAIN, width: 16, height: 32,
                xOff: -8, yOff: -16
            }));
        }
    }
}


// TODO move this to core
export class Rope extends PIXIComponent<PIXI.SimpleRope>
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

class Destination extends Component
{
    constructor(readonly graph: TrackGraph, public node: Node, public  previous: Node)
    {
        super();
    }

    next(): Node
    {
        const nextNode = this.graph.next(this.previous, this.node);
        this.previous = this.node;
        this.node = nextNode;
        return nextNode;
    }
}

export class Track extends Entity
{
    readonly trackGraph = new TrackGraph();
    allPoints: number[][] = [];

    onAdded(): void
    {
        super.onAdded();

        const trackBuilder = new TrackBuilder(track, this);

        // circle half
        const points: number[][] = [];
        points.push(...trackBuilder.addXBezier([0, 0], [100, 100]));
        points.push(...trackBuilder.addYBezier([100, 100], [200, 0]));
        // this.addComponent(new Rope(track.textureFromIndex(0), points));
        points.pop();

        // other circle half
        const points2: number[][] = [];
        points2.push(...trackBuilder.addXBezier([200, 0], [100, -100]));
        points2.push(...trackBuilder.addYBezier([100, -100], [0, 0]));
        // this.addComponent(new Rope(track.textureFromIndex(0), points2));
        points2.pop();

        const nodes = points.map(x => new Node(x[0] + this.transform.x, x[1] + this.transform.y));
        const nodes2 = points2.map(x => new Node(x[0] + this.transform.x, x[1] + this.transform.y));
        this.trackGraph.addSequence(nodes);
        this.trackGraph.addSequence(nodes2);

        // connect circle at both joins
        this.trackGraph.connect(nodes[0], nodes2[nodes2.length - 1]);
        this.trackGraph.connect(nodes2[0], nodes[nodes.length - 1]);


        // FORK
        // branch 1
        const points1: number[][] = [];
        points1.push(...trackBuilder.addXBezier([200, 0], [300, -50]));
        points1.push(...trackBuilder.addYBezier([300, -50], [400, 0]));
        points1.push(...trackBuilder.addLine([400, 0], [400, 50]));
        points1.push(...trackBuilder.addXBezier([400, 50], [300, 100]));
        points1.push(...trackBuilder.addLine([300, 100], [100, 100]));
        // points1.push([100, 100]);

        // this.addComponent(new Rope(track.textureFromIndex(0), points1));

        points1.pop();
        points1.reverse();
        points1.pop();
        points1.reverse();

        const nodes1 = points1.map(x => new Node(x[0] + this.transform.x, x[1] + this.transform.y));

        // points.forEach(x => this.addComponent(new RenderCircle(x[0], x[1], 5, null, 0x00FF00)));
        // points1.forEach(x => this.addComponent(new RenderCircle(x[0], x[1], 4, null, 0xFF0000)));
        // points2.forEach(x => this.addComponent(new RenderCircle(x[0], x[1], 3, null, 0x0000FF)));

        this.trackGraph.addSequence(nodes1);

        // junction connect to the circle
        this.trackGraph.createJunction(nodes[nodes.length - 1], [nodes1[0], nodes2[0]]);

        // junction in to the bottom of the circle
        this.trackGraph.createJunction(nodes[25], [nodes[11], nodes1[nodes1.length - 1]]);

        this.addChild(new JunctionButton(this.trackGraph, nodes[nodes.length - 1]));
        this.addChild(new JunctionButton(this.trackGraph, nodes[25]));

        this.allPoints = this.allPoints.concat(points).concat(points1).concat(points2);
        this.getScene().entities.filter(x => x.name === "train")
            .forEach(x => x.addComponent(new Destination(this.trackGraph, nodes[1], nodes[0])));
        this.spawnGoal(0);
    }

    spawnGoal(trainId: number): void
    {
        const point = this.allPoints[MathUtil.randomRange(0, this.allPoints.length)];
        this.addChild(new Goal(point[0], point[1], trainId));
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

            entity.transform.x += movecomp.x;
            entity.transform.y += movecomp.y;
            entity.transform.rotation = -targetDir + MathUtil.degToRad(90);
        });
    }
}

class ScoreUpdater extends System
{
    types(): LagomType<Component>[]
    {
        return [Score, TextDisp];
    }

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, score: Score, text: TextDisp) => {
            text.pixiObj.text = score.score.toString();
        });
    }

}

class Scorer extends GlobalSystem
{
    types(): LagomType<Component>[]
    {
        return [Score, AddScore];
    }

    update(delta: number): void
    {
        this.runOnComponents((score: Score[], addScores: AddScore[]) => {
            const masterScore = score[0];
            for (const addScore of addScores)
            {
                masterScore.score++;
                addScore.destroy();
            }
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
        this.addGlobalSystem(new Scorer());

        this.addSystem(new JunctionSwitcher());

        this.addEntity(new Train(150, 350, 0, 4, true));
        this.addEntity(new Track("track", 250, 250, Layers.TRACK));
        this.addSystem(new TrainMover());
        this.addSystem(new ScoreUpdater());

        this.addGUIEntity(new GameManager());
        this.addEntity(new Diagnostics("white"));
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
        collisionMatrix.addCollision(Layers.TRAIN, Layers.BUTTON);
        collisionMatrix.addCollision(Layers.TRAIN, Layers.GOAL);
    }
}
