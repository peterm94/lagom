import {System} from "../../../ECS/System";
import {Game} from "../../../ECS/Game";
import {Button} from "../../../Input/Button";
import {MainScene} from "../LD46";

export class GameState extends System
{
    public static GameRunning: "INTRO" | "SYNC-UP" | "RUNNING" | "DIED" = "INTRO";

    types = () => [];

    update(delta: number): void
    {
        if (Game.mouse.isButtonPressed(Button.LEFT))
        {
            if (GameState.GameRunning == "INTRO")
            {
                GameState.GameRunning = "SYNC-UP";
                this.startSync();
            }
            else if (GameState.GameRunning == "DIED")
            {

                this.scene.game.setScene(new MainScene(this.scene.game));
                this.scene.destroy();
                GameState.GameRunning = "SYNC-UP";
                this.startSync();
            }

            console.log(GameState.GameRunning);
        }
    }

    private startSync = () =>
    {
        setTimeout(() => GameState.GameRunning = "RUNNING", 2900);
    }
}
