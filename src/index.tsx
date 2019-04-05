import './index.css';
import * as serviceWorker from './serviceWorker';
import * as PIXI from 'pixi.js'
import {Component, Entity, System, World} from './ECS'
import {Sprite, TextDisp} from './Components'
import wall from './resources/tilesetx3.png'
import {Diagnostics} from "./Debug";

// https://www.npmjs.com/package/pixi.js-keyboard
const Keyboard = require('pixi.js-keyboard');

let setup = () => {

    let spr = new Sprite(resources[wall].texture);
};

let loader    = PIXI.loader,
    resources = PIXI.loader.resources;

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();

// TODO this needs to do everything and wait before starting the app
loader.add(wall).load(() => {

    let world = new World({width: 256, height: 256, resolution: 2}, 0x00F5F0);

    let player = new Entity("player", 0, 50);
    world.addEntity(player);
    player.addComponent(new Sprite(resources[wall].texture));
    player.addComponent(new TextDisp("HELLO HOW ARE YOU"));
    player.addComponent(new PlayerControlled());

    world.addEntity(new Diagnostics());

    world.addSystem(new Mover());
    world.start();
});


class PlayerControlled extends Component {
}

class Mover extends System {
    update(world: World, delta: number, entity: Entity): void {
        World.runOnEntity(() => {

            if (Keyboard.isKeyDown('ArrowLeft', 'KeyA')) {
                entity.transform.x -= 4 * delta;
            }
            if (Keyboard.isKeyDown('ArrowRight', 'KeyD')) {
                entity.transform.x += 4 * delta;
            }
            if (Keyboard.isKeyDown('ArrowUp', 'KeyW')) {
                entity.transform.y -= 4 * delta;
            }
            if (Keyboard.isKeyDown('ArrowDown', 'KeyS')) {
                entity.transform.y += 4 * delta;
            }

        }, entity, PlayerControlled)
    }
}

