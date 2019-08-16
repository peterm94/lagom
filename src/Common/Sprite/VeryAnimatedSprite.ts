import * as PIXI from "pixi.js";
import {Log} from "../Util";
import {FrameTrigger} from "../FrameTrigger";
import {AnimatedSprite, AnimatedSpriteConfig} from "./AnimatedSprite";

export interface SpriteAnimation
{
    id: number;
    textures: PIXI.Texture[];
    config?: AnimatedSpriteConfig;
}

export class VeryAnimatedSprite extends AnimatedSprite
{
    get currentState(): number
    {
        return this._currentState;
    }

    private readonly animationStates: Map<number, SpriteAnimation> = new Map();
    private readonly events: Map<number, Map<number, () => void>> = new Map();
    private currentEventMap: Map<number, () => void> | null = null;

    private _currentState: number;

    constructor(private initialState: number, animations: SpriteAnimation[])
    {
        super(animations[0].textures);
        this._currentState = initialState;

        // Store the animations
        animations.forEach(anim => this.animationStates.set(anim.id, anim));
    }

    onAdded(): void
    {
        super.onAdded();
        const config = this.animationStates.get(this._currentState);
        if (config !== undefined)
        {
            this.onTrigger.register(this.spriteChangeFrame.bind(this));
            this.setAnimation(this._currentState, true);
        }
        else
        {
            Log.error("An animation was not added for the requested state: " + this.initialState);
        }
    }

    private spriteChangeFrame(caller: FrameTrigger<number>, animationFrame: number)
    {
        if (this.currentEventMap !== null)
        {
            const event = this.currentEventMap.get(animationFrame);
            if (event !== undefined)
            {
                event();
            }
        }
    }

    setAnimation(stateId: number, reset: boolean = false)
    {
        // Check if we are already in the desired state.
        if (this._currentState === stateId && !reset) return;

        // Create the new sprite using the factory.
        const loadedConfig = this.animationStates.get(stateId) || null;
        if (loadedConfig !== null)
        {
            // Apply the configuration to the sprite and set the texture
            this.textures = loadedConfig.textures;
            if (loadedConfig.config) this.applyConfig(loadedConfig.config);
            this.currentEventMap = this.events.get(stateId) || null;
            this._currentState = stateId;
        }
    }

    // TODO this needs to come in with the SpriteAnimation object.
    addEvent(animationId: number, frame: number, event: () => void)
    {
        const animation = this.events.get(animationId);
        if (animation === undefined)
        {
            Log.warn("Expected animation does not exist on VeryAnimatedSprite.", this, animationId);
        }
        else
        {
            animation.set(frame, event);
        }
    }
}