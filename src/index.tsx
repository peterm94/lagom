import './index.css';
import * as serviceWorker from './serviceWorker';
import * as PIXI from 'pixi.js'
import {Entity, World} from './ECS'
import {Sprite, Text} from './Components'

import wall from './resources/tilesetx3.png'

let setup = () => {

    let spr = new Sprite(resources[wall].texture);
};


let Application = PIXI.Application,
    loader = PIXI.loader,
    resources = PIXI.loader.resources,
    Rectangle = PIXI.Rectangle;


// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();

// TODO this needs to do everything and wait before starting the app
loader.add(wall).load(() => {

    let world = new World({width: 256, height: 256, resolution: 2}, 0x00F5F0);

    let player = new Entity("player");
    world.addEntity(player);
    player.addComponent(new Sprite(resources[wall].texture));
    player.addComponent(new Text(new PIXI.Text("HELLO HOW ARE YOU")));
    world.start();
});

