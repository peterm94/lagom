import * as PIXI from "pixi.js";
import {Entity} from "../../../ECS/Entity";
import {DrawLayers} from "../LD46";
import {SpriteSheet} from "../../../Common/Sprite/SpriteSheet";
import endScreen from "../Art/end_screen.png";
import {Sprite} from "../../../Common/Sprite/Sprite";
import {System} from "../../../ECS/System";
import {GameState} from "../Systems/StartedSystem";
import {Component} from "../../../ECS/Component";
import {TextDisp} from "../../../Common/PIXIComponents";
import {GameTimer} from "../Entities/LobsterMinigame";

const endScreenSheet = new SpriteSheet(endScreen, 320, 180);

class EndScreenComponent extends Component
{
}

export class EndScreen extends Entity
{
    constructor()
    {
        super("endScreen", 0, 0, DrawLayers.BOTTOM_FRAME);
    }

    onAdded()
    {
        super.onAdded();

        this.depth = 999999;
        this.addComponent(new EndScreenComponent());
        this.addComponent(new Sprite(endScreenSheet.texture(0, 0)));

        const style = new PIXI.TextStyle({fontFamily: "8bitoperator JVE", fontSize: "8px", fill: "white"});
        const text = new TextDisp(240, 120, "Time Survived: ", style);
        this.addComponent(text);
        this.scene.addSystem(new EndScreenSystem());
    }
}

export class EndScreenMoverSystem extends System
{
    cleanedUp = false;

    types = () => [EndScreenComponent]

    update(delta: number): void
    {
        this.runOnEntitiesWithSystem((sys: EndScreenMoverSystem, entity: Entity) => {
            if (GameState.GameRunning == "DIED")
            {
                entity.transform.position.y = 0;

                if (!sys.cleanedUp)
                {
                    entity.scene.getEntityWithName("runninggame")?.destroy();
                    entity.scene.getEntityWithName("boilinggame")?.destroy();
                    entity.scene.getEntityWithName("lobstergame")?.destroy();
                    entity.scene.getEntityWithName("netjumpgame")?.destroy();

                    sys.cleanedUp = true;
                }
            }
            else
            {
                entity.transform.position.y = -9999;
            }
        });
    }
}

// sorry peter
class EndScreenSystem extends System
{
    types = () => [EndScreenComponent]

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity) =>
                           {
                               const text = entity.getComponentsOfType<TextDisp>(TextDisp, true);
                               text[0].pixiObj.text = "Time Survived: " + GameTimer.timerText;
                           })
    }
}
