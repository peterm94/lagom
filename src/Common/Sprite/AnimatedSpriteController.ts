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
    config?: AnimatedSpriteConfig;
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

    /**
     * Set the animation to be played.
     *
     * @param stateId ID of the animation to play.
     * @param reset Force reset. If true, will reset the animation. Otherwise, if the specified state is already
     * active, will do nothing.
     */
    public setAnimation(stateId: number, reset: boolean = false)
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
            this.reset();
        }
    }

    /**
     * Add an event to an animation fame. This will be fired whenever the specified frame triggers.
     * @param animationId The animation ID for the desired frame.
     * @param frame The desired frame number.
     * @param event The event to fire.
     */
    // TODO this needs to come in with the SpriteAnimation object.
    addEvent(animationId: number, frame: number, event: () => void)
    {
        const animation = this.events.get(animationId);
        if (animation === undefined)
        {
            Log.warn("Expected animation does not exist on AnimatedSpriteController.", this, animationId);
        }
        else
        {
            animation.set(frame, event);
        }
    }
}