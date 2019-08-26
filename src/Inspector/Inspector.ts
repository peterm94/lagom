import {GlobalSystem} from "../ECS/GlobalSystem";
import {LagomType} from "../ECS/LifecycleObject";
import {Component} from "../ECS/Component";
import {observable} from "mobx";
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

export class Inspector extends GlobalSystem
{
    @observable public entities: string[] = [];
    @observable public inspectingEntity: Entity | null = null;
    @observable public entityStuff: EntityStuff = new EntityStuff(0, 0);

    update(delta: number): void
    {
        this.entities = this.getScene().entities.map(
            entity => entity.name);

        if (this.inspectingEntity)
        {
            this.entityStuff.x = this.inspectingEntity.transform.x;
            this.entityStuff.y = this.inspectingEntity.transform.y;
        }
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