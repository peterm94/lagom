import * as React from 'react';
import {Game} from "../ECS/Game";

interface IMainProps
{
    game: Game;
}

export class LagomGameComponent extends React.Component<IMainProps, {}>
{
    game: Game;
    gameCanvas: HTMLDivElement | null = null;

    constructor(props: IMainProps)
    {
        super(props);
        this.game = props.game;
    }


    /**
     * After mounting, add the Pixi Renderer to the div and start the Application.
     */
    componentDidMount()
    {
        if (this.gameCanvas !== null)
        {
            this.gameCanvas.appendChild(this.game.renderer.view);
        }
        this.game.start();
    }

    componentWillUnmount()
    {
        // ??
    }

    /**
     * Simply render the div that will contain the Game Renderer.
     */
    render()
    {
        let component = this;
        return (
            <div ref={(thisDiv) => {
                component.gameCanvas = thisDiv
            }}/>
        );
    }
}