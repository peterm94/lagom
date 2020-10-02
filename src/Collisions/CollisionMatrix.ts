/**
 * A matrix representing all valid collisions for a physics engine. An enum is recommended for keeping track of layers.
 */
export class CollisionMatrix
{
    private readonly maxLayer = 31;

    // Nothing collides with anything by default.
    readonly layers: Map<number, number> = new Map();

    /**
     * Add a valid collision between two layers. This will be computed both ways.
     * @param l1 The first layer.
     * @param l2 The second layer.
     */
    addCollision(l1: number, l2: number): void
    {
        if (!this.validLayer(l1) || !this.validLayer(l2))
        {
            throw Error(`Layer must be between 0 and ${this.maxLayer}`);
        }

        // Bump everything by 1, makes it easier for people to use enums and not worry about 0 being invalid.
        const layer1 = CollisionMatrix.layerInternal(l1);
        const layer2 = CollisionMatrix.layerInternal(l2);

        let layer1mask = this.layers.get(layer1);
        layer1mask = layer1mask === undefined ? 0 : layer1mask;
        this.layers.set(layer1, layer1mask | (1 << layer2));

        let layer2mask = this.layers.get(layer2);
        layer2mask = layer2mask === undefined ? 0 : layer2mask;
        this.layers.set(layer2, layer2mask | (1 << layer1));
    }

    /**
     * Check if two layers can collide.
     * @param layer1 The first layer to check.
     * @param layer2 The second layer to check.
     * @returns True if the layers can collide.
     */
    canCollide(layer1: number, layer2: number): boolean
    {
        const layerMask = this.layers.get(CollisionMatrix.layerInternal(layer1));
        if (layerMask === undefined) return false;
        return (layerMask & (1 << CollisionMatrix.layerInternal(layer2))) !== 0;
    }

    /**
     * Get the collision mask for a layer.
     * @param layer The layer to use in the lookup.
     * @returns The valid collisions. If the mask is not valid or no collision are registered, will return 0.
     */
    maskFor(layer: number): number
    {
        const layerMask = this.layers.get(CollisionMatrix.layerInternal(layer));
        return layerMask !== undefined ? layerMask : 0;
    }

    /**
     * Get the internal layer value for a given layer. Should not be used outside of the engine.
     * @param layer The layer to convert.
     * @returns The internal layer value.
     */
    static layerInternal(layer: number): number
    {
        return layer + 1;
    }

    /**
     * Check if a layer is valid and in range.
     * @param layer The layer to check.
     * @returns True if valid, false otherwise.
     */
    private validLayer(layer: number): boolean
    {
        return layer >= 0 && layer < this.maxLayer;
    }
}
