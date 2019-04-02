import './index.css';
import * as serviceWorker from './serviceWorker';
import * as PIXI from 'pixi.js'
import {Entity, TestSys, World, XX, YY} from './ECS'

import wall from './resources/tilesetx3.png'

let setup = () => {

    let spr = new Sprite(resources[wall].texture);

    app.ticker.add(delta => {
        return gameLoop(delta);
    });
    app.stage.addChild(spr);
};


let Application = PIXI.Application,
    loader = PIXI.loader,
    resources = PIXI.loader.resources,
    Sprite = PIXI.Sprite,
    Rectangle = PIXI.Rectangle;


// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();


let app = new Application({width: 256, height: 256, resolution: 2});

app.renderer.backgroundColor = 0x00F5F0;

document.body.appendChild(app.view);

loader.add(wall).load(setup);


let world = new World();
world.addSystem(new TestSys(world));
let e = new Entity("GIVME");
world.entities.push(e);
e.addComponent(new XX("hello"));
e.addComponent(new YY());

e.getComponent("YY");

world.update();

function gameLoop(delta: number) {
    app.stage.getChildAt(0).position.x += delta;
}


