import {Entity} from "../../../ECS/Entity";
import {Timer} from "../../../Common/Timer";
import {System} from "../../../ECS/System";
import {Enemy, EnemyTag} from "../Entities/Enemy";
import {Log, MathUtil} from "../../../Common/Util";
import {HexRegister} from "../HexEntity";
import {YouWin} from "../Entities/YouWin";
import {spawn} from "child_process";
import {ScreenShake, ScreenShaker} from "../../../Common/Screenshake";

export class GameDirector extends Entity
{
    private counter!: EnemyCounter;
    private threshold = 100;
    private overThreshold = false;
    private win = false;
    private bossSpawn = false;

    constructor()
    {
        super("director", 0, 0, 0);
    }

    onAdded()
    {
        super.onAdded();

        this.counter = this.getScene().addSystem(new EnemyCounter());
        this.addComponent(new Timer(10000, undefined, true)).onTrigger.register(this.trigger.bind(this))
    }

    private trigger()
    {
        // Over the threshold, haven't displayed win yet.
        if (this.counter.count === 0 && !this.win && this.overThreshold)
        {
            const player = this.getScene().getEntityWithName("player");
            this.getScene().addEntity(new YouWin());
            this.win = true;
        }

        // Already spawned the boss, don't spawn anything else.
        if (this.bossSpawn) return;

        // Spawn the boss if there's only one enemy left and we're over the win threshold.
        this.bossSpawn = this.counter.count === 1 && this.overThreshold;

        // Do we need a new enemy?
        if (((this.counter.count === 0 || (this.counter.count < 3 && MathUtil.randomRange(0, 5) < 2)) && !this.overThreshold)
        || this.bossSpawn)
        {
            const player = this.getScene().getEntityWithName("player");
            if (!player) return;
            const reg = player.getComponent<HexRegister>(HexRegister);
            if (!reg) return;

            const currValue = reg.computeValue();

            // Once the player hits the threshold, don't spawn any more enemies.
            if (currValue > this.threshold)
            {
                this.overThreshold = true;
            }

            const enemyDist = MathUtil.randomRange(800, 1800);
            const enemyDir = MathUtil.degToRad(MathUtil.randomRange(0, 360));
            const enemyX = MathUtil.lengthDirX(enemyDist, enemyDir);
            const enemyY = MathUtil.lengthDirY(enemyDist, enemyDir);

            let enemyValue = currValue;

            // Don't let the ships be too small.
            if (enemyValue < 10) enemyValue = 10;

            if (this.bossSpawn)
            {
                enemyValue *= 2;
                this.addComponent(new ScreenShake(5, 1000));
            }
            
            Log.info("Spawning enemy at ", enemyX, enemyY);
            this.getScene().addEntity(new Enemy(enemyValue,
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