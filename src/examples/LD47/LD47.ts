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
import {MathUtil, Util} from "../../Common/Util";
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
import {FrameTriggerSystem} from "../../Common/FrameTrigger";
import {AnimatedSpriteController} from "../../Common/Sprite/AnimatedSpriteController";

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
            if (trainId !== this.trainId) return;

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

class SwapSprite extends Component
{
}

class SpriteSwapper extends System
{
    types(): LagomType<Component>[]
    {
        return [AnimatedSpriteController, SwapSprite];
    }

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, sprite: AnimatedSpriteController, swapTrigger: SwapSprite) => {
            swapTrigger.destroy();
            sprite.setAnimation((sprite.currentState + 1) % 2);
        });
    }
}

class JunctionSwitcher extends System
{
    types(): LagomType<Component>[]
    {
        return [JunctionHolder, SwitchJunction];
    }

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, junctionHolder: JunctionHolder, switchJunc: SwitchJunction) => {
            junctionHolder.graph.switchJunction(junctionHolder.junction);
            entity.findChildWithName("indicator0")?.addComponent(new SwapSprite());
            entity.findChildWithName("indicator1")?.addComponent(new SwapSprite());
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

export class JunctionButton extends Entity
{
    constructor(readonly trackGraph: TrackGraph, readonly junction: Node,
                readonly xOffset = 0, readonly yOffset = 0,
                readonly j0pos: { x: number; y: number; rot: number },
                readonly j1pos: { x: number; y: number; rot: number })
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
        this.addComponent(new RenderRect(0, 0, 50, 50, null, 0x0));
        // this.addComponent(new TextDisp(0, 0, "0", new PIXI.TextStyle({fill: 0xFFFFFF})));
        this.addComponent(new JunctionHolder(this.trackGraph, this.junction));

        // TODO pass position + rotation info through
        const onTexture = () => trains.textureFromPoints(4 * 16, 2 * 16, 16, 16);
        const offTexture = () => trains.textureFromPoints(4 * 16, 0, 16, 16);
        const p1 = this.addChild(new Entity("indicator0", this.j0pos.x, this.j0pos.y));
        p1.transform.rotation = this.j0pos.rot;
        p1.addComponent(new AnimatedSpriteController(0, [{textures: [onTexture()], id: 0, config: {}},
            {textures: [offTexture()], id: 1, config: {}}]));
        const p2 = this.addChild(new Entity("indicator1", this.j1pos.x, this.j1pos.y));
        p2.addComponent(new AnimatedSpriteController(1, [{textures: [onTexture()], id: 0, config: {}},
            {textures: [offTexture()], id: 1, config: {}}]));
        p2.transform.rotation = this.j1pos.rot;


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
    trackGraph = new TrackGraph();
    allPoints: number[][] = [];

    onAdded(): void
    {
        super.onAdded();

        const trackBuilder = new TrackBuilder(track, this);

        // Bottom circle half
        const blNodes = trackBuilder.addXBezier([0, 0], [100, 100], false);
        const bottomJunction = Util.last(blNodes);

        const brNodes = trackBuilder.addYBezier([100, 100], [200, 0]);
        const middleJunction = Util.last(brNodes);

        // Top circle half
        const trNodes = trackBuilder.addXBezier([200, 0], [100, -100]);
        const tlNodes = trackBuilder.addYBezier([100, -100], [0, 0]);

        // Link the circle up
        trackBuilder.getTrackGraph().connect(blNodes[0], Util.last(tlNodes));

        // Top circle junction
        const cubic = trackBuilder.addBezier(false,
                                             [100, -100],
                                             [300, -200],
                                             [175, -100],
                                             [150, -200]);

        trackBuilder.addJunction(tlNodes[0], Util.last(trNodes), cubic[0]);

        const topJunctionEntrance = trackBuilder.addLine([300, -200], [500, -200]);
        const farRightJunctionRight = trackBuilder.addYBezier([500, -200], [600, -100]);
        const farRightJunctionEntrance = trackBuilder.addLine([600, -100], [600, 100]);
        trackBuilder.addXBezier([600, 100], [500, 200]);
        const bottomRightJunctionEntrance = trackBuilder.addLine([500, 200], [400, 200]);
        const bottomRightJunctionLeft = trackBuilder.addLine([400, 200], [-150, 200]);
        trackBuilder.addYBezier([-150, 200], [-200, 150]);
        trackBuilder.addLine([-200, 150], [-200, -50]);
        trackBuilder.addXBezier([-200, -50], [-125, -100]);

        trackBuilder.addBezier(true,
                               [-125, -100],
                               [75, -200],
                               [-50, -100],
                               [-75, -200]);

        const outerLoopTopLeftStraight = trackBuilder.addLine([75, -200], [300, -200]);
        trackBuilder.addJunction(topJunctionEntrance[0], Util.last(outerLoopTopLeftStraight), Util.last(cubic));

        // Right-hand loop
        const farRightJunctionLeft = trackBuilder.addXBezier([600, -100], [500, -150], false);
        trackBuilder.addJunction(farRightJunctionEntrance[0], farRightJunctionLeft[0], Util.last(farRightJunctionRight));

        trackBuilder.addLine([500, -150], [400, -150]);
        trackBuilder.addYBezier([400, -150], [300, -100]);
        trackBuilder.addLine([300, -100], [300, 100]);
        const bottomRightJunctionRight = trackBuilder.addXBezier([300, 100], [400, 200]);

        trackBuilder.addJunction(Util.last(bottomRightJunctionEntrance),
                                 bottomRightJunctionLeft[0],
                                 Util.last(bottomRightJunctionRight));

        // Middle right fork
        const rightFork = trackBuilder.addXBezier([200, 0], [300, -50], false);

        trackBuilder.addJunction(middleJunction, rightFork[0], trNodes[0]);

        trackBuilder.addYBezier([300, -50], [400, 0]);
        trackBuilder.addLine([400, 0], [400, 50]);
        trackBuilder.addXBezier([400, 50], [300, 100]);
        const rightForkReentry = trackBuilder.addLine([300, 100], [100, 100]);

        // Re-connect the middle-right fork at the bottom with a junction.
        trackBuilder.addJunction(bottomJunction, brNodes[0], Util.last(rightForkReentry));

        this.trackGraph = trackBuilder.getTrackGraph();
        this.allPoints = trackBuilder.getAllPoints();

        // this.allPoints.forEach(x => this.addComponent(new RenderCircle(x[0], x[1], 5, null, 0x00FF00)));

        this.getScene().entities.filter(x => x.name === "train")
            .forEach(x => x.addComponent(new Destination(this.trackGraph, blNodes[1], blNodes[0])));
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
    readonly speed = 3;

    types = () => [Destination];

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, destination: Destination) => {

            let actualMovement = 0;

            // Target movement distance for this frame.
            const moveAmt = this.speed * 100 * (delta / 1000);

            // We want to accurately follow the path
            while (actualMovement < moveAmt)
            {
                const targetDir = MathUtil.pointDirection(entity.transform.x, entity.transform.y,
                                                          destination.node.x, destination.node.y);
                const targetDistance = MathUtil.pointDistance(entity.transform.x, entity.transform.y,
                                                              destination.node.x, destination.node.y);

                let toMove = moveAmt - actualMovement;

                // We will move too far, cap it so we can move accurately in another loop
                if (toMove > targetDistance)
                {
                    toMove = targetDistance;
                    destination.next();
                }

                const movecomp = MathUtil.lengthDirXY(toMove, -targetDir);

                entity.transform.x += movecomp.x;
                entity.transform.y += movecomp.y;
                entity.transform.rotation = -targetDir + MathUtil.degToRad(90);
                actualMovement += toMove;
            }
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
        this.addGlobalSystem(new FrameTriggerSystem());

        this.addSystem(new JunctionSwitcher());

        this.addEntity(new Train(150, 350, 0, 4, true));
        this.addEntity(new Track("track", 250, 250, Layers.TRACK));
        this.addSystem(new TrainMover());
        this.addSystem(new ScoreUpdater());
        this.addSystem(new SpriteSwapper());

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
