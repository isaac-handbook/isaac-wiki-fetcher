import { Item } from "src/item/type";

/** 一个种子 */
export interface Seed extends Partial<Item> {
  /** 种子 code */
  seedCode: string;
  /** 种子类型 */
  seedType: string;
  /** 是否支持解锁成就 */
  supportAchieve: boolean;
}
