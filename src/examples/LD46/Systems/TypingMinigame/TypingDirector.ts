import {System} from "../../../../ECS/System";
import {TextTyper} from "../../Entities/TypingMinigame";
import {Entity} from "../../../../ECS/Entity";
import {Game} from "../../../../ECS/Game";
import {Key} from "../../../../Input/Key";
import {TextDisp} from "../../../../Common/PIXIComponents";

export class TypingDirector extends System
{
    private keys = Object.keys(Key)
                         .filter((k) => k.startsWith("Key") || k == "Period" || k == "Space" || k == "Backspace")
                         // @ts-ignore
                         .map((k) => Key[k as any] as Key);

    private count: number = 0;

    public types = () => [TextDisp, TextTyper];

    public update(delta: number): void
    {
        this.runOnEntities((entity: Entity, textDisp: TextDisp) => {
            // TODO: Holding down backspace?

            for (const key of this.keys) {
                if (Game.keyboard.isKeyReleased(key)) {
                    if (key == "Backspace") {
                        if (textDisp.pixiObj.text.length > 0) {
                            textDisp.pixiObj.text = textDisp.pixiObj.text.substr(0, textDisp.pixiObj.text.length - 1);
                        }

                        continue;
                    }

                    textDisp.pixiObj.text += key.replace("Key", "")
                                                .replace("Space", " ")
                                                .replace("Period", ".");
                }
            }
        });
    }
}
