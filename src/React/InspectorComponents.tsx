import * as React from 'react';
import {Game} from "../ECS/Game";
import {Inspector} from "../Inspector/Inspector";
import {observer} from "mobx-react";
import {Entity} from "../ECS/Entity";
import {Component} from "../ECS/Component";

@observer
export class InspectorComponent extends React.Component<{ game: Game }, {}>
{
    private readonly inspector: Inspector;

    constructor(props: { game: Game })
    {
        super(props);
        this.inspector = props.game.currentScene.addGlobalSystem(new Inspector());
    }

    render()
    {
        return <div>
            <table>
                <tbody>
                <tr>
                    <th style={{textAlign: "left"}}>Entities</th>
                    <th style={{textAlign: "left"}}>Entity Info</th>
                </tr>
                <tr>
                    <td style={{verticalAlign: "top"}}>
                        <EntityList inspector={this.inspector}/>
                    </td>
                    <td style={{verticalAlign: "top"}}>
                        <EntityInfo inspector={this.inspector}/>
                    </td>
                </tr>
                </tbody>
            </table>
        </div>
    }
}

@observer
export class EntityList extends React.Component<{ inspector: Inspector }>
{
    render()
    {
        const entities = this.props.inspector.entities;

        return <ul>{entities.map((item, idx) => {
            return <li key={idx}>
                <button onClick={this.entitySelected.bind(this, idx)} key={idx}>{item}</button>
            </li>
        })}</ul>
    }

    private entitySelected(idx: number)
    {
        this.props.inspector.selectEntity(idx);
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
            return (<div>
                {this.basicInfo()}
                {this.componentList(entity)}
            </div>)
        }
        return null;
    }

    private componentList(entity: Entity)
    {
        return <div>{entity.components.map((item, idx) => {
            return <div key={idx}>
                <pre>
                    {item.constructor.name}<br/>
                    {JSON.stringify(item, (key: string, value: any) => {
                        if (value instanceof Component)
                        {
                            return value;
                        }
                        // Don't attempt to display complex types. Can work on this in the future...
                        if (!(value instanceof Object))
                        {
                            return value;
                        }
                        return undefined;
                    }, 4)}
                </pre>
            </div>
        })}</div>
    }

    private basicInfo()
    {
        if (this.props.inspector.entityStuff)
        {
            return <div>
                <pre>
                    Position<br/>
                    {JSON.stringify(this.props.inspector.entityStuff, null, 4)}
                </pre>
            </div>
        }
        return null;
    }
}