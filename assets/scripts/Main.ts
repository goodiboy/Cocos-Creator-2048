import Utils from "./Utils";
import Block from './Block';

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
    // public blockPos: Array<Array<cc.Vec2>> = [];

    // 块的对象池
    public BlockPool: cc.NodePool = new cc.NodePool();

    protected onLoad(): void {
        this.createBgBlock();
        this.init();
    };

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
        this.initScore();
        this.ForeLayerNode.children.forEach((item: cc.Node) => {
            this.BlockPool.put(item);
        });

        this.BackLayerNode.children.forEach((item: cc.Node) => {
            item.getComponent(Block).isNull = true;
        });

        this.createBlock();
    }


    // 创建块
    public createBlock(): void {
        let block: cc.Node = null;
        if (this.BlockPool.size() > 0) {
            block = this.BlockPool.get();
        }
        let emptyBlock = this.getEmptyBlock();
        for (let i = 0; i < 3; i++) {
            block = cc.instantiate(this.BlockPrefab);
            block.getComponent(Block).init(Utils.initialNumber[Utils.random(0, 2)], this.blockSize, emptyBlock[Utils.random(0, emptyBlock.length)].position);
            block.parent = this.ForeLayerNode;
        }
    }

    //  查找空的块
    public getEmptyBlock(): cc.Node[] {
        return this.BackLayerNode.children.filter(item => {
            return item.getComponent(Block).isNull === true;
        });
    }

    // 初始化分数
    public initScore(): void {
        this.score = 0;
        this.ScoreLabel.string = '' + 0;
    }

}
