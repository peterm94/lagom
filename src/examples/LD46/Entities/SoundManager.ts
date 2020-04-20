import {Entity} from "../../../ECS/Entity";
import {Component} from "../../../ECS/Component";
import {System} from "../../../ECS/System";
import {Button} from "../../../Input/Button";
import muteSpr from "../Art/mute.png"
import {SpriteSheet} from "../../../Common/Sprite/SpriteSheet";
import {Game} from "../../../ECS/Game";
import {AnimatedSpriteController} from "../../../Common/Sprite/AnimatedSpriteController";
import {LD46} from "../LD46";
import {Log} from "../../../Common/Util";
import {GameState} from "../Systems/StartedSystem";
import {Timer} from "../../../Common/Timer";

let muteSheet = new SpriteSheet(muteSpr, 22, 22);

export class SoundManager extends Entity
{
    constructor()
    {
        super("audio", 0, 0);

        this.startMusic();
    }

    onAdded(): void
    {
        super.onAdded();

        this.addComponent(new MuteComp());
        const spr = this.addComponent(new AnimatedSpriteController(Number(LD46.muted), [
            {
                id: 0,
                textures: muteSheet.textures([[0, 0]])
            }, {
                id: 1,
                textures: muteSheet.textures([[1, 0]])
            }]));

        this.addComponent(new Timer(50, spr, false)).onTrigger.register((caller, data) => {
            data.setAnimation(Number(LD46.muted));
        })

        this.scene.addSystem(new MuteListener());
    }

    toggleMute()
    {
        LD46.muted = !LD46.muted;

        if (LD46.muted)
        {
            this.stopAllSounds();
        }
        else
        {
            this.startMusic();
        }
    }

    startMusic()
    {
        if (!LD46.muted && !LD46.musicPlaying)
        {
            LD46.audioAtlas.play("music");
            LD46.musicPlaying = true;
        }
    }

    stopAllSounds()
    {
        LD46.audioAtlas.sounds.forEach((k, v) => k.stop())
        LD46.musicPlaying = false;
    }

    onRemoved(): void
    {
        super.onRemoved();
        this.stopAllSounds();
    }

    playSound(name: string)
    {
        if (!LD46.muted)
        {
            LD46.audioAtlas.play(name);
        }
    }
}


class MuteComp extends Component
{
}

class MuteListener extends System
{
    types = () => [AnimatedSpriteController, MuteComp];

    update(delta: number): void
    {
        this.runOnEntities((e: Entity, spr: AnimatedSpriteController) => {
            if (Game.mouse.isButtonPressed(Button.LEFT))
            {
                const pos = e.scene.game.renderer.plugins.interaction.mouse.global;

                if (pos.x > 0 && pos.x < 22 && pos.y > 0 && pos.y < 22)
                {
                    (e.scene.getEntityWithName("audio") as SoundManager).toggleMute();
                    spr.setAnimation(Number(LD46.muted));
                }
            }
        });
    }
}
