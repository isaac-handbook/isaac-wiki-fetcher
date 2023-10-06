import { myLog } from "./log";

export function extractDLCRContent(value: string, inDif: boolean = false) {
  let str = value;
  if (!str.includes("DLC")) {
    return str;
  }
  if (str.includes("|DLC")) {
    let str1 = str;
    // 删除 |DLC-=、|DLCR-= 、|DLC+-= 及其跟随的内容
    str1 = str1
      .replace(/\|DLC-=.*?(?=\|DLC|\|DLCR|$)/g, "")
      .replace(/\|DLC\+-=.*?(?=\|DLC|\|DLCR|$)/g, "")
      .replace(/\|DLCR-=.*?(?=\|DLC|\|DLCR|$)/g, "");

    // 如果存在同时存在多个，则只保留{{DLCR}}的内容
    if (
      inDif &&
      str1.includes("|DLCR=") &&
      (str1.includes("|DLC=") || str1.includes("|DLC+="))
    ) {
      str1 = str1
        .replace(/\|DLC=.*?(?=\|DLC|\|DLCR|$)/g, "")
        .replace(/\|DLC\+=.*?(?=\|DLC|\|DLCR|$)/g, "")
        .replace(/\|DLCR=|\|DLC\+=/g, "");
    } else {
      // 提取 |DLCR= 或 |DLC+= 后面跟随的内容，并替换标志符
      str1 = str1
        .replace(/\|DLCR=|\|DLC\+=/g, "")
        .replace(/\|DLC\+=|\|DLC\+=/g, "")
        .replace(/\|DLC=|\|DLC\+=/g, "");
    }

    if (str1) {
      return str1;
    }
  }

  if (str.includes("{{DLC")) {
    let str2 = str;
    // 删除 {{DLC+-}}、{{DLC-}}、{{DLCR-}} 及其跟随的内容
    str2 = str2
      .replace(/\{\{DLC-\}\}.*?(?=\{\{DLC|$)/g, "")
      .replace(/\{\{DLC\+-\}\}.*?(?=\{\{DLC|$)/g, "")
      .replace(/\{\{DLCR-\}\}.*?(?=\{\{DLC|$)/g, "");

    // 删除 {{DLC}} {{DLCR}} 或 {{DLC+}} 标志符本身，保留其后的内容
    // 如果存在同时存在多个，则只保留{{DLCR}}的内容
    if (
      inDif &&
      str2.includes("{{DLCR}}") &&
      (str2.includes("{{DLC}}") || str2.includes("{{DLC+}}"))
    ) {
      str2 = str2
        .replace(/\{\{DLC\}\}.*?(?=\{\{DLC|$)/g, "")
        .replace(/\{\{DLC\+\}\}.*?(?=\{\{DLC|$)/g, "")
        .replace(/\{\{DLCR\}\}/g, "");
    } else {
      str2 = str2
        .replace(/\{\{DLCR\}\}/g, "")
        .replace(/\{\{DLC\+\}\}/g, "")
        .replace(/\{\{DLC\}\}/g, "");
    }

    if (str2) {
      return str2;
    }
  }

  myLog(`DLCR内容解析失败或为空 ${str}`);
  return "";
}
