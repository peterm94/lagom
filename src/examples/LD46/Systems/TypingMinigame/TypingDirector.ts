import {System} from "../../../../ECS/System";
import {TextTyper} from "../../Entities/TypingMinigame";
import {Entity} from "../../../../ECS/Entity";
import {Sprite} from "../../../../Common/Sprite/Sprite";
import {Game} from "../../../../ECS/Game";
import {Key} from "../../../../Input/Key";

export class TypingDirector extends System
{
    // @ts-ignore
    private keys = Object.keys(Key).map((k: string) => Key[k as any] as Key);

    private count: number = 0;

    public types = () => [TextTyper];

    public update(delta: number): void
    {
        this.runOnEntities((entity: Entity, sprite: Sprite) => {
            if (Game.keyboard.isKeyDown(...this.keys))
            {
                console.log("poope");
            }
        });
    }
}
