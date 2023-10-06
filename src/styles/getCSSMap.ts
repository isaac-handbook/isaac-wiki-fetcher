import * as fs from "fs";
import * as path from "path";
import * as css from "css";

export const getCSSMap = () => {
  // 读取同级目录下rawIcon.css文件
  const rawIconCSS = fs.readFileSync(
    path.resolve(__dirname, "./raw.css"),
    "utf-8"
  );
  const iconCSS = css.parse(rawIconCSS).stylesheet.rules;
  // 转换为 key:selectors[0] value:declarations的形式
  const cssMap = iconCSS.reduce((acc, cur) => {
    const { selectors, declarations } = cur;
    if (!selectors || !declarations) {
      return acc;
    }
    const key = selectors[0];
    const value = declarations[0].value;
    acc[key] = value;
    return acc;
  }, {});

  return cssMap as Record<string, string>;
};
