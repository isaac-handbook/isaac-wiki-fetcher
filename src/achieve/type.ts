import { Item } from "src/item/type";

/** 一个成就 */
export interface Achieve extends Partial<Item> {
  /** 解锁物品 */
  unlockItem?: string;
  /** 成就类型 */
  achieveType: number;
  /** 临时数据，用于搜索 */
  tmp?: string;
}

export const achieveTypeMap = {
  重生成就: 1,
  胎衣成就: 2,
  "胎衣†成就": 3,
  忏悔成就: 4,
  PS中的重生奖杯: 5,
};
