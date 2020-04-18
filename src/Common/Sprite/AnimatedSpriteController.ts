import * as PIXI from "pixi.js";
import {Log} from "../Util";
import {FrameTrigger} from "../FrameTrigger";
import {AnimatedSprite, AnimatedSpriteConfig} from "./AnimatedSprite";

/**
 * Configured SpriteAnimation. Used for AnimatedSprite states.
 */
export interface SpriteAnimation
{
    /**
     * Animation ID.
     */
    id: number;

    /**
     * Textures for this animation.
     */
    textures: PIXI.Texture[];

    /**
     * Optional configuration for this animation.
     */
    config?: AnimatedSpriteConfig,

    events?: Map<number, () => void>
}

/**
 * Extended version of AnimatedSprite. This allows for different animations to be played, as well as synchronizing
 * events to specific frames.
 */
export class AnimatedSpriteController extends AnimatedSprite
{
    /**
     * Get the currently playing state.
     */
    public get currentState(): number
    {
        return this._currentState;
    }

    private readonly animationStates: Map<number, SpriteAnimation> = new Map();

    private currentEventMap: Map<number, () => void> | undefined = undefined;
    private _currentState: number;

    /**
     * Create a new AnimatedSpriteController.
     * @param initialState The initial animation state.
     * @param animations An array of all animations that this controller will manage.
     */
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
            this.onFrameChange.register(this.spriteChangeFrame.bind(this));
            this.setAnimation(this._currentState, true);
        }
        else
        {
            Log.error("An animation was not added for the requested state: " + this.initialState);
        }
    }

    private spriteChangeFrame(caller: FrameTrigger<number>, animationFrame: number): void
    {
        if (this.currentEventMap !== null)
        {
            const event = this.currentEventMap?.get(animationFrame);
            if (event !== undefined)
            {
                event();
            }
        }
    }

    /**
     * Set the animation to be played.
     *
     * @param stateId ID of the animation to play.
     * @param reset Force reset. If true, will reset the animation. Otherwise, if the specified state is already
     * active, will do nothing.
     */
    public setAnimation(stateId: number, reset = false): void
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
            this.currentEventMap = loadedConfig.events;
            this._currentState = stateId;
            this.reset();
        }
        else
        {
            Log.error("State transition invalid.");
        }
    }
}
