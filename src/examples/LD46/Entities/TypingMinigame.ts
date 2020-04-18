import * as PIXI from "pixi.js";
import {Entity} from "../../../ECS/Entity";
import {RenderRect, TextDisp} from "../../../Common/PIXIComponents";
import {Component} from "../../../ECS/Component";
import {TypingDirector} from "../Systems/TypingMinigame/TypingDirector";

export class TypingMinigame extends Entity
{
    constructor()
    {
        super("TypingMinigame", 0, 0);
    }

    public onAdded()
    {
        super.onAdded();

        this.addChild(new TextConveyor());
        this.addChild(new RequestedWord());
        this.scene.addSystem(new TypingDirector());
    }
}

export class TextConveyor extends Entity
{
    constructor()
    {
        super("TextConveyor", 0, 160);
    }

    public onAdded()
    {
        super.onAdded();

        this.addComponent(new RenderRect(0, 0, 158, 20, 0xFF00FF, 0xFF00FF));
        this.addComponent(new TextTyper());
    }
}

export class TextTyper extends Component
{

}

export class RequestedWord extends Entity
{
    constructor()
    {
        super("TypingMinigame", 0, 0);
    }

    public onAdded()
    {
        super.onAdded();

        const style = new PIXI.TextStyle({ fontSize: "10px", fill: "black" });
        const text = new TextDisp(0, 0, "", style);
        this.addComponent(text);
        this.addComponent(new TextTyper());
    }
}