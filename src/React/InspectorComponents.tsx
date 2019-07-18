import * as React from 'react';
import {Game} from "../ECS/Game";
import {Inspector} from "../Inspector/Inspector";

export class InspectorComponent extends React.Component<{ game: Game }, {}>
{
    private inspector: Inspector;

    constructor(props: { game: Game })
    {
        super(props);
        this.inspector = props.game.currentScene.addGlobalSystem(new Inspector(this));
    }

    render()
    {
        return <div>
            <EntityList/>
            <EntityInfo/>
        </div>;
    }
}

export class EntityList extends React.Component<{}, { entities: string[] }>
{
    constructor(props: {})
    {
        super(props);
        this.state = {entities: []}
    }

    render()
    {
        return (<ul>{this.state.entities.map((item, idx) => {
            return <li key={idx}>{item}</li>
        })}</ul>)
    }
}

export class EntityInfo extends React.Component<{}, {}>
{
    render()
    {
        return <div>hello</div>;
    }
}