import Bezier from "bezier-js";

export class TrackBuilder
{
    // private track: [number, number][] = [];
    // private nodes: Node[] = [];
    //
    // public constructor(originX: number, originY: number)
    // {
    //     this.track.push([originX, originY]);
    // }

    public static addXBezier = (start: [number, number],
                                end: [number, number]) => {
        return TrackBuilder.addBezier(start, end, [start[0], end[1]])
    }

    public static addYBezier = (start: [number, number],
                                end: [number, number]) => {
        return TrackBuilder.addBezier(start, end, [end[0], start[1]])
    }

    public static addBezier = (start: [number, number],
                               end: [number, number],
                               controlPoint: [number, number]) => {

        const points = [];

        const bezier = new Bezier(start[0], start[1],
                                  controlPoint[0], controlPoint[1],
                                  end[0], end[1]);

        const lut = bezier.getLUT(20);

        for (const point of lut)
        {
            points.push([point.x, point.y]);
        }

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