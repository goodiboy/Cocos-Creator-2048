// 颜色接口
export interface Colors {
    // 块的数字
    number: number;
    // 块的颜色
    color: cc.Color;
}

// 方向枚举
export enum Direction {
    /**左方向*/
    LEFT = 'left',
    /**右方向*/
    RIGHT = 'right',
    /**上方向*/
    UP = 'up',
    /**下方向*/
    DOWN = 'down',
}

// 记录需要的块
export interface TwoIndex {
    i: number,
    j: number
}