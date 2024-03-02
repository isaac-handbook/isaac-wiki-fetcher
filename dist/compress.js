const fs = require("fs");
// const path = "./isaac-handbook-data.json";
const path = "./isaac-exam-data.json";

// 读取文件
fs.readFile(path, "utf8", (err, data) => {
  if (err) {
    console.error("读取文件时发生错误:", err);
    return;
  }

  try {
    // 解析 JSON
    const json = JSON.parse(data);

    // 压缩 JSON 字符串（去除空格和换行）
    const compressed = JSON.stringify(json);

    // 保存文件
    fs.writeFile(path, compressed, "utf8", (err) => {
      if (err) {
        console.error("写入文件时发生错误:", err);
      } else {
        console.log("文件压缩成功。");
      }
    });
  } catch (err) {
    console.error("解析 JSON 时发生错误:", err);
  }
});
