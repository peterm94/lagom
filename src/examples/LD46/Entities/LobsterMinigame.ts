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
import {Layers, MainScene} from "../LD46";
import {Log, Util} from "../../../Common/Util";
import {ScreenShake} from "../../../Common/Screenshake";
import {GameState} from "../Systems/StartedSystem";
import {SoundManager} from "./SoundManager";

const smallBubbleSheet = new SpriteSheet(smallBubble, 10, 10);
const bigBubbleSheet = new SpriteSheet(bigBubble, 32, 32);
const cookingSheet = new SpriteSheet(cookingSpr, 1, 1);
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

    public update(delta: number): void
    {
        this.runOnEntities((entity: Entity) => {
            let letters = entity.getComponentsOfType<TextDisp>(TextDisp, true);

            const unpressed = letters.filter((letter) =>
                                                 letter.pixiObj.style.fill == RED || letter.pixiObj.style.fill == WHITE
            );

            if (unpressed.length > 0)
            {
                const selectedLetter = unpressed[0];
                const nextKey = "Key" + selectedLetter.pixiObj.text.toUpperCase();
                if (Game.keyboard.isKeyPressed(nextKey as Key))
                {
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

            for (const letter of letters)
            {
                if (letter.parent.transform.x > 320)
                {
                    letter.parent.destroy();
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
                        (this.scene.getEntityWithName("audio") as SoundManager).playSound(
                            Util.choose("chop1", "chop2", "chop3"));

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
    static increases = 0;

    static increaseConveyor = () =>
    {
        ConveyorMoveSystem.conveyorSpeed *= 1.2;
        ConveyorMoveSystem.increases += 1;
    }

    types = () => [OnConveyor]

    update(delta: number): void
    {
        if (GameState.GameRunning != "RUNNING")
        {
            ConveyorMoveSystem.increases = 0;
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
    private totalMs: number = 0;

    private letterBag = this.fillBag();

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
    };

    private triggerTimer = (caller: Timer<null>) =>
    {
        if (GameState.GameRunning == "SYNC-UP")
        {
            this.totalMs = 0;
        }
        if (GameState.GameRunning != "RUNNING") return;

        let difficulty = (this.totalMs / 30000) + 1;
        if (difficulty > 10) difficulty = 10;

        // Base difficulty is send a letter out every 10 seconds.
        const trigger = 5000;

        // Ramp up to 1 letter a second
        const ramper = (trigger / difficulty);

        this.totalMs += ramper;

        let nextLetter = this.takeLetter();
        if (nextLetter == undefined)
        {
            this.letterBag = this.fillBag();

            // We know that the bag will be filled here so we can
            // cast it to direct string instead of string | undefined
            nextLetter = this.takeLetter() as string;
        }

        this.addChild(new LetterEntity(-40, 5, nextLetter.toUpperCase()));

        // Reset.
        caller.remainingMS = Math.floor(ramper);
    }

    onAdded(): void
    {
        super.onAdded();

        const timer = this.addComponent(new Timer(100, null, true));
        timer.onTrigger.register(this.triggerTimer);

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

                    if (caller.parent.transform.position.x > 240)
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

class GameTimer extends Entity
{
    private totalMs: number = 0;

    private triggerTimer = (caller: Timer<null>) =>
    {
        const timer = this.getComponent(TextDisp) as TextDisp;

        if (GameState.GameRunning == "INTRO" || GameState.GameRunning == "SYNC-UP")
        {
            this.totalMs = 0;
            timer.pixiObj.position.x = 1000;
        }
        if (GameState.GameRunning != "RUNNING") return;

        this.totalMs += 1000;

        timer.pixiObj.text = this.totalMs / 1000 + "s";

        // Right align (hacky)
        timer.pixiObj.position.x = -(timer.pixiObj.width - 24.75);

        // Reset.
        caller.remainingMS = 1000;
    }

    onAdded(): void
    {
        super.onAdded();

        const timer = this.addComponent(new Timer(1000, null, true));
        timer.onTrigger.register(this.triggerTimer);

        const style = new PIXI.TextStyle({fontFamily: "8bitoperator JVE", fontSize: "26px", fill: "white", stroke: "black", strokeThickness: 2});
        const text = new TextDisp(1000, 0, this.totalMs / 1000 + "s", style);
        this.addComponent(text);
    }
}

class IncreaseIndicator extends Entity
{
    private lastCheckup = 0;
    private indicatedAt = 0;
    private totalMs: number = 0;

    private triggerTimer = (caller: Timer<null>) =>
    {
        const timer = this.getComponent(TextDisp) as TextDisp;
        if (GameState.GameRunning == "INTRO" || GameState.GameRunning == "SYNC-UP")
        {
            this.totalMs = 0;
            this.lastCheckup = 0;
            this.indicatedAt = 0;
            timer.pixiObj.position.x = 1000;
        }
        if (GameState.GameRunning != "RUNNING") return;

        this.totalMs += 100;

        if (ConveyorMoveSystem.increases > this.lastCheckup)
        {
            this.lastCheckup = ConveyorMoveSystem.increases;
            this.indicatedAt = this.totalMs;
            timer.pixiObj.position.x = 0;
            timer.pixiObj.text = `Failed x ${ConveyorMoveSystem.increases}. Speeding up...`;
        }

        if (this.totalMs > this.indicatedAt + 3000)
        {
            timer.pixiObj.position.x = 1000;
        }

        // Reset.
        caller.remainingMS = 100;
    }

    onAdded(): void
    {
        super.onAdded();

        const timer = this.addComponent(new Timer(100, null, true));
        timer.onTrigger.register(this.triggerTimer);

        const style = new PIXI.TextStyle({fontFamily: "8bitoperator JVE", fontSize: "14px", fill: "red", stroke: "black", strokeThickness: 2});
        const text = new TextDisp(1000, 0, "Failed. Speeding up...", style);
        this.addComponent(text);
    }
}

export class LobsterMinigame extends Entity
{
    onAdded(): void
    {
        super.onAdded();

        this.addChild(new Conveyor("conveyor", 0, 84, 1));
        this.addChild(new Chef("chef", 320 - 100, 0, 1));
        this.addChild(new GameTimer("ingameTimer", 292, 60, 1));
        this.addChild(new IncreaseIndicator("increaseIndicator", 3, 71, 0));

        this.scene.addSystem(new ConveyorMoveSystem());
        this.scene.addSystem(new BeltLetterDirector());
        this.scene.addSystem(new LobstaDirector());
        this.scene.addSystem(new BumpResetSystem());
        this.scene.addSystem(new ChefMoveSystem());
    }
}
