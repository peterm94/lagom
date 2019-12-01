import {GlobalSystem} from "../ECS/GlobalSystem";
import {LagomType} from "../ECS/LifecycleObject";
import {Component} from "../ECS/Component";
import {action, computed, observable, ObservableMap, runInAction} from "mobx";
import {Entity} from "../ECS/Entity";

class EntityStuff
{
    @observable x: number = 0;
    @observable y: number = 0;

    constructor(x: number, y: number)
    {
        this.x = x;
        this.y = y;
    }
}

export type InspectorEntity = [string, string]

export class DylanInspectorSystem extends GlobalSystem
{
    @observable public entityNameMap: Map<string, string> = new Map();
    public entityMap: Map<string, Entity> = new Map();

    @computed get entityEntries(): InspectorEntity[]
    {
        return Array.from(this.entityNameMap.entries())
    }

    onAdded()
    {
        super.onAdded();
        const scene = this.getScene();
        scene.entityAddedEvent.register((scene, entity) => runInAction("Add entity to inspector.", () => {
            this.entityNameMap.set(entity.id, entity.name);
            this.entityMap.set(entity.id, entity);
        }));
        scene.entityRemovedEvent.register((scene, entity) => runInAction("Remove entity from inspector.", () => {
            this.entityNameMap.delete(entity.id);
            this.entityMap.delete(entity.id);
        }));
    }

    public update(delta: number): void
    {
    }

    types(): LagomType<Component>[]
    {
        return [];
    }
}