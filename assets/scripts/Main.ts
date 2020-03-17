import Utils from "./Utils";
import Block from './Block';
import {Direction, TwoIndex} from "./interface";
import array = cc.js.array;

const {ccclass, property} = cc._decorator;

@ccclass
export default class Main extends cc.Component {
    // 分数
    @property(cc.Label)
    ScoreLabel: cc.Label = null;

    // 块预制体
    @property(cc.Prefab)
    BlockPrefab: cc.Prefab = null;

    // 背景层
    @property(cc.Node)
    BackLayerNode: cc.Node = null;

    // 数字层
    @property(cc.Node)
    ForeLayerNode: cc.Node = null;

    @property(cc.Node)
    GameOverLayer: cc.Node = null;

    // 块的大小
    public blockSize: number;

    // 分数
    public score: number = 0;

    // 存储块的位置
    public blockPos: cc.Vec2[][] = [];

    // 所有数字块
    public blocks: cc.Node | null[][] = [];

    // 存储数据的数组
    public blockData: number[][] = [];

    // 块的对象池
    public BlockPool: cc.NodePool = new cc.NodePool();

    // 初始点击位置
    private startPoint: cc.Vec2;

    // 本次滑动是否合并过
    private isMergeArr: boolean[][] = [];

    // 是否有移动
    private hasMove: boolean = false;


    protected onLoad(): void {
        this.createBgBlock();
        this.init();
        this.node.on(cc.Node.EventType.TOUCH_START, (e: cc.Touch): void => {
            this.startPoint = e.getLocation();
        }, this);

        this.node.on(cc.Node.EventType.TOUCH_END, this.touchEnd, this);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this.touchEnd, this);
    };

    private touchEnd(e: cc.Touch): void {
        const endPoint: cc.Vec2 = e.getLocation().subSelf(this.startPoint);
        if (endPoint.mag() < Utils.MIN_TOUCH_DIR) return;
        let ry = endPoint.y;
        if (Math.abs(endPoint.x) > Math.abs(ry)) {
            if (endPoint.x > 0) {
                this.moveBlock(Direction.RIGHT);
            } else {
                this.moveBlock(Direction.LEFT);
            }
        } else {
            if (endPoint.y > 0) {
                this.moveBlock(Direction.UP);
            } else {
                this.moveBlock(Direction.DOWN);
            }
        }
    }

    /**
     * 触摸移动数字
     * @param dir 方向
     */
    private moveBlock(dir: Direction): void {
        // 本次的所有块
        let moveBlock: TwoIndex[] = [];
        this.hasMove = false;
        // 计数，最后一个的时候执行回调函数
        let counter = 0;

        // 判断方向
        switch (dir) {
            case 'left':
                // 往左滑动。j从0的位置开始存储所有块
                for (let i = 0; i < Utils.ROWS; i++) {
                    for (let j = 0; j < Utils.ROWS; j++) {
                        this.isMergeArr[i][j] = false;
                        if (this.blockData[i][j] !== 0) {
                            moveBlock.push({i, j});
                        }
                    }
                }
                // 遍历全部的块，进行移动
                for (let i = 0; i < moveBlock.length; i++) {
                    this.moveAnimLeft(moveBlock[i].i, moveBlock[i].j, (): void => {
                        counter++;
                        if (counter === moveBlock.length) {
                            this.afterMove();
                        }
                    });
                }
                break;
            case 'right':
                // 往右滑动。j从0最后的位置开始存储所有块
                for (let i = 0; i < Utils.ROWS; ++i) {
                    for (let j = Utils.ROWS - 1; j >= 0; --j) {
                        this.isMergeArr[i][j] = false;
                        if (this.blockData[i][j] != 0) {
                            moveBlock.push({i, j});
                        }
                    }
                }
                for (let i = 0; i < moveBlock.length; i++) {
                    this.moveAnimRight(moveBlock[i].i, moveBlock[i].j, (): void => {
                        counter++;
                        if (counter === moveBlock.length) {
                            this.afterMove();
                        }
                    });
                }
                break;
            case 'down':
                // 往右滑动。i从0开始的位置开始存储所有块
                for (let i = 0; i < Utils.ROWS; i++) {
                    for (let j = 0; j < Utils.ROWS; j++) {
                        this.isMergeArr[i][j] = false;
                        if (this.blockData[i][j] !== 0) {
                            moveBlock.push({i, j});
                        }
                    }
                }

                for (let i = 0; i < moveBlock.length; i++) {
                    this.moveAnimDown(moveBlock[i].i, moveBlock[i].j, (): void => {
                        counter++;
                        if (counter === moveBlock.length) {
                            this.afterMove();
                        }
                    });
                }
                break;
            case 'up':
                // 往右滑动。i从最后的位置开始存储所有块
                for (let i = Utils.ROWS - 1; i >= 0; i--) {
                    for (let j = Utils.ROWS - 1; j >= 0; --j) {
                        this.isMergeArr[i][j] = false;
                        if (this.blockData[i][j] != 0) {
                            moveBlock.push({i, j});
                        }
                    }
                }

                for (let i = 0; i < moveBlock.length; i++) {
                    this.moveAnimUp(moveBlock[i].i, moveBlock[i].j, (): void => {
                        counter++;
                        if (counter === moveBlock.length) {
                            this.afterMove();
                        }
                    });
                }
                break;
        }
    }

    // 移动结束的回调
    private afterMove(): void {
        if (this.hasMove) {
            this.createBlock();
            this.updateScore(this.score + 1);
        } else if (this.checkFail()) {
            this.GameOverLayer.active = true;
        }

    }

    /**
     * 向左边移动
     * @param i 横坐标
     * @param j 纵坐标
     * @param callback 回调
     */
    private moveAnimLeft(i: number, j: number, callback: Function): void {
        if (j === 0 || this.blockData[i][j] === 0) {
            callback && callback();
            return;
        }
        // 可以移动的个数
        let c: number = 0;
        // 是否有合并
        let hasMerge: boolean = false;
        for (let n = 1; n <= j; n++) {
            // 0 代表空格，可以移动，c+1
            if (this.blockData[i][j - n] === 0) {
                c++;
                // 如果下个和当前的格子数值一样，并且本次移动是没有合并过的，则合并
            } else if (this.blockData[i][j - n] === this.blockData[i][j] && !this.isMergeArr[i][j - n]) {
                c++;
                hasMerge = true;
                break;
            } else {
                // 不是空格切不能合并的时候，退出循环
                break;
            }
        }
        if (c === 0 && !hasMerge) {
            callback && callback();
        } else {
            let block: cc.Node = this.blocks[i][j];
            let position = this.blockPos[i][j - c];
            this.blocks[i][j] = null;
            this.blockData[i][j - c] = this.blockData[i][j];
            this.blockData[i][j] = 0;
            if (hasMerge) {
                this.isMergeArr[i][j - c] = true;
                this.blockData[i][j - c] *= 2;
                cc.tween(block)
                    .to(Utils.SLIDE_TIME, {position: position})
                    .call(e => {
                        this.doMerge(block, this.blocks[i][j - c], this.blockData[i][j - c], callback)
                    })
                    .start();
            } else {
                this.blocks[i][j - c] = block;
                cc.tween(block)
                    .to(Utils.SLIDE_TIME, {position: position})
                    .call(e => {
                        // this.moveAnimLeft(i, j + 1, callback);
                        callback && callback();
                    })
                    .start();
            }
            this.hasMove = true;
        }
    }

    private moveAnimRight(i: number, j: number, callback: Function): void {

        if (j === Utils.ROWS - 1 || this.blockData[i][j] === 0) {
            callback && callback();
            return;
        }
        let c: number = 0;
        let hasMerge: boolean = false;
        for (let n = 1; n <= Utils.ROWS - 1 - j; n++) {
            if (this.blockData[i][j + n] === 0) {
                c++;
            } else if ((this.blockData[i][j + n] === this.blockData[i][j] && !this.isMergeArr[i][j + n])) {
                c++;
                hasMerge = true;
                break;
            } else {
                break;
            }
        }

        if (c === 0 && !hasMerge) {
            callback && callback();
        } else {
            let block: cc.Node = this.blocks[i][j];
            let position = this.blockPos[i][j + c];
            this.blockData[i][j + c] = this.blockData[i][j];
            this.blockData[i][j] = 0;
            this.blocks[i][j] = null;
            if (hasMerge) {
                this.isMergeArr[i][j + c] = true;
                this.blockData[i][j + c] *= 2;
                cc.tween(block)
                    .to(Utils.SLIDE_TIME, {position: position})
                    .call(e => {
                        this.doMerge(block, this.blocks[i][j + c], this.blockData[i][j + c], callback)
                    })
                    .start();
            } else {
                this.blocks[i][j + c] = block;
                cc.tween(block)
                    .to(Utils.SLIDE_TIME, {position: position})
                    .call(e => {
                        callback && callback();
                    })
                    .start();
            }
            this.hasMove = true;
        }
    }


    private moveAnimDown(i: number, j: number, callback: Function): void {
        if (i === 0 || this.blockData[i][j] === 0) {
            callback && callback();
            return;
        }
        let c: number = 0;
        let hasMerge: boolean = false;
        for (let n = 1; n <= i; n++) {
            if (this.blockData[i - n][j] === 0) {
                c++;
            } else if (this.blockData[i - n][j] === this.blockData[i][j] && !this.isMergeArr[i - n][j]) {
                c++;
                hasMerge = true;
                break;
            } else {
                break;
            }
        }
        if (c === 0 && !hasMerge) {
            callback && callback();
        } else {
            let block: cc.Node = this.blocks[i][j];
            let position = this.blockPos[i - c][j];
            this.blocks[i][j] = null;
            this.blockData[i - c][j] = this.blockData[i][j];
            this.blockData[i][j] = 0;
            if (hasMerge) {
                this.isMergeArr[i - c][j] = true;
                this.blockData[i - c][j] *= 2;
                cc.tween(block)
                    .to(Utils.SLIDE_TIME, {position: position})
                    .call(e => {
                        this.doMerge(block, this.blocks[i - c][j], this.blockData[i - c][j], callback)
                    })
                    .start();
            } else {
                this.blocks[i - c][j] = block;
                cc.tween(block)
                    .to(Utils.SLIDE_TIME, {position: position})
                    .call(e => {
                        callback && callback();
                    })
                    .start();
            }
            this.hasMove = true;
        }
    }

    private moveAnimUp(i: number, j: number, callback: Function): void {
        if (i === Utils.ROWS - 1 || this.blockData[i][j] === 0) {
            callback && callback();
            return;
        }
        let c: number = 0;
        let hasMerge: boolean = false;
        for (let n = 1; n <= Utils.ROWS - 1 - i; n++) {
            if (this.blockData[i + n][j] === 0) {
                c++;
            } else if ((this.blockData[i + n][j] === this.blockData[i][j] && !this.isMergeArr[i + n][j])) {
                c++;
                hasMerge = true;
                break;
            } else {
                break;
            }
        }

        if (c === 0 && !hasMerge) {
            callback && callback();
        } else {
            let block: cc.Node = this.blocks[i][j];
            let position = this.blockPos[i + c][j];
            this.blockData[i + c][j] = this.blockData[i][j];
            this.blockData[i][j] = 0;
            this.blocks[i][j] = null;
            if (hasMerge) {
                this.isMergeArr[i + c][j] = true;
                this.blockData[i + c][j] *= 2;
                cc.tween(block)
                    .to(Utils.SLIDE_TIME, {position: position})
                    .call(e => {
                        this.doMerge(block, this.blocks[i + c][j], this.blockData[i + c][j], callback)
                    })
                    .start();
            } else {
                this.blocks[i + c][j] = block;
                cc.tween(block)
                    .to(Utils.SLIDE_TIME, {position: position})
                    .call(e => {
                        callback && callback();
                    })
                    .start();
            }
            this.hasMove = true;
        }
    }


    /**
     * 检查失败，每个格子上下左右都不能移动的时候，游戏结束
     */
    private checkFail(): boolean {
        for (let i = 0; i < Utils.ROWS; i++) {
            for (let j = 0; j < Utils.ROWS; j++) {
                const data = this.blockData[i][j];
                if (data === 0) return false;
                if (j > 0 && data === this.blockData[i][j - 1]) return false;
                if (j < Utils.ROWS && data === this.blockData[i][j + 1]) return false;
                if (i > 0 && this.blockData[i - 1][j] === data) return false;
                if (i < Utils.ROWS && data === this.blockData[i + 1][j]) return false;
            }
        }
        return true;
    }


    /**
     * 合并数字
     * @param b1 目标块（需要销毁的）
     * @param b2 当前块
     * @param newNumber 合并之后的数字
     * @param callback 回调函数
     */
    private doMerge(b1: cc.Node, b2: cc.Node, newNumber: number, callback: Function): void {
        this.BlockPool.put(b1);
        // 进行放大，设置数值
        const scaleBig = cc.tween().to(0.1, {scale: 1.05}).call(e => {
            b2.getComponent(Block).setNumber(newNumber);
        });
        // 缩小
        const scaleSmall = cc.tween().to(0.1, {scale: 1}).call(callback);
        cc.tween(b2)
            .then(scaleBig)
            .then(scaleSmall)
            .start()

    }

    // 创建背景块
    private createBgBlock(): void {
        this.blockSize = (cc.winSize.width - Utils.GAP * (Utils.ROWS + 1)) / Utils.ROWS;
        let offsetX = Utils.GAP + this.blockSize / 2;
        let offsetY = Utils.GAP + this.blockSize;
        for (let i = 0; i < Utils.ROWS; i++) {
            this.blockPos[i] = [];
            for (let j = 0; j < Utils.ROWS; j++) {
                const pos: cc.Vec2 = cc.v2(offsetX, offsetY);
                const block = cc.instantiate(this.BlockPrefab);
                this.blockPos[i][j] = pos;
                // 每一块的间距X轴递增
                offsetX += Utils.GAP + this.blockSize;
                block.getComponent(Block).init(0, this.blockSize, pos);
                block.parent = this.BackLayerNode;
            }
            // 重置X轴的位置从左边开始
            offsetY += Utils.GAP + this.blockSize;
            // 递增Y轴的位置
            offsetX = Utils.GAP + this.blockSize / 2;
        }
    }

    // 初始化
    public init(): void {
        this.GameOverLayer.active = false;
        this.updateScore();
        // 节点的数量实时更新，所以要从后面减开始
        for (let i = this.ForeLayerNode.childrenCount; i >= 0; i--) {
            this.BlockPool.put(this.ForeLayerNode.children[i]);
        }

        // 初始化block数组
        for (let i = 0; i < Utils.ROWS; i++) {
            this.blockData[i] = [];
            this.isMergeArr[i] = [];
            this.blocks[i] = [];
            for (let j = 0; j < Utils.ROWS; j++) {
                this.blockData[i][j] = 0;
                if (this.blocks[i][j]) {
                    this.BlockPool.put(this.blocks[i][j]);
                }
                this.blocks[i][j] = null;
                this.isMergeArr[i][j] = false;
            }
        }
        for (let i = 0; i < 2; i++) {
            this.createBlock();
        }
    }


    // 创建数字块
    public createBlock(): void {
        let block: cc.Node = null;
        if (this.BlockPool.size() > 0) {
            block = this.BlockPool.get();
        }

        let emptyBlock = this.getEmptyBlock();
        if (emptyBlock.length < 1) {
            // todo
            return;
        }
        block = cc.instantiate(this.BlockPrefab);
        let location = emptyBlock[Utils.random(0, emptyBlock.length)];
        const num = Utils.initialNumber[Utils.random(0, 2)];
        this.blockData[location.i][location.j] = num;
        this.blocks[location.i][location.j] = block;
        block.parent = this.ForeLayerNode;
        block.getComponent(Block).init(num, this.blockSize, this.blockPos[location.i][location.j]);
    }

    //  查找空的块
    public getEmptyBlock(): TwoIndex[] {
        const pos: TwoIndex[] = [];
        for (let i = 0; i < Utils.ROWS; i++) {
            for (let j = 0; j < Utils.ROWS; j++) {
                if (this.blocks[i][j] === null) {
                    pos.push({i, j});
                }
            }
        }
        return pos;
    }

    // 初始化分数
    public updateScore(score = 0): void {
        this.score = score;
        this.ScoreLabel.string = '分数:' + score;
    }

}
