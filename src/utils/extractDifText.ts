// @ts-nocheck
import { extractDLCRContent } from "./extractDLCRContent";
import { removeComments } from "./removeComments";
import { myLog } from "./log";

export function extractDifText(s) {
  let stack = [];
  let startIdx = -1;
  let endIdx = -1;
  let difHead = "";
  for (let i = 0; i < s.length; i++) {
    if (s.substring(i, i + 5) === "{{dif" && stack.length === 0) {
      startIdx = i + 5;
      difHead = "{{dif";
    }
    if (
      s.substring(i, i + 6) === "{{dif|" &&
      s.substring(i, i + 9) !== "{{dif|DLC" &&
      stack.length === 0
    ) {
      startIdx = i + 6;
      difHead = "{{dif|";
    }

    if (s.substring(i, i + 2) === "{{") {
      stack.push("{{");
    } else if (s.substring(i, i + 2) === "}}") {
      stack.pop();
      if (stack.length === 0 && startIdx !== -1) {
        endIdx = i - 1;
        break;
      }
    }
  }

  let rawDifText = "";

  if (startIdx !== -1 && endIdx !== -1) {
    if (s[endIdx] === "}") {
      rawDifText = s.substring(startIdx, endIdx + 2);
    }
    rawDifText = s.substring(startIdx, endIdx + 1);
  }

  // 删除括号内容
  // let difText = rawDifText.replace(/（[\s\S]*?）/g, "");
  let difText = rawDifText;

  console.log("difText", difText);

  const DLCRText = extractDLCRContent(difText, true);

  const res = s.replace(`${difHead}${rawDifText}}}`, DLCRText);

  myLog("处理dif数据 " + `${difHead}${rawDifText}}}`);

  myLog("处理结果 " + res);

  return res;
}

// console.log(
//   extractDifText(
//     "{{dif|DLCR-={{移速}}移速{{math|-0.10}}（{{DLC-}}直到下次角色的移速改变时才会生效）|DLCR={{移速}}移速{{math|+0.20}}}}{{不叠加}}"
//   )
// );
// console.log(
//   extractDifText(
//     "哈哈哈{{dif|DLCR-={{移速}}移速{{math|+0.60}}|DLCR={{移速}}移速{{math|+0.30}}}}{{不叠加}}"
//   )
// );
// console.log(
//   extractDifText(
//     `*{{dif<!--
//       -->|DLC  =多个{{N}}不叠加效果。<!--
//       -->|DLC+ =多个{{N}}会叠加效果，即免疫多次伤害。<!--
//       -->|DLCR =多个{{N}}不叠加效果。<!--
//       -->}}`
//   )
// );
