import * as path from "path";
import * as fs from "fs";
import { cleanAllItems } from "./item";
import { cleanAllCharas } from "./chara";
import { cleanAllAchieves } from "./achieve";
// import { cleanObject } from "@utils/cleanObject";

const fetch = async () => {
  const { TYPE, START_INDEX = 0, TARGET_LENGTH = 2000 } = process.env as any;

  const startIndex = parseInt(START_INDEX);
  const targetLength = parseInt(TARGET_LENGTH);

  // 初始化存储的路径
  const baseDirectory = path.join(__dirname, "..", "output");
  if (!fs.existsSync(baseDirectory)) {
    fs.mkdirSync(baseDirectory);
  }
  // 本次存储的目录名称
  const now = new Date();
  const saveDirectoryName = `${
    TYPE ?? ""
  }_${startIndex}_${targetLength}_${now.getFullYear()}-${
    now.getMonth() + 1
  }-${now.getDate()}-${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}`;
  const saveDirectory = path.join(baseDirectory, saveDirectoryName);
  if (!fs.existsSync(saveDirectory)) {
    fs.mkdirSync(saveDirectory);
  }

  if (TYPE === "all") {
    console.log("即将抓取所有内容");
    await Promise.all([
      cleanAllItems("item", startIndex, targetLength, saveDirectory),
      cleanAllItems("trinket", startIndex, targetLength, saveDirectory),
      cleanAllItems("card", startIndex, targetLength, saveDirectory),
      cleanAllItems("pill", startIndex, targetLength, saveDirectory),
      cleanAllCharas(saveDirectory),
      cleanAllAchieves(saveDirectory),
    ]);
    return saveDirectory;
  }
  if (TYPE === "chara") {
    console.log("即将抓取所有角色");
    await cleanAllCharas(saveDirectory);
    return saveDirectory;
  }
  if (TYPE === "achieve") {
    console.log("即将抓取所有成就");
    await cleanAllAchieves(saveDirectory);
    return saveDirectory;
  }
  console.log("即将抓取类型：" + TYPE);
  console.log("startIndex", startIndex);
  console.log("targetLength", targetLength);
  await cleanAllItems(TYPE, startIndex, targetLength, saveDirectory);
  return saveDirectory;
};

const main = async () => {
  const saveDirectory = await fetch();

  // 读取 saveDirectory 下的所有文件，然后合并成一个文件
  const files = fs.readdirSync(saveDirectory);
  const allItems: any = {};
  for (const file of files) {
    const filePath = path.join(saveDirectory, file);
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const fileObject = JSON.parse(fileContent);
    allItems[file.replace(".json", "")] = fileObject;
  }
  // 读取 dist 文件夹下的 extra.json，存到 allItems 中
  const extraFilename = path.join(__dirname, "..", "dist", "extra.json");
  const extraContent = fs.readFileSync(extraFilename, "utf-8");
  const extraObject = JSON.parse(extraContent);
  allItems.extra = extraObject;

  // 下个版本再开启
  // cleanObject(allItems);

  const logFilename = path.join(
    saveDirectory,
    `isaac-handbook-data-${new Date().getTime()}.json`
  );
  fs.writeFileSync(logFilename, JSON.stringify(allItems, null, 2));
};

main();
