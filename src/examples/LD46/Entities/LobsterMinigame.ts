import * as PIXI from "pixi.js";
import {SpriteSheet} from "../../../Common/Sprite/SpriteSheet";
import cookingSpr from '../Art/cooking_sheet.png'
import {Entity} from "../../../ECS/Entity";
import {Sprite} from "../../../Common/Sprite/Sprite";
import {Component} from "../../../ECS/Component";
import {System} from "../../../ECS/System";
import {RenderRect, TextDisp} from "../../../Common/PIXIComponents";
import {Key} from "../../../Input/Key";
import {Game} from "../../../ECS/Game";

const cookingSheet = new SpriteSheet(cookingSpr, 1, 1);

class BeltLetterDirector extends System
{
    public types = () => [ConveyorRunnerComponent];

    private letterBag = this.fillBag();
    private pressedLetters: string[] = [];
    private letters: string[] = [];
    private trimmed = 0;
    private spawned = 0;
    private timeElapsed = 0;

    private fillBag()
    {
        const letterBag = "abcdefghijklmnopqrstuvwxyz".split('');
        // Shuffle the letter bag.
        return letterBag.sort(() => { return Math.floor(Math.random() * 3) - 1; });
    }

    private takeLetter = () =>
    {
        return this.letterBag.shift();
    }

    public update(delta: number): void
    {
        this.timeElapsed += delta;

        // Increase difficulty every 15 seconds (todo)
        const difficulty = (this.timeElapsed / 15000) + 1;

        // Base difficulty is send a letter out every 10 seconds.
        const trigger = 10000;

        let ramper = (trigger / difficulty);
        if (ramper < 0.1) ramper = 0.1;

        // Always spawn one letter at the start, then calculate the amount of letters
        // based off the difficulty ramp and time elapsed
        const expectedLetters = (this.timeElapsed / (ramper)) + 1;
        if (this.letters.length < Math.floor(expectedLetters))
        {
            let nextLetter = this.takeLetter();
            if (nextLetter == undefined)
            {
                this.letterBag = this.fillBag();

                // We know that the bag will be filled here so we can
                // cast it to direct string instead of string | undefined
                nextLetter = this.takeLetter() as string;
            }

            this.letters.push( nextLetter );
        }

        this.runOnEntities((entity: Entity) =>
        {
            let letters = entity.getComponentsOfType(TextDisp) as TextDisp[];

            // Check if there is a letter for the user to press
            if (this.pressedLetters.length != this.letters.length)
            {
                const nextKey = "Key" + this.letters[this.pressedLetters.length].toUpperCase();
                if (Game.keyboard.isKeyPressed(nextKey as Key))
                {
                    this.pressedLetters.push(this.letters[this.pressedLetters.length]);

                    const selectedLetter = letters[this.pressedLetters.length - 1 - this.trimmed];
                    if (selectedLetter.pixiObj.style.fill == "red")
                    {
                        selectedLetter.pixiObj.style.fill = "orange";
                    }
                    else
                    {
                        selectedLetter.pixiObj.style.fill = "green";
                    }
                }
            }

            if (this.spawned < this.letters.length)
            {
                // If we have gotten new letters, push them onto the canvas
                for (let i = this.spawned; i < this.letters.length; i++)
                {
                    const style = new PIXI.TextStyle({ fontSize: "14px", fill: "white" });
                    const text = new TextDisp(-40, 8, this.letters[i].toUpperCase(), style);
                    entity.addComponent(text);
                    this.spawned += 1;
                }

                // Update the letters after we add them
                letters = entity.getComponentsOfType(TextDisp);
            }

            for (const letter of letters)
            {
                const text = letter as TextDisp;
                text.pixiObj.position.x = (text.pixiObj.position.x + (delta / 1000) * BumpMoveSystem.conveyorSpeed);

                if (text.pixiObj.position.x > 320)
                {
                    // They didn't press the letter even though it went off screen so we add it to the array
                    if (text.pixiObj.style.fill == "red")
                    {
                        this.pressedLetters.push(text.pixiObj.text);
                    }
                    text.destroy();
                    this.trimmed += 1;
                }
            }
        });
    }
}

class LobstaDirector extends System
{
    public types = () => [ConveyorLobstaComponent];

    public update(delta: number): void
    {
        this.runOnEntities((entity: Entity) => {
            entity.transform.position.x = (entity.transform.position.x - (delta / 1000) * 3) % 480;

            const parent = entity.parent as Entity;
            let letters = parent.getComponentsOfType(TextDisp) as TextDisp[];
            const lobsterPos = entity.transform.position;

            for (const letter of letters)
            {
                const letterPos = letter.pixiObj.position;

                // im sorry peter
                if (lobsterPos.x < letterPos.x + letter.pixiObj.width &&
                    lobsterPos.x + entity.transform.width > letterPos.x &&
                    lobsterPos.y < letterPos.y + letter.pixiObj.height &&
                    lobsterPos.y + entity.transform.height > letterPos.y)
                {
                    if (letter.pixiObj.style.fill == "green")
                    {
                        break;
                    }

                    if (letter.pixiObj.style.fill == "white" || letter.pixiObj.style.fill == "red")
                    {
                        letter.pixiObj.style.fill = "red";
                        entity.transform.position.x = (entity.transform.position.x + (delta / 1000) * (BumpMoveSystem.conveyorSpeed - 1)) % 480;
                        break;
                    }

                    break;
                }
            }

            if (entity.transform.position.x < 50)
            {
                entity.transform.position.x = 50;
            }

            if (entity.transform.position.x > 285)
            {
                // End game here
                entity.transform.position.x = 285;
            }
        });
    }
}

class Chef extends Entity
{
    onAdded(): void
    {
        super.onAdded();

        this.addComponent(new Sprite(cookingSheet.texture(0, 0, 96, 90)));
    }
}

class BumpMoveSystem extends System
{
    static conveyorSpeed = 20;

    types = () => [BumpMove]

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity) => {
            entity.transform.position.x = (entity.transform.position.x + (delta / 1000) * BumpMoveSystem.conveyorSpeed) % 480;
        });
    }
}

class BumpMove extends Component
{
}

class ConveyorBump extends Entity
{
    onAdded(): void
    {
        super.onAdded();

        this.addComponent(new BumpMove());
        this.addComponent(new Sprite(cookingSheet.texture(0, 128, 2, 32)));
    }
}

class ConveyorRunnerComponent extends Component
{
}

class ConveyorRunner extends Entity
{
    onAdded(): void
    {
        super.onAdded();

        this.addComponent(new ConveyorRunnerComponent());
        this.addChild(new ConveyorLobsta("lobsta"));
    }
}

class ConveyorLobstaComponent extends Component
{
}

class ConveyorLobsta extends Entity
{
    onAdded(): void
    {
        super.onAdded();

        this.depth = 1;
        this.transform.position.x = 120;

        this.addComponent(new ConveyorLobstaComponent());
        this.addComponent(new RenderRect(0, 10, 10, 10, 0xFF00FF));
    }
}

class Conveyor extends Entity
{
    onAdded(): void
    {
        super.onAdded();
        this.addComponent(new Sprite(cookingSheet.texture(0, 96, 320, 32)));

        for (let i = 0; i < 20; i++)
        {
            this.addChild(new ConveyorBump("bump", i * 24 + 1));
        }

        this.addChild(new ConveyorRunner("conveyorText"));
    }
}

export class LobsterMinigame extends Entity
{
    onAdded(): void
    {
        super.onAdded();

        this.addChild(new Chef("chef", 320 - 100));

        this.addChild(new Conveyor("conveyor", 0, 84));

        this.scene.addSystem(new BumpMoveSystem());
        this.scene.addSystem(new BeltLetterDirector());
        this.scene.addSystem(new LobstaDirector());
    }
}
