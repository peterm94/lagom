import './index.css';
import * as serviceWorker from './serviceWorker';
import {DetectDemo} from "./examples/DetectDemo";
import * as React from "react";
import * as ReactDOM from "react-dom";
import {Scene} from "./ECS/Scene";
import {store} from "./redux/store";
import {connect, Provider} from "react-redux";

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();

//
// class Game extends React.Component<{game: Scene}>
// {
//     static defaultProps = {game: new DetectDemo};
//
//     render()
//     {
//         if (Game.defaultProps.game !== null)
//         {
//             for (let entity of Game.defaultProps.game.entities)
//             {
//                 return <div>{entity.name}</div>
//             }
//         }
//         return <div>banana</div>
//     }
// }

class EntityList extends React.Component<{ entityNames: string[] }>
{
    static defaultProps = {entityNames: ["thui", "baa"]};

    render()
    {
        return (<ul>{this.props.entityNames.map((item, idx) => {
            return <li key={idx}>{item}</li>
        })}</ul>)
    }
}

const mapStateToProps = (state: {}) => (
    {
        name: "banana"
    });

const dispatchProps = {

};

const LinkyList = connect(mapStateToProps, dispatchProps)(EntityList);

//
// switch (window.location.search.substr(1).toLowerCase())
// {
//     case "downshaft":
//         new Downshaft();
//         break;
//     case "matter":
//         new MatterAsteroids();
//         break;
//     case "perf":
//         new PerfTest();
//         break;
//     case "asteroids":
//         new Asteroids();
//         break;
//     default:
//         new DetectDemo();
// }

ReactDOM.render(
    <Provider store={store}>
        <LinkyList/>
    </Provider>
    , document.getElementById("root"));