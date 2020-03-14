import Utils from "./Utils";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Block extends cc.Component {

    // 数字
    @property(cc.Label)
    NumberLabel: cc.Label = null;


    // 记录是不是没有数字
    public isNull: boolean = false;

    // 格式化
    public init(number: number, size: number, pos: cc.Vec2): void {
        Utils.Colors.forEach((item, index) => {
            this.node.width = size;
            this.node.height = size;
            this.node.position = pos;
            if (item.number === number) {
                this.node.color = item.color;
                if (number === 0)
                    this.NumberLabel.string = '';
                else
                    this.NumberLabel.string = number + '';
                return;
            }
        })
    }




    // update (dt) {}
}
