import * as cheerio from "cheerio";
import { BriefItemList } from "./type";
import { getCSSMap } from "../styles/getCSSMap";
import { fetchWithRetry } from "../utils/fetchWithRetry";
import { CleanType } from ".";

// 道具
const ITEM_LIST_URL = "https://isaac.huijiwiki.com/wiki/%E9%81%93%E5%85%B7";
// 饰品
const TRINKET_LIST_URL = "https://isaac.huijiwiki.com/wiki/%E9%A5%B0%E5%93%81";
// 卡片
const CARD_LIST_URL = "https://isaac.huijiwiki.com/wiki/%E5%8D%A1%E7%89%8C";
// 胶囊
const PILL_LIST_URL = "https://isaac.huijiwiki.com/wiki/%E8%83%B6%E5%9B%8A";

const getItemListHtml = async (TYPE: CleanType) => {
  let url = "";
  if (TYPE === "item") {
    url = ITEM_LIST_URL;
  }
  if (TYPE === "trinket") {
    url = TRINKET_LIST_URL;
  }
  if (TYPE === "card") {
    url = CARD_LIST_URL;
  }
  if (TYPE === "pill") {
    url = PILL_LIST_URL;
  }
  const response = await fetchWithRetry(url);
  return response.data;
};

const formatItemList = (data: string, TYPE: CleanType) => {
  // 获取所有道具的icon样式
  const cssMap = getCSSMap();

  const $ = cheerio.load(data);
  const itemList: BriefItemList = [];
  $("table.wikitable tbody tr").each((_, element) => {
    const $element = $(element);
    // 道具名称
    const nameEn = $element
      .find("td:nth-child(1)")
      .contents()
      .first()
      .text()
      .trim();

    let nameZh = "";
    let id = "";
    let quality = "";
    let charge = "";
    let description = "";
    let iconClass = "";
    let iconPosition = "";
    if (TYPE === "item" || TYPE === "trinket" || TYPE === "card") {
      // 道具名称
      nameZh = $element.find("td:nth-child(1) a").text();
      // 道具ID
      id = $element.find("td:nth-child(3)").text();
      // 道具品质 0-4
      quality = $element.find("td:nth-child(5)").text();
      // 充能格数
      charge = $element.find("td:nth-child(6)").text();
      // 效果简述
      description = $element.find("td:nth-child(7)").text();
      // 道具图片class
      iconClass = $element.find("td:nth-child(2) span").attr("id") ?? "";
      // 道具图片位置
      iconPosition = cssMap[`#${iconClass}`];
    }
    if (TYPE === "pill") {
      // 道具名称
      nameZh = $element.find("td:nth-child(1) a").text();
      // 道具ID
      id = $element.find("td:nth-child(2)").text();
      // 道具品质 正面、中性、负面
      quality = $element.find("td:nth-child(3)").text();
      // 效果简述
      description = $element.find("td:nth-child(5)").text();
    }

    if (iconPosition === "collectible-dogma-anim") {
      iconPosition = "-64px -1152px";
    }

    const item = {
      nameZh,
      nameEn,
      id,
      quality,
      charge,
      description,
      iconPosition,
    };
    if (nameZh) {
      itemList.push(item);
    }
  });
  return itemList;
};

export const getItemList = async (TYPE: CleanType) => {
  const html = await getItemListHtml(TYPE);
  return formatItemList(html, TYPE);
};
