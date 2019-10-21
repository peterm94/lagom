import * as React from 'react';
import {Box, Button, Collapsible, Text} from "grommet";
import {FormDown, FormNext} from "grommet-icons";
import {Game} from "../ECS/Game";
import {observer, useLocalStore} from "mobx-react";
import {DylanInspectorSystem, InspectorEntity} from "../Inspector/DylanInspector";
import {observable, runInAction} from "mobx";
import {useObserver} from 'mobx-react-lite';
import {Component} from "../ECS/Component";

const EcsEntity = ({entity, inspector}: { entity: InspectorEntity, inspector: DylanInspectorSystem }) => {

    const open = useLocalStore(() => ({
        isOpen: false,
        toggle()
        {
            runInAction(() => this.isOpen = !this.isOpen);
        }
    }));

    const Icon = open.isOpen ? FormDown : FormNext;

    return useObserver(() => (
        <Box>
            <Button hoverIndicator="background" onClick={open.toggle}>
                <Box direction="row" align="center" pad="xsmall">
                    <Icon color="brand"/>
                    <Text size="small">{entity[1]}</Text>
                </Box>
            </Button>
            <Collapsible open={open.isOpen}>
                {
                    open.isOpen
                    ? <EcsEntityDetails entity={entity} inspector={inspector}/>
                    : null
                }
            </Collapsible>
        </Box>
    ));
};

@observer
class EcsEntityDetails extends React.PureComponent<{ entity: InspectorEntity, inspector: DylanInspectorSystem }>
{
    componentDidMount()
    {
        setInterval(() => this.setState({time: Date.now()}), 100)
    }

    // TODO why isn't this observing change :(
    @observable
    public entity = this.props.inspector!.entityMap.get(this.props.entity[0]);

    public render()
    {
        console.log(this.entity);

        // TODO pretty render.
        return (
            <div>
                {this.entity!.components.map((item, idx) => {
                    return JSON.stringify(item, (key: string, value: any) => {
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
                    }, 4)
                })}
            </div>
        )
    }
}

export class DylanInspectorComponent extends React.PureComponent<{ game: Game }>
{
    private inspector = this.props.game.currentScene.addGlobalSystem(new DylanInspectorSystem());

    public render()
    {
        return (
            <EntityList inspector={this.inspector}/>
        );
    }
}

@observer
class EntityList extends React.PureComponent<{ inspector: DylanInspectorSystem }>
{
    public render()
    {
        return (
            <>
                {this.props.inspector.entityEntries.map((entity) => <EcsEntity key={entity[0]} entity={entity} inspector={this.props.inspector}/>)}
            </>
        );
    }
}
