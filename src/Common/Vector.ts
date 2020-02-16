/**
 * Simple vector type, used by various systems.
 */
export class Vector
{
    /**
     * X component of the vector.
     */
    x: number;

    /**
     * Y component of the vector.
     */
    y: number;

    /**
     * Create a new vector.
     * @param x X component.
     * @param y Y component.
     */
    constructor(x: number, y: number)
    {
        this.x = x;
        this.y = y;
    }

    /**
     * Creates a new vector of (0, 0);
     * @returns The created vector.
     */
    static zero(): Vector
    {
        return new Vector(0, 0);
    };

    /**
     * Creates a new unit vector of (-1, 0);
     * @returns The created vector.
     */
    static left(): Vector
    {
        return new Vector(-1, 0);
    };

    /**
     * Creates a new unit vector of (1, 0);
     * @returns The created vector.
     */
    static right(): Vector
    {
        return new Vector(1, 0);
    };

    /**
     * Creates a new unit vector of (0, -1);
     * @returns The created vector.
     */
    static up(): Vector
    {
        return new Vector(0, -1);
    };

    /**
     * Creates a new unit vector of (0, 1);
     * @returns The created vector.
     */
    static down(): Vector
    {
        return new Vector(0, 1);
    };

    /**
     * Add the value of another vector to this vector.
     * @param other The vector to add.
     * @returns This vector, with modifications.
     */
    add(other: Vector): Vector
    {
        this.x += other.x;
        this.y += other.y;
        return this;
    }

    /**
     * Subtract the value of another vector from this vector.
     * @param other The vector to subtract.
     * @returns This vector, with modifications.
     */
    sub(other: Vector): Vector
    {
        this.x -= other.x;
        this.y -= other.y;
        return this;
    }

    /**
     * Calculate the length (hypotenuse) of this vector.
     * @returns The length of the vector.
     */
    length(): number
    {
        return Math.sqrt((this.x * this.x) + (this.y * this.y));
    }

    /**
     * Creates a new normalized vector without modifying the original.
     * @returns A newly created unit vector.
     */
    asNormalized(): Vector
    {
        const len = this.length();
        return new Vector(this.x / len, this.y / len);
    }

    /**
     * Normalize this vector.
     * @returns This vector, modified.
     */
    normalize(): Vector
    {
        const len = this.length();
        this.divide(len);
        return this;
    }

    /**
     * Divide this vector by a scalar value.
     * @param scalar The value to divide the vector by.
     * @returns This vector, with modifications.
     */
    divide(scalar: number): Vector
    {
        this.x /= scalar;
        this.y /= scalar;
        return this;
    }

    /**
     * Multiply this vector by a scalar value.
     * @param scalar The value to multiply the vector by.
     * @returns This vector, with modifications.
     */
    multiply(scalar: number): Vector
    {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }
}
