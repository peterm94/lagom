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

        const style = new PIXI.TextStyle({fontFamily: "8bitoperator JVE", fontSize: "26px", fill: "white"});
        const text = new TextDisp(-3000, 0, "e", style);
        this.addComponent(text);

        this.addComponent(new StartScreenComponent());
        this.addComponent(new Sprite(startScreenSheet.texture(0, 0)));
    }
}

export class StartScreenMoverSystem extends System
{
    types = () => [StartScreenComponent]

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity) => {
            if (GameState.GameRunning != "SYNC-UP" && GameState.GameRunning != "RUNNING" && GameState.GameRunning != "DIED")
            {
                entity.transform.position.y = 0;
            }

            if (GameState.GameRunning != "SYNC-UP") return;

            entity.transform.position.y -= (delta / 1000) * 145;
        });
    }
}