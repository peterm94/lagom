import {GlobalSystem} from "../ECS/GlobalSystem";
import {LagomType} from "../ECS/LifecycleObject";
import {Component} from "../ECS/Component";
import {action, computed, observable, ObservableMap, runInAction} from "mobx";

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

export class DylanInspectorSystem extends GlobalSystem
{
    @observable public entities: ObservableMap<string, string> = observable.map();

    // public entityStuff: EntityStuff = new EntityStuff(0, 0);

    @computed get entityEntries()
    {
        return Array.from(this.entities.entries())
    }

    onAdded()
    {
        super.onAdded();
        const scene = this.getScene();
        scene.entityAddedEvent.register(
            (scene, entity) => runInAction(() => this.entities.set(entity.id, entity.name)));
        scene.entityRemovedEvent.register(
            (scene, entity) => runInAction(() => this.entities.delete(entity.id)));
    }

    @action
    public update(delta: number): void
    {
    }

    types(): LagomType<Component>[]
    {
        return [];
    }
}