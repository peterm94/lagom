import {Scene} from "../ECS/Scene";

export class TiledMapLoader
{
    private readonly map: TiledMap;

    constructor(map: TiledMap)
    {
        this.map = map;
    }

    load(scene: Scene, entityCreators: Map<number, (x: number, y: number) => void>): void
    {
        for (let layer of this.map.layers)
        {
            layer.data.forEach((value, index) => {
                // TODO for some reason, the json output is 1 indexed?!?!
                const creator = entityCreators.get(value - 1);
                if (creator !== undefined)
                {
                    // TODO not using x/y of the layer here, not sure how they work
                    const row = Math.floor(index / layer.width);
                    const column = index - layer.width * row;
                    creator(this.map.tilewidth * column, this.map.tileheight * row);
                }
            });
        }
    }
}

export interface TiledMap
{
    height: number,
    layers: TiledLayer[],
    nextobjectid: number,
    orientation: string,
    renderorder: string,
    tiledversion: string,
    tileheight: number,
    tilesets: { firstgid: number, source: string }[],
    tilewidth: number,
    type: string,
    version: number,
    width: number
}

export interface TiledLayer
{
    data: number[],
    height: number,
    name: string,
    opacity: number,
    type: string,
    visible: boolean,
    width: number,
    x: number,
    y: number
}