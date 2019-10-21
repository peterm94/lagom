import * as React from 'react';
import {Box, Button, Collapsible, Text} from "grommet";
import {FormDown, FormNext} from "grommet-icons";
import {Game} from "../ECS/Game";
import {observer, useLocalStore} from "mobx-react";
import {DylanInspectorSystem} from "../Inspector/DylanInspector";
import {Entity} from "../ECS/Entity";
import {observable, ObservableMap, runInAction, toJS} from "mobx";
import {useObserver, useAsObservableSource} from 'mobx-react-lite';
import {Component} from "../ECS/Component";

const EcsEntity = ({entity}: { entity: string }) => {

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
                    <Text size="small">{entity}</Text>
                </Box>
            </Button>
            <Collapsible open={open.isOpen}>
                {/*{*/}
                {/*    open.isOpen*/}
                {/*    ? <EcsEntityDetails entity={entity}/>*/}
                {/*    : null*/}
                {/*}*/}
            </Collapsible>
        </Box>
    ));
};

// const EcsEntityDetails = ({entity}: { entity: Entity }) => {
//     console.log(entity)
//     return (
//         <>
//             <div>
//                 {entity.components.map((item, idx) => {
//                     return JSON.stringify(item, (key: string, value: any) => {
//                         if (value instanceof Component)
//                         {
//                             return value;
//                         }
//                         // Don't attempt to display complex types. Can work on this in the future...
//                         if (!(value instanceof Object))
//                         {
//                             return value;
//                         }
//                         return undefined;
//                     }, 4)
//                 })}
//             </div>
//         </>);
// };

@observer
export class DylanInspectorComponent extends React.Component<{game: Game}>
{
    private inspector = this.props.game.currentScene.addGlobalSystem(new DylanInspectorSystem());

    public render()
    {
        return <EntityList entities={this.inspector.entityEntries}/>
    }
}


const EntityList = ({entities}: { entities: [string, string][] }) => {
    return (
        <>
            {entities.map((entity) => <EcsEntity key={entity[0]} entity={entity[1]}/>)}
        </>
    )
};