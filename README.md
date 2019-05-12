# Lagom

Lagom is a game framework for Javascript games.


# Basic Usage

## Available ECS Interfaces

### Component

Data container class. `Component`s generally should not contain any logic. Use them to store data which can be
manipulated or read by `System`s or `WorldSystem`s.

### Entity

Container type for `Components`. Generally should not contain any logic, as they do not have an `update` method.
The Entity class allows you to add `Components` and retrieve them by type.

### System

`Systems` update every game tick on specific `Component` groupings. A system must declare which `Component`
combinations it wishes to run on. If an `Entity` is found which holds an instance of each requested `Component`,
the system will run on it. If any `Component` types are missing from the `Entity`, the `System` will not run.
If multiple matching Components of the same type are found on an `Entity`, the first found will be returned.

### WorldSystem

`WorldSystems` are similar to `System`s, but instead of running on `Component` groupings by entities, they run on all
`Components` of specified types.

### Scene

A `Scene` is a container object for all of the ECS object types. A `Scene` can be likened to a game level.

### World

The `World` type is the top level Lagom object. All global configuration is done in the `World` object, and it controls
the update loop and the currently loaded `Scene`.