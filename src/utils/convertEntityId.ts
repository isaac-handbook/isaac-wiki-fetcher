import * as cheerio from "cheerio";
import { myLog } from "./log";
import { CleanType } from "../item";
import { getItemDetailHtml } from "../item/detailPage/getItemDetail";

// 一些事先确认的实体ID
const ENTITY_ID_MAP: Record<string, string> = {
  "2.9.0": "混沌卡泪弹",
  "4.1.0": "大型炸弹",
  "2.4.0": "鲍勃的烂头泪弹",
  "4.2.0": "诱饵",
};

// 通过TYPE+itemId实现一个详情页html的缓存
const detailHtmlCache: { [key: string]: string } = {};

// 转化实体ID到实体名称
export const convertEntityID = async (
  entityID: string,
  itemId: string,
  TYPE: CleanType
) => {
  myLog(`实体ID ${entityID} 转换中...`);

  // 在事先确认的实体ID中
  if (ENTITY_ID_MAP[entityID]) {
    myLog(`实体ID ${entityID} 转换成功：${ENTITY_ID_MAP[entityID]}`);
    return ENTITY_ID_MAP[entityID];
  }

  // 在detail页面的style标签中，找到对应的 icon location
  let detailHtml: string = "";
  if (detailHtmlCache[TYPE + itemId]) {
    detailHtml = detailHtmlCache[TYPE + itemId];
  } else {
    detailHtml = await getItemDetailHtml(itemId, TYPE);
    detailHtmlCache[TYPE + itemId] = detailHtml;
  }

  const $2 = cheerio.load(detailHtml);
  // 找到 title 属性等于：实体ID：{{entityID}} 的 span 标签
  const $span = $2(`span[title="实体ID：${entityID}"]`);
  // 获取span下一个a标签的文本
  const entityName = $span.next().html();
  // 找到 style 属性中的 background-position
  const style = $span.attr("style");
  const backgroundPosition = style?.match(/background-position: (.*);/)?.[1];
  // 找到span的class属性
  const entityType = $span.attr("class")?.split(" ")?.[1]?.split("-")?.[1];

  const resData =
    "{{entity|" +
    entityName +
    "|" +
    backgroundPosition +
    "|" +
    entityType +
    "}}";

  myLog(`实体ID ${entityID} 转换成功：${resData}`);

  return resData;
};
