import * as PIXI from "pixi.js";
import {SpriteSheet} from "../../../Common/Sprite/SpriteSheet";
import cookingSpr from '../Art/cooking_sheet.png'
import {Entity} from "../../../ECS/Entity";
import {Sprite} from "../../../Common/Sprite/Sprite";
import {Component} from "../../../ECS/Component";
import {System} from "../../../ECS/System";
import {TextDisp} from "../../../Common/PIXIComponents";

const cookingSheet = new SpriteSheet(cookingSpr, 1, 1);

class BeltLetterDirector extends System
{
    public types = () => [ConveyorTextComponent];

    private letterBag = this.fillBag();
    private letters: string[] = [];
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

        // Base difficulty is send a letter out every 6 seconds.
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
            let letters = entity.getComponentsOfType(TextDisp);

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
                text.pixiObj.position.x = (text.pixiObj.position.x + (delta / 1000) * BumpMoveSystem.convSpeed);

                if (text.pixiObj.position.x > 400)
                {
                    text.destroy();
                }
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
    static readonly convSpeed = 10;

    types = () => [BumpMove]

    update(delta: number): void
    {
        this.runOnEntitiesWithSystem((system: BumpMoveSystem, entity: Entity) => {
            entity.transform.position.x = (entity.transform.position.x + (delta / 1000) * BumpMoveSystem.convSpeed) % 480;
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

class ConveyorTextComponent extends Component
{
}

class ConveyorText extends Entity
{
    onAdded(): void
    {
        super.onAdded();

        this.addComponent(new ConveyorTextComponent());
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

        this.addChild(new ConveyorText("conveyorText"));
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
    }
}
