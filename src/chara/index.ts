import { fetchWithRetry } from "../utils/fetchWithRetry";
import { formatItemEditPage } from "../item/editPage/formatItemEditPage";
import { charaList } from "./charaList";
import { Chara, CharaInfo } from "./type";
import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";
import { myLog } from "../utils/log";
import { format, formatBaseInfo, formatHealth } from "./utils";

const editUrl =
  "https://isaac.huijiwiki.com/index.php?title={{charaName}}&action=edit";

const getEditContentHtml = async (charaName: string) => {
  const charaName_ = charaName.replace(/\?/g, "%3F");
  const url = editUrl.replace("{{charaName}}", charaName_);
  const response = await fetchWithRetry(url);
  return response.data;
};

const detailUrl = "https://isaac.huijiwiki.com/wiki/{{charaName}}";

const getDetailContentHtml = async (charaName: string) => {
  const charaName_ = charaName.replace(/\?/g, "%3F");
  const url = detailUrl.replace("{{charaName}}", charaName_);
  const response = await fetchWithRetry(url);
  return response.data;
};

const run = async () => {
  const charaListMap: Record<string, Chara> = {};

  for (const charaName of charaList) {
    // 获取编辑页面的具体信息
    const htmlE = await getEditContentHtml(charaName);
    const $E = cheerio.load(htmlE);
    const text = $E("#wpTextbox1").text();
    const content = await formatItemEditPage(
      text,
      // @ts-ignore 兼容道具的逻辑
      { id: charaName.replace(/\?/g, "%3F") },
      "chara"
    );

    const chara: Partial<Chara> = {
      nameZh: charaName,
      infoList: [],
      tags: [],
      pools: [],
    };

    // 在详情页面中获取基础信息
    const htmlD = await getDetailContentHtml(charaName);
    const $D = cheerio.load(htmlD);
    $D("table.infobox").each((_, infobox) => {
      // 单个角色信息
      const charaInfo: Partial<CharaInfo> = {};
      $D(infobox)
        .find("tbody tr")
        .each((_, element) => {
          // 名称
          if ($D(element).attr("class") === "infobox-title") {
            // 获取当前 element 中 th 标签内的内容
            const name = $D(element).find("th").html() ?? "";
            charaInfo.nameZh = name.split("<br>")[0];
            charaInfo.nameEn = name.split("<br>")[1];
          }
          // 生命
          if (
            $D(element).find("th img").attr("alt") === "Health Stat Icon 2.png"
          ) {
            let healthImgNames: string[] = [];
            $D(element)
              .find("td")
              .find("img")
              .each((_, e) => {
                healthImgNames.push($D(e).attr("alt") ?? "");
              });
            charaInfo.health = formatHealth(
              healthImgNames.filter((name) => name).join("")
            );
          }
          // ID
          if ($D(element).find("th").text().trim() === "ID") {
            const id = $D(element).find("td").text();
            charaInfo.id = format(id);
          }
          // 移速
          if (
            $D(element).find("th img").attr("alt") === "Speed Stat Icon 2.png"
          ) {
            const speed = $D(element).find("td").text();
            charaInfo.speed = formatBaseInfo(speed);
          }
          // 射速
          if (
            $D(element).find("th img").attr("alt") === "Tears Stat Icon 2.png"
          ) {
            const tears = $D(element).find("td").text();
            charaInfo.tears = formatBaseInfo(tears);
          }
          // 伤害
          if (
            $D(element).find("th img").attr("alt") === "Damage Stat Icon 2.png"
          ) {
            const damage = $D(element).find("td").text();
            charaInfo.damage = formatBaseInfo(damage);
          }
          // 射程
          if (
            $D(element).find("th img").attr("alt") === "Range Stat Icon 2.png"
          ) {
            const range = $D(element).find("td").text();
            charaInfo.range = formatBaseInfo(range);
          }
          // 弹速
          if (
            $D(element).find("th img").attr("alt") ===
            "Shot Speed Stat Icon 2.png"
          ) {
            const shotSpeed = $D(element).find("td").text();
            charaInfo.shotSpeed = formatBaseInfo(shotSpeed);
          }
          // 幸运
          if (
            $D(element).find("th img").attr("alt") === "Luck Stat Icon 2.png"
          ) {
            const luck = $D(element).find("td").text();
            charaInfo.luck = formatBaseInfo(luck);
          }
          // 解锁条件
          // 道具解锁条件
          if ($D(element).find('td div[class="bg-primary achievement-box"]')) {
            const unlock = $D(element).find("td div p");
            // 找到 class 里包含 entity 的 span 标签
            const span = unlock.find("span[class*='entity']");
            span.each((_, span) => {
              const $span = $D(span);
              const backgroundPosition = $span
                .attr("style")
                ?.match(/background-position: (.*);/)?.[1];
              const entityType = $span
                .attr("class")
                ?.split(" ")?.[1]
                ?.split("-")?.[1];
              const entity =
                "{{entity|" +
                "" +
                "|" +
                backgroundPosition +
                "|" +
                entityType +
                "}}";
              // 将 entity 插入到 unlock 中原本 span 标签的位置
              $span.replaceWith(entity);
            });
            // 找一下 span 内有没有 img
            const img = unlock.find("span img");
            let chara_ = "";
            let charaName: any = "";
            if (img) {
              // 获取img的alt
              charaName = img.attr("alt");
              chara_ = `{{chara|${charaName}}}`;
            }
            charaInfo.unlock = unlock
              .text()
              ?.trim()
              ?.replace(charaName, chara_);
          }
        });
      chara?.infoList?.push(charaInfo as CharaInfo);
    });

    chara.content = content;

    charaListMap[charaName] = chara as Chara;
  }

  // 保存 charaListMap 到 output/charaListMap.json
  // 生成带当前时间戳的json文件名
  const now = new Date();
  const fileName = `chara-${now.getFullYear()}-${
    now.getMonth() + 1
  }-${now.getDate()}-${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}.json`;

  if (JSON.stringify(charaListMap) === "{}") {
    myLog("内容为空！");
    return;
  }

  const logDirectory = path.join(__dirname, "../..", "output");

  // 确保日志目录存在
  if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory);
  }

  const logFilename = path.join(logDirectory, fileName);

  // 保存到src同级的output文件夹下
  fs.writeFileSync(logFilename, JSON.stringify(charaListMap, null, 2));
};

run();
