import {Game} from "../../ECS/Game";
import {Scene} from "../../ECS/Scene";
import {Entity} from "../../ECS/Entity";
import {CollisionMatrix} from "../../Collisions/CollisionMatrix";
import {Component, PIXIComponent} from "../../ECS/Component";
import {System} from "../../ECS/System";
import trainsheet from './Art/train1.png';
import tracksheet from './Art/track3.png';
import titleScreen from './Art/startScreen.png';
import gameoverScreen from './Art/gameOver2.png';
import {SpriteSheet} from "../../Common/Sprite/SpriteSheet";
import * as PIXI from "pixi.js";
import {Log, LogLevel, MathUtil, Util} from "../../Common/Util";
import {Sprite} from "../../Common/Sprite/Sprite";
import {PIXIGraphicsComponent, TextDisp} from "../../Common/PIXIComponents";
import {CollisionSystem, DebugCollisionSystem, DiscreteCollisionSystem} from "../../Collisions/CollisionSystems";
import {CircleCollider, Collider, RectCollider} from "../../Collisions/Colliders";
import {GlobalSystem} from "../../ECS/GlobalSystem";
import {LagomType} from "../../ECS/LifecycleObject";
import {Timer, TimerSystem} from "../../Common/Timer";
import {TrackBuilder} from "./TrackBuilder";
import {Node, Straight, TrackGraph} from "./TrackGraph";
import {FrameTriggerSystem} from "../../Common/FrameTrigger";
import {AnimatedSpriteController} from "../../Common/Sprite/AnimatedSpriteController";
import {ScreenShake, ScreenShaker} from "../../Common/Screenshake";
import {AudioAtlas} from "../../Audio/AudioAtlas";
import {SoundManager} from "./SoundManager";

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
    MOUSE_COLL,
    END_SCREEN,
    SCORE_DISP,
    JUNCTION
}


class AddScore extends Component
{
    constructor(readonly trainId: number, readonly posX: number, readonly posY: number)
    {
        super();
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


class Goal extends Entity
{
    constructor(x: number, y: number, readonly trainId: number)
    {
        super("goal", x, y, Layers.GOAL);
    }

    onAdded(): void
    {
        super.onAdded();

        this.addComponent(new Sprite(trains.texture(this.trainId, 1),
                                     {xAnchor: 0.5, yAnchor: 0.5, rotation: MathUtil.degToRad(90)}));

        const sys = this.getScene().getGlobalSystem<CollisionSystem>(CollisionSystem);
        if (sys === null) return;

        const coll = this.addComponent(new CircleCollider(sys, {layer: Layers.GOAL, radius: 4}));

        coll.onTriggerEnter.register((caller, data) => {
            if (data.other.layer !== Layers.TRAIN) return;

            // check that the train is the right one
            const train = (data.other.parent as Train);
            const trainId = train.trainId;
            if (trainId !== this.trainId) return;

            const manager = caller.getScene().getEntityWithName("manager") as GameManager;
            if (manager === null) return;
            manager.addComponent(new AddScore(trainId, caller.parent.transform.x, caller.parent.transform.y));
            manager.spawnGoal(trainId);

            train.addCarriage(1);

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


class MoveFade extends Component
{
    alpha = 1;
}

class PointDisp extends Entity
{
    constructor(x: number, y: number, readonly score: number)
    {
        super("pointdisp", x, y, Layers.SCORE_DISP);
    }

    onAdded(): void
    {
        super.onAdded();

        this.addComponent(new TextDisp(0, 0, "+" + this.score.toString(), new PIXI.TextStyle({fill: "white"})));
        this.addComponent(new MoveFade());
    }
}

class PointMover extends System
{
    types = () => [MoveFade, TextDisp];

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, moveFade: MoveFade, text: TextDisp) => {
            entity.transform.y -= delta / 1000 * 20;

            text.pixiObj.alpha = moveFade.alpha;

            moveFade.alpha -= delta / 1000;
            if (moveFade.alpha < 0) entity.destroy();
        });
    }
}

class Score extends Component
{
    carriageCounts: number[] = [];
    score = 0;

    constructor(trainCount: number)
    {
        super();

        for (let i = 0; i < trainCount; i++)
        {
            this.carriageCounts.push(0);
        }
    }
}

class DenySwitch extends Component
{
}

class NicerRenderRect extends PIXIGraphicsComponent
{
    /**
     * Create a new rectangle.
     *
     * @param xOff Positional X offset.
     * @param yOff Positional Y offset.
     * @param width Width of the rectangle.
     * @param height Height of the rectangle.
     * @param fillColour The inner fill colour. Null for transparent.
     * @param lineStyle Custom line styling.
     */
    constructor(xOff: number,
                yOff: number,
                width: number,
                height: number,
                fillColour: number | null = PIXIGraphicsComponent.defaultFill,
                lineStyle: { width: number; color: number; alpha: number })
    {
        super(fillColour, lineStyle.color);
        this.pixiObj.lineStyle(lineStyle.width, lineStyle.color, lineStyle.alpha);
        this.pixiObj.drawRect(xOff, yOff, width, height);
    }
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
            this.transform.x = this.junction.x - this.parent.transform.x - 25 + this.xOffset;
            this.transform.y = this.junction.y - this.parent.transform.y - 25 + this.yOffset;
        }
        // this.addComponent(new NicerRenderRect(-25, -25, 100, 100, null, {color: 0x0, width: 2, alpha: 0.1}));
        // this.addComponent(new RenderCircle(25, 25, 10));
        this.addComponent(new JunctionHolder(this.trackGraph, this.junction));

        const onTexture = () => trains.textureFromPoints(4 * 16, 2 * 16, 16, 16);
        const offTexture = () => trains.textureFromPoints(4 * 16, 0, 16, 16);
        const p1 = this.addChild(new Entity("indicator0", this.j0pos.x, this.j0pos.y));
        p1.transform.angle = this.j0pos.rot;
        p1.addComponent(new AnimatedSpriteController(0, [{textures: [onTexture()], id: 0, config: {}},
            {textures: [offTexture()], id: 1, config: {}}]));
        const p2 = this.addChild(new Entity("indicator1", this.j1pos.x, this.j1pos.y));
        p2.addComponent(new AnimatedSpriteController(1, [{textures: [onTexture()], id: 0, config: {}},
            {textures: [offTexture()], id: 1, config: {}}]));
        p2.transform.angle = this.j1pos.rot;


        const sys = this.getScene().getGlobalSystem<CollisionSystem>(CollisionSystem);
        if (sys !== null)
        {
            const buttonColl = this.addComponent(
                new RectCollider(sys, {xOff: -25, yOff: -25, width: 100, height: 100, layer: Layers.BUTTON}));
            const junctionColl = this.addComponent(
                new CircleCollider(sys, {xOff: 25, yOff: 25, radius: 10, layer: Layers.JUNCTION}));

            buttonColl.onTriggerEnter.register((caller, data) => {
                if (data.other.layer === Layers.MOUSE_COLL &&
                    caller.getEntity().getComponent<DenySwitch>(DenySwitch) === null)
                {
                    caller.getEntity().addComponent(new SwitchJunction());
                    (this.scene.getEntityWithName("audio") as SoundManager)?.playSound("switch");
                }
            });

            junctionColl.onTriggerEnter.register((caller, data) => {
                if (data.other.layer === Layers.TRAIN)
                {
                    caller.getEntity().addComponent(new DenySwitch());
                }
            });
            junctionColl.onTriggerExit.register((caller, other) => {
                if (other.layer === Layers.TRAIN)
                {
                    caller.getEntity().getComponent<DenySwitch>(DenySwitch)?.destroy();
                }
            });
        }
    }
}

class Ragdoll extends Component
{
    readonly drag = 0.4;
    readonly angDrag = 0.31;
    readonly dir = MathUtil.degToRad(MathUtil.randomRange(0, 360));
    velocity = MathUtil.randomRange(1, 5) / 3;
    angVelocity = MathUtil.randomRange(1, 5) / 100 * Util.choose(-1, 1);
}

class RagdollSystem extends System
{
    types = () => [Ragdoll];

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, props: Ragdoll) => {
            // dampen for this frame
            props.velocity -= props.velocity * props.drag * (delta / 1000);
            props.angVelocity -= props.angVelocity * props.angDrag * (delta / 1000);

            const move = MathUtil.lengthDirXY(props.velocity, props.dir);

            entity.transform.x += move.x;
            entity.transform.y += move.y;
            entity.transform.rotation += props.angVelocity;
        });
    }
}

class ClickAction extends Component
{
    constructor(readonly action: number)
    {
        super();
    }

    onAction()
    {
        switch (this.action)
        {
            // start game
            case 0:
            {
                this.getScene().addGUIEntity(new GameManager());
                (this.getScene().getEntityWithName("audio") as SoundManager)?.playSound("horn");
                this.getEntity().destroy();
                break;
            }
            // restart
            case 1:
            {
                this.getScene().entities.forEach(x => x.destroy());
                this.getScene().systems.forEach(x => x.destroy());
                this.getScene().globalSystems.forEach(x => x.destroy());
                this.getScene().getGame().setScene(new TrainsScene(this.getScene().getGame()));
                break;
            }
        }
    }
}


class ClickListener extends GlobalSystem
{
    types(): LagomType<Component>[]
    {
        return [ClickAction];
    }

    update(delta: number): void
    {
        this.runOnComponents((clickActions: ClickAction[]) => {

            if (Mouse.isButtonPressed(0))
            {
                for (const action of clickActions)
                {
                    action.onAction();
                    action.destroy();
                }
            }
        });
    }
}

class ScreenCard extends Entity
{
    constructor(readonly texture: PIXI.Texture, readonly clickAction: number, layer: number = 0)
    {
        super("card", -4, 0, layer);
    }

    onAdded(): void
    {
        super.onAdded();

        this.addComponent(new Sprite(this.texture));

        // Game reload. Skip to gameplay.
        if (!TrainsScene.firstLoad && this.clickAction === 0)
        {
            const action = this.addComponent(new ClickAction(this.clickAction));
            action.onAction();
        }
        else
        {
            TrainsScene.firstLoad = false;

            this.addComponent(new Timer(500, null)).onTrigger.register(() => {
                this.addComponent(new ClickAction(this.clickAction));
            });
        }
    }
}

class Train extends Entity
{
    nextTrain: Train | null = null;

    constructor(x: number, y: number, readonly trainId: number, readonly carriage: number = 0, readonly front: boolean)
    {
        super("train", x, y, Layers.TRAIN);
    }

    getNextTrain(): Train
    {
        return this.nextTrain === null ? this : this.nextTrain.getNextTrain();
    }

    addCarriage(carriage = 0): void
    {
        const end = this.getNextTrain();

        let trainX = end.transform.x;
        let trainY = end.transform.y;
        let trainRot = 0;

        // Need to position it correctly and set up the movement. This is kinda hard. We can do what TrainMover
        // does.. but backwards. Will always be on the track, be always perfect.
        const myDest = end.getComponent<Destination>(Destination);
        if (myDest === null) return;

        // We want to go backwards!
        const dest = new Destination(myDest.graph, myDest.previous, myDest.node);

        // Train spacing
        const moveAmt = 35;
        let actualMovement = 0;

        while (actualMovement < moveAmt)
        {
            const targetDir = MathUtil.pointDirection(trainX, trainY, dest.node.x, dest.node.y);
            const targetDist = MathUtil.pointDistance(trainX, trainY, dest.node.x, dest.node.y);
            let toMove = moveAmt - actualMovement;
            if (toMove > targetDist)
            {
                toMove = targetDist;
                dest.next();
            }

            const moveComp = MathUtil.lengthDirXY(toMove, -targetDir);
            trainX += moveComp.x;
            trainY += moveComp.y;
            trainRot = -targetDir + MathUtil.degToRad(90);
            actualMovement += toMove;
        }

        // Now that it is positioned, reverse the current dest and add it.
        end.nextTrain = this.scene.addEntity(new Train(trainX, trainY, end.trainId, carriage - 1, false));
        end.nextTrain.addComponent(new Destination(myDest.graph, dest.previous, dest.node));
        end.nextTrain.transform.rotation = trainRot;

        (this.scene.getEntityWithName("audio") as SoundManager)?.playSound("clickclack");

    }

    onAdded(): void
    {
        super.onAdded();

        if (this.carriage !== 0)
        {
            this.addCarriage(this.carriage);
        }

        this.addComponent(new Sprite(trains.texture(this.trainId, this.front ? 0 : 1), {xAnchor: 0.5, yAnchor: 0.5}));
        const sys = this.getScene().getGlobalSystem<CollisionSystem>(CollisionSystem);

        if (sys === null) return;

        const coll = this.addComponent(new RectCollider(sys, {
            layer: Layers.TRAIN, width: 10, height: 24, xOff: -5, yOff: -12
        }));

        coll.onTriggerEnter.register((caller, data) => {
            // GAME OVER BUDDY
            if (data.other.layer === Layers.TRAIN)
            {
                caller.getEntity().addComponent(new ScreenShake(1, 1500));

                // ragtrain time
                const allTrains = caller.getScene().entities.filter(x => x.name === "train");
                for (const train of allTrains)
                {
                    // We aren't going anywhere sensible any more
                    train.getComponent<Destination>(Destination)?.destroy();
                    train.getComponent<Collider>(Collider)?.destroy();
                    train.addComponent(new Ragdoll());
                }

                (this.scene.getEntityWithName("audio") as SoundManager)?.playSound("crash");

                caller.getEntity().addComponent(new Timer(4000, null)).onTrigger.register(() => {
                    caller.getScene()
                          .addEntity(new ScreenCard(PIXI.Texture.from(gameoverScreen), 1, Layers.END_SCREEN));
                });
            }
        });
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

        trackBuilder.addJunction(tlNodes[0], cubic[0], Util.last(trNodes),
                                 20, 0,
                                 {x: 33, y: -1, rot: 60},
                                 {x: 40, y: 32, rot: 100});

        const topJunctionEntrance = trackBuilder.addLine([300, -200], [400, -200]);
        const trJunctionLeft = trackBuilder.addLine([400, -200], [500, -200]);
        trackBuilder.addYBezier([500, -200], [600, -100]);
        const topRightJunctionEntrance = trackBuilder.addLine([600, -100], [600, 0]);
        const bottomFarRightJunctionEntrance = trackBuilder.addLine([600, 0], [600, 100]);
        trackBuilder.addXBezier([600, 100], [500, 200]);
        const bottomJunctionEntrance = trackBuilder.addLine([500, 200], [400, 200]);
        const bottomJunctionMid = trackBuilder.addLine([400, 200], [200, 200]);
        const bottomJunctionStraightLeft = trackBuilder.addLine([200, 200], [-150, 200]);
        trackBuilder.addYBezier([-150, 200], [-200, 150]);
        trackBuilder.addLine([-200, 150], [-200, -50]);
        trackBuilder.addXBezier([-200, -50], [-125, -100]);

        trackBuilder.addBezier(true,
                               [-125, -100],
                               [75, -200],
                               [-50, -100],
                               [-75, -200]);

        const outerLoopTopLeftStraight = trackBuilder.addLine([75, -200], [300, -200]);

        trackBuilder.addJunction(topJunctionEntrance[0], Util.last(outerLoopTopLeftStraight), Util.last(cubic),
                                 -20, 0,
                                 {x: 0, y: 20, rot: -90},
                                 {x: 2, y: 48.5, rot: -100});


        const bottomJunctionTop = trackBuilder.addXBezier([300, 100], [400, 0], false);
        trackBuilder.addYBezier([400, 0], [500, -100]);
        const trJunctionRight = trackBuilder.addXBezier([500, -100], [400, -200]);

        trackBuilder.addJunction(Util.last(topJunctionEntrance), trJunctionLeft[0], Util.last(trJunctionRight),
                                 0, 0,
                                 {x: 50, y: 4, rot: 90},
                                 {x: 51, y: 32, rot: 100});

        // const bottomJunctionTop = trackBuilder.addLine([300, 0], [300, 100]);
        const bottomJunctionRight = trackBuilder.addXBezier([300, 100], [400, 200], false);

        trackBuilder.addJunction(Util.last(bottomJunctionEntrance),
                                 Util.last(bottomJunctionRight),
                                 bottomJunctionMid[0],
                                 0, 0,
                                 {x: -1, y: 17, rot: -80},
                                 {x: 0, y: 46, rot: -90});

        const bottomJunctionLeft = trackBuilder.addXBezier([300, 100], [200, 200], false);

        trackBuilder.addJunction(bottomJunctionTop[0], bottomJunctionLeft[0], bottomJunctionRight[0],
                                 0, 0,
                                 {x: 17, y: 50, rot: 190},
                                 {x: 48, y: 47.5, rot: 170});

        trackBuilder.addJunction(bottomJunctionStraightLeft[0], Util.last(bottomJunctionLeft),
                                 Util.last(bottomJunctionMid),
                                 20, 0,
                                 {x: 49, y: 0, rot: 80},
                                 {x: 51, y: 30, rot: 90});

        // Middle right fork
        const rightFork = trackBuilder.addXBezier([200, 0], [300, -50], false);
        trackBuilder.addJunction(middleJunction, trNodes[0], rightFork[0],
                                 0, 0,
                                 {x: 1, y: 6, rot: -10},
                                 {x: 36, y: 2, rot: 25});

        trackBuilder.addLine([300, -50], [500, -50]);

        const bottomFarRightJunctionLeft = trackBuilder.addYBezier([500, -50], [600, 0]);

        trackBuilder.addJunction(bottomFarRightJunctionEntrance[0],
                                 Util.last(bottomFarRightJunctionLeft),
                                 Util.last(topRightJunctionEntrance),
                                 0, 0,
                                 {x: -1, y: 10, rot: -30},
                                 {x: 31, y: 5, rot: 0});


        // trackBuilder.addBezier(true,
        //                        [300, -50],
        //                        [600, -50],
        //                        [400, -50],
        //                        [500, -50]
        //                        );
        // trackBuilder.addYBezier([300, -50], [400, 0]);
        // trackBuilder.addLine([400, 0], [400, 50]);
        // trackBuilder.addXBezier([400, 50], [300, 100]);
        // const rightForkReentry = trackBuilder.addLine([100, 100], [500, 100], false);
        //
        // // Re-connect the middle-right fork at the bottom with a junction.
        // trackBuilder.addJunction(bottomJunction, brNodes[0], rightForkReentry[0]);

        // const bottomFarRightJunctionRight = trackBuilder.addYBezier([500, 100], [600, 0]);

        // trackBuilder.addJunction(Util.last(farRightJunctionEntrance), Util.last(bottomFarRightJunctionRight),
        // bottomFarRightJunctionLeft[0]);


        // trackBuilder.addLine(500)

        this.trackGraph = trackBuilder.getTrackGraph();
        this.allPoints = trackBuilder.getAllPoints();

        // this.allPoints.forEach(x => this.addComponent(new RenderCircle(x[0], x[1], 5, null, 0x00FF00)));
    }
}


class TrainMover extends System
{
    readonly speed = 2;

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
            text.pixiObj.text = "Score: " + score.score.toString();
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
        this.runOnComponentsWithSystem((system: Scorer, score: Score[], addScores: AddScore[]) => {
            const masterScore = score[0];
            for (const addScore of addScores)
            {
                masterScore.carriageCounts[addScore.trainId]++;

                // Calculate a multiplier based on the lowest carriage. The more you have, the bigger the number gets.
                // You will have more points by having lots of long trains.
                const lowest = Math.min(...masterScore.carriageCounts);
                const multiplier = (lowest + 1) / 10;

                const thisScore = Math.floor(masterScore.carriageCounts[addScore.trainId] * 100 * multiplier);

                system.scene.addEntity(new PointDisp(addScore.posX, addScore.posY, thisScore));
                masterScore.score += thisScore;

                addScore.destroy();
            }
        });
    }
}


class GameManager extends Entity
{
    trackGraph: TrackGraph | null = null;

    constructor()
    {
        super("manager", 100, 350);
    }

    onAdded(): void
    {
        super.onAdded();

        this.addComponent(new TextDisp(0, 0, "", new PIXI.TextStyle({fontSize: 40, fill: "white"})));

        const track = this.getScene().getEntityWithName("track") as Track;

        if (track === null) return;

        // Make sure this matches number of trains.
        const trainCount = 2;
        this.spawnTrain(track.trackGraph, 0, track.trackGraph.edges[0]);
        this.spawnTrain(track.trackGraph, 1, track.trackGraph.edges[500]);
        // this.spawnTrain(track.trackGraph, 2, track.trackGraph.edges[60]);
        // this.spawnTrain(track.trackGraph, 3, track.trackGraph.edges[90]);
        this.addComponent(new Score(trainCount));

        this.trackGraph = track.trackGraph;

        for (let i = 0; i < trainCount; i++)
        {
            this.spawnGoal(i);
        }
    }

    spawnTrain(graph: TrackGraph, trainId: number, edge: Straight)
    {
        const train = this.getScene().addEntity(new Train(edge.n1.x, edge.n1.y, trainId, 0, true));
        train.addComponent(new Destination(graph, edge.n1, edge.n2));
    }

    spawnGoal(trainId: number): void
    {
        if (this.trackGraph === null) return;
        const point = this.trackGraph.nodes[MathUtil.randomRange(0, this.trackGraph.nodes.length)];
        let nextPoint = this.trackGraph.edges.find(x => x.n1 === point)?.n2;
        if (nextPoint === undefined) nextPoint = this.trackGraph.edges.find(x => x.n2 === point)?.n1;
        if (nextPoint === undefined) return;

        const dir = MathUtil.pointDirection(point.x, point.y, nextPoint.x, nextPoint.y);
        const goal = this.scene.addEntity(new Goal(point.x, point.y, trainId));
        goal.transform.rotation = -dir;
    }
}

class TrainsScene extends Scene
{
    static firstLoad = true;

    onAdded(): void
    {
        super.onAdded();

        const col = this.addGlobalSystem(new DiscreteCollisionSystem(collisionMatrix));
        this.addGlobalSystem(new DebugCollisionSystem(col));
        this.addGlobalSystem(new MouseEventSystem());
        this.addGlobalSystem(new TimerSystem());
        this.addGlobalSystem(new Scorer());
        this.addGlobalSystem(new FrameTriggerSystem());
        this.addGlobalSystem(new ScreenShaker());
        this.addGlobalSystem(new ClickListener());

        this.addSystem(new TrainMover());

        this.addSystem(new JunctionSwitcher());
        this.addSystem(new ScoreUpdater());
        this.addSystem(new SpriteSwapper());
        this.addSystem(new RagdollSystem());
        this.addSystem(new PointMover());
        this.addEntity(new SoundManager());

        this.addEntity(new Track("track", 220, 230, Layers.TRACK));

        this.addGUIEntity(new ScreenCard(PIXI.Texture.from(titleScreen), 0));
    }
}


export class LD47 extends Game
{
    static muted = false;
    static musicPlaying = false;
    static audioAtlas: AudioAtlas = new AudioAtlas();

    constructor()
    {
        super({
                  width: 853,
                  height: 460,
                  resolution: 1.5,
                  backgroundColor: 0x263238
              });

        Log.logLevel = LogLevel.NONE;

        collisionMatrix.addCollision(Layers.TRAIN, Layers.TRAIN);
        collisionMatrix.addCollision(Layers.MOUSE_COLL, Layers.BUTTON);
        collisionMatrix.addCollision(Layers.TRAIN, Layers.GOAL);
        collisionMatrix.addCollision(Layers.TRAIN, Layers.JUNCTION);


        const music = LD47.audioAtlas.load("music", require("./Sound/music.mp3"));
        LD47.audioAtlas.load("clickclack", require("./Sound/clickclack.wav"));
        LD47.audioAtlas.load("switch", require("./Sound/switch.wav")).volume(0.1);
        LD47.audioAtlas.load("crash", require("./Sound/crash.wav")).volume(0.1);
        LD47.audioAtlas.load("horn", require("./Sound/horn.wav")).volume(0.2);
        music.loop(true);
        music.volume(0.4);

        // TODO load sounds

        this.setScene(new TrainsScene(this));
    }
}
