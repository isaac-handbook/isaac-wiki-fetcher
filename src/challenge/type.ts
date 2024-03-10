import { Item } from "src/item/type";

/** 一个成就 */
export interface Challenge extends Partial<Item> {
  /** 使用人物 */
  useChara?: string;
  /** 初始物品 */
  initialItems?: string;
  /** 是否有宝箱房 */
  hasTreasureRoom?: boolean;
  /** 是否有商店 */
  hasShop?: boolean;
  /** 目的地 */
  destination?: string;
  /** 特殊规则 */
  specialRule?: string;
}
