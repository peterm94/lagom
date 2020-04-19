import {Entity} from "../../../ECS/Entity";
import {DrawLayers} from "../LD46";
import {SpriteSheet} from "../../../Common/Sprite/SpriteSheet";
import startScreen from "../Art/start_screen.png";
import {Sprite} from "../../../Common/Sprite/Sprite";
import {System} from "../../../ECS/System";
import {GameState} from "../Systems/StartedSystem";
import {Component} from "../../../ECS/Component";
import * as PIXI from "pixi.js";
import {TextDisp} from "../../../Common/PIXIComponents";

const startScreenSheet = new SpriteSheet(startScreen, 320, 180);

class StartScreenComponent extends Component
{
}

export class StartScreen extends Entity
{
    constructor()
    {
        super("startScreen", 0, 0, DrawLayers.BOTTOM_FRAME);
    }

    onAdded()
    {
        super.onAdded();

        this.depth = 999999;

        const style = new PIXI.TextStyle({fontFamily: "8bitoperator JVE", fontSize: "100px", fill: "white", stroke: "black", strokeThickness: 2});
        const text = new TextDisp(-50, 180, "4", style);
        this.addComponent(text);

        this.addComponent(new StartScreenComponent());
        this.addComponent(new Sprite(startScreenSheet.texture(0, 0)));
    }
}

export class StartScreenMoverSystem extends System
{
    types = () => [StartScreenComponent]

    public counter = 0;

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity) => {
            const text = entity.getComponentsOfType(TextDisp) as TextDisp[];

            if (GameState.GameRunning != "SYNC-UP")
            {
                this.counter = 0;
                text[0].pixiObj.position.x = -200;
            }

            if (GameState.GameRunning != "SYNC-UP" && GameState.GameRunning != "RUNNING" && GameState.GameRunning != "DIED")
            {
                entity.transform.position.y = 0;
            }

            if (GameState.GameRunning != "SYNC-UP") return;

            this.counter += delta;

            entity.transform.position.y -= (delta / 1000) * 145;
            if (entity.transform.position.y < -150)
            {
                entity.transform.position.y = -150;
            }

            //if (this.counter >= 1000)
            //{
            text[0].pixiObj.position.x = 140;
            text[0].pixiObj.text = Math.ceil(3 - ((this.counter) / 1000)).toString();
            //}
        });
    }
}