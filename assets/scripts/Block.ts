import Utils from "./Utils";
import {Colors} from "./interface";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Block extends cc.Component {

    // 数字
    @property(cc.Label)
    NumberLabel: cc.Label = null;



    // 格式化
    public init(number: number, size: number, pos: cc.Vec2): void {
        this.node.scale = 0;
        this.node.width = size;
        this.node.height = size;
        this.node.position = pos;
        this.node.runAction(cc.scaleTo(0.1,1));
        this.setNumber(number);
    }

    public setNumber(number: number): void {
        if (number === 0)
            this.NumberLabel.node.active = false;
        else
            this.NumberLabel.string = number + '';

        for (let i = 0; i < Utils.Colors.length; i++) {
            const item: Colors = Utils.Colors[i];
            if (number === item.number) {
                this.node.color = item.color;
                break;
            }
        }
    }

    // update (dt) {}
}
