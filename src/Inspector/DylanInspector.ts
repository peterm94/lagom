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

export class DylanInspectorSystem extends GlobalSystem
{
    @observable public entities: Entity[] = [];
    public entityStuff: EntityStuff = new EntityStuff(0, 0);

    constructor()
    {
        super();
        // this.entities = this.getScene().entities;
    }

    //
    update(delta: number): void
    {
        this.entities = this.getScene().entities;
    }

    types(): LagomType<Component>[]
    {
        return [];
    }
}