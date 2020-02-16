export class Vector
{
    x: number;
    y: number;

    constructor(x: number, y: number)
    {
        this.x = x;
        this.y = y;
    }

    static zero(): Vector
    {
        return new Vector(0, 0);
    };

    static left(): Vector
    {
        return new Vector(-1, 0);
    };

    static right(): Vector
    {
        return new Vector(1, 0);
    };

    static up(): Vector
    {
        return new Vector(0, -1);
    };

    static down(): Vector
    {
        return new Vector(0, 1);
    };

    add(other: Vector): Vector
    {
        this.x += other.x;
        this.y += other.y;
        return this;
    }

    sub(other: Vector): Vector
    {
        this.x -= other.x;
        this.y -= other.y;
        return this;
    }

    length(): number
    {
        return Math.sqrt((this.x * this.x) + (this.y * this.y));
    }

    asNormalized(): Vector
    {
        const len = this.length();
        return new Vector(this.x / len, this.y / len);
    }

    normalize(): Vector
    {
        const len = this.length();
        this.divide(len);
        return this;
    }

    divide(scalar: number): Vector
    {
        this.x /= scalar;
        this.y /= scalar;
        return this;
    }

    multiply(scalar: number): Vector
    {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }
}
