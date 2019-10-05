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

    constructor(private sprite: Component)
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

        this.getScene().addEntity(new EnemyHex(register, new Hex(0, 0, 0), this.sprite));
        this.getScene().addEntity(new StructureHex(register, new Hex(0, 1, -1)));
        this.getScene().addEntity(new StructureHex(register, new Hex(0, 2, -2)));
        this.getScene().addEntity(new StructureHex(register, new Hex(0, -1, 1)));
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
