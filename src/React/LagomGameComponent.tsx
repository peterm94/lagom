import * as React from 'react';
import {Game} from "../ECS/Game";


export class LagomGameComponent extends React.Component<{ game: Game }, {}>
{
    game: Game;
    gameCanvas: HTMLDivElement | null = null;

    constructor(props: { game: Game })
    {
        super(props);
        this.game = props.game;
    }


    /**
     * After mounting, add the Pixi Renderer to the div and start the Application.
     */
    componentDidMount(): void
    {
        if (this.gameCanvas !== null)
        {
            this.gameCanvas.appendChild(this.game.renderer.view);
        }
        this.game.start();
    }

    componentWillUnmount(): void
    {
        // ??
    }

    /**
     * Simply render the div that will contain the Game Renderer.
     */
    render()
    {
        const component = this;
        return (
            <div ref={(thisDiv) => {
                component.gameCanvas = thisDiv;
            }}/>
        );
    }
}
