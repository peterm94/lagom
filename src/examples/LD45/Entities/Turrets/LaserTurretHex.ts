import {TurretAnimationStates, TurretTag} from "../Turret";
import {HexEntity, HexRegister} from "../../HexEntity";
import {Hex} from "../../Hexagons/Hex";
import {AnimatedSprite, AnimationEnd} from "../../../../Common/Sprite/AnimatedSprite";
import {SpriteSheet} from "../../../../Common/Sprite/SpriteSheet";

import turretSpr from "../../art/turret.png";
import turretBaseSpr from "../../art/turret_base.png"
import turretBulletSpr from "../../art/turret_bullet.png"
import {AnimatedSpriteController} from "../../../../Common/Sprite/AnimatedSpriteController";
import {Sprite} from "../../../../Common/Sprite/Sprite";

const turretBaseSheet = new SpriteSheet(turretBaseSpr, 32, 32);
const turretSheet = new SpriteSheet(turretSpr, 32, 32);
const turretBulletSheet = new SpriteSheet(turretBulletSpr, 32, 32);

export class LaserTurretHex extends HexEntity
{
    public static shootingSprites = () => turretSheet.textureSliceFromRow(0, 0, 12);
    public static cooldownSprites = () => turretSheet.textureSliceFromRow(0, 12, 12);

    public static shootingFrameSpeed = 24;
    public static shootingTime = LaserTurretHex.shootingSprites().length * LaserTurretHex.shootingFrameSpeed;

    public static cooldownFrameSpeed = 240;
    public static cooldownTime = LaserTurretHex.cooldownSprites().length * LaserTurretHex.cooldownFrameSpeed;

    constructor(public owner: HexRegister, public hex: Hex)
    {
        super("laserTurret", owner, hex, 4);
    }

    onAdded()
    {
        super.onAdded();
        this.addComponent(
            new TurretTag(() => new AnimatedSprite(turretBulletSheet.textureSliceFromRow(0, 0, 14),
                                                   {
                                                       xAnchor: 0.5, yAnchor: 0.5,
                                                       animationEndAction: AnimationEnd.LOOP,
                                                       animationSpeed: 24
                                                   }), LaserTurretHex.shootingTime, LaserTurretHex.cooldownTime, 0.5,
                          1));

        this.addComponent(new Sprite(turretBaseSheet.texture(0, 0), {xAnchor: 0.5, yAnchor: 0.5}));
        this.addComponent(new AnimatedSpriteController(0, [
            {
                id: TurretAnimationStates.OFF,
                textures: [turretSheet.texture(0, 0)],
                config: {xAnchor: 0.5, yAnchor: 0.5}
            },
            {
                id: TurretAnimationStates.SHOOTING,
                textures: LaserTurretHex.shootingSprites(),
                config: {xAnchor: 0.5, yAnchor: 0.5, animationSpeed: LaserTurretHex.shootingFrameSpeed}
            },
            {
                id: TurretAnimationStates.COOLING,
                textures: LaserTurretHex.cooldownSprites(),
                config: {xAnchor: 0.5, yAnchor: 0.5, animationSpeed: LaserTurretHex.cooldownFrameSpeed}
            }]));

    }
}