import {Game} from "../../ECS/Game";
import {Scene} from "../../ECS/Scene";
import {System} from "../../ECS/System";
import {LagomType} from "../../ECS/LifecycleObject";
import {Component} from "../../ECS/Component";
import {Entity} from "../../ECS/Entity";
import {Key} from "../../Input/Key";
import {RenderCircle} from "../../Common/PIXIComponents";
import {ContinuousCollisionSystem, Rigidbody} from "../../Collisions/DetectCollisions";
import {CollisionMatrix} from "../../LagomCollisions/CollisionMatrix";
import {CircleCollider, CollisionType} from "../../Collisions/DetectColliders";
import {Log} from "../../Common/Util";

const Keyboard = require('pixi.js-keyboard');

class Stopper extends Component
{
}

class MoveMe extends Component
{
}

class MoveMeConst extends Component
{
}

class MoveMeConstMover extends System
{
    types(): LagomType<Component>[]
    {
        return [Rigidbody, MoveMeConst];
    }

    update(delta: number): void
    {
        this.runOnEntities((e: Entity, body: Rigidbody) => {
            body.move(0, -2 * delta);
        });
    }
}

class Mover extends System
{
    types(): LagomType<Component>[]
    {
        return [Rigidbody, MoveMe];
    }

    update(delta: number): void
    {
        const spd = 0.3;
        const rotSpd = 0.005;

        this.runOnEntities((entity: Entity, body: Rigidbody) => {
            if (Keyboard.isKeyDown(Key.KeyA))
            {
                body.move(-spd * delta, 0);
                // entity.transform.position.x -= spd * delta;
            }
            if (Keyboard.isKeyDown(Key.KeyD))
            {
                body.move(spd * delta, 0);
                // entity.transform.position.x += spd * delta;
            }
            if (Keyboard.isKeyDown(Key.KeyW))
            {
                body.move(0, -spd * delta);
                // entity.transform.position.y -= spd * delta;
            }
            if (Keyboard.isKeyDown(Key.KeyS))
            {
                body.move(0, spd * delta);
                // entity.transform.position.y += spd * delta;
            }
            if (Keyboard.isKeyDown(Key.KeyQ))
            {
                entity.transform.rotation -= rotSpd * delta;
            }
            if (Keyboard.isKeyDown(Key.KeyE))
            {
                entity.transform.rotation += rotSpd * delta;
            }

            if (Keyboard.isKeyPressed(Key.Space))
            {
                const e = this.scene.addEntity(new Entity("bulletttttt", entity.transform.x, entity.transform.y));
                e.addComponent(new Rigidbody(CollisionType.Continuous));
                e.addComponent(
                    new CircleCollider(
                        this.scene.getGlobalSystem(ContinuousCollisionSystem) as ContinuousCollisionSystem,
                        {layer: 0, radius: 5})).onTriggerEnter.register((caller, data) => {
                    Log.trace("fuck");
                    caller.parent.getComponent<MoveMeConst>(MoveMeConst)?.destroy();
                    const other = caller.parent.getComponent<Rigidbody>(Rigidbody);
                    if (other !== null) {
                        other.pendingX = 0;
                        other.pendingY = 0;
                    }
                });
                e.addComponent(new RenderCircle(0, 0, 5, 0x0000FF));
                e.addComponent(new MoveMeConst());
            }
        });
    }
}

class CompositionScene extends Scene
{
    onAdded(): void
    {
        super.onAdded();

        const matrix = new CollisionMatrix();
        matrix.addCollision(0, 0);
        const collSystem = this.addGlobalSystem(new ContinuousCollisionSystem(matrix, 5));

        this.addSystem(new MoveMeConstMover());


        const e = this.addEntity(new Entity("hello", 50, 50));

        e.addComponent(new RenderCircle(0, 0, 10));
        e.addComponent(new MoveMe());
        e.addComponent(new Rigidbody(CollisionType.Continuous));

        this.addSystem(new Mover());

        const c1 = e.addChild(new Entity("c1", 20, 0));
        c1.addComponent(new RenderCircle(0, 0, 5, 0x222255));
        c1.addComponent(new CircleCollider(collSystem, {radius: 10, layer: 0}));

        const e2 = this.addEntity(new Entity("e2", 100, 100));
        const e2col = e2.addComponent(new CircleCollider(collSystem, {radius: 20, layer: 0}));

        e2.addComponent(new RenderCircle(0, 0, 20, null, 0x00FF00));
        e2.addComponent(new Rigidbody(CollisionType.Continuous));

        e2col.onTriggerEnter.register((caller) => {
            caller.getEntity().getComponent<RenderCircle>(RenderCircle)?.destroy();
            caller.getEntity().addComponent(new RenderCircle(0, 0, 20, null, 0xFF0000));
        });
        e2col.onTriggerExit.register((caller) => {
            caller.getEntity().getComponent<RenderCircle>(RenderCircle)?.destroy();
            caller.getEntity().addComponent(new RenderCircle(0, 0, 20, null, 0x00FF00));
        });
    }
}

export class Composition extends Game
{
    constructor()
    {
        super({
                  width: 512,
                  height: 512,
                  resolution: 1,
                  backgroundColor: 0x200140
              });

        this.setScene(new CompositionScene(this));
    }
}
