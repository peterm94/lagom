# Lagom

Lagom is a game framework for Javascript games.


# Basic Usage

## Available ECS Interfaces

### Component

Data container class. `Components` generally should not contain any logic. Use them to store data which can be
manipulated or read by `Systems` or `WorldSystems`.

### Entity

Container type for `Components`. Generally should not contain any logic, as they do not have an `update` method.
The Entity class allows you to add `Components` and retrieve them by type.

### System

`Systems` update every game tick on specific `Component` groupings. A system must declare which `Component`
combinations it wishes to run on. If an `Entity` is found which holds an instance of each requested `Component`,
the system will run on it. If any `Component` types are missing from the `Entity`, the `System` will not run.
If multiple matching Components of the same type are found on an `Entity`, the first found will be returned.

### GlobalSystem

`GlobalSystems` are similar to `Systems`, but instead of running on `Component` groupings by entities, they run on all
`Components` of specified types.

### Scene

A `Scene` is a container object for all of the ECS object types. A `Scene` can be likened to a game level.

### Game

The `Game` type is the top level Lagom object type. All global configuration is done in the `Game` instance and it
controls the update loop and the currently loaded `Scene`.

## Modules

### Audio

The `AudioAtlas` class allows you to load and manage audio files using the [Howler](https://howlerjs.com/) engine.

Audio files can be loaded using the `load` method.

Example:
```typescript
AudioAtlas.load("jump", require("./resources/jump.wav"))
```

A file can then be simply played with the `AudioAtlas.play()` method, or `Howler` methods can be used directly for more advanced usage.

### Sprite

#### Sprite

Simple `Sprite` component used to render images. A `Sprite` can be directly created from a `PIXI Texture`.

#### SpriteSheet

A `SpriteSheet` can be used to load multiple sprites at once that are part of a larger image. This supports single and multiple texture extraction with tile indexing support.

#### AnimatedSprite

A `Sprite` component type that supports multiple image frames and animation options.

#### AnimatedSpriteController

A more advanced version of `AnimatedSprite`, that allows for multiple animation states that can be controlled with logic.
Also supports custom event triggering on registered animation frames.

### Camera

A Lagom `Scene` always has a single `Camera`, which can be accessed via the `camera` property. This controls how the game viewport is rendered.
The `Camera` can be moved directly, or used with the `FollowCamera` to follow an `Entity` in a game `Scene`.

### PIXI Components

Commonly used rendering `Components`, to display shapes and text.
- TextDisp
- RenderCircle
- RenderRect
- RenderPoly

### ScreenShake

Screenshake `System` and `Component`. The `ScreenShaker` `WorldSystem` must be added to a `Scene` for it to work. Create a `ScreenShake` instance on an `Entity` to trigger it.

### TiledMapLoader

Custom loader for [Tiled](https://www.mapeditor.org/) exported maps. This class can only open map exported with the JSON type.

### Timer

Timer used to schedule events, controlled by the ECS. All subscribed Observers to the `onTrigger` event will be notified when the timer is complete.
A `TimerSystem` must be added to a `Scene` for the timer to function.

### Debugging and Utilities

A `Diagnostics` `Entity` has been provided that will display useful information about the FPS on the canvas.

The `Util` and `MathUtil` classes provide useful helper functions that are commonly used when dealing with objects in a 2D space.

`Log` is a custom logger with multiple logging levels that can be enabled or disabled with the `Log.logLevel` property.

### Physics and Collision Detection

There are two libraries that can be used for collision detection. `Detect`, which can be used as a pure collision detection library (no physics!) and `Matter`, which is a wrapper for the [Matter.js](http://brm.io/matter-js/) physics engine.

Both of these libraries make use of the `CollisionMatrix` class, which allows layers and collision rules to be created. By default, no layers can collide at all.

#### Detect

To use this system, a `DetectCollisionSystem` must be added to the active `Scene`.

In order to register for collisions, `Entities` must add one of the various `DetectCollider` `Components` (`CircleCollider`, `PointCollider`, `RectCollider`, `PolyCollider`).
If the `isTrigger` flag is set for a `DetectCollider`, collider overlaps will be permitted by the system. Otherwise, colliders will be treated as solid objects that cannot occupy the same space. If overlap of colliders occurs, the engine will attempt to separate them.
The `DetectCollider` type has multiple `Observable` members that are triggered for different types of collision events. These can be subscribed to by any `Observer`.

- `onCollision`/`onTrigger`: Triggered on any collision frame. For continuous collisions, this will be triggered on every single frame.
- `onCollisionEnter`/`onTriggerEnter`: Triggered on the first collision frame.
- `onCollisionExit`/`onTriggerExit`: Triggered one frame after the last collision frame.

If an `Entity` has a `DetectCollider` on it, it should **not** be moved by directly modifying the `transform` position. This could cause the Entity to desynchronize from the `Detect` engine.
Instead, a `DetectRigidbody` should be added to the `Entity` which contains `move` functions for direct movement, as well as physics functions for dealing with forces.

#### Matter

To use this system, a `MatterEngine` must be added to the active `Scene`. This engine can only be used as a physics engine

Entities must have a `MCollider` Component on them to be registered by the engine. As with the `Detect` module, a `Matter` controlled `Entity` should not be moved with `transform` modification.
Instead, use `Matter.Body.*` methods such as `applyForce` on the `Body` instance contained by the `MCollider`.
