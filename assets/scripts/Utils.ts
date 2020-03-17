import {Colors} from "./interface";

export default class Utils {
    // 颜色数组
    public static Colors: Array<Colors> = [
        {
            number: 0,
            color: cc.color(198, 184, 172, 255)
        },
        {
            number: 2,
            color: cc.color(235, 224, 213, 255)
        },
        {
            number: 4,
            color: cc.color(234, 219, 193, 255)
        },
        {
            number: 8,
            color: cc.color(240, 167, 110, 255)
        },
        {
            number: 16,
            color: cc.color(244, 138, 89, 255)
        },
        {
            number: 32,
            color: cc.color(245, 112, 85, 255)
        },
        {
            number: 64,
            color: cc.color(245, 83, 52, 255)
        },
        {
            number: 128,
            color: cc.color(234, 200, 103, 255)
        },
        {
            number: 256,
            color: cc.color(234, 197, 87, 255)
        },
        {
            number: 512,
            color: cc.color(234, 192, 71, 255)
        },
        {
            number: 1024,
            color: cc.color(146, 208, 80, 255)
        },
        {
            number: 2048,
            color: cc.color(0, 176, 240, 255)
        },
    ];

    // 行列数量
    public static ROWS: number = 4;

    // 间隔大小
    public static GAP: number = 20;

    // 随机的数字
    public static initialNumber: number[] = [2, 4];

    // 最小滑动距离
    public static MIN_TOUCH_DIR = 80;

    // 滑动的时间
    public static SLIDE_TIME: number = 0.2;

    public static random(min: number, max: number): number {
        if (max <= min) {
            throw new Error('max must be greater than min');
        }
        return Math.floor(Math.random() * (max - min) + min);
    }
}