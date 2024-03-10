import { fetchWithRetry } from "../utils/fetchWithRetry";
import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";
import { Challenge } from "./type";
import { convertHTML } from "../utils/convertHTML";

const challengeBaseUrl = "https://isaac.huijiwiki.com/wiki/挑战/";

const MAX_ID = 45;

const getChallengePageHtml = async (id: number) => {
  const response = await fetchWithRetry(challengeBaseUrl + id);
  return response.data;
};

const run = async (saveDirectory: string) => {
  const challengeList: Challenge[] = [];

  for (let id = 1; id <= MAX_ID; id++) {
    console.log(`正在处理挑战#${id}`);

    // 获取单个挑战页面信息
    const html = await getChallengePageHtml(id);
    const $ = cheerio.load(html);

    const challenge: Challenge = {
      id: String(id),
    };

    $("table.infobox tbody tr").each((_, element) => {
      const $element = $(element);

      // 名称
      // 如果当前的 tr 的 class 等于 infobox-title
      if ($element.attr("class") === "infobox-title") {
        const $th = $element.find("th");
        // <br> 上面是 nameZh，下面是 nameEn。
        challenge.nameZh = cleanString(
          $th.contents().first().text().trim()
        ).split(".")[1];
        challenge.nameEn = $th.contents().last().text().trim();
      }

      // 使用人物
      if ($element.find("th").text().includes("使用人物")) {
        $element.find("td span").each((_, a) => {
          const $a = $(a);
          if ($a.text()) {
            challenge.useChara = `{{chara|${$a.text()}}}`;
          }
        });
      }

      // 初始物品
      if ($element.find("th").text().includes("初始物品")) {
        const info: string[] = [];
        $element.find("td span").each((_, a) => {
          const $a = $(a);
          // 如果当前的 span 标签的 class为 item
          if ($a.attr("class") === "item" && $a.text()) {
            info.push(`{{item|${cleanString($a.text())}}}`);
          }
        });
        challenge.initialItems = info.join("、");
      }

      // 是否有宝箱房
      if ($element.find("th").text().includes("宝箱房")) {
        const $td = $element.find("td");
        challenge.hasTreasureRoom = $td.text().includes("有");
      }

      // 是否有商店
      if ($element.find("th").text().includes("商店")) {
        const $td = $element.find("td");
        challenge.hasShop = $td.text().includes("有");
      }

      // 目的地
      if ($element.find("th").text().includes("目的地")) {
        const $td = $element.find("td");
        challenge.destination = changeBossName(cleanString($td.text()));
      }

      // 特殊规则
      if ($element.find("th").text().includes("特殊规则")) {
        const $td = $element.find("td");
        challenge.specialRule = convertHTML($td, $);
        if (id === 25) {
          challenge.specialRule += "{{health|红2}} + 两排空的心之容器";
        }
        if (id === 8) {
          challenge.specialRule +=
            "{{health|红2}}{{health|红2}}{{health|红2}}{{health|魂2}}{{health|魂2}}{{health|魂2}}{{health|黑2}}{{health|黑2}}{{health|黑2}}";
        }
        if (challenge.specialRule.includes("蒙眼")) {
          challenge.specialRule = challenge.specialRule.replace(
            "蒙眼",
            "蒙眼，无法正常发射泪弹 "
          );
        }
      }

      // 解锁条件
      // 如果当前 tr 的文本包含“挑战解锁条件”，则取同级的下一个 tr
      if ($element.find("th").text().includes("挑战解锁条件")) {
        const $next = $element.next();
        // 找到内部的 p 标签
        const $p = $next.find("p");
        challenge.unlock = convertHTML($p, $);
      }
    });

    challengeList.push(challenge);
  }

  const logFilename = path.join(saveDirectory, "challenges.json");

  // 保存到src同级的output文件夹下
  fs.writeFileSync(logFilename, JSON.stringify(challengeList, null, 2));
};

export const cleanAllChallenge = run;

// 去除字符串中的所有空格、换行符
const cleanString = (str: string) => {
  return str.replace(/\s/g, "");
};

const changeBossName = (str: string) => {
  switch (str) {
    case "母亲":
      return "{{entity|母亲|-0px-816px|boss}}";
    case "妈妈":
      return "{{entity|妈妈|-128px-48px|boss}}";
    case "撒但":
      return "{{entity|撒但|-384px-336px|boss}}";
    case "以撒":
      return "{{entity|以撒|-384px-384px|boss}}";
    case "妈妈的心脏":
      return "{{entity|妈妈的心脏|-320px-288px|boss}}";
    case "???":
      return "{{entity|???|-0px-432px|boss}}";
    case "超级撒但":
      return "{{entity|超级撒但|-0px-528px|boss}}";
    default:
      return str;
  }
};
