import * as cheerio from "cheerio";

/** 将原始 html 转换为格式化数据 */
export const convertHTML = (
  target: cheerio.Cheerio<cheerio.Element>,
  $: cheerio.CheerioAPI
) => {
  // 处理实体
  // 找到 class 里包含 entity 的 span 标签
  const entitySpans = target.find("span[class*='entity']");
  entitySpans.each((_, span) => {
    const $span = $(span);
    const backgroundPosition = $span
      .attr("style")
      ?.match(/background-position: (.*);/)?.[1];
    const entityType = $span.attr("class")?.split(" ")?.[1]?.split("-")?.[1];
    const entity =
      "{{entity|" + "" + "|" + backgroundPosition + "|" + entityType + "}}";
    // 将 entity 插入到 target 中原本 span 标签的位置
    $span.replaceWith(entity);
  });

  // 处理道具
  // 找到 class 里包含 item-link 的 span 标签
  const itemLinkSpans = target.find("span[class*='item-link']");
  itemLinkSpans.each((_, itemLink) => {
    const $itemLink = $(itemLink);
    // 找到当前 span 内 a 标签的内容
    const itemCode = $itemLink.find("a").attr("title");
    if (itemCode) {
      const item = "{{item|ID=" + itemCode?.toLowerCase() + "}}";
      // 将 item 插入到 target 中原本 span 标签的位置
      $itemLink.replaceWith(item);
    }
  });

  // 处理角色
  // 找一下 target 内有没有 img。有的话，将 img 的 alt 替换为 {{chara|xxx}}
  const img = target.find("span img");
  let chara = "";
  let charaName: any = "";
  if (img) {
    // 获取img的alt
    charaName = img.attr("alt");
    chara = `{{chara|${charaName}}}`;
  }

  // 将所有 挑战#XXX 替换为 {{挑战|XXX}}，其中 XXX 为纯数字
  const challenge = target.text()?.match(/挑战#(\d+)/);
  if (challenge) {
    target.text(
      target.text()?.replace(challenge[0], `{{挑战|${challenge[1]}}}`)
    );
  }

  return target.text()?.trim()?.replace(charaName, chara);
};
