import { fetchWithRetry } from "../utils/fetchWithRetry";
import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";
import { Seed } from "./type";
import { convertHTML } from "../utils/convertHTML";

const SeedPageUrl = "https://isaac.huijiwiki.com/wiki/种子";

const getSeedPageHtml = async () => {
  const response = await fetchWithRetry(SeedPageUrl);
  return response.data;
};

const run = async (saveDirectory: string) => {
  const SeedList: Seed[] = [];

  // 获取成就页面信息
  const html = await getSeedPageHtml();
  const $ = cheerio.load(html);

  const trs = $("table.wikitable tr");

  let seedType = "";

  trs.each((index, tr) => {
    // 如果当前只包含一个 th，那么这个 th 就是种子类型
    const ths = $(tr).find("th");
    if (ths.length === 1) {
      seedType = $(ths[0]).text().trim();
      return;
    }
    if (index < 2) {
      return;
    }
    const tds = $(tr).find("td");
    const seedCode = $(tds[0]).text().trim();

    // name 区块
    const nameZone = $(tds[1]);
    // <br/> 上面的是中文名，下面的是英文名
    const nameEn = nameZone.contents().first().text().trim();
    const nameZh = nameZone.contents().last().text().trim();

    // name 区块中是否包含 title=Disables achievements 的 span
    const span = nameZone.find("span");
    const supportAchieve = span.attr("title") === "Disables achievements";

    // desc 区块
    const descZh = convertHTML($(tds[2]), $);

    SeedList.push({
      nameZh: nameZh || nameEn,
      nameEn,
      descZh,
      seedCode,
      supportAchieve,
      seedType,
    });
  });

  const logFilename = path.join(saveDirectory, "seeds.json");

  // 保存到src同级的output文件夹下
  fs.writeFileSync(logFilename, JSON.stringify(SeedList, null, 2));
};

export const cleanAllSeeds = run;
