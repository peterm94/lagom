import {Component, Entity, PIXIComponent, World, WorldSystem} from "./ECS";

enum BodyType {
    Dynamic,
    Kinematic,
    Static
}

export class Rigidbody extends Component {

}

export class PhysicsSystem extends WorldSystem {
    update(world: World, delta: number, entities: Entity[]): void {
    }
}