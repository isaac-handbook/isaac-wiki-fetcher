import * as fs from "fs";
import * as path from "path";

const logDirectory = path.join(__dirname, "../..", "log");

// 确保日志目录存在
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}

const logFileNamePrefix = new Date().toString().split(" GMT")[0]; // yyyy-MM-ddTHH:mm:ss.sssZ

export const myLog = (message: string): void => {
  // 获取当前日期时间作为文件名和日志条目的时间戳
  const currentDateTime = new Date();
  const logLinePrefix = currentDateTime.toString().split(" GMT")[0]; // yyyy-MM-ddTHH:mm:ss.sssZ

  const logFilename = path.join(logDirectory, `${logFileNamePrefix}.log`);

  // 在控制台打印
  console.log(message);

  // 将消息追加到日志文件
  const logEntry = `${logLinePrefix}: ${message}\n`;
  fs.appendFileSync(logFilename, logEntry);
};
