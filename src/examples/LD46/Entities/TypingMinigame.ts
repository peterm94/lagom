import * as PIXI from "pixi.js";
import {Entity} from "../../../ECS/Entity";
import {TextDisp} from "../../../Common/PIXIComponents";
import {Component} from "../../../ECS/Component";

export class TypingMinigame extends Entity
{
    constructor()
    {
        super("TypingMinigame", 0, 0);
    }

    public onAdded()
    {
        super.onAdded();

        this.addChild(new RequestedWord());
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

        const style = new PIXI.TextStyle({ fill: "black" });
        const text = new TextDisp(0, 0, "memes!", style);
        this.addComponent(text);
        this.addComponent(new TextTyper());
    }
}