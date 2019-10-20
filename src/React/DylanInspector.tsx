import * as React from 'react';
import {Box, Button, Collapsible, Text} from "grommet";
import {FormDown, FormNext} from "grommet-icons";
import {Game} from "../ECS/Game";
import {observer, useLocalStore} from "mobx-react";
import {DylanInspectorSystem} from "../Inspector/DylanInspector";
import {Entity} from "../ECS/Entity";
import {observable, toJS} from "mobx";
import {useObserver, useAsObservableSource} from 'mobx-react-lite';
import {Component} from "../ECS/Component";

const EcsEntity = ({entity}: { entity: Entity }) => {

    const open = useLocalStore(() => ({
        isOpen: false,
        toggle()
        {
            this.isOpen = !this.isOpen
        }
    }));

    const Icon = open.isOpen ? FormDown : FormNext;

    return (
        <Box>
            <Button hoverIndicator="background" onClick={open.toggle}>
                <Box direction="row" align="center" pad="xsmall">
                    <Icon color="brand"/>
                    <Text size="small">{entity.name}</Text>
                </Box>
            </Button>
            <Collapsible open={open.isOpen}>
                {
                    open.isOpen
                    ? <EcsEntityDetails entity={entity}/>
                    : null
                }
            </Collapsible>
        </Box>
    );
};

// TODO remove mobx so shit isn't busted hopefully. I can't print the entity for some reason??

const EcsEntityDetails = ({entity}: { entity: Entity }) => {
    console.log(entity)
    return (
        <>
            <div>
                {entity.components.map((item, idx) => {
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
        </>);
};

export const DylanInspector = ({game}: { game: Game }) => {

    const inspector = useAsObservableSource(game.currentScene.addGlobalSystem(new DylanInspectorSystem()));

    return useObserver(() => <EntityList entities={inspector.entities}/>);
};

const EntityList = ({entities}: { entities: Entity[] }) => {
    return (
        <>
            {entities.map((entity, i) => <EcsEntity key={i} entity={entity}/>)}
        </>
    )
};