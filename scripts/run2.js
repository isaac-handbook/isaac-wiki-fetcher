const fs = require("fs");
const path = require("path");

function countChargeValues(filename) {
  // 读取文件内容
  const fileContent = fs.readFileSync(filename, "utf-8");

  // 解析为 JSON
  const data = JSON.parse(fileContent);

  // 定义一个对象来统计 charge 的值
  const chargeCount = {};

  // 遍历数据数组
  for (let item of data) {
    const chargeValue = item.charge;
    if (chargeCount[chargeValue]) {
      chargeCount[chargeValue] += 1;
    } else {
      chargeCount[chargeValue] = 1;
    }
  }

  return chargeCount;
}

// 使用示例
const result = countChargeValues(
  path.join(__dirname, "../bak/", "item-719-2023-9-24-18-27-38.json")
);
console.log(result);
