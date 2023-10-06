import { CleanType } from "./../index";
import { formatItemEditPage } from "./formatItemEditPage";
import { BriefItem } from "../type";
import * as cheerio from "cheerio";
import { fetchWithRetry } from "../../utils/fetchWithRetry";

// 道具
const ITEM_EDIT_URL = `https://isaac.huijiwiki.com/index.php?title=C{{itemCode}}&action=edit`;
// 饰品
const TRINKET_EDIT_URL = `https://isaac.huijiwiki.com/index.php?title=T{{itemCode}}&action=edit`;
// 卡牌
const CARD_EDIT_URL = `https://isaac.huijiwiki.com/index.php?title=K{{itemCode}}&action=edit`;
// 胶囊
const PILL_EDIT_URL = `https://isaac.huijiwiki.com/index.php?title=P{{itemCode}}&action=edit`;

const getItemContentHtml = async (code: string, TYPE: CleanType) => {
  let url = "";
  if (TYPE === "item") {
    url = ITEM_EDIT_URL;
  }
  if (TYPE === "trinket") {
    url = TRINKET_EDIT_URL;
  }
  if (TYPE === "card") {
    url = CARD_EDIT_URL;
  }
  if (TYPE === "pill") {
    url = PILL_EDIT_URL;
  }
  const response = await fetchWithRetry(url.replace("{{itemCode}}", code));
  return response.data;
};

export const getItemContent = async (item: BriefItem, TYPE: CleanType) => {
  // 获取编辑页面的具体信息
  const html = await getItemContentHtml(item.id, TYPE);
  const $ = cheerio.load(html);
  const text = $("#wpTextbox1").text();
  return await formatItemEditPage(text, item, TYPE);
};
