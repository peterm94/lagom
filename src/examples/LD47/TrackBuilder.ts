import Bezier from "bezier-js";
import {SpriteSheet} from "../../Common/Sprite/SpriteSheet";
import {Entity} from "../../ECS/Entity";
import {Rope} from "./LD47";

export class TrackBuilder
{
    private track: [number, number][] = [];
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
                         end: [number, number]) => {
        return this.addBezier(start, end, [start[0], end[1]])
    }

    public addYBezier = (start: [number, number],
                         end: [number, number]) => {
        return this.addBezier(start, end, [end[0], start[1]])
    }

    public addLine = (start: [number, number], end: [number, number]) => {
        const points = [start, end];
        this.entity.addComponent(new Rope(this.trackSprite.textureFromIndex(0), points));
        return points;
    }

    public addBezier = (start: [number, number],
                        end: [number, number],
                        controlPoint: [number, number]) => {

        const points = [];

        const bezier = new Bezier(start[0], start[1],
                                  controlPoint[0], controlPoint[1],
                                  end[0], end[1]);

        const lut = bezier.getLUT(25);

        for (const point of lut)
        {
            points.push([point.x, point.y]);
        }

        this.entity.addComponent(new Rope(this.trackSprite.textureFromIndex(0), points));
        return points;
    };

    // public addJunction = () => {
    //
    // }
    //
    // public getTrack = () => this.track;
    //
    // public getTrackEnd = (): [number, number] => this.track[this.track.length - 1]
}