const fs = require("fs");
const path = require("path");

function cleanObject(obj) {
  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    if (
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)
    ) {
      // 删除满足条件的叶子节点
      delete obj[key];
    } else if (typeof value === "object") {
      cleanObject(value); // 递归调用以处理子对象
      if (Object.keys(value).length === 0) {
        // 如果递归清理后的对象为空，则也将其删除
        delete obj[key];
      }
    }
  });
  return obj;
}

const filename = path.join(__dirname, "../dist/", "isaac-handbook-data.json");
const rawData = fs.readFileSync(filename);
const obj = JSON.parse(rawData);
cleanObject(obj);

// 重新写入文件。写在当前目录下
fs.writeFileSync("./isaac-handbook-data.json", JSON.stringify(obj, null, 2));
