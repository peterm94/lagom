/**
 * Map loader for Tiled JSON files.
 */
export class TiledMapLoader
{
    private readonly map: TiledMap;

    /**
     * Load a JSON Tiled map. The map should be imported from JSON file straight in.
     *
     * ```
     * import world2 from "./resources/World2.json";
     * new TiledMapLoader(world2);
     * ```
     *
     * @param map The map to load.
     */
    constructor(map: TiledMap)
    {
        this.map = map;
    }

    /**
     * Load a given layer from the map.
     * @param layerId The ID of the layer to load.
     * @param entityCreators A map containing a creator function for different tile IDs. The function will be called
     * with the tile X and Y positions for the corresponding tile ID if present.
     */
    load(layerId: number, entityCreators: Map<number, (x: number, y: number) => void>): void
    {
        const layer = this.map.layers[layerId];

        layer.data.forEach((value, index) => {

            // The json output is 1 indexed in the file. Someone else made this decision.
            const creator = entityCreators.get(value - 1);
            if (creator !== undefined)
            {
                // TODO not using x/y of the layer here, not sure how they work
                const row = Math.floor(index / layer.width);
                const column = index - layer.width * row;

                // Trigger the creator function.
                creator(this.map.tilewidth * column, this.map.tileheight * row);
            }
        });
    }

    /**
     * Load a given layer from the map.
     * @param layerId The ID of the layer to load.
     * @param fn The function called for every tile loaded. Can be used as an alternative to the function map.
     */
    loadFn(layerId: number, fn: (tileId: number, x: number, y: number) => void): void
    {
        const layer = this.map.layers[layerId];

        layer.data.forEach((value, index) => {
            const row = Math.floor(index / layer.width);
            const column = index - layer.width * row;
            fn(value - 1, this.map.tilewidth * column, this.map.tileheight * row);
        });
    }
}

/**
 * Type mappings for Tiled JSON maps.
 */
export interface TiledMap
{
    height: number;
    layers: TiledLayer[];
    nextobjectid: number;
    orientation: string;
    renderorder: string;
    tiledversion: string;
    tileheight: number;
    tilesets: { firstgid: number; source: string }[];
    tilewidth: number;
    type: string;
    version: number;
    width: number;
}

/**
 * Type mappings for Tiled JSON layers.
 */
export interface TiledLayer
{
    data: number[];
    height: number;
    name: string;
    opacity: number;
    type: string;
    visible: boolean;
    width: number;
    x: number;
    y: number;
}
