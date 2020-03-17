import Utils from "./Utils";
import Block from './Block';
import {Direction, TwoIndex} from "./interface";

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

    private moveBlock(dir: Direction): void {
        let moveBlock: TwoIndex[] = [];
        this.hasMove = false;
        let counter = 0;

        switch (dir) {
            case 'left':
                for (let i = 0; i < Utils.ROWS; i++) {
                    for (let j = 0; j < Utils.ROWS; j++) {
                        this.isMergeArr[i][j] = false;
                        if (this.blockData[i][j] !== 0) {
                            moveBlock.push({i, j});
                        }
                    }
                }
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

    private afterMove(): void {
        if (this.hasMove) {
            this.createBlock();
            this.updateScore(this.score + 1);
        }
    }

    private moveAnimLeft(i: number, j: number, callback: Function): void {
        if (j === 0 || this.blockData[i][j] === 0) {
            callback && callback();
            return;
        } else if (this.blockData[i][j - 1] === 0) {
            let block: cc.Node = this.blocks[i][j];
            let position = this.blockPos[i][j - 1];
            this.blocks[i][j - 1] = block;
            this.blockData[i][j - 1] = this.blockData[i][j];
            this.blockData[i][j] = 0;
            this.blocks[i][j] = null;
            cc.tween(block)
                .to(0.1, {position: position})
                .call(e => {
                    this.moveAnimLeft(i, j - 1, callback);
                })
                .start();
            this.hasMove = true;
        } else if (this.blockData[i][j - 1] === this.blockData[i][j] && !this.isMergeArr[i][j]) {
            let block: cc.Node = this.blocks[i][j];
            let position = this.blockPos[i][j - 1];
            this.blockData[i][j - 1] *= 2;
            this.isMergeArr[i][j] = true;
            this.blocks[i][j] = null;
            this.blockData[i][j] = 0;
            cc.tween(block)
                .to(0.1, {position: position})
                .call(e => {
                    this.doMerge(block, this.blocks[i][j - 1], this.blockData[i][j - 1], callback)
                })
                .start();
            this.hasMove = true;
        } else {
            callback && callback()
        }
    }

    private moveAnimRight(i: number, j: number, callback: Function): void {
        if (j === Utils.ROWS - 1 || this.blockData[i][j] === 0) {
            callback && callback();
            return;
        } else if (this.blockData[i][j + 1] === 0) {
            let block: cc.Node = this.blocks[i][j];
            let position = this.blockPos[i][j + 1];
            this.blocks[i][j + 1] = block;
            this.blockData[i][j + 1] = this.blockData[i][j];
            this.blockData[i][j] = 0;
            this.blocks[i][j] = null;
            cc.tween(block)
                .to(0.1, {position: position})
                .call(e => {
                    this.moveAnimRight(i, j + 1, callback);
                })
                .start();
            this.hasMove = true;
        } else if (this.blockData[i][j + 1] === this.blockData[i][j] && !this.isMergeArr[i][j]) {
            let block: cc.Node = this.blocks[i][j];
            let position = this.blockPos[i][j + 1];
            this.blockData[i][j + 1] *= 2;
            this.isMergeArr[i][j] = true;
            this.blocks[i][j] = null;
            this.blockData[i][j] = 0;
            cc.tween(block)
                .to(0.1, {position: position})
                .call(e => {
                    this.doMerge(block, this.blocks[i][j + 1], this.blockData[i][j + 1], callback)
                })
                .start();
            this.hasMove = true;
        } else {
            callback && callback()
        }
    }


    private moveAnimDown(i: number, j: number, callback: Function): void {
        if (i === 0 || this.blockData[i][j] === 0) {
            callback && callback();
            return;
        } else if (this.blockData[i - 1][j] === 0) {
            let block: cc.Node = this.blocks[i][j];
            let position = this.blockPos[i - 1][j];
            this.blocks[i - 1][j] = block;
            this.blockData[i - 1][j] = this.blockData[i][j];
            this.blockData[i][j] = 0;
            this.blocks[i][j] = null;
            cc.tween(block)
                .to(0.1, {position: position})
                .call(e => {
                    this.moveAnimDown(i - 1, j, callback);
                })
                .start();
            this.hasMove = true;
        } else if (this.blockData[i - 1][j] === this.blockData[i][j] &&!this.isMergeArr[i][j]) {
            let block: cc.Node = this.blocks[i][j];
            let position = this.blockPos[i - 1][j];
            this.blockData[i - 1][j] *= 2;
            this.isMergeArr[i][j] = true;
            this.blocks[i][j] = null;
            this.blockData[i][j] = 0;
            cc.tween(block)
                .to(0.1, {position: position})
                .call(e => {
                    this.doMerge(block, this.blocks[i - 1][j], this.blockData[i - 1][j], callback)
                })
                .start();
            this.hasMove = true;
        } else {
            callback && callback()
        }
    }

    private moveAnimUp(i: number, j: number, callback: Function): void {
        if (i === Utils.ROWS - 1 || this.blockData[i][j] === 0) {
            callback && callback();
            return;
        } else if (this.blockData[i + 1][j] === 0) {
            let block: cc.Node = this.blocks[i][j];
            let position = this.blockPos[i + 1][j];
            this.blocks[i + 1][j] = block;
            this.blockData[i + 1][j] = this.blockData[i][j];
            this.blockData[i][j] = 0;
            this.blocks[i][j] = null;
            cc.tween(block)
                .to(0.1, {position: position})
                .call(e => {
                    this.moveAnimUp(i + 1, j, callback);
                })
                .start();
            this.hasMove = true;
        } else if (this.blockData[i + 1][j] === this.blockData[i][j] && !this.isMergeArr[i][j]) {
            let block: cc.Node = this.blocks[i][j];
            let position = this.blockPos[i + 1][j];
            this.blockData[i + 1][j] *= 2;
            this.isMergeArr[i][j] = true;
            this.blocks[i][j] = null;
            this.blockData[i][j] = 0;
            cc.tween(block)
                .to(0.1, {position: position})
                .call(e => {
                    this.doMerge(block, this.blocks[i + 1][j], this.blockData[i + 1][j], callback)
                })
                .start();
            this.hasMove = true;
        } else {
            callback && callback()
        }
    }


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
        this.updateScore();
        // 清除所有有数字的块
        this.ForeLayerNode.children.forEach((item: cc.Node): void => {
            this.BlockPool.put(item);
        });

        for (let i = 0; i < Utils.ROWS; i++) {
            this.blockData[i] = [];
            this.isMergeArr[i] = [];
            this.blocks[i] = [];
            for (let j = 0; j < Utils.ROWS; j++) {
                this.blockData[i][j] = 0;
                this.blocks[i][j] = null;
                this.isMergeArr[i][j] = false;
            }
        }
        for (let i = 0; i < 13; i++) {
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
