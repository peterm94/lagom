import {Entity} from "../../../ECS/Entity";
import {FollowMe} from "../../../Common/CameraUtil";
import {DetectRigidbody} from "../../../DetectCollisions/DetectRigidbody";
import {CircleCollider} from "../../../DetectCollisions/DetectColliders";
import {Hex} from "../Hexagons/Hex";
import {DrawLayer, Layers} from "../HexGame";
import {HexEntity, HexRegister} from "../HexEntity";
import {Component} from "../../../ECS/Component";
import {SpriteSheet} from "../../../Common/Sprite/SpriteSheet";
import {AnimatedSprite, AnimationEnd} from "../../../Common/Sprite/AnimatedSprite";
import {StructureHex} from "./Structure";

import purpleAlienSpr from '../art/purple_alien.png';
import greenAlienSpr from '../art/green_alien.png';
import { MathUtil } from "../../../Common/Util";
import { neighbours, add } from "../Hexagons/HexUtil";
import { ThrusterHex } from "./Thruster";
import { TurretHex } from "./Turret";
import { ShieldHex } from "./Shield";
const purpleAlienSheet = new SpriteSheet(purpleAlienSpr, 32, 32);
const greenAlienSheet = new SpriteSheet(greenAlienSpr, 32, 32);

export class Enemy extends Entity
{
    public static purpleAlien = new AnimatedSprite(
        purpleAlienSheet.textures([[0, 0], [1, 0], [2, 0]]),
        {xAnchor: 0.5, yAnchor: 0.5, animationEndAction: AnimationEnd.LOOP, animationSpeed: 250});

    public static greenAlien = new AnimatedSprite(
        greenAlienSheet.textures([[0, 0], [1, 0], [2, 0], [3, 0]]),
        {xAnchor: 0.5, yAnchor: 0.5, animationEndAction: AnimationEnd.LOOP, animationSpeed: 250});

    constructor(private sprite: Component, public value: number = 20)
    {
        super("enemy", 512, 256, DrawLayer.BLOCK);
        this.layer = Layers.ENEMY;
    }

    onAdded()
    {
        super.onAdded();

        this.addComponent(new FollowMe());

        this.addComponent(new DetectRigidbody());
        this.addComponent(new CircleCollider(0, 0, 1, Layers.NONE, true));

        const register = this.addComponent(new HexRegister());

        this.constructEnemy(register, this.value);
    }

    private constructEnemy(register: HexRegister, points: number)
    {
        // Always add the core
        this.getScene().addEntity(new EnemyHex(register, new Hex(0, 0, 0), this.sprite));

        while (points > 0)
        {
            // Where to put the new block
            let hex = this.chooseHexLocation(register);

            // Pick which thing to put there
            let hexEntity = this.buildRandomHexType(register, hex);
            points -= hexEntity.value;
            this.getScene().addEntity(hexEntity);
        }
    }

    private chooseHexLocation(register: HexRegister): Hex
    {
        while(true)
        {
            // Choose an entity to add a neighbour to
            const rando = MathUtil.randomRange(0, register.register.size);
            let list = Array.from(register.register)
            let hexEntity = list[rando][1]

            // choose which neighbour
            const randomFriend = MathUtil.randomRange(0, neighbours.length);
            const newHex = add(hexEntity.hex, neighbours[randomFriend])

            // Check if it already exists
            if (!register.register.has(newHex.toString()))
            {
                // All good
                return newHex;
            }
            // Try again
        }
    }

    private buildRandomHexType(register: HexRegister, location: Hex): HexEntity
    {
        switch(MathUtil.randomRange(0,10))
        {
            case 0: return new StructureHex(register, location);
            case 1: return new ThrusterHex(register, location);
            case 2: return new TurretHex(register, location);
            case 3: return new ShieldHex(register, location);
            default: return new StructureHex(register, location);
        }
    }
}

export class EnemyHex extends HexEntity
{
    constructor(public owner: HexRegister, public hex: Hex, private sprite: Component)
    {
        super("purpleEnemy", owner, hex, 0);
    }

    onAdded()
    {
        super.onAdded();

        const spr = this.addComponent(this.sprite);
    }
}
