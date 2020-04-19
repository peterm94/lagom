import {Entity} from "../../../ECS/Entity";
import {AudioAtlas} from "../../../Audio/AudioAtlas";
import {Component} from "../../../ECS/Component";
import {System} from "../../../ECS/System";
import {Button} from "../../../Input/Button";
import muteSpr from "../Art/mute.png"
import {SpriteSheet} from "../../../Common/Sprite/SpriteSheet";
import {Game} from "../../../ECS/Game";
import {AnimatedSpriteController} from "../../../Common/Sprite/AnimatedSpriteController";

let muteSheet = new SpriteSheet(muteSpr, 22, 22);
let muted = false;

export class SoundManager extends Entity
{
    audioAtlas: AudioAtlas = new AudioAtlas();

    constructor()
    {
        super("audio", 0, 0);

        // Load sounds
        const music = this.audioAtlas.load("music", require("../Audio/music.mp3"));
        music.loop(true);
        music.volume(0.4);

        this.audioAtlas.load("chop1", require("../Audio/chop1.wav"));
        this.audioAtlas.load("chop2", require("../Audio/chop2.wav"));
        this.audioAtlas.load("chop3", require("../Audio/chop3.wav"));
        this.audioAtlas.load("hop", require("../Audio/hop.wav")).volume(0.5);
        this.audioAtlas.load("jump", require("../Audio/jump.wav")).volume(0.5);
        this.audioAtlas.load("hurt1", require("../Audio/hurt1.wav")).volume(0.5);
        this.audioAtlas.load("hurt2", require("../Audio/hurt2.wav")).volume(0.5);
        this.audioAtlas.load("hurt3", require("../Audio/hurt3.wav")).volume(0.5);

        this.startMusic();
    }

    onAdded(): void
    {
        super.onAdded();

        this.addComponent(new MuteComp());
        this.addComponent(new AnimatedSpriteController(Number(muted), [
            {
                id: 0,
                textures: muteSheet.textures([[0, 0]])
            }, {
                id: 1,
                textures: muteSheet.textures([[1, 0]])
            }]));

        this.scene.addSystem(new MuteListener());
    }

    toggleMute()
    {
        muted = !muted;

        if (muted)
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
        if (!muted)
        {
            this.audioAtlas.play("music");
        }
    }

    stopAllSounds()
    {
        this.audioAtlas.sounds.forEach((k, v) => k.stop())
    }

    onRemoved(): void
    {
        super.onRemoved();
        this.stopAllSounds();
    }

    playSound(name: string)
    {
        if (!muted)
        {
            this.audioAtlas.play(name);
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
                    spr.setAnimation(Number(muted));
                }
            }
        });
    }
}
