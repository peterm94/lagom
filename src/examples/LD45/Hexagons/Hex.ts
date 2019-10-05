export class Hex
{
    constructor(public x: number, public y: number, public z: number)
    {
        if (x + y + z !== 0)
        {
            throw new Error("Invalid Hexagon created.")
        }
    }

    public equals = (other: Hex) => this.x === other.x && this.y === other.y && this.z === other.z;

    public toString = () => `(${this.x}, ${this.y}, ${this.z})`
}
