import './index.css';
import * as serviceWorker from './serviceWorker';
import {Platformer} from "./examples/Platformer/Platformer";
import * as React from "react";
import * as ReactDOM from "react-dom";
import {LagomGameComponent} from "./React/LagomGameComponent";
import {InspectorComponent} from "./React/InspectorComponents";

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();

const game = new Platformer();
// const game = new MatterAsteroids();

ReactDOM.render(
    <div>
        <LagomGameComponent game={game}/>
        <InspectorComponent game={game}/>
    </div>,
    document.getElementById("root"));