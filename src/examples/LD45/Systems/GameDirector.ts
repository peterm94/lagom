import {Entity} from "../../../ECS/Entity";
import {Timer} from "../../../Common/Timer";
import {System} from "../../../ECS/System";
import {Enemy, EnemyTag} from "../Entities/Enemy";
import {Log, MathUtil} from "../../../Common/Util";
import {HexRegister} from "../HexEntity";

export class GameDirector extends Entity
{
    private counter!: EnemyCounter;

    constructor()
    {
        super("director", 0, 0, 0);
    }

    onAdded()
    {
        super.onAdded();

        this.counter = this.getScene().addSystem(new EnemyCounter());
        this.addComponent(new Timer(5000, undefined, true)).onTrigger.register(this.trigger.bind(this))
    }

    private trigger()
    {
        // Do we need a new enemy?
        if (this.counter.count === 0 || (this.counter.count < 3 && MathUtil.randomRange(0, 5) < 2))
        {
            const player = this.getScene().getEntityWithName("player");
            if (!player) return;
            const reg = player.getComponent<HexRegister>(HexRegister);
            if (!reg) return;

            const currValue = reg.computeValue();

            const enemyDist = MathUtil.randomRange(400, 1200);
            const enemyDir = MathUtil.degToRad(MathUtil.randomRange(0, 360));
            const enemyX = MathUtil.lengthDirX(enemyDist, enemyDir);
            const enemyY = MathUtil.lengthDirY(enemyDist, enemyDir);

            Log.info("Spawning enemy at ", enemyX, enemyY);
            this.getScene().addEntity(new Enemy(currValue + 4,
                                                player.transform.x + enemyX,
                                                player.transform.y + enemyY));
        }
    }
}

export class EnemyCounter extends System
{
    count: number = 0;

    types = () => [EnemyTag];

    update(delta: number): void
    {
        let count = 0;
        this.runOnEntities(() => count++);
        this.count = count;
    }
}