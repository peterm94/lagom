import Bezier from "bezier-js";
import {SpriteSheet} from "../../Common/Sprite/SpriteSheet";
import {Entity} from "../../ECS/Entity";
import {JunctionButton, Rope} from "./LD47";
import {Node, TrackGraph} from "./TrackGraph";
import {Util} from "../../Common/Util";

export class TrackBuilder
{
    private points: [number, number][] = [];
    private graph: TrackGraph = new TrackGraph();

    // private nodes: Node[] = [];
    //
    private trackSprite: SpriteSheet;
    private entity: Entity;

    public constructor(trackSprite: SpriteSheet, entity: Entity)
    {
        this.trackSprite = trackSprite;
        this.entity = entity;
    }

    public addXBezier = (start: [number, number],
                         end: [number, number],
                         connectToPrevious = true) => {
        return this.addBezier(connectToPrevious, start, end, [start[0], end[1]]);
    };

    public addYBezier = (start: [number, number],
                         end: [number, number],
                         connectToPrevious = true) => {
        return this.addBezier(connectToPrevious, start, end, [end[0], start[1]]);
    };

    public addLine = (start: [number, number],
                      end: [number, number],
                      connectToPrevious = true) => {
        return this.addBezier(connectToPrevious, start, end, [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2]);
    };

    public addBezier = (connectToPrevious: boolean,
                        start: [number, number],
                        end: [number, number],
                        controlPoint: [number, number],
                        controlPoint2?: [number, number]) => {

        const points: [number, number][] = [];

        let bezier;
        if (controlPoint2)
        {
            bezier = new Bezier(start[0], start[1],
                                controlPoint[0], controlPoint[1],
                                controlPoint2[0], controlPoint2[1],
                                end[0], end[1]);
        }
        else
        {
            bezier = new Bezier(start[0], start[1],
                                controlPoint[0], controlPoint[1],
                                end[0], end[1]);
        }

        const lut = bezier.getLUT(25);

        for (const point of lut)
        {
            points.push([point.x, point.y]);
        }

        this.entity.addComponent(new Rope(this.trackSprite.textureFromIndex(0), points));

        // We only want the first point visually.
        points.shift();

        const nodes = points.map(x => new Node(x[0] + this.entity.transform.x, x[1] + this.entity.transform.y));

        const lastNode = this.graph.nodes[this.graph.nodes.length - 1];

        this.graph.addSequence(nodes);
        this.points.push(...points);

        if (connectToPrevious)
        {
            this.graph.connect(lastNode, nodes[0]);
        }

        return nodes;
    };

    public addJunction = (controlNode: Node, switch1: Node, switch2: Node) => {
        this.graph.createJunction(controlNode, [switch1, switch2]);
        this.entity.addChild(new JunctionButton(this.graph, controlNode));
    };

    // public createJunctionHere = (bezier1: () => ) => {
    //     this.graph.createJunction(this.graph.nodes[this.graph.nodes.length - 1], )
    // };

    public getAllPoints = () => this.points;

    public getTrackGraph = () => this.graph;

    // public addJunction = () => {
    //
    // }
    //
    // public getTrack = () => this.track;
    //
    // public getTrackEnd = (): [number, number] => this.track[this.track.length - 1]
}