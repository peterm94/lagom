import * as React from 'react';
import {Game} from "../ECS/Game";
import {Inspector} from "../Inspector/Inspector";
import {observer} from "mobx-react";
import {Entity} from "../ECS/Entity";
import {Component} from "../ECS/Component";

@observer
export class InspectorComponent extends React.Component<{ game: Game }, {}>
{
    private inspector: Inspector;

    constructor(props: { game: Game })
    {
        super(props);
        this.inspector = props.game.currentScene.addGlobalSystem(new Inspector());
    }

    render()
    {
        return <div>
            <table>
                <tr>
                    <th>Entities</th>
                    <th>Entity Info</th>
                </tr>
                <tr>
                    <td>
                        <EntityList inspector={this.inspector}/>
                    </td>
                    <td>
                        <EntityInfo inspector={this.inspector}/>
                    </td>
                </tr>
            </table>
        </div>;
    }
}

@observer
export class EntityList extends React.Component<{ inspector: Inspector }>
{
    render()
    {
        const entities = this.props.inspector.entities;

        return (<ul>{entities.map((item, idx) => {
            return <li key={idx}>
                <button onClick={this.entitySelected.bind(this, idx)} key={idx}>{item}</button>
            </li>
        })}</ul>)
    }

    private entitySelected(idx: number)
    {
        this.props.inspector.selectEntity(idx)
    }
}

@observer
export class EntityInfo extends React.Component<{ inspector: Inspector }, {}>
{
    render()
    {
        const entity = this.props.inspector.inspectingEntity;
        if (entity !== null)
        {
            return (<div>{this.basicInfo(entity)}{this.componentList(entity)}</div>)
        }
        return null;
    }

    private componentList(entity: Entity)
    {
        return <ul>{entity.components.map((item, idx) => {
            return <li key={idx}>{item.constructor.name}
                <pre>{JSON.stringify(item, (key: string, value: any) => {
                    if (value instanceof Component)
                    {
                        return value;
                    }
                    // Ignore the warning, it works.
                    if (!(value instanceof Object))
                    {
                        return value;
                    }
                    return undefined;
                }, 4)}</pre>
            </li>
        })}</ul>;
    }

    private basicInfo(entity: Entity)
    {
        if (this.props.inspector.entityStuff)
        {
            return <div>
                <pre>{JSON.stringify(this.props.inspector.entityStuff, null, 4)}</pre>
            </div>
        }
        return null;
    }
}