import {Entity, GUIEntity} from "../../../ECS/Entity";
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
import markerSpr from '../art/enemy_marker.png';
import {MathUtil, Util, Log} from "../../../Common/Util";
import {neighbours, add} from "../Hexagons/HexUtil";
import {ThrusterHex} from "./Thruster";
import {ShieldHex} from "./Shield";
import {LaserTurretHex} from "./Turrets/LaserTurretHex";
import {Sprite} from "../../../Common/Sprite/Sprite";
import {System} from "../../../ECS/System";
import {PlasmaCannonHex} from "./Turrets/PlasmaCannonHex";
import {Movement} from "../Movement";
import {Vector} from "../../../LagomPhysics/Physics";
import {Timer} from "../../../Common/Timer";

const purpleAlienSheet = new SpriteSheet(purpleAlienSpr, 32, 32);
const greenAlienSheet = new SpriteSheet(greenAlienSpr, 32, 32);
const enemyMarkerSheet = new SpriteSheet(markerSpr, 32, 32);

export class EnemyTag extends Component
{
    where: Vector = Vector.zero();

    constructor()
    {
        super();
        this.randomWhere();
    }

    randomWhere()
    {
        const dir = MathUtil.degToRad(MathUtil.randomRange(0, 360));
        const dist = MathUtil.randomRange(350, 700);
        this.where = new Vector(MathUtil.lengthDirX(dist, dir), MathUtil.lengthDirY(dist, dir));
    }
}

export class EnemyMarkerE extends GUIEntity
{
    onAdded()
    {
        super.onAdded();
        this.addComponent(new Sprite(enemyMarkerSheet.textureFromId(0)));
    }
}

export class EnemyMarker extends Component
{
    guiMarker!: EnemyMarkerE;

    onAdded()
    {
        super.onAdded();
        this.guiMarker = this.getScene().addEntity(new EnemyMarkerE("enemy_marker", 0, 0, DrawLayer.GUI));
    }

    onRemoved()
    {
        super.onRemoved();
        this.guiMarker.destroy();
    }
}

export class Enemy extends Entity
{
    public static purpleAlien = new AnimatedSprite(
        purpleAlienSheet.textures([[0, 0], [1, 0], [2, 0]]),
        {xAnchor: 0.5, yAnchor: 0.5, animationEndAction: AnimationEnd.LOOP, animationSpeed: 250});

    public static greenAlien = new AnimatedSprite(
        greenAlienSheet.textures([[0, 0], [1, 0], [2, 0], [3, 0]]),
        {xAnchor: 0.5, yAnchor: 0.5, animationEndAction: AnimationEnd.LOOP, animationSpeed: 250});

    private readonly sprite: AnimatedSprite;

    constructor(public value: number, x: number, y: number)
    {
        super("enemy", x, y, DrawLayer.BLOCK);
        this.layer = Layers.ENEMY;
        this.sprite = Util.choose(Enemy.purpleAlien, Enemy.greenAlien);
    }

    makeTimer(caller: Timer<EnemyTag>, data: EnemyTag)
    {
        data.randomWhere();
        caller.getEntity().addComponent(new Timer(MathUtil.randomRange(1000, 10000), data))
              .onTrigger.register(this.makeTimer.bind(this));
    }

    onAdded()
    {
        super.onAdded();

        const tag = this.addComponent(new EnemyTag());

        this.addComponent(new Timer(1, tag, false)).onTrigger.register(this.makeTimer.bind(this));

        this.addComponent(new DetectRigidbody());
        this.addComponent(new CircleCollider(0, 0, 1, Layers.NONE, true));

        this.addComponent(new Movement(0.00001, 0.9, 0.00075, 2.5));
        this.addComponent(new EnemyMarker());

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

            if (points > 0)
            {
                this.getScene().addEntity(hexEntity);
            }
        }
    }

    private chooseHexLocation(register: HexRegister): Hex
    {
        while (true)
        {
            // Choose an entity to add a neighbour to
            const rando = MathUtil.randomRange(0, register.register.size);
            let list = Array.from(register.register)
            let hexEntity = list[rando][1]

            // choose which neighbour
            const randomFriend = MathUtil.randomRange(0, neighbours.length);
            const newHex = add(hexEntity.hex, neighbours[randomFriend])

            // Check if it already exists
            if (!register.register.has(newHex.toString()) && !newHex.equals(new Hex(0, 0, 0)))
            {
                // All good
                return newHex;
            }
            // Try again
        }
    }

    private buildRandomHexType(register: HexRegister, location: Hex): HexEntity
    {
        switch (MathUtil.randomRange(0, 10))
        {
            case 0:
                return new StructureHex(register, location);
            case 1:
                return new ThrusterHex(register, location);
            case 2:
                return new LaserTurretHex(register, location);
            case 3:
                return new ShieldHex(register, location);
            case 4:
                return new PlasmaCannonHex(register, location);
            default:
                return new StructureHex(register, location);
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
        this.addComponent(this.sprite);
    }

    onRemoved()
    {
        super.onRemoved();
        this.owner.getEntity().destroy();
    }
}


export class EnemyMarkerSystem extends System
{
    readonly outerTolerance = 64;
    readonly innerPadding = 10;
    readonly sprSize = 32;

    update(delta: number): void
    {
        const cam = this.getScene().camera;
        const camPos = cam.position();

        this.runOnEntitiesWithSystem((system: EnemyMarkerSystem, entity: Entity, marker: EnemyMarker) => {
            let enemyPosX = marker.getEntity().transform.x - camPos.x;
            let enemyPosY = marker.getEntity().transform.y - camPos.y;

            let screenSpaceX = -camPos.x + entity.transform.x;
            let screenSpaceY = -camPos.y + entity.transform.y;

            // If we are in view, 'disappear'
            if (enemyPosX > -system.outerTolerance && enemyPosX < cam.width + system.outerTolerance
                && enemyPosY > -system.outerTolerance && enemyPosY < cam.height + system.outerTolerance)
            {
                marker.guiMarker.transform.x = -1000;
                marker.guiMarker.transform.y = -1000;
                return;
            }

            // Move to screen bounds
            if (screenSpaceX < system.innerPadding) screenSpaceX = system.innerPadding;
            if (screenSpaceY < system.innerPadding) screenSpaceY = system.innerPadding;

            if (screenSpaceX > cam.width - system.innerPadding - system.sprSize)
            {
                screenSpaceX = cam.width - system.innerPadding - system.sprSize;
            }
            if (screenSpaceY > cam.height - system.innerPadding - system.sprSize)
            {
                screenSpaceY = cam.height - system.innerPadding - system.sprSize;
            }

            marker.guiMarker.transform.x = screenSpaceX;
            marker.guiMarker.transform.y = screenSpaceY;
        });
    }

    types = () => [EnemyMarker];
}