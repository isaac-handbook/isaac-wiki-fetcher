import { fetchWithRetry } from "../utils/fetchWithRetry";
import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";
import { Achieve, achieveTypeMap } from "./type";
import { getCSSMap } from "../styles/getCSSMap";
import { convertHTML } from "../utils/convertHTML";

const achievePageUrl = "https://isaac.huijiwiki.com/wiki/%E6%88%90%E5%B0%B1";

const getAchievePageHtml = async () => {
  const response = await fetchWithRetry(achievePageUrl);
  return response.data;
};

const run = async (saveDirectory: string) => {
  // 获取所有道具的icon样式
  const cssMap = getCSSMap();

  const achieveList: Achieve[] = [];

  // 获取成就页面信息
  const html = await getAchievePageHtml();
  const $ = cheerio.load(html);

  // 找到每一个 h2 标签，且该 h2 标签的下一个兄弟节点是 class=table-responsive table-wrapper 的 div
  const h2s = $("h2");
  h2s.each((index, h2) => {
    const h2Text = $(h2).text();
    const nextDiv = $(h2).next();
    if (nextDiv.hasClass("wikitable")) {
      const tbody = nextDiv.find("tbody");
      const trs = tbody.find("tr");
      trs.each((index, tr) => {
        if (index === 0) {
          return;
        }
        const tds = $(tr).find("td");
        const id = $(tds[0]).text().trim();

        const type = achieveTypeMap[h2Text];

        if (type > 4) {
          return;
        }

        // name 区块
        const nameZone = $(tds[1]);
        // <br/> 上面的是中文名，下面的是英文名
        const nameZh = nameZone.contents().first().text().trim();
        const nameEn = nameZone.contents().last().text().trim();

        // icon 区块
        const iconZone = $(tds[2]);
        // 获取内部 span 标签的 id
        const iconClass = iconZone.find("span").attr("id") ?? "";
        // 通过 id 获取样式
        const iconPosition = cssMap[`#${iconClass}`];

        // desc 区块
        const descZone = $(tds[3]);
        // 遍历找到 descZone 内部的第一个 <br>，取其前面的内容
        let descZh = "";
        descZone.contents().each((index, content) => {
          descZh += $(content).text().trim();
          // @ts-ignore
          if (content.tagName === "br") {
            return false;
          }
        });

        const unlock = convertHTML($(tds[4]), $);
        const unlockItem = convertHTML($(tds[5]), $);

        achieveList.push({
          id,
          nameZh,
          nameEn,
          iconPosition,
          descZh,
          unlock,
          unlockItem,
          type,
        });
      });
    }
  });

  const logFilename = path.join(saveDirectory, "achieve.json");

  // 保存到src同级的output文件夹下
  fs.writeFileSync(logFilename, JSON.stringify(achieveList, null, 2));
};

export const cleanAllAchieves = run;
