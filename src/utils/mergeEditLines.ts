// @ts-nocheck

// 确保每行开头都有 *

export function mergeEditLines(input) {
  const lines = input.split("\n");
  let result = [];

  // 如果某一行只有 {{dif 或 }}，则删除这一行
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("{{dif") || lines[i].startsWith("}}")) {
      lines.splice(i, 1);
      i--;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("==") || lines[i].startsWith("*")) {
      result.push(lines[i]);
    } else {
      let prefix = "*";

      if (i > 0 && lines[i - 1].startsWith("*")) {
        const matches = lines[i - 1].match(/^\*+/);
        if (matches) {
          if (lines[i].includes("不叠加")) {
            prefix = matches[0] + "*";
          } else {
            prefix = matches[0];
          }
        }
      }

      result.push(prefix + lines[i]);
    }
  }

  return result.join("\n");
}
