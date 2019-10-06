import {TurretAnimationStates, TurretTag} from "../Turret";
import {HexEntity, HexRegister} from "../../HexEntity";
import {Hex} from "../../Hexagons/Hex";
import {AnimatedSprite, AnimationEnd} from "../../../../Common/Sprite/AnimatedSprite";
import {SpriteSheet} from "../../../../Common/Sprite/SpriteSheet";

import turretSpr from "../../art/plasma_cannon.png";
import turretBaseSpr from "../../art/plasma_cannon_base.png"
import turretBulletSpr from "../../art/turret_bullet.png"
import {AnimatedSpriteController} from "../../../../Common/Sprite/AnimatedSpriteController";
import {Sprite} from "../../../../Common/Sprite/Sprite";

const turretBaseSheet = new SpriteSheet(turretBaseSpr, 32, 32);
const turretSheet = new SpriteSheet(turretSpr, 32, 32);
const turretBulletSheet = new SpriteSheet(turretBulletSpr, 32, 32);

export class PlasmaCannonHex extends HexEntity
{
    public static idleSprites = turretSheet.textureSliceFromRow(0, 0, 4);
    public static idleFrameSpeed = 240;
    public static shootingSprites = turretSheet.textureSliceFromRow(0, 5, 23);
    public static shootingFrameSpeed = 48;
    public static shootingTime = PlasmaCannonHex.shootingSprites.length * PlasmaCannonHex.shootingFrameSpeed;
    public static cooldownSprites = turretSheet.textureSliceFromRow(0, 23, 29);
    public static cooldownFrameSpeed = 240;
    public static cooldownTime = PlasmaCannonHex.cooldownSprites.length * PlasmaCannonHex.cooldownFrameSpeed;

    constructor(public owner: HexRegister, public hex: Hex)
    {
        super("laserTurret", owner, hex, 4);
    }

    onAdded()
    {
        super.onAdded();
        this.addComponent(
            new TurretTag(new AnimatedSprite(turretBulletSheet.textureSliceFromRow(0, 0, 14),
                                             {
                                                 xAnchor: 0.5, yAnchor: 0.5, animationEndAction: AnimationEnd.LOOP,
                                                 animationSpeed: 24
                                             }),
                          PlasmaCannonHex.shootingTime,
                          PlasmaCannonHex.cooldownTime));

        this.addComponent(new Sprite(turretBaseSheet.texture(0, 0), {xAnchor: 0.5, yAnchor: 0.5}));
        this.addComponent(new AnimatedSpriteController(0, [
            {
                id: TurretAnimationStates.OFF,
                textures: PlasmaCannonHex.idleSprites,
                config: {xAnchor: 0.5, yAnchor: 0.5, animationSpeed: PlasmaCannonHex.idleFrameSpeed}
            },
            {
                id: TurretAnimationStates.SHOOTING,
                textures: PlasmaCannonHex.shootingSprites,
                config: {xAnchor: 0.5, yAnchor: 0.5, animationSpeed: PlasmaCannonHex.shootingFrameSpeed}
            },
            {
                id: TurretAnimationStates.COOLING,
                textures: PlasmaCannonHex.cooldownSprites,
                config: {xAnchor: 0.5, yAnchor: 0.5, animationSpeed: PlasmaCannonHex.cooldownFrameSpeed}
            }]));

    }
}