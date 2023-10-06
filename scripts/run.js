const fs = require("fs");
const path = require("path");

function countTagsAndPools(filename) {
  // 读取文件
  const rawData = fs.readFileSync(filename);
  const itemsArray = JSON.parse(rawData);

  let tagsCount = {};
  let poolsCount = {};

  // 遍历数组
  for (let item of itemsArray) {
    // 统计tags
    for (let tag of item.tags) {
      if (tagsCount[tag]) {
        tagsCount[tag] += 1;
      } else {
        tagsCount[tag] = 1;
      }
    }

    // 统计pools
    for (let pool of item.pools) {
      if (poolsCount[pool]) {
        poolsCount[pool] += 1;
      } else {
        poolsCount[pool] = 1;
      }
    }
  }

  return {
    tagsCount,
    poolsCount,
  };
}

// 使用示例
const result = countTagsAndPools(
  path.join(__dirname, "../bak/", "item-719-2023-9-24-18-27-38.json")
);
console.log(result);
