import { BriefItem, Item } from "../type";
import * as cheerio from "cheerio";
import { fetchWithRetry } from "../../utils/fetchWithRetry";
import { CleanType } from "..";
import { convertHTML } from "../../utils/convertHTML";

// 道具
export const ITEM_DETAIL_URL = `https://isaac.huijiwiki.com/wiki/C{{itemCode}}`;
// 饰品
export const TRINKET_DETAIL_URL = `https://isaac.huijiwiki.com/wiki/T{{itemCode}}`;
// 卡牌
export const CARD_DETAIL_URL = `https://isaac.huijiwiki.com/wiki/K{{itemCode}}`;
// 胶囊
export const PILL_DETAIL_URL = `https://isaac.huijiwiki.com/wiki/P{{itemCode}}`;
// 角色
export const CHARA_DETAIL_URL = `https://isaac.huijiwiki.com/wiki/{{itemCode}}`;

export const getItemDetailHtml = async (code: string, TYPE: CleanType) => {
  let url = "";
  if (TYPE === "item") {
    url = ITEM_DETAIL_URL;
  }
  if (TYPE === "trinket") {
    url = TRINKET_DETAIL_URL;
  }
  if (TYPE === "card") {
    url = CARD_DETAIL_URL;
  }
  if (TYPE === "pill") {
    url = PILL_DETAIL_URL;
  }
  if (TYPE === "chara") {
    url = CHARA_DETAIL_URL;
  }
  const response = await fetchWithRetry(url.replace("{{itemCode}}", code));
  return response.data;
};

export const getItemDetail = async (item: BriefItem, TYPE: CleanType) => {
  // 获取编辑页面的具体信息
  const html = await getItemDetailHtml(item.id, TYPE);
  const $ = cheerio.load(html);

  const itemDetail: Pick<
    Item,
    "tags" | "pools" | "unlock" | "descZh" | "descEn"
  > = {
    tags: [],
    pools: [],
    unlock: "",
    descZh: "",
    descEn: "",
  };

  $("table.infobox tbody tr").each((_, element) => {
    const $element = $(element);
    // 道具标签
    if ($element.find("th").text().includes("标签")) {
      const tags: string[] = [];
      $element.find("td a").each((_, a) => {
        const $a = $(a);
        if ($a.text()) {
          tags.push($a.text());
        }
      });
      itemDetail.tags = tags;
    }
    // 道具池信息
    if ($element.find("th").text().includes("道具池")) {
      const pools: string[] = [];
      $element.find(" td table tbody tr").each((_, tr) => {
        const $tr = $(tr);
        // 是否是忏悔的
        let isExist = false;
        // 是否是贪婪模式
        let isGreed = false;
        $tr.find("td").each((_, td) => {
          const $td = $(td);
          const imgAlt = $td.find("a img").attr("alt");
          if (imgAlt?.includes("DLCR-.png")) {
            // 在忏悔中被删除，不计入
            return;
          }
          if (
            imgAlt?.includes("DLCR.png") ||
            imgAlt?.includes("DLC+.png") ||
            imgAlt?.includes("DLC.png")
          ) {
            // 算作存在
            isExist = true;
          }
          if ($td.find("a").attr("title")?.includes("贪婪")) {
            isGreed = true;
          }
        });
        // 只保留忏悔的
        if (!isExist) {
          return;
        }
        pools.push((isGreed ? "贪婪|" : "") + $tr.text());
      });
      itemDetail.pools = pools;
    }
    // 道具解锁条件
    if ($element.attr("class") === "infobox-below") {
      const unlock = $element.find("td div p");

      itemDetail.unlock = convertHTML(unlock, $);

      // // 处理实体
      // // 找到 class 里包含 entity 的 span 标签
      // const entitySpans = unlock.find("span[class*='entity']");
      // entitySpans.each((_, span) => {
      //   const $span = $(span);
      //   const backgroundPosition = $span
      //     .attr("style")
      //     ?.match(/background-position: (.*);/)?.[1];
      //   const entityType = $span
      //     .attr("class")
      //     ?.split(" ")?.[1]
      //     ?.split("-")?.[1];
      //   const entity =
      //     "{{entity|" + "" + "|" + backgroundPosition + "|" + entityType + "}}";
      //   // 将 entity 插入到 unlock 中原本 span 标签的位置
      //   $span.replaceWith(entity);
      // });

      // // 处理道具
      // // 找到 class 里包含 item-link 的 span 标签
      // const itemLinkSpans = unlock.find("span[class*='item-link']");
      // itemLinkSpans.each((_, itemLink) => {
      //   const $itemLink = $(itemLink);
      //   // 找到当前 span 内 a 标签的内容
      //   const itemCode = $itemLink.find("a").attr("title");
      //   if (itemCode) {
      //     const item = "{{item|ID=" + itemCode?.toLowerCase() + "}}";
      //     // 将 item 插入到 unlock 中原本 span 标签的位置
      //     $itemLink.replaceWith(item);
      //   }
      // });

      // // 处理角色
      // // 找一下 unlock 内有没有 img。有的话，将 img 的 alt 替换为 {{chara|xxx}}
      // const img = unlock.find("span img");
      // let chara = "";
      // let charaName: any = "";
      // if (img) {
      //   // 获取img的alt
      //   charaName = img.attr("alt");
      //   chara = `{{chara|${charaName}}}`;
      // }

      // itemDetail.unlock = unlock.text()?.trim()?.replace(charaName, chara);
    }
    // 官方简介
    if ($element.attr("class") === "infobox-header" && !itemDetail.descZh) {
      const descAll = $element.text().trim();
      const descEn = $element.find("th i big").text().trim();
      const descZh = descAll.replace(descEn, "").trim();
      if (descZh && descEn) {
        itemDetail.descZh = descZh;
        itemDetail.descEn = descEn;
      }
    }
  });

  return itemDetail;
};
