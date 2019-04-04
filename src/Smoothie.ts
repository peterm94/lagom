export class Smoothie {

    renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer;
    stage: PIXI.Container;
    update: Function;
    interpolate: boolean;

    // set to -1 for uncapped
    _fps: number;

    // set to -1 for uncapped
    _renderFps: number;

    private properties: {
        position: boolean; rotation: boolean, size: boolean,
        scale: boolean, alpha: boolean, tile: boolean
    };

    private paused: boolean;
    private _startTime: number;
    private _frameDuration: number;
    private _lag: number;
    private _lagOffset: number;
    private _renderStartTime: number;
    private _renderDuration: number;

    constructor(renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer, root: PIXI.Container, update: Function,
                interpolate: boolean = true, fps: number = 60, renderFps: number = 60) {

        this.renderer = renderer;
        this.stage = root;
        this.update = update;

        // TODO expose this in the constructor
        this.properties = {position: true, rotation: true, size: false, scale: false, alpha: false, tile: false};

        //The upper-limit frames per second that the game' logic update function should run at.
        this._fps = fps;
        this._renderFps = renderFps;

        //Set sprite rendering position interpolation to
        //`true` by default
        this.interpolate = interpolate;


        //A variable that can be used to pause and play Smoothie
        this.paused = false;

        //Private properties used to set the frame rate and figure out the interpolation values
        this._startTime = Date.now();
        this._frameDuration = 1000 / this._fps;
        this._lag = 0;
        this._lagOffset = 0;

        this._renderStartTime = 0;
        this._renderDuration = 1000 / this._renderFps;
    }

    //Getters and setters

    //Fps
    get fps() {
        return this._fps;
    }

    set fps(value) {
        this._fps = value;
        this._frameDuration = 1000 / this._fps;
    }

    //renderFps
    get renderFps() {
        return this._renderFps;
    }

    set renderFps(value) {
        this._renderFps = value;
        this._renderDuration = 1000 / this._renderFps;
    }

    //`dt` (Delta time, the `this._lagOffset` value in Smoothie's code)
    get dt() {
        return this._lagOffset;
    }

    //Methods to pause and resume Smoothie
    pause() {
        this.paused = true;
    }

    resume() {
        this.paused = false;
    }

    //The `start` method gets Smoothie's game loop running
    start() {

        //Start the game loop
        this.gameLoop(0);
    }

    //The core game loop
    gameLoop(timestamp: number) {
        requestAnimationFrame(this.gameLoop.bind(this));

        //Only run if Smoothie isn't paused
        if (!this.paused) {

            //The `interpolate` function updates the logic function at the same rate as the user-defined fps, renders
            // the sprites, with interpolation, at the maximum frame rate the system is capable of

            let interpolate = () => {

                //Calculate the time that has elapsed since the last frame
                let current = Date.now(),
                    elapsed = current - this._startTime;

                //Catch any unexpectedly large frame rate spikes
                if (elapsed > 1000) elapsed = this._frameDuration;

                //For interpolation:
                this._startTime = current;

                //Add the elapsed time to the lag counter
                this._lag += elapsed;

                //Update the frame if the lag counter is greater than or
                //equal to the frame duration
                while (this._lag >= this._frameDuration) {

                    //Capture the sprites' previous properties for rendering
                    //interpolation
                    this.capturePreviousSpriteProperties();

                    //Update the logic in the user-defined update function
                    this.update();

                    //Reduce the lag counter by the frame duration
                    this._lag -= this._frameDuration;
                }

                //Calculate the lag offset and use it to render the sprites
                this._lagOffset = this._lag / this._frameDuration;
                this.render(this._lagOffset);
            };

            //If the `fps` hasn't been defined, call the user-defined update
            //function and render the sprites at the maximum rate the
            //system is capable of
            if (this._fps === -1) {

                //Run the user-defined game logic function as fast as possible
                this.update();
                this.render();
            } else {
                if (this._renderFps === -1) {
                    interpolate();
                } else {
                    //Implement optional frame rate rendering clamping
                    if (timestamp >= this._renderStartTime) {

                        //Update the current logic frame and render with
                        //interpolation
                        interpolate();

                        //Reset the frame render start time
                        this._renderStartTime = timestamp + this._renderDuration;
                    }
                }
            }
        }
    }

    //`capturePreviousSpritePositions`
    //This function is run in the game loop just before the logic update
    //to store all the sprites' previous positions from the last frame.
    //It allows the render function to interpolate the sprite positions
    //for ultra-smooth sprite rendering at any frame rate
    capturePreviousSpriteProperties() {

        //A function that capture's the sprites properties
        let setProperties = (sprite: PIXI.Container) => {

            if (sprite.name == "__smoothieMeta") return;
            let meta: SmoothieMeta = sprite.getChildByName("__smoothieMeta");
            if (meta === null) {
                meta = new SmoothieMeta("__smoothieMeta");
                sprite.addChild(meta);
            }

            if (this.properties.position) {
                meta._previousX = sprite.x;
                meta._previousY = sprite.y;
            }
            if (this.properties.rotation) {
                meta._previousRotation = sprite.rotation;
            }
            if (this.properties.size && sprite instanceof PIXI.Sprite) {
                meta._previousWidth = sprite.width;
                meta._previousHeight = sprite.height;
            }
            if (this.properties.scale) {
                meta._previousScaleX = sprite.scale.x;
                meta._previousScaleY = sprite.scale.y;
            }
            if (this.properties.alpha) {
                meta._previousAlpha = sprite.alpha;
            }
            if (this.properties.tile && sprite instanceof PIXI.extras.TilingSprite) {
                if (sprite.tilePosition !== undefined) {
                    meta._previousTilePositionX = sprite.tilePosition.x;
                    meta._previousTilePositionY = sprite.tilePosition.y;
                }
                if (sprite.tileScale !== undefined) {
                    meta._previousTileScaleX = sprite.tileScale.x;
                    meta._previousTileScaleY = sprite.tileScale.y;
                }
            }

            if (sprite.children && sprite.children.length > 0) {
                for (let i = 0; i < sprite.children.length; i++) {
                    let child = sprite.children[i];
                    if (child instanceof PIXI.Container) {
                        setProperties(child);
                    }
                }
            }
        };

        //loop through the all the sprites and capture their properties
        for (let i = 0; i < this.stage.children.length; i++) {
            let sprite = this.stage.children[i];
            if (sprite instanceof PIXI.Container) {
                setProperties(sprite);
            }
        }
    }

    //Smoothie's `render` method will interpolate the sprite positions and
    //rotation for ultra-smooth animation, if `interpolate` property is `true`
    render(lagOffset = 1) {
        if (this.interpolate) {

            //A recursive function that does the work of figuring out the
            //interpolated positions
            let interpolateSprite = (sprite: PIXI.Container) => {

                if (sprite.name == "__smoothieMeta") return;

                // If this doesn't exist we can't do anything
                let meta: SmoothieMeta = sprite.getChildByName("__smoothieMeta");
                if (meta === null) return;


                //Position (`x` and `y` properties)
                if (this.properties.position) {

                    //Capture the sprite's current x and y positions
                    meta._currentX = sprite.x;
                    meta._currentY = sprite.y;

                    //Figure out its interpolated positions
                    if (meta._previousX !== undefined) {
                        sprite.x = (sprite.x - meta._previousX) * lagOffset + meta._previousX;
                    }
                    if (meta._previousY !== undefined) {
                        sprite.y = (sprite.y - meta._previousY) * lagOffset + meta._previousY;
                    }
                }

                //Rotation (`rotation` property)
                if (this.properties.rotation) {

                    //Capture the sprite's current rotation
                    meta._currentRotation = sprite.rotation;

                    //Figure out its interpolated rotation
                    if (meta._previousRotation !== undefined) {
                        sprite.rotation = (sprite.rotation - meta._previousRotation) * lagOffset + meta._previousRotation;
                    }
                }

                //Size (`width` and `height` properties)
                if (this.properties.size) {

                    //Only allow this for Sprites. Because
                    //Containers vary in size when the sprites they contain
                    //move, the interpolation will cause them to scale erraticly
                    if (sprite instanceof PIXI.Sprite) {

                        //Capture the sprite's current size
                        meta._currentWidth = sprite.width;
                        meta._currentHeight = sprite.height;

                        //Figure out the sprite's interpolated size
                        if (meta._previousWidth !== undefined) {
                            sprite.width = (sprite.width - meta._previousWidth) * lagOffset + meta._previousWidth;
                        }
                        if (meta._previousHeight !== undefined) {
                            sprite.height = (sprite.height - meta._previousHeight) * lagOffset + meta._previousHeight;
                        }
                    }
                }

                //Scale (`scale.x` and `scale.y` properties)
                if (this.properties.scale) {

                    //Capture the sprite's current scale
                    meta._currentScaleX = sprite.scale.x;
                    meta._currentScaleY = sprite.scale.y;

                    //Figure out the sprite's interpolated scale
                    if (meta._previousScaleX !== undefined) {
                        sprite.scale.x = (sprite.scale.x - meta._previousScaleX) * lagOffset + meta._previousScaleX;
                    }
                    if (meta._previousScaleY !== undefined) {
                        sprite.scale.y = (sprite.scale.y - meta._previousScaleY) * lagOffset + meta._previousScaleY;
                    }
                }

                //Alpha (`alpha` property)
                if (this.properties.alpha) {

                    //Capture the sprite's current alpha
                    meta._currentAlpha = sprite.alpha;

                    //Figure out its interpolated alpha
                    if (meta._previousAlpha !== undefined) {
                        sprite.alpha = (sprite.alpha - meta._previousAlpha) * lagOffset + meta._previousAlpha;
                    }
                }

                //Tiling sprite properties (`tileposition` and `tileScale` x
                //and y values)
                if (this.properties.tile && sprite instanceof PIXI.extras.TilingSprite) {

                    //`tilePosition.x` and `tilePosition.y`
                    if (sprite.tilePosition !== undefined) {

                        //Capture the sprite's current tile x and y positions
                        meta._currentTilePositionX = sprite.tilePosition.x;
                        meta._currentTilePositionY = sprite.tilePosition.y;

                        //Figure out its interpolated positions
                        if (meta._previousTilePositionX !== undefined) {
                            sprite.tilePosition.x = (sprite.tilePosition.x - meta._previousTilePositionX) * lagOffset + meta._previousTilePositionX;
                        }
                        if (meta._previousTilePositionY !== undefined) {
                            sprite.tilePosition.y = (sprite.tilePosition.y - meta._previousTilePositionY) * lagOffset + meta._previousTilePositionY;
                        }
                    }

                    //`tileScale.x` and `tileScale.y`
                    if (sprite.tileScale !== undefined) {

                        //Capture the sprite's current tile scale
                        meta._currentTileScaleX = sprite.tileScale.x;
                        meta._currentTileScaleY = sprite.tileScale.y;

                        //Figure out the sprite's interpolated scale
                        if (meta._previousTileScaleX !== undefined) {
                            sprite.tileScale.x = (sprite.tileScale.x - meta._previousTileScaleX) * lagOffset + meta._previousTileScaleX;
                        }
                        if (meta._previousTileScaleY !== undefined) {
                            sprite.tileScale.y = (sprite.tileScale.y - meta._previousTileScaleY) * lagOffset + meta._previousTileScaleY;
                        }
                    }
                }

                //Interpolate the sprite's children, if it has any
                if (sprite.children.length !== 0) {
                    for (let j = 0; j < sprite.children.length; j++) {

                        //Find the sprite's child
                        let child = sprite.children[j];

                        //display the child
                        if (child instanceof PIXI.Container)
                            interpolateSprite(child);
                    }
                }
            };

            //loop through the all the sprites and interpolate them
            for (let i = 0; i < this.stage.children.length; i++) {
                let sprite = this.stage.children[i];
                if (sprite instanceof PIXI.Container)
                    interpolateSprite(sprite);
            }
        }

        //Render the stage. If the sprite positions have been
        //interpolated, those position values will be used to render the
        //sprite
        this.renderer.render(this.stage);

        //Restore the sprites' original x and y values if they've been
        //interpolated for this frame
        if (this.interpolate) {

            //A recursive function that restores the sprite's original x and y positions
            let restoreSpriteProperties = (sprite: PIXI.Container) => {

                if (sprite.name == "__smoothieMeta") return;

                // If this doesn't exist we can't do anything
                let meta: SmoothieMeta = sprite.getChildByName("__smoothieMeta");
                if (meta === null) return;

                if (this.properties.position) {
                    sprite.x = meta._currentX;
                    sprite.y = meta._currentY;
                }
                if (this.properties.rotation) {
                    sprite.rotation = meta._currentRotation;
                }
                if (this.properties.size) {

                    //Only allow this for Sprites to prevent Container scaling bug
                    if (sprite instanceof PIXI.Sprite) {
                        sprite.width = meta._currentWidth;
                        sprite.height = meta._currentHeight;
                    }
                }
                if (this.properties.scale) {
                    sprite.scale.x = meta._currentScaleX;
                    sprite.scale.y = meta._currentScaleY;
                }
                if (this.properties.alpha) {
                    sprite.alpha = meta._currentAlpha;
                }
                if (this.properties.tile && sprite instanceof PIXI.extras.TilingSprite) {
                    if (sprite.tilePosition !== undefined) {
                        sprite.tilePosition.x = meta._currentTilePositionX;
                        sprite.tilePosition.y = meta._currentTilePositionY;
                    }
                    if (sprite.tileScale !== undefined) {
                        sprite.tileScale.x = meta._currentTileScaleX;
                        sprite.tileScale.y = meta._currentTileScaleY;
                    }
                }

                //Restore the sprite's children, if it has any
                if (sprite.children.length !== 0) {
                    for (let i = 0; i < sprite.children.length; i++) {

                        //Find the sprite's child
                        let child = sprite.children[i];

                        //Restore the child sprite properties
                        if (child instanceof PIXI.Container)
                            restoreSpriteProperties(child);
                    }
                }
            };

            for (let i = 0; i < this.stage.children.length; i++) {
                let sprite = this.stage.children[i];
                if (sprite instanceof PIXI.Container)
                    restoreSpriteProperties(sprite);
            }
        }
    }
}

class SmoothieMeta extends PIXI.Container {
    _previousX: number = 0;
    _previousY: number = 0;
    _previousRotation: number = 0;
    _previousWidth: number = 0;
    _previousHeight: number = 0;
    _previousScaleX: number = 0;
    _previousScaleY: number = 0;
    _previousAlpha: number = 0;
    _previousTilePositionX: number = 0;
    _previousTilePositionY: number = 0;
    _previousTileScaleX: number = 0;
    _previousTileScaleY: number = 0;

    _currentX: number = 0;
    _currentY: number = 0;
    _currentRotation: number = 0;
    _currentWidth: number = 0;
    _currentHeight: number = 0;
    _currentScaleX: number = 0;
    _currentScaleY: number = 0;
    _currentAlpha: number = 0;
    _currentTilePositionX: number = 0;
    _currentTilePositionY: number = 0;
    _currentTileScaleX: number = 0;
    _currentTileScaleY: number = 0;

    constructor(name: string) {
        super();
        this.name = name;
    }
}