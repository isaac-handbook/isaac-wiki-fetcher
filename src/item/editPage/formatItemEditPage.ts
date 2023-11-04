import { removeComments } from "../../utils/removeComments";
import { convertEntityID } from "../../utils/convertEntityId";
import { extractDifText } from "../../utils/extractDifText";
import { extractDLCRContent } from "../../utils/extractDLCRContent";
import { BriefItem, ItemDetailNode } from "../type";
import { extractSquareBracket } from "../../utils/extractSquareBracket";
import { mergeEditLines } from "../../utils/mergeEditLines";
import { CleanType } from "..";

// const targetNodeTitleList = ["效果", "注意", "协同效应", "协同作用"];
const ignoreNodeTitleList = [
  "轶事",
  "漏洞",
  "画廊",
  "可解锁成就",
  "引用",
  "引用和注释",
  "外部链接",
  "算法与模拟",
  "算法",
  "键位",
  "解锁方式",
  "被移除的道具",
  "不可投掷",
  "可投掷",
];

/**
 * by ChatGPT
 */
const parseText = async (
  text: string,
  item: BriefItem,
  TYPE: CleanType
): Promise<ItemDetailNode[]> => {
  text = text
    .replace(/----\n/g, "")
    .replace(/{{ItemNav}}/g, "")
    .replace(/{{clear}}/g, "")
    .replace(/{{infobox character\|12}}/g, "")
    .replace(/{{TrinketNav}}/g, "")
    .replace(/{{CPNav}}/g, "")
    .replace(/（实体ID：.*?）/g, "")
    .replace(/{{Dif/g, "{{dif")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/{{\s*[Nn]av*[\|\/][^}]*}}/g, "")
    .replace(/{{kbd\|([^}]*)}}/g, "$1")
    .replace(/<code>/g, "")
    .replace(/<\/code>/g, "")
    .replace(/<nowiki>/g, "")
    .replace(/<\/nowiki>/g, "")
    .replace(/<kbd>/g, "")
    .replace(/<\/kbd>/g, "")
    .replace(/#/g, "*")
    .replace(/\:\*/g, "*")
    .replace(/{{DLCR\n}}/g, "{{DLCR}}");

  // 将所有 [[文件:XXX]] 替换为 {{file|XXX}}
  text = text.replace(/\[\[文件:(.*?)\]\]/g, "{{file|$1}}");
  text = text.replace(/\[\[File:(.*?)\]\]/g, "{{file|$1}}");

  text = mergeEditLines(text);
  // 去掉注释、换行等
  // text = removeComments(text);
  const lines = text.split("\n");

  function extractValue(i: number): { value: string; index: number } {
    let combinedValue = lines[i].replace(/^\*+/, "").trim();
    while (
      i + 1 < lines.length &&
      !lines[i + 1].startsWith("*") &&
      !lines[i + 1].startsWith("==")
    ) {
      i++;
      combinedValue += "\n" + lines[i].trim();
    }
    return { value: combinedValue, index: i };
  }

  const parseChildren = async (
    startIndex: number,
    depth: number
  ): Promise<ItemDetailNode[]> => {
    const children: ItemDetailNode[] = [];
    for (let i = startIndex; i < lines.length; i++) {
      const lineDepth = (lines[i].match(/^\*+/) || [])[0]?.length || 0;
      if (lines[i] === "*}}") {
        lines[i] = "*{{FIXME 存在未知数据}}";
      }
      if (lineDepth === depth) {
        const { value, index } = extractValue(i);
        i = index;
        if (value.includes("下面所列出来的[[种子]]")) {
          break;
        }
        const formatedValue = await formatValue(value, item, TYPE);
        if (!formatedValue) {
          continue;
        }
        const child: ItemDetailNode = {
          level: depth,
          value: formatedValue,
          extra: [],
          children: await parseChildren(index + 1, depth + 1),
        };
        children.push(child);
      }
      if (lineDepth < depth || lines[i].startsWith("==")) {
        break;
      }
    }
    return children;
  };

  const result: ItemDetailNode[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("==")) {
      const nodeTitle = lines[i].replace(/=/g, "").trim();
      // 只获取指定标题的
      // if (!targetNodeTitleList.includes(nodeTitle)) {
      //   continue;
      // }
      // 忽略某些标题的
      if (ignoreNodeTitleList.includes(nodeTitle)) {
        continue;
      }
      const formatedValue = await formatValue(
        lines[i].replace(/==/g, "").trim(),
        item,
        TYPE
      );
      if (!formatedValue) {
        continue;
      }
      const mainTitle: ItemDetailNode = {
        level: 0,
        extra: [],
        value: formatMainValue(formatedValue),
        children: await parseChildren(i + 1, 1),
      };
      if (lines[i].startsWith("===")) {
        mainTitle.extra.push("subTitle");
      }
      result.push(mainTitle);
    }
  }

  return result;
};

// 额外格式化单个主标题
const formatMainValue = (value: string) => {
  return value.replace(/\=/g, "");
};

// 格式化单个 value 的值
const formatValue = async (val: string, item: BriefItem, TYPE: CleanType) => {
  let value = val;
  // 将 {{entity|ID=XXX}} 转换为实体名称
  const entityReg = /\{\{entity\|ID=(.*?)\}\}/g;
  const entityList = value.match(entityReg);
  if (entityList) {
    for (const entity of entityList) {
      const entityID = entity.replace(/\{\{entity\|ID=(.*?)\}\}/, "$1");
      const entityName = await convertEntityID(entityID, item.id, TYPE);
      value = value.replace(entity, entityName);
    }
  }
  // 将 {{entity|XXX}} 转换为XXX
  // value = value.replace(/\{\{entity\|(.*?)\}\}/g, "$1");

  value = value.replace(/\{\{plat\|(.*?)\}\}/g, "$1");

  value = value.replace(/\{\{curse\|(.*?)\}\}/g, "$1");
  value = value.replace(/\{\{Curse\|(.*?)\}\}/g, "$1");

  // 将 =XXX= 转换为 XXX。需要注意，XXX不超过3个字符
  value = value.replace(/=(.{1,4})=/g, "$1");

  // 去掉注释、换行等
  value = removeComments(value);

  // 格式化 [[]] 数据
  value = extractSquareBracket(value);

  // 如果存在特殊样式，例如表格，直接返回
  if (value.includes("{|class")) {
    if (value.includes("wikitable")) {
      return "{{table}}";
    } else {
      return "{{FIXME 存在复杂数据}}" + value;
    }
  }

  let prevLength = value.length;
  for (let i = 0; i < 10; i++) {
    if (value.includes("{{dif")) {
      // 格式化 dif 的数据
      value = extractDifText(value);
      if (value.length === prevLength) {
        // 说明这轮处理没有用，可能是结尾少了}}，补上再来
        value = value + "}}";
      }
    } else {
      break;
    }
  }

  if (value.includes("DLC")) {
    // 只获取 DLCR 的内容
    value = extractDLCRContent(value);
  }

  value = value.replace(/：：/g, "：");

  // if (value.includes("{{main")) {
  //   value = "{{FIXME 存在main跳转标签}}" + value;
  // }

  // if (value.includes("{{Main")) {
  //   value = "{{FIXME 存在main跳转标签}}" + value;
  // }

  if (value.includes("{{main") || value.includes("{{Main")) {
    value = "";
  }

  // 请写一个 replace正则。检测字符串中所有{{3|XXX}}或{{3|XXX|NNN}}的内容。如果是{{3|XXX}}，则替换为XXX。如果是{{3|XXX|NNN}}，则替换为NNN。XXX和NNN是任意字符
  value = value.replace(
    /{{3\|([^|}]+)(?:\|([^}]+))?}}/g,
    (_, firstGroup, secondGroup) => {
      if (secondGroup !== undefined) {
        return secondGroup;
      }
      return firstGroup;
    }
  );

  value = value.replace(/''/g, "");
  value = value.replace(/<br\/>/g, "");

  if (value.includes("div")) {
    value = "{{FIXME 存在div标签}}" + value;
  }

  // 删除所有非中文行
  if (!/[\u4e00-\u9fa5]/.test(value) && !value.includes("{{")) {
    return "";
  }

  // 如果内容中包含“详见”，并且不包含“{{”，则删除
  if (value.includes("详见") && !value.includes("详见{{")) {
    return "";
  }

  if (value === "十字爆炸相当于以如下形式放置了9个炸弹的爆炸效果：") {
    value = "十字爆炸相当于放置了9个炸弹的爆炸效果";
  }

  if (value === "当人物为{{chara|堕化夏娃}}时：") {
    value = "当人物为{{chara|堕化夏娃}}时：请查阅{{chara|堕化夏娃}}";
  }

  value = value.replace(/{{需要确认概率}}/g, "");
  value = value.replace(/{{扩展包}}/g, "");

  value = value.replace(/老妈的/g, "妈妈的");
  value = value.replace(/创世纪/g, "创世记");
  value = value.replace(/神圣斗篷/g, "神圣屏障");
  value = value.replace(/巧克力奶/g, "巧克力牛奶");
  value = value.replace(/发光的沙漏/g, "发光沙漏");
  value = value.replace(/小硫磺火/g, "硫磺火宝宝");
  value = value.replace(/小怪蛋/g, "萌死戳宝宝");
  value = value.replace(/鲍勃的脑子/g, "鲍勃的脑浆子");
  value = value.replace(/栓童绳/g, "儿童栓绳");
  value = value.replace(/基友蝇/g, "生死之交");
  value = value.replace(/遥远的仰慕/g, "仰慕之交");
  value = value.replace(/朋友区/g, "浅交朋友");
  value = value.replace(/聪明蝇/g, "智能苍蝇");
  value = value.replace(/幸运轮盘/g, "幸运转盘");
  value = value.replace(/妈妈的手提包/g, "妈妈的钱包");
  value = value.replace(/血腥怒风/g, "嗜血腥风");
  value = value.replace(/店主的袋子/g, "店主的胯袋");
  value = value.replace(/伪造博士证书/g, "伪造药学博士证");
  value = value.replace(/糖果心/g, "糖心");
  value = value.replace(/洞窟探险头盔/g, "探窟帽");
  value = value.replace(/故障王冠/g, "错误王冠");
  value = value.replace(/药学博士证书/g, "药学博士证");
  value = value.replace(/巫毒娃娃的头/g, "巫毒娃娃头");
  value = value.replace(/干涸的心/g, "空虚之心");
  value = value.replace(/迷失的灵魂/g, "迷失游魂");
  value = value.replace(/新手卡组/g, "新手牌组");
  value = value.replace(/药丸袋/g, "小药袋");
  value = value.replace(/Steam打折/g, "Steam大促");
  value = value.replace(/神圣天梯/g, "天堂阶梯");
  value = value.replace(/好的妈妈？！/g, "妈妈套装");
  value = value.replace(/'妈妈的辫子'/g, "妈妈的发髻");
  value = value.replace(/水瓶座/g, "宝瓶座");
  value = value.replace(/老爸的戒指/g, "爸爸的戒指");
  value = value.replace(/格洛/g, "格罗");
  value = value.replace(/甜蝇溜溜笛/g, "糖梅溜溜笛");
  value = value.replace(/搏动虫/g, "波动虫");
  value = value.replace(/扭扭虫/g, "蠕动虫");
  value = value.replace(/遗失书页2/g, "遗失的书页2");
  value = value.replace(/纸板火柴/g, "火柴盒");
  value = value.replace(/恶魔尾巴/g, "恶魔的尾巴");
  value = value.replace(/黑口红/g, "黑色口红");
  value = value.replace(/参孙的辫子/g, "参孙的发髻");
  value = value.replace(/科技\.5/g, "科技0.5");
  value = value.replace(/迷你蘑菇/g, "小蘑菇");
  value = value.replace(/奇怪的蘑菇\(小\)/g, "怪异蘑菇(小)");
  value = value.replace(/奇怪的蘑菇\(大\)/g, "怪异蘑菇(大)");
  value = value.replace(/蓝蘑菇/g, "蓝盖蘑菇");
  value = value.replace(/魔法菇/g, "魔法蘑菇");
  value = value.replace(/上帝果实/g, "神体蘑菇");
  value = value.replace(/长子权/g, "长子名分");
  value = value.replace(/罗眠乐/g, "遗忘药");
  value = value.replace(/唤梅笛/g, "糖梅溜溜笛");
  value = value.replace(/最棒的伙伴/g, "生死之交");
  value = value.replace(/老爸的便条/g, "爸爸的便条");
  value = value.replace(/点金术/g, "弥达斯之触");
  value = value.replace(/扁平的石头/g, "扁石");
  value = value.replace(/水疱\(饰品\)/g, "水疱");
  value = value.replace(/扩展电缆/g, "扩接电线");
  value = value.replace(/小角\(道具\)/g, "小魔角");
  value = value.replace(/邪道之眼/g, "玄秘魔眼");
  value = value.replace(/跳跳虫/g, "波动虫");
  value = value.replace(/钩虫/g, "钩形虫");
  value = value.replace(/脑虫/g, "脑形虫");
  value = value.replace(/大便炸弹/g, "屁股炸弹");
  value = value.replace(/燃烧炸弹/g, "炙热炸弹");
  value = value.replace(/伤心炸弹/g, "悲伤炸弹");
  value = value.replace(/妈妈的刀/g, "妈妈的菜刀");
  value = value.replace(/科技2/g, "科技II");
  value = value.replace(/生命的气息/g, "生命之息");
  value = value.replace(/Hud/g, "health");
  value = value.replace(/感染！/g, "大量滋生！");
  value = value.replace(/感染？/g, "大量滋生？");
  value = value.replace(/狂暴！/g, "狂怒！");
  value = value.replace(/独角兽的断角/g, "独角兽的残角");
  value = value.replace(/处女座/g, "室女座");
  value = value.replace(/虚空大嘴/g, "虚空之喉");
  value = value.replace(/消逝的胞胎/g, "消失的胞胎");
  value = value.replace(/玻璃大炮\(道具\)/g, "玻璃大炮");
  value = value.replace(/鲍勃的烂脑袋/g, "鲍勃的烂头");
  value = value.replace(/婴儿博士/g, "胎儿博士");
  value = value.replace(/混沌宝珠/g, "混沌卡");
  value = value.replace(/波比弟弟/g, "波比兄弟");
  value = value.replace(/玛姬妹妹/g, "玛姬姐妹");
  value = value.replace(/？？？的灵魂/g, "???的灵魂");
  value = value.replace(/笨笨/g, "乞丐宝");
  value = value.replace(/长腿蜘蛛\(道具\)/g, "长腿蛛父");
  value = value.replace(/水蛭\(道具\)/g, "水蛭");
  value = value.replace(/小精神错乱/g, "精神错乱宝宝");
  value = value.replace(/小加迪\(道具\)/g, "肉山宝宝");
  value = value.replace(/小幽灵\(道具\)/g, "恶灵宝宝");
  value = value.replace(/心脏\(道具\)/g, "<3");
  value = value.replace(/窥视者/g, "窥眼");
  value = value.replace(/出气筒/g, "受气包");
  value = value.replace(/长腿茜茜/g, "长腿蛛妹妹");
  value = value.replace(/注意听！/g, "嘿，听好！");
  value = value.replace(/莉莉丝的灵魂石/g, "莉莉丝的魂石");
  value = value.replace(/失而复得的灵魂/g, "复得游魂");
  value = value.replace(/突变蜘蛛/g, "变异蜘蛛");
  value = value.replace(/等等，什么？/g, "等等，啥？");
  value = value.replace(/钝刀片/g, "钝剃刀片");
  value = value.replace(/所罗门之钥/g, "所罗门魔典");
  value = value.replace(/夜之精灵/g, "夜之幽魂");
  value = value.replace(/神风特攻队/g, "神风！");
  value = value.replace(/战争之蝗虫/g, "战争蝗虫");
  value = value.replace(/救济/g, "救恩");
  value = value.replace(/火柴棒/g, "火柴棍");
  value = value.replace(/魔法师/g, "魔术师");
  value = value.replace(/小洛基/g, "洛基宝宝");
  value = value.replace(/我的小独角/g, "彩虹独角兽");
  value = value.replace(/裂天/g, "撕裂苍穹");
  value = value.replace(/小马/g, "小黑马");
  value = value.replace(/刀片/g, "剃刀片");
  value = value.replace(/如何跳跃/g, "跳跃教程");
  value = value.replace(/棕色金块/g, "棕色粪块");
  value = value.replace(/博士的遥控器/g, "胎儿博士的遥控器");
  value = value.replace(/游戏机/g, "游戏掌机");
  value = value.replace(/傻瓜心灵感应教程/g, "心灵感应傻瓜式教程");
  value = value.replace(/白马/g, "小白马");
  value = value.replace(/木制硬币/g, "木制镍币");
  value = value.replace(/嗖-哒-呜/g, "嗖-哒-呜！");
  value = value.replace(/嗖-哒-呜！！/g, "嗖-哒-呜！");
  value = value.replace(/8寸钉/g, "八寸钉");
  value = value.replace(/恶魔的王冠/g, "恶魔王冠");
  value = value.replace(/灵魂石/g, "魂石");
  value = value.replace(/药丸/g, "胶囊");
  value = value.replace(/巨人豆/g, "巨豆");
  value = value.replace(/胎儿胎儿/g, "胎儿");
  value = value.replace(/胎儿胎儿/g, "胎儿");
  value = value.replace(/剃剃/g, "剃");
  value = value.replace(/小小白马/g, "小白马");
  value = value.replace(/传送器/g, "传送");
  value = value.replace(/撒旦圣经/g, "撒但圣经");
  value = value.replace(/火之意志/g, "火焰意志");
  value = value.replace(/贪婪的喉咙/g, "贪婪的胃袋");
  value = value.replace(/恶魔皇冠/g, "恶魔王冠");
  value = value.replace(/---/g, "--");
  value = value.replace(/永远的好朋友！/g, "好朋友一辈子！");
  value = value.replace(/炸弹是钥匙/g, "炸弹变钥匙");
  value = value.replace(/镍币/g, "五元币");
  value = value.replace(/铸币/g, "十元币");
  value = value.replace(/伪造硬币/g, "假币");
  value = value.replace(/弯宝宝者/g, "儿童弯勺");
  value = value.replace(/神秘纸张/g, "神秘纸片");
  value = value.replace(/史诗婴儿/g, "史诗胎儿博士");
  value = value.replace(/血腥小狗/g, "嗜血小宠");
  value = value.replace(/魔法手指/g, "魔术手指");
  value = value.replace(/永恒D6/g, "永恒六面骰");
  value = value.replace(/左手/g, "左断手");
  value = value.replace(/损坏的十字架/g, "碎安卡十字");
  value = value.replace(/幸运下降/g, "运气下降");
  value = value.replace(/被遗忘的摇篮曲/g, "失落摇篮曲");
  value = value.replace(/绦虫/g, "长条虫");
  value = value.replace(/羊蹄/g, "山羊蹄");
  value = value.replace(/木质十字架/g, "木十字架");
  value = value.replace(/试验性/g, "实验性");
  value = value.replace(/饥荒之/g, "饥荒");
  value = value.replace(/木制五元币/g, "木制镍币");
  value = value.replace(/回满血量/g, "体力回满");
  value = value.replace(/1up！/g, "1UP!");
  value = value.replace(/大便\(道具\)/g, "大便");
  value = value.replace(/雷霆大腿/g, "霹雳大腿");
  value = value.replace(/妈妈的吻/g, "母亲的吻");
  value = value.replace(/插头/g, "锋利插头");
  value = value.replace(/尖牙利爪/g, "肉中刺");
  value = value.replace(/怪蛋的肺/g, "萌死戳的肺");
  value = value.replace(/（heavyattackratepenalty）/g, "");
  value = value.replace(/雅各的天梯/g, "雅各布天梯");
  value = value.replace(/苍蝇罐头/g, "苍蝇罐");
  value = value.replace(/平衡标志/g, "平衡符号");
  value = value.replace(/眼泪起爆器/g, "眼泪引爆器");
  value = value.replace(/犹大之影/g, "犹大的影子");
  value = value.replace(/遥控起爆器/g, "起爆器");
  value = value.replace(/厨刀部件/g, "菜刀碎片");
  value = value.replace(/害虫横行2/g, "害虫横行II");
  value = value.replace(/趋泪行为/g, "食泪症");
  value = value.replace(/欲望之血/g, "血嗜");
  value = value.replace(/深渊/g, "无底坑");
  value = value.replace(/giveitem/g, "give item");
  value = value.replace(/木勺/g, "木头勺子");
  value = value.replace(/砰！/g, "轰！");
  value = value.replace(/污秽之心/g, "龌龊之心");
  value = value.replace(/魂瓶/g, "灵魂之瓮");
  value = value.replace(/重生十字架/g, "安卡十字");
  value = value.replace(/所多玛的苹果/g, "所多玛之果");
  value = value.replace(/锋利的吸管/g, "尖头吸管");
  value = value.replace(/玛姬的蝴蝶结/g, "抹大拉的蝴蝶结");
  value = value.replace(/吸血鬼的魔力/g, "吸血鬼之魅");
  value = value.replace(/遗失的隐形眼镜/g, "丢失的隐形眼镜");
  value = value.replace(/瘸子/g, "兽性面具");
  value = value.replace(/凯尔特十字架/g, "凯尔特十字");
  value = value.replace(/巴风特的印记/g, "巴风特之印");
  value = value.replace(/死者之书/g, "亡者之书");
  value = value.replace(/复活节蜡烛/g, "逾越节蜡烛");
  value = value.replace(/清澈的符文/g, "透明符文");
  value = value.replace(/驼鹿/g, "保护符文");
  value = value.replace(/孤独的灵魂/g, "孤魂铁索");
  value = value.replace(/黑魔法/g, "暗仪刺刀");
  value = value.replace(/完美/g, "满分考卷");
  value = value.replace(/指示物骰子/g, "计数二十面骰");
  value = value.replace(/奇异吸子/g, "怪异磁铁");
  value = value.replace(/寄生帽/g, "寄居骷髅帽");
  value = value.replace(/克里吉特的身体/g, "柯吉猫的身体");
  value = value.replace(/断裂的钥匙/g, "红钥匙碎片");
  value = value.replace(/美丽蝇/g, "大美蝇");
  value = value.replace(/1金钱力量/g, "金钱=力量");
  value = value.replace(/诅咒的硬币/g, "诅咒硬币");
  value = value.replace(/圣体光/g, "圣体匣");
  value = value.replace(/120伏特/g, "220伏");
  value = value.replace(/拉撒路的破布/g, "拉撒路的绷带");
  value = value.replace(/缝线娃娃/g, "织布魔偶");
  value = value.replace(/吼！/g, "呕！");
  value = value.replace(/太恐怖了/g, "恐怖如斯");
  value = value.replace(/手电筒/g, "小夜灯");
  value = value.replace(/空罐子/g, "罐子");
  value = value.replace(/魔法皮肤/g, "玄奇驴皮");
  value = value.replace(/点亮的灯泡/g, "亮灯泡");
  value = value.replace(/黯淡的灯泡/g, "暗灯泡");
  value = value.replace(/满分考卷视力/g, "完美视力");

  value = value.replace(/书虫！/g, "{{suit|书套装}}");
  value = value.replace(/别西卜！/g, "{{suit|苍蝇套装}}");
  value = value.replace(/连体！/g, "{{suit|宝宝套装}}");
  value = value.replace(/蜘蛛宝宝！/g, "{{suit|蜘蛛套装}}");
  value = value.replace(
    /部分胶囊会转换为其他胶囊：/g,
    "部分胶囊会转换为其他胶囊。"
  );

  value = value.replace(/小战争/g, "{{file|小战争.png}}小战争");
  value = value.replace(/小瘟疫/g, "{{file|小瘟疫.png}}小瘟疫");
  value = value.replace(/小饥荒/g, "{{file|小饥荒.png}}小饥荒");
  value = value.replace(/小死亡/g, "{{file|小死亡.png}}小死亡");
  value = value.replace(/小征服/g, "{{file|小征服.png}}小征服");
  value = value.replace(
    /{{chara\|雅各}}\/{{chara\|以扫}}/g,
    "{{chara|雅各和以扫}}"
  );
  value = value.replace(
    /{{chara\|雅各}}和{{chara\|以扫}}/g,
    "{{chara|雅各和以扫}}"
  );

  value = value.replace(/。\|/g, "。");
  value = value.replace(/成就\//g, "成就#");
  value = value.replace(/雅各\|雅各和以扫\|/g, "雅各和以扫");
  value = value.replace(/雅各\|雅各和以扫/g, "雅各和以扫");
  value = value.replace(/\(卡牌\)/g, "");
  value = value.replace(/link\=/g, "");
  value = value.replace(/\}\}\}：/g, "}}：");
  value = value.replace(/挑战\|/g, "挑战#");
  value = value.replace(/自杀之王\(卡牌\)/g, "自杀之王");
  value = value.replace(/黑桃A\(卡牌\)\|黑桃A/g, "黑桃A");
  value = value.replace(/Room\|/g, "room|");
  value = value.replace(/Item\|/g, "item|");
  value = value.replace(/Stage\|/g, "stage|");
  value = value.replace(/s\|/g, "stage|");
  value = value.replace(/\{\{Health\|/g, "{{health|");
  value = value.replace(/\{\{item\|弹珠\}\}/g, "{{item|弹珠袋}}");
  value = value.replace(/\{\{item\|D6\}\}/g, "{{item|六面骰}}");
  value = value.replace(/\{\{item\|D4\}\}/g, "{{item|四面骰}}");
  value = value.replace(/\{\{item\|D20\}\}/g, "{{item|二十面骰}}");
  value = value.replace(/\{\{item\|铁镐\}\}/g, "{{item|残损铁镐}}");
  value = value.replace(/\{\{item\|鼻涕\}\}/g, "{{item|鼻涕泡}}");
  value = value.replace(/\{\{item\|圣地\}\}/g, "{{item|圣地大便}}");
  value = value.replace(/\{\{item\|吐根\}\}/g, "{{item|吐根酊}}");
  value = value.replace(/\{\{item\|橡皮\}\}/g, "{{item|橡皮擦}}");
  value = value.replace(/\{\{item\|选择\}\}/g, "{{item|额外选择}}");
  value = value.replace(/\{\{item\|谷底\}\}/g, "{{item|谷底石}}");
  value = value.replace(/\{\{item\|白卡\}\}/g, "{{item|空白卡牌}}");
  value = value.replace(/\{\{item\|秒表\}\}/g, "{{item|怀表}}");
  value = value.replace(/\{\{item\|传送\}\}/g, "{{item|传送！}}");
  value = value.replace(/\{\{item\|捆绑包\}\}/g, "{{item|慈善捆绑包}}");

  // 如果以#开头，则删除这个#
  if (value.startsWith("#")) {
    value = value.replace(/^#/, "");
  }

  // 将所有 $$XXX$$ 转换为 {{math|XXX}}
  value = value.replace(/\$\$([^$]+)\$\$/g, "{{math|$1}}");

  // 将所有 {{achi|XXX|text}} 替换为 成就XXX
  value = value.replace(/\{\{achi\|([^|]+)\|text\}\}/g, "成就$1");

  if (value.startsWith("环绕中心的方向可以用鼠标来控制")) {
    value = "";
  }

  // 删除所有<s>和</s>中间的内容，包括两边的<s>和</s>
  value = value.replace(/<s>.*?<\/s>/g, "");

  // 处理颜色。将所有 <spanstyle=\"color:*AAAAAA\">'BBBBBB'</span> 替换为 {{color|AAAAAA|BBBBBB}}
  value = value.replace(
    /<spanstyle="color:\*(.*?)">(.*?)<\/span>/g,
    "{{color|#$1|$2}}"
  );
  value = value.replace(
    /<spanstyle="color\*(.*?)">(.*?)<\/span>/g,
    "{{color|#$1|$2}}"
  );

  // 将所有 'X级' 更换为 X级，去掉单引号
  value = value.replace(/'(.*?)级'/g, "$1级");

  value = value.replace(/timess/g, "times s");

  if (value.startsWith("|")) {
    value = "";
  }
  if (value.startsWith("!")) {
    value = "";
  }

  if (value.includes("div")) {
    value = "";
  }

  if (value.includes("爆炸范围如下所示")) {
    value = "";
  }

  return value;
};

export const formatItemEditPage = parseText;
