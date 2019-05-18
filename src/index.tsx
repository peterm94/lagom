import './index.css';
import * as serviceWorker from './serviceWorker';
import {Asteroids} from "./examples/Asteroids";
import {Downshaft} from "./examples/Downshaft";
import {MatterAsteroids} from "./examples/MatterAsteroids";
import {PerfTest} from "./examples/PerfTest";
import {DetectDemo} from "./examples/DetectDemo";
import {CameraDemo} from "./examples/CameraDemo";

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();

switch (window.location.search.substr(1).toLowerCase())
{
    case "downshaft":
        new Downshaft();
        break;
    case "matter":
        new MatterAsteroids();
        break;
    case "perf":
        new PerfTest();
        break;
    case "asteroids":
        new Asteroids();
        break;
    case "detect":
        new DetectDemo();
        break;
    default:
        new CameraDemo();
}