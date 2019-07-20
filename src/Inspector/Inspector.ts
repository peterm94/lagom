import {GlobalSystem} from "../ECS/GlobalSystem";
import {LagomType} from "../ECS/LifecycleObject";
import {Component} from "../ECS/Component";
import {observable} from "mobx";
import {Entity} from "../ECS/Entity";

export class Inspector extends GlobalSystem
{
    constructor()
    {
        super();
    }

    @observable public entities: string[] = [];
    @observable public inspectingEntity: Entity | null = null;

    update(delta: number): void
    {
        this.entities = this.getScene().entities.map(
            entity => entity.name);
    }

    types(): LagomType<Component>[]
    {
        return [];
    }

    selectEntity(idx: number)
    {
        this.inspectingEntity = this.getScene().entities[idx];
    }
}