import * as path from "path";
import * as fs from "fs";
import { cleanAllItems } from "./item";
import { cleanAllCharas } from "./chara";

const fetch = async () => {
  const { MODE, TYPE } = process.env as any;

  // 初始化存储的路径
  const baseDirectory = path.join(__dirname, "..", "output");
  if (!fs.existsSync(baseDirectory)) {
    fs.mkdirSync(baseDirectory);
  }
  // 本次存储的目录名称
  const now = new Date();
  const saveDirectoryName = `${MODE}-${TYPE ?? ""}-${now.getFullYear()}-${
    now.getMonth() + 1
  }-${now.getDate()}-${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}`;
  const saveDirectory = path.join(baseDirectory, saveDirectoryName);
  if (!fs.existsSync(saveDirectory)) {
    fs.mkdirSync(saveDirectory);
  }

  if (MODE === "prod") {
    if (TYPE === "all") {
      console.log("即将抓取所有内容");
      await Promise.all([
        cleanAllItems("item", 0, 2000, saveDirectory),
        cleanAllItems("trinket", 0, 2000, saveDirectory),
        cleanAllItems("card", 0, 2000, saveDirectory),
        cleanAllItems("pill", 0, 2000, saveDirectory),
        cleanAllCharas(saveDirectory),
      ]);
      return saveDirectory;
    }
    if (TYPE === "chara") {
      console.log("即将抓取所有角色");
      await cleanAllCharas(saveDirectory);
      return saveDirectory;
    }
    console.log("即将抓取所有类型：" + TYPE);
    await cleanAllItems(TYPE, 0, 2000, saveDirectory);
    return saveDirectory;
  }

  if (MODE === "dev") {
    await cleanAllItems(undefined, undefined, undefined, saveDirectory);
  }
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

  const logFilename = path.join(
    saveDirectory,
    `isaac-handbook-data-${new Date().getTime()}.json`
  );
  fs.writeFileSync(logFilename, JSON.stringify(allItems, null, 2));
};

main();
