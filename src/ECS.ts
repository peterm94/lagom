import * as PIXI from "pixi.js";
import {Smoothie} from "./Smoothie";

const Keyboard = require('pixi.js-keyboard');

// const Mouse = require('pixi.js-mouse');

export class World {

    static instance: World;

    private readonly entities: Entity[] = [];
    private readonly systems: System[] = [];
    private readonly worldSystems: WorldSystem[] = [];

    // Set this to end the game
    gameOver: boolean = false;

    readonly app: PIXI.Application;
    readonly smoothie: Smoothie;
    readonly mainTicker: PIXI.ticker.Ticker;

    constructor(options: PIXI.ApplicationOptions, backgroundCol: number) {

        World.instance = this;

        this.app = new PIXI.Application(options);

        this.smoothie = new Smoothie(this.app.renderer, this.app.stage, this.gameLoop.bind(this), true, 144, -1);

        // Set it up in the page
        this.app.renderer.backgroundColor = backgroundCol;
        document.body.appendChild(this.app.view);

        this.mainTicker = this.app.ticker.add(delta => {
            return this.gameLoop(delta);
        });
        this.mainTicker.stop();
    }

    private testUpdate() {
        console.log("OOF")
    }

    // Start the loop
    start() {

        // this.smoothie.start();
        this.mainTicker.start();
    }

    private gameLoop(delta: number) {

        // const delta = this.smoothie.dt;

        if (!this.gameOver) {
            // Update input event listeners
            Keyboard.update();
            // Mouse.update();

            this.update(delta);
        } else {
            this.app.stop();
        }
    }

    update(delta: number) {
        for (let system of this.worldSystems) {
            system.update(delta);
        }

        for (let system of this.systems) {
            for (let entity of this.entities) {
                system.update(this, delta, entity);
            }
        }
    }

    addSystem(system: System): System {
        this.systems.push(system);
        return system;
    }

    addWorldSystem(system: WorldSystem): WorldSystem {
        this.worldSystems.push(system);
        return system;
    }

    addEntity(entity: Entity): Entity {
        this.entities.push(entity);
        return entity;
    }

    removeSystem(system: System) {
        remove(this.systems, system);
    }

    removeWorldSystem(system: WorldSystem) {
        remove(this.worldSystems, system);
    }

    removeEntity(entity: Entity) {
        remove(this.entities, entity);
    }

    runOnEntities(f: Function, entity: Entity, ...types: string[]) {
        let ret: Component[] = [];
        for (let type of types) {
            let comp = entity.getComponent(type);
            if (comp == null) return;

            ret.push(comp);
        }
        f(entity, ...ret);
    }
}

export abstract class Component {

    entity: Entity | null = null;

    id() {
        return this.constructor.name;
    }

    onAdded() {
    }

    onRemoved() {
    }
}

export abstract class PIXIComponent<T extends PIXI.DisplayObject> extends Component {
    readonly pixiObj: T;

    protected constructor(pixiComp: T) {
        super();
        this.pixiObj = pixiComp;
    }

    onAdded() {
        if (this.entity != null)
            this.entity.transform.addChild(this.pixiObj);
    }

    onRemoved() {
        if (this.entity != null)
            this.entity.transform.removeChild(this.pixiObj);
    }
}

export abstract class WorldSystem {
    abstract update(delta: number): void;
}

export abstract class System {

    abstract update(world: World, delta: number, entity: Entity): void;
}

class ComponentHolder {
    readonly id: string;
    readonly comp: Component;

    constructor(id: string, comp: Component) {
        this.id = id;
        this.comp = comp;
    }
}

export class Entity {

    transform: PIXI.Container;

    // TODO add this as a pixi object and make everything in it relative to it? as children?

    readonly name: string;
    private readonly components: ComponentHolder[] = [];

    constructor(name: string, x: number = 0, y: number = 0) {
        this.name = name;

        this.transform = new PIXI.Container();
        this.transform.x = x;
        this.transform.y = y;
        World.instance.app.stage.addChild(this.transform);
    }

    addComponent(component: Component): Entity {
        component.entity = this;
        this.components.push(new ComponentHolder(component.id(), component));
        component.onAdded();
        return this;
    }

    getComponentsOfType<T extends Component>(type: string): T[] {
        let matches = this.components.filter(value => value.id == type);
        return matches.map(value => value.comp) as T[];
    }

    getComponent<T extends Component>(type: string): T | null {
        let found = this.components.find(value => value.id == type);
        return found != undefined ? found.comp as T : null;
    }

    removeComponent(component: Component) {
        component.onRemoved();
        remove(this.components, this.components.find(value => value.comp === component));
    }
}

function remove<T>(list: T[], element: T) {
    let idx = list.indexOf(element);

    if (idx > -1) {
        list.splice(idx, 1);
    }
}