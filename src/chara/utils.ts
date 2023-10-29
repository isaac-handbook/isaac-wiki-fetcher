// 去除字符串中的换行符
export function format(str: string): string {
  return str
    .replace(/[\r\n\t]/g, "")
    .replace(/\\\(/g, "")
    .replace(/\\\)/g, "");
}

// 生命转换
export function formatHealth(str: string): string {
  if (!str) return "{{math|/}}";
  return str
    .replace(/Health Red 2.png/g, "{{health|红2}}")
    .replace(/Health Soul 2.png/g, "{{health|魂2}}")
    .replace(/Health Black 2.png/g, "{{health|黑2}}")
    .replace(/Health Coin 2.png/g, "{{health|钱}}")
    .replace(/Health Bone 2.png/g, "{{health|骨0}}")
    .replace(/Health Red 0.pngHealth Red 0.png/g, "+2个空容器");
}

export const formatBaseInfo = (info: string) => {
  return `{{math|${format(info)}}}`;
};
