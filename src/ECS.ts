import * as PIXI from "pixi.js";

export class World {

    private readonly entities: Entity[] = [];
    private readonly systems: System[] = [];
    private readonly worldSystems: WorldSystem[] = [];

    gameOver: boolean = false;

    readonly app: PIXI.Application;

    constructor(options: PIXI.ApplicationOptions, backgroundCol: number) {
        this.app = new PIXI.Application(options);

        // Set it up in the page
        this.app.renderer.backgroundColor = backgroundCol;
        document.body.appendChild(this.app.view);
    }

    // Start the loop
    start() {
        this.app.ticker.add(delta => {
            return this.gameLoop(delta);
        })
    }

    private gameLoop(delta: number) {
        if (!this.gameOver) {
            this.update(delta);
        } else {
            this.app.stop();
        }
    }

    update(delta: number) {
        for (let system of this.worldSystems) {
            system.update();
        }

        for (let system of this.systems) {
            for (let entity of this.entities) {
                system.update(this, entity);
            }
        }
    }

    addSystem(system: System) {
        this.systems.push(system);
    }

    addWorldSystem(system: WorldSystem) {
        this.worldSystems.push(system);
    }

    addEntity(entity: Entity) {
        entity.world = this;
        this.entities.push(entity);
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
    protected readonly pixiObj: T;

    protected constructor(pixiComp: T) {
        super();
        this.pixiObj = pixiComp;
    }

    onAdded() {
        if (this.entity != null && this.entity.world != null)
            this.entity.world.app.stage.addChild(this.pixiObj);
    }

    onRemoved() {
        if (this.entity != null && this.entity.world != null)
            this.entity.world.app.stage.removeChild(this.pixiObj);
    }
}

export abstract class WorldSystem {
    abstract update(): void;
}

export abstract class System {

    abstract update(world: World, entity: Entity): void;
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

    world: World | null = null;

    readonly name: string;
    private readonly components: ComponentHolder[] = [];

    constructor(name: string) {
        this.name = name;
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