import { getItemList } from "./getItemList";
import { randomSleep } from "../utils/common";
import { Item } from "./type";
import * as fs from "fs";
import * as path from "path";
import { getItemDetail } from "./detailPage/getItemDetail";
import { getItemContent } from "./editPage/getItemContent";
import { myLog } from "../utils/log";
import { formatItemObject } from "./formatItemObject";
import { extraItems } from "./extraItems";

export type CleanType = "item" | "trinket" | "card" | "pill" | "chara";

// 获取多少个
const dev_TARGET_LENGTH = 2;
// 从第几个开始
const dev_START_INDEX = 1;
// 爬取类型
export const dev_TYPE: CleanType = "card";

// 间隔时间
export const INTERVAL = 0;

export const cleanAllItems = async (
  cleanType: CleanType | undefined,
  startIndex: number | undefined,
  targetLength: number | undefined,
  saveDirectory: string
) => {
  const startTime = new Date().getTime();
  const otpList: Item[] = [];

  const TYPE_ = cleanType ?? dev_TYPE;
  const START_INDEX_ = startIndex ?? dev_START_INDEX;
  const TARGET_LENGTH_ = targetLength ?? dev_TARGET_LENGTH;

  let count = 0;
  let itemList = await getItemList(TYPE_);

  // 拿到了所有道具的基本信息
  // 但有个别道具会漏掉，需要手动添加
  if (TYPE_ === "item") {
    itemList = itemList.concat(extraItems);
    // 有些道具要转换下名字
    itemList = itemList.map((item) => {
      if (item.id === "120") {
        item.nameZh = "怪异蘑菇(小)";
      }
      if (item.id === "121") {
        item.nameZh = "怪异蘑菇(大)";
      }
      if (item.id === "551") {
        item.nameZh = "损坏的铲子(头部)";
      }
      if (item.id === "550") {
        item.nameZh = "损坏的铲子(手柄)";
      }
      return item;
    });
  }

  for (const item of itemList) {
    if (Number(item.id) < START_INDEX_) {
      // 如果位于extraItems中，不跳过
      if (TYPE_ === "item") {
        if (!extraItems.find((extraItem) => extraItem.id === item.id)) {
          continue;
        }
      } else {
        continue;
      }
    }
    if (Number(item.id) >= START_INDEX_ + TARGET_LENGTH_) {
      break;
    }
    if (!item.id) {
      break;
    }
    count++;

    myLog(`----------处理道具${item.id} ${item.nameZh}----------`);

    const itemContent = await getItemContent(item, TYPE_);

    const itemDetail = await getItemDetail(item, TYPE_);

    const itemObject = {
      ...item,
      ...itemDetail,
      content: itemContent,
    };

    otpList.push(formatItemObject(itemObject));
    if (count < TARGET_LENGTH_) {
      // 停顿
      await randomSleep(INTERVAL);
    }
  }

  const logFilename = path.join(saveDirectory, TYPE_ + "s.json");

  // 保存到src同级的output文件夹下
  fs.writeFileSync(logFilename, JSON.stringify(otpList, null, 2));

  myLog("完成！");
  myLog(`耗时：${(new Date().getTime() - startTime) / 1000}秒`);
};
