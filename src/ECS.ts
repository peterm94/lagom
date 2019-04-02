import {Iterator} from "typescript";

export class World {
    readonly entities: Entity[] = [];
    readonly systems: System[] = [];

    update() {
        for (let system of this.systems) {

            for (let entity of this.entities) {
                system.update(entity);
            }
        }
    }

    addSystem(system: System) {
        this.systems.push(system);
    }

    removeSystem(system: System) {
        remove(this.systems, system);
    }

    runOnEntities(f: Function, entity: Entity, ...types: string[]) {
        let ret: Component[] = [];
        for (let i in types) {
            let type = types[i];

            let comp = entity.getComponent(type);
            if (comp == null) return;

            ret.push(comp);
        }
        f(entity, ...ret);
    }
}

export interface SystemData {
}

export abstract class Component {

    readonly id: string;

    constructor() {
        // hurr duurr javascript
        this.id = this.constructor.name;
    }
}

export class XX extends Component {
    hello: string;

    constructor(hello: string) {
        super();
        this.hello = hello;
    }
}

export class YY extends Component {

}

function remove<T>(list: T[], element: T) {
    let idx = list.indexOf(element);

    if (idx > -1) {
        list.splice(idx, 1);
    }
}

export abstract class System {

    world: World;

    protected constructor(world: World) {
        this.world = world;
    }

    abstract update(entity: Entity): void;
}

export class TestSysData implements SystemData {
    public xx: XX;

    constructor(xx: XX) {
        this.xx = xx;
    }
}

function banana(entity: Entity, b: YY, c: XX) {
    console.log("hello?")
}

export class TestSys extends System {
    constructor(world: World) {

        super(world);
    }

    update(entity: Entity): void {
        let data = this.world.runOnEntities(banana, entity, "YY", "XX");
    }
}

export class ComponentHolder {
    readonly id: string;
    readonly comp: Component;

    constructor(id: string, comp: Component) {
        this.id = id;
        this.comp = comp;
    }
}

export class Entity {

    readonly name: string;
    private components: ComponentHolder[] = [];

    constructor(name: string) {
        this.name = name;
    }

    addComponent(component: Component): Entity {

        this.components.push(new ComponentHolder(component.id, component));

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
        remove(this.components, component);
    }
}