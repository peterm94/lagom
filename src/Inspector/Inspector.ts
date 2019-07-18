import {GlobalSystem} from "../ECS/GlobalSystem";
import {LagomType} from "../ECS/LifecycleObject";
import {Component} from "../ECS/Component";
import {EntityList, InspectorComponent} from "../React/InspectorComponents";

export class Inspector extends GlobalSystem
{
    constructor(private readonly reactComp: InspectorComponent)
    {
        super();
    }

    public entities: string[] = [];

    update(delta: number): void
    {
        this.entities = this.getScene().entities.map(
            entity => entity.name);

        // this.reactComp.setState(() => ({
        //     entities: this.entities
        // }));
    }

    types(): LagomType<Component>[]
    {
        return [];
    }
}