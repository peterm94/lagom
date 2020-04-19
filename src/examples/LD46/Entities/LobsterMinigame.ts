import * as PIXI from "pixi.js";
import {SpriteSheet} from "../../../Common/Sprite/SpriteSheet";
import cookingSpr from '../Art/cooking_sheet.png'
import chefSpr from '../Art/swing.png'
import lobstaSpr from '../Art/legs.png'
import smallBubble from '../Art/small_bubble.png'
import bigBubble from '../Art/big_bubble.png'
import {Entity} from "../../../ECS/Entity";
import {Sprite} from "../../../Common/Sprite/Sprite";
import {Component} from "../../../ECS/Component";
import {System} from "../../../ECS/System";
import {TextDisp} from "../../../Common/PIXIComponents";
import {Key} from "../../../Input/Key";
import {Game} from "../../../ECS/Game";
import {AnimatedSprite, AnimationEnd} from "../../../Common/Sprite/AnimatedSprite";
import {AnimatedSpriteController} from "../../../Common/Sprite/AnimatedSpriteController";
import {Timer} from "../../../Common/Timer";
import {RectCollider} from "../../../Collisions/Colliders";
import {CollisionSystem, DiscreteCollisionSystem} from "../../../Collisions/CollisionSystems";
import {Layers} from "../LD46";
import {Log} from "../../../Common/Util";
import {ScreenShake} from "../../../Common/Screenshake";
import {GameState} from "../Systems/StartedSystem";

const smallBubbleSheet = new SpriteSheet(smallBubble, 10, 10);
const bigBubbleSheet = new SpriteSheet(bigBubble, 32, 32);
const cookingSheet = new SpriteSheet(cookingSpr, 1, 1);
// 108 actual height
const chefSheet = new SpriteSheet(chefSpr, 94, 108);
const lobstaSheet = new SpriteSheet(lobstaSpr, 48, 64);

const GREEN = "#30cc30";
const ORANGE = "orange";
const RED = "#ff2626";
const WHITE = "white";


class LetterEntity extends Entity
{
    constructor(x: number, y: number, readonly letter: string)
    {
        super("letter", x, y);
    }

    onAdded(): void
    {
        super.onAdded();

        const style = new PIXI.TextStyle({fontFamily: "8bitoperator JVE", fontSize: "26px", fill: "white"});
        const text = new TextDisp(0, 0, this.letter, style);
        this.addComponent(text);
        this.addComponent(new OnConveyor());

        // Collision
        const system = this.scene.getGlobalSystem<DiscreteCollisionSystem>(CollisionSystem);

        if (system == null)
        {
            Log.error("No collision system detected!");
        }
        else
        {
            this.addComponent(new RectCollider(system, {width: 18, height: 24, layer: Layers.CONV_LETTERS}));
        }
    }
}

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
        return letterBag.sort(() => {
            return Math.floor(Math.random() * 3) - 1;
        });
    }

    private takeLetter = () =>
    {
        return this.letterBag.shift();
    }

    public update(delta: number): void
    {
        // yikes
        this.runOnEntities((entity: Entity) => {
            if (GameState.GameRunning == "SYNC-UP")
            {
                this.letters = [];
                this.pressedLetters = [];
                this.trimmed = 0;
                this.spawned = 0;
                this.timeElapsed = 0;

                let letters = entity.getComponentsOfType<TextDisp>(TextDisp, true);
                letters.forEach((l) => l.destroy());
            }
        });

        if (GameState.GameRunning != "RUNNING") return;

        this.timeElapsed += delta;

        // Always spawn one letter at the start, then calculate the amount of letters
        // based off the difficulty ramp and time elapsed
        const expectedLetters = (ConveyorMoveSystem.conveyorSpeed * (this.timeElapsed / 10000)) / 10;

        if (this.letters.length < (Math.floor(expectedLetters) + 1))
        {
            let nextLetter = this.takeLetter();
            if (nextLetter == undefined)
            {
                this.letterBag = this.fillBag();

                // We know that the bag will be filled here so we can
                // cast it to direct string instead of string | undefined
                nextLetter = this.takeLetter() as string;
            }

            this.letters.push(nextLetter);
        }

        this.runOnEntities((entity: Entity) => {
            let letters = entity.getComponentsOfType<TextDisp>(TextDisp, true);

            // Check if there is a letter for the user to press
            if (this.pressedLetters.length != this.letters.length)
            {
                const nextKey = "Key" + this.letters[this.pressedLetters.length].toUpperCase();
                if (Game.keyboard.isKeyPressed(nextKey as Key))
                {
                    this.pressedLetters.push(this.letters[this.pressedLetters.length]);

                    const selectedLetter = letters[this.pressedLetters.length - 1 - this.trimmed];
                    if (selectedLetter.pixiObj.style.fill == RED)
                    {
                        selectedLetter.pixiObj.style.fill = ORANGE;
                    }
                    else
                    {
                        selectedLetter.pixiObj.style.fill = GREEN;
                    }
                }
            }

            if (this.spawned < this.letters.length)
            {
                // If we have gotten new letters, push them onto the canvas
                for (let i = this.spawned; i < this.letters.length; i++)
                {
                    entity.addChild(new LetterEntity(-40, 5, this.letters[i].toUpperCase()));
                    this.spawned += 1;
                }

                // Update the letters after we add them
                letters = entity.getComponentsOfType<TextDisp>(TextDisp, true);
            }

            for (const letter of letters)
            {
                if (letter.parent.transform.x > 320)
                {
                    // They didn't press the letter even though it went off screen so we add it to
                    // the array
                    if (letter.pixiObj.style.fill === RED)
                    {
                        this.pressedLetters.push(letter.pixiObj.text);
                    }
                    letter.parent.destroy();
                    this.trimmed += 1;
                }
            }
        });
    }
}

class OnConveyor extends Component
{
}

class LobstaDirector extends System
{
    public types = () => [ConveyorLobstaComponent];

    public update(delta: number): void
    {
        this.runOnEntities((entity: Entity) => {
            if (GameState.GameRunning != "RUNNING")
            {
                entity.transform.position.x = 140;
            }

            entity.transform.position.x = (entity.transform.position.x - (delta / 1000) * 3);

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

enum ChefAnimations
{
    Idle,
    Swinging,
    Reset
}

class ChefComponent extends Component
{
}

class Chef extends Entity
{
    onAdded(): void
    {
        super.onAdded();

        this.addComponent(new ChefComponent());
        const spr = this.addComponent(new AnimatedSpriteController(
            ChefAnimations.Idle,
            [
                {
                    id: ChefAnimations.Idle,
                    textures: chefSheet.textures([[0, 0]]),
                },
                {
                    id: ChefAnimations.Swinging,
                    textures: chefSheet.textures(
                        [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]]),
                    config: {animationSpeed: 100, animationEndAction: AnimationEnd.STOP},
                    events: new Map([[4, () => {
                        this.addComponent(new ScreenShake(0.5, 20));
                        const timer = this.addComponent(new Timer(200, spr, false));
                        timer.onTrigger.register((caller, data) => {
                            data.setAnimation(ChefAnimations.Reset)
                        });
                    }]])
                },
                {
                    id: ChefAnimations.Reset,
                    textures: chefSheet.textures([[5, 0], [0, 0]]),
                    config: {animationSpeed: 100, animationEndAction: AnimationEnd.STOP},
                    events: new Map([[1, () => {
                        const timer = this.addComponent(new Timer(100, spr, false));
                        timer.onTrigger.register((caller, data) => {
                            data.setAnimation(ChefAnimations.Idle)
                        });
                    }]])
                }
            ]
        ));

        const system = this.scene.getGlobalSystem<DiscreteCollisionSystem>(CollisionSystem);

        if (system == null)
        {
            Log.error("No collision system detected!");
        }
        else
        {
            const coll = this.addComponent(new RectCollider(system, {
                xOff: 20, yOff: 86,
                width: 24, height: 24,
                layer: Layers.CHEF_CHOP_TRIGGER
            }));

            coll.onTriggerEnter.register((caller, data) => {
                caller.parent.getComponent<AnimatedSpriteController>(AnimatedSpriteController)
                      ?.setAnimation(ChefAnimations.Swinging);
            })
        }
    }
}

class ChefMoveSystem extends System
{
    types = () => [ChefComponent];

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity) => {
            if (GameState.GameRunning != "SYNC-UP" && GameState.GameRunning != "RUNNING")
            {
                entity.transform.position.x = 320;
            }

            if (GameState.GameRunning != "SYNC-UP") return;
            if (entity.transform.position.x < 200) return;

            entity.transform.position.x -= (delta / 1000) * 100;
        });
    }
}

export class ConveyorMoveSystem extends System
{
    static conveyorSpeed = 20;

    types = () => [OnConveyor]

    update(delta: number): void
    {
        if (GameState.GameRunning != "RUNNING")
        {
            ConveyorMoveSystem.conveyorSpeed = 20;
            return;
        }

        this.runOnEntities((entity: Entity) => {
            entity.transform.position.x =
                (entity.transform.position.x + (delta / 1000) * ConveyorMoveSystem.conveyorSpeed);
        });
    }
}

class BumpResetSystem extends System
{
    types = () => [BumpMove]

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity) => {
            entity.transform.position.x %= 480;
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
        this.addComponent(new OnConveyor());
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

        this.addComponent(new AnimatedSprite(lobstaSheet.textureSliceFromRow(0, 0, 9), {
            animationEndAction: AnimationEnd.LOOP,
            animationSpeed: 80,
            yOffset: -35
        }))

        this.addComponent(new ConveyorLobstaComponent());
        /*this.addComponent(new AnimatedSprite(smallBubbleSheet.textures([[0, 0], [1, 0]]),
                             {animationEndAction: AnimationEnd.LOOP, animationSpeed: 800, xOffset: 35, yOffset: -25}));
        this.addComponent(new AnimatedSprite(bigBubbleSheet.textures([[0, 0], [1, 0]]),
                             {animationEndAction: AnimationEnd.LOOP, animationSpeed: 800, xOffset: 42, yOffset: -46}));*/

        // Collision
        const system = this.scene.getGlobalSystem<DiscreteCollisionSystem>(CollisionSystem);

        if (system == null)
        {
            Log.error("No collision system detected!");
        }
        else
        {
            const coll = this.addComponent(new RectCollider(system, {
                xOff: 10, width: 24, height: 24, layer: Layers.CONV_PLAYER
            }));

            coll.onTrigger.register((caller, data) => {

                if (data.other.parent.name !== "letter") return;

                const txt = data.other.parent.getComponent<TextDisp>(TextDisp);

                if (txt === null) return;

                const fill = txt.pixiObj.style.fill;

                if (fill === GREEN)
                {
                    return;
                }
                if (fill === WHITE || fill === RED)
                {
                    txt.pixiObj.style.fill = RED;

                    caller.parent.transform.position.x +=
                        (Game.fixedDeltaMS / 1000) * (ConveyorMoveSystem.conveyorSpeed + 1);

                    if (caller.parent.transform.position.x > 220)
                    {
                        GameState.GameRunning = "DIED";
                    }
                }

            })
        }
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

        this.addChild(new Conveyor("conveyor", 0, 84, 1));
        this.addChild(new Chef("chef", 320 - 100, 0, 1));

        this.scene.addSystem(new ConveyorMoveSystem());
        this.scene.addSystem(new BeltLetterDirector());
        this.scene.addSystem(new LobstaDirector());
        this.scene.addSystem(new BumpResetSystem());
        this.scene.addSystem(new ChefMoveSystem());
    }
}