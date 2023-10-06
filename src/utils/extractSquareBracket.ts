import { myLog } from "./log";

export const extractSquareBracket = (str: string) => {
  if (!str.includes("[[")) {
    return str;
  }
  // 使用正则表达式匹配所有被[[和]]包裹起来的内容
  const matches = str.match(/\[\[(.*?)\]\]/g);

  if (!matches) {
    myLog(`方括号内容解析为空 ${str}`);
    return str;
  }

  const contentList = matches.map((match) => match.slice(2, -2));

  let lastValueList = "";

  contentList.forEach((content) => {
    const [key, value] = content.split("|");
    let lastValue = value || key;
    // 看看是否包含中文
    const regex = /[\u4e00-\u9fa5]/;
    if (!regex.test(lastValue)) {
      myLog(`方括号内容解析不包含中文 ${str} ${lastValue}`);
      lastValue = "";
    } else {
      myLog(`方括号内容解析成功 ${str} ${lastValue}`);
    }

    str = str.replace(`[[${content}]]`, lastValue);
    lastValueList += lastValue;
  });

  if (
    lastValueList.replace("color:*", "").replace("color*", "").includes("*")
  ) {
    // str = `{{FIXME 方括号内容解析包含*}} ${str}`;
    str = "";
  }

  return str;
};
