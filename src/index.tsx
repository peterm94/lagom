import './index.css';
import * as serviceWorker from './serviceWorker';
import {Asteroids} from "./examples/Asteroids";
import {Downshaft} from "./examples/Downshaft";

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();

new Asteroids();
// new Downshaft();