import { useState, useMemo } from "react";

const POSITION_TO_DIR8 = {
  top:"南",topLeft:"南東",left:"東",bottomLeft:"北東",
  bottom:"北",bottomRight:"北西",right:"西",topRight:"南西",
};
const DIR8_TO_DIR16 = {
  "南":["南"],"南東":["南南東","東南東"],"東":["東"],"北東":["東北東","北北東"],
  "北":["北"],"北西":["北北西","西北西"],"西":["西"],"南西":["西南西","南南西"],
};
const OPP8 = {
  "南":"北","北":"南","東":"西","西":"東",
  "南東":"北西","北西":"南東","北東":"南西","南西":"北東",
};
const HAKAI = {
  "子":"南","丑":"南南西","寅":"西南西","卯":"西",
  "辰":"西北西","巳":"北北西","午":"北","未":"北北東",
  "申":"東北東","酉":"東","戌":"東南東","亥":"南南東",
};
const DAISANGO = {
  "子":"東南東","丑":"南南東","寅":"南","卯":"南南西",
  "辰":"西南西","巳":"西","午":"西北西","未":"北北西",
  "申":"北","酉":"北北東","戌":"東北東","亥":"東",
};
// 線路日グループ
var SENRO_GROUP = {
  1:"人",2:"地",3:"天",4:"人",5:"地",6:"天",7:"人",8:"地",9:"天"
};
var SENRO_JISHI = {
  "天":["戌","未","辰","丑"],
  "人":["酉","午","卯","子"],
  "地":["亥","申","巳","寅"],
};
var SENRO_ICON = {"天":"☆","人":"♡","地":"♢"};

function getSenro(honmei, jishi) {
  var group = SENRO_GROUP[honmei];
  if (!group) return null;
  var jishiList = SENRO_JISHI[group];
  if (jishiList.indexOf(jishi) >= 0) return SENRO_ICON[group];
  return null;
}

// 天道方位（節月ベース・毎年同じ）
// 節月1=寅月(2月節)、節月4=巳月(4月節)...
// 月番号は節入り月で管理（1〜12）
var TENTO_DIRECTION = {
  1:"西",2:"南",3:"南南西",4:"北",5:"西",6:"西北西",
  7:"東",8:"北",9:"北北東",10:"南",11:"東",12:"東南東"
};

// 節入り日テーブル（2026-2027）：{year-month: [start_month, start_day, end_month, end_day]}
// 月番号は天道の月番号（1〜12）
var SETSUNYU = [
  {tentoMonth:4,  s:[2026,4,5],  e:[2026,5,4]},
  {tentoMonth:5,  s:[2026,5,5],  e:[2026,6,5]},
  {tentoMonth:6,  s:[2026,6,6],  e:[2026,7,6]},
  {tentoMonth:7,  s:[2026,7,7],  e:[2026,8,6]},
  {tentoMonth:8,  s:[2026,8,7],  e:[2026,9,6]},
  {tentoMonth:9,  s:[2026,9,7],  e:[2026,10,7]},
  {tentoMonth:10, s:[2026,10,8], e:[2026,11,6]},
  {tentoMonth:11, s:[2026,11,7], e:[2026,12,6]},
  {tentoMonth:12, s:[2026,12,7], e:[2027,1,4]},
  {tentoMonth:1,  s:[2027,1,5],  e:[2027,2,28]},
];

// 節入り日（左側に太線を入れる）
var SETSUNYU_DAYS = {
  "2026-4-5":true,"2026-5-5":true,"2026-6-6":true,"2026-7-7":true,
  "2026-8-7":true,"2026-9-7":true,"2026-10-8":true,"2026-11-7":true,
  "2026-12-7":true,"2027-1-5":true,
};
// 祝日テーブル
var HOLIDAYS = {
  "2026-4-29":"昭和の日",
  "2026-5-3":"憲法記念日",
  "2026-5-4":"みどりの日",
  "2026-5-5":"こどもの日",
  "2026-5-6":"振替休日",
  "2026-7-20":"海の日",
  "2026-8-11":"山の日",
  "2026-9-21":"敬老の日",
  "2026-9-22":"国民の休日",
  "2026-9-23":"秋分の日",
  "2026-10-12":"スポーツの日",
  "2026-11-3":"文化の日",
  "2026-11-23":"勤労感謝の日",
  "2027-1-1":"元旦",
  "2027-1-11":"成人の日",
};
// 一粒万倍日
var ICHIRYUMAN = {
  "2026-4":[8,11,20,23],
  "2026-5":[2,5,6,17,18,29,30],
  "2026-6":[12,13,24,25],
  "2026-7":[6,7,10,19,22,31],
  "2026-8":[3,13,18,25,30],
  "2026-9":[6,7,14,19,26],
  "2026-10":[1,11,14,23,26],
  "2026-11":[4,7,8,19,20],
  "2026-12":[1,2,15,16,27,28],
  "2027-1":[9,12,21],
};
// 天赦日
var TENSHA = {
  "2026-5":[4,20],
  "2026-7":[19],
  "2026-10":[1],
  "2026-12":[16],
};
// 新月
var SHINGETSU = {
  "2026-4-17":true,"2026-5-17":true,"2026-6-15":true,
  "2026-7-14":true,"2026-8-13":true,"2026-9-11":true,
  "2026-10-11":true,"2026-11-9":true,"2026-12-9":true,
  "2027-1-8":true,
};
// 満月
var MANGETSU = {
  "2026-4-2":"満月","2026-5-2":"満月","2026-5-31":"満月",
  "2026-6-30":"満月","2026-7-29":"満月","2026-8-28":"満月",
  "2026-9-27":"満月","2026-10-26":"満月","2026-11-24":"満月",
  "2026-12-24":"満月",
  "2027-1-22":"満月",
};
var SUPERMOON = {"2026-12-24":true};
function getMangetsu(date) {
  var key=date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate();
  return MANGETSU[key]||null;
}
function isSuperMoon(date) {
  var key=date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate();
  return SUPERMOON[key]===true;
}

function isShingetsu(date) {
  var key=date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate();
  return SHINGETSU[key]===true;
}

function isTensha(date) {
  var key=date.getFullYear()+"-"+(date.getMonth()+1);
  var days=TENSHA[key];
  return days?days.indexOf(date.getDate())>=0:false;
}

// 恵方参りの日
var EHOMAIRI_DAYS = {
  "2026-4-5":true,"2026-5-5":true,"2026-6-6":true,"2026-7-7":true,
  "2026-8-7":true,"2026-9-7":true,"2026-10-8":true,"2026-11-7":true,
  "2026-12-7":true,"2026-6-18":true,"2026-6-19":true,
  "2026-12-15":true,"2026-12-16":true,
  "2027-1-5":true,"2027-2-3":true,
};
function isEhomairi(date) {
  var key=date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate();
  return EHOMAIRI_DAYS[key]===true;
}

function isIchiryuman(date) {
  var key=date.getFullYear()+"-"+(date.getMonth()+1);
  var days=ICHIRYUMAN[key];
  return days?days.indexOf(date.getDate())>=0:false;
}

// 記念日（赤文字にしない）
var KINENBI = {
  "2026-9-25":"中秋の名月",
};
function getKinenbi(date) {
  var key=date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate();
  return KINENBI[key]||null;
}

function getHoliday(date) {
  var key=date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate();
  return HOLIDAYS[key]||null;
}

function isSetsunyu(date) {
  var key=date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate();
  return SETSUNYU_DAYS[key]===true;
}

function getTentoDirection(date) {
  var y=date.getFullYear(),m=date.getMonth()+1,d=date.getDate();
  for (var i=0;i<SETSUNYU.length;i++) {
    var p=SETSUNYU[i];
    var sy=p.s[0],sm=p.s[1],sd=p.s[2];
    var ey=p.e[0],em=p.e[1],ed=p.e[2];
    var inRange=false;
    if (y>sy||(y===sy&&(m>sm||(m===sm&&d>=sd)))) {
      if (y<ey||(y===ey&&(m<em||(m===em&&d<=ed)))) {
        inRange=true;
      }
    }
    if (inRange) return TENTO_DIRECTION[p.tentoMonth];
  }
  return null;
}

const CARDINAL4 = ["東","西","南","北"];
const POSITIONS = ["top","topLeft","left","bottomLeft","bottom","bottomRight","right","topRight"];
const KYUSEI = ["","一白水星","二黒土星","三碧木星","四緑木星","五黄土星","六白金星","七赤金星","八白土星","九紫火星"];
// 本命×月命→最大吉方テーブル（ルールA変換後の月命星で引く）
var MAX_KICHI_TABLE = {
  "1-2":[6,7],"1-3":[4],"1-4":[3],"1-5":[6,7],"1-6":[7],"1-7":[6],"1-8":[6,7],"1-9":[3,4],
  "2-1":[6,7],"2-3":[9],"2-4":[9],"2-5":[6,7,8,9],"2-6":[7,8],"2-7":[6,8],"2-8":[6,7,9],"2-9":[8],
  "3-1":[4],"3-2":[9],"3-4":[1,9],"3-5":[9],"3-6":[1],"3-7":[1],"3-8":[9],"3-9":[4],
  "4-1":[3],"4-2":[9],"4-3":[1,9],"4-5":[9],"4-6":[1],"4-7":[1],"4-8":[9],"4-9":[3],
  "5-1":[6,7],"5-2":[6,7,8,9],"5-3":[9],"5-4":[9],"5-6":[2,7,8],"5-7":[2,6,8],"5-8":[2,6,7,9],"5-9":[2,8],
  "6-1":[7],"6-2":[7,8],"6-3":[1],"6-4":[1],"6-5":[2,7,8],"6-7":[1,2,8],"6-8":[2,7],"6-9":[2,8],
  "7-1":[6],"7-2":[6,8],"7-3":[1],"7-4":[1],"7-5":[2,6,8],"7-6":[1,2,8],"7-8":[2,6],"7-9":[2,8],
  "8-1":[6,7],"8-2":[6,7,9],"8-3":[9],"8-4":[9],"8-5":[2,6,7,9],"8-6":[2,7],"8-7":[2,6],"8-9":[2],
  "9-1":[3,4],"9-2":[8],"9-3":[4],"9-4":[3],"9-5":[2,8],"9-6":[2,8],"9-7":[2,8],"9-8":[2],
};

// ルールA：同星変換
var SAME_STAR_CONVERT = {
  1:9, 2:6, 3:4, 4:3, 6:2, 7:8, 8:7, 9:1,
};
// 五黄×五黄は性別で分岐（gender: "f"→6, "m"→7）

function getEffectiveTsukimei(honmei, tsukimei, gender) {
  if (honmei === tsukimei) {
    if (honmei === 5) {
      return gender === "f" ? 6 : 7;
    }
    return SAME_STAR_CONVERT[honmei] || tsukimei;
  }
  return tsukimei;
}

function getMaxKichiStars(honmei, tsukimei, gender) {
  var effTsuki = getEffectiveTsukimei(honmei, tsukimei, gender);
  var key = honmei + "-" + effTsuki;
  return MAX_KICHI_TABLE[key] || [];
}

// 本命×月命→吉方位テーブル（ルールA変換後の月命星で引く）
var KICHI_TABLE = {
  '1-2':[3,4],'1-3':[6,7],'1-4':[6,7],'1-5':[3,4],'1-6':[3,4],'1-7':[3,4],'1-8':[3,4],'1-9':[6,7],
  '2-1':[8,9],'2-3':[8,6,7],'2-4':[8,6,7],'2-5':[],'2-6':[9],'2-7':[9],'2-8':[],'2-9':[6,7],
  '3-1':[9],'3-2':[4,1],'3-4':[],'3-5':[4,1],'3-6':[4,9],'3-7':[4,9],'3-8':[1,4],'3-9':[1],
  '4-1':[9],'4-2':[1,3],'4-3':[],'4-5':[3,1],'4-6':[3,9],'4-7':[3,9],'4-8':[1,3],'4-9':[1],
  '5-1':[2,8,9],'5-2':[],'5-3':[2,8,6,7],'5-4':[2,8,6,7],'5-6':[9],'5-7':[9],'5-8':[],'5-9':[6,7],
  '6-1':[2,8],'6-2':[1],'6-3':[7,2,8],'6-4':[7,2,8],'6-5':[1],'6-7':[],'6-8':[1],'6-9':[7,1],
  '7-1':[2,8],'7-2':[1],'7-3':[6,2,8],'7-4':[6,2,8],'7-5':[1],'7-6':[],'7-8':[1],'7-9':[6,1],
  '8-1':[2,9],'8-2':[],'8-3':[2,6,7],'8-4':[2,6,7],'8-5':[],'8-6':[9],'8-7':[9],'8-9':[6,7],
  '9-1':[2,8],'9-2':[3,4],'9-3':[2,8],'9-4':[2,8],'9-5':[3,4],'9-6':[3,4],'9-7':[3,4],'9-8':[3,4],
};

function getKichiStars(honmei, tsukimei, gender) {
  var effTsuki = getEffectiveTsukimei(honmei, tsukimei, gender);
  var key = honmei + '-' + effTsuki;
  return KICHI_TABLE[key] || [];
}
const KANSHI = [
  "甲子","乙丑","丙寅","丁卯","戊辰","己巳","庚午","辛未","壬申","癸酉",
  "甲戌","乙亥","丙子","丁丑","戊寅","己卯","庚辰","辛巳","壬午","癸未",
  "甲申","乙酉","丙戌","丁亥","戊子","己丑","庚寅","辛卯","壬辰","癸巳",
  "甲午","乙未","丙申","丁酉","戊戌","己亥","庚子","辛丑","壬寅","癸卯",
  "甲辰","乙巳","丙午","丁未","戊申","己酉","庚戌","辛亥","壬子","癸丑",
  "甲寅","乙卯","丙辰","丁巳","戊午","己未","庚申","辛酉","壬戌","癸亥",
];
const BASE_DATE = new Date(2026,3,1);
const BASE_CHUKO = 3;
const BASE_KI = 41;
const DOYOU_JISHI = ["丑","辰","未","戌"];
const DOYOU = [
  {s:new Date(2026,3,17),e:new Date(2026,4,4),  d:"東南東"},
  {s:new Date(2026,6,20),e:new Date(2026,7,6),  d:"南南西"},
  {s:new Date(2026,9,20),e:new Date(2026,10,6), d:"西北西"},
  {s:new Date(2027,0,17),e:new Date(2027,1,3),  d:"北北東"},
];
// 凌犯期間
var RYOHAN = [
  {s:new Date(2026,5,23), e:new Date(2026,6,19)},
  {s:new Date(2026,11,29),e:new Date(2027,0,7)},
  {s:new Date(2027,0,26), e:new Date(2027,1,6)},
];

const BASE_PAT = {top:9,topLeft:4,left:3,bottomLeft:8,bottom:1,bottomRight:6,right:7,topRight:2,center:5};

// 中宮キャッシュ
var CHUKO_CACHE = null;
function buildCache() {
  if (CHUKO_CACHE) return;
  CHUKO_CACHE = {};
  function key(d) { return d.getFullYear()+"/"+d.getMonth()+"/"+d.getDate(); }
  var cur = new Date(BASE_DATE);
  var end = new Date(2027,2,1);
  var c = BASE_CHUKO;
  CHUKO_CACHE[key(cur)] = c;
  while (cur < end) {
    var next = new Date(cur.getTime()+86400000);
    var nk = key(next);
    var ny=next.getFullYear(),nm=next.getMonth()+1,nd=next.getDate();
    if ((ny===2026&&nm===6&&nd===19)||(ny===2026&&nm===12&&nd===16)) {
      CHUKO_CACHE[nk] = c;
    } else {
      var after619  = ny===2026 && (nm>6||(nm===6&&nd>=19));
      var after1216 = (ny===2026&&(nm>12||(nm===12&&nd>=16)))||ny>=2027;
      var inHide = after619 && !after1216;
      c = inHide ? ((c-2+9)%9)+1 : (c%9)+1;
      CHUKO_CACHE[nk] = c;
    }
    cur = next;
  }
}
function getChuko(date) {
  buildCache();
  var k = date.getFullYear()+"/"+date.getMonth()+"/"+date.getDate();
  return CHUKO_CACHE[k] !== undefined ? CHUKO_CACHE[k] : BASE_CHUKO;
}

function to8(dir) {
  for (var d8 in DIR8_TO_DIR16) {
    if (DIR8_TO_DIR16[d8].indexOf(dir)>=0||d8===dir) return d8;
  }
  return dir;
}

function calcDay(date, honmei, tsukimei, maxStars, kichiStars) {
  var c = getChuko(date);
  var board = {};
  for (var i=0;i<POSITIONS.length;i++) board[POSITIONS[i]]=((BASE_PAT[POSITIONS[i]]-5+c-1+9)%9)+1;
  board.center = ((BASE_PAT.center-5+c-1+9)%9)+1;

  var gokou8=null;
  for (var i=0;i<POSITIONS.length;i++) {
    if (board[POSITIONS[i]]===5){gokou8=POSITION_TO_DIR8[POSITIONS[i]];break;}
  }
  var anken8 = gokou8?OPP8[gokou8]:null;

  var n = Math.round((date-BASE_DATE)/86400000);
  var ki = ((BASE_KI+n)%60+60)%60;
  var kanshi = KANSHI[ki];
  var jishi = kanshi[1];
  var hakai16 = HAKAI[jishi];
  var daisango16 = DAISANGO[jishi];

  // 土用殺（土の日のみ・30°）
  var doyou16 = null;
  var dt = new Date(date.getFullYear(),date.getMonth(),date.getDate());
  for (var i=0;i<DOYOU.length;i++) {
    var s=new Date(DOYOU[i].s.getFullYear(),DOYOU[i].s.getMonth(),DOYOU[i].s.getDate());
    var e=new Date(DOYOU[i].e.getFullYear(),DOYOU[i].e.getMonth(),DOYOU[i].e.getDate());
    if (dt>=s&&dt<=e&&DOYOU_JISHI.indexOf(jishi)>=0){doyou16=DOYOU[i].d;break;}
  }

  // 60°凶：五黄殺・暗剣殺・本命殺・月命殺・的殺
  var kyou8 = {};
  if (gokou8){kyou8[gokou8]=true;if(OPP8[gokou8])kyou8[OPP8[gokou8]]=true;}
  for (var i=0;i<POSITIONS.length;i++) {
    var star=board[POSITIONS[i]];
    if (honmei.indexOf(star)>=0||tsukimei.indexOf(star)>=0) {
      var d8=POSITION_TO_DIR8[POSITIONS[i]];
      kyou8[d8]=true;
      if(OPP8[d8])kyou8[OPP8[d8]]=true;
    }
  }

  // 30°凶：破壊殺・土用殺
  var kyou16 = {};
  if (hakai16) kyou16[hakai16]=true;
  if (doyou16) kyou16[doyou16]=true;

  var daisango8 = to8(daisango16);
  var daisangoIsCardinal = CARDINAL4.indexOf(daisango16)>=0;

  // 天道方位
  var tento16 = getTentoDirection(date);
  var tento8 = tento16 ? to8(tento16) : null;

  var maxResults=[],kichiResults=[];
  for (var i=0;i<POSITIONS.length;i++) {
    var pos=POSITIONS[i];
    var star=board[pos];
    var d8=POSITION_TO_DIR8[pos];
    if (kyou8[d8]) continue; // 60°凶はスキップ

    var dir16list=DIR8_TO_DIR16[d8];
    var isCardinal=(dir16list.length===1);

    if (isCardinal) {
      // 東西南北：30°も同一
      if (kyou16[d8]) continue;
      var matchDaisango=(d8===daisango16);
      var matchTento=(d8===tento16);
      var isSpec=matchDaisango||matchTento;
      var isSuperSpec=matchDaisango&&matchTento;
      // 東西南北でスペシャル（大三合or天道）の場合は通常カード非表示
      // 東西南北は30°=60°なのでスペシャルと通常が同じ方位→非表示
      var tentoIsCardinal=tento16?CARDINAL4.indexOf(tento16)>=0:false;
      var hideN=isSpec&&((matchDaisango&&daisangoIsCardinal)||(matchTento&&tentoIsCardinal));
      var ent={star:star,dir8:d8,dir16:d8,isSpecial:isSpec,isSuperSpecial:isSuperSpec,hideNormal:hideN,matchDaisango:matchDaisango,matchTento:matchTento};
      if(maxStars.indexOf(star)>=0) maxResults.push(ent);
      if(kichiStars.indexOf(star)>=0) kichiResults.push(ent);
    } else {
      // 斜め方位：30度凶の有無で表示方法を決める
      var bl0=kyou16[dir16list[0]]?true:false;
      var bl1=kyou16[dir16list[1]]?true:false;
      if (bl0&&bl1) {
        continue;
      } else if (!bl0&&!bl1) {
        // 両方吉：天道・大三合チェック
        var matchDaisango=(daisango16===dir16list[0]||daisango16===dir16list[1]);
        var matchTento=tento16&&(tento16===dir16list[0]||tento16===dir16list[1]);
        var isSpec=matchDaisango||matchTento;
        var isSuperSpec=matchDaisango&&matchTento;
        // スペシャル方位のdir16を決定（両方なら大三合優先）
        var specDir16=matchDaisango?daisango16:(matchTento?tento16:d8);
        var ent={star:star,dir8:d8,dir16:isSpec?specDir16:d8,isSpecial:isSpec,isSuperSpecial:isSuperSpec,hideNormal:false,matchDaisango:matchDaisango,matchTento:matchTento};
        if(maxStars.indexOf(star)>=0) maxResults.push(ent);
        if(kichiStars.indexOf(star)>=0) kichiResults.push(ent);
      } else {
        // 片方だけ凶→残った30°のみ吉
        var okd16=bl0?dir16list[1]:dir16list[0];
        var matchDaisango=(okd16===daisango16);
        var matchTento=tento16&&(okd16===tento16);
        var isSpec=matchDaisango||matchTento;
        var isSuperSpec=matchDaisango&&matchTento;
        var specDir16=matchDaisango?daisango16:(matchTento?tento16:okd16);
        var hideN=isSpec&&!matchTento&&daisangoIsCardinal;
        var ent={star:star,dir8:okd16,dir16:isSpec?specDir16:okd16,isSpecial:isSpec,isSuperSpecial:isSuperSpec,hideNormal:hideN,matchDaisango:matchDaisango,matchTento:matchTento};
        if(maxStars.indexOf(star)>=0) maxResults.push(ent);
        if(kichiStars.indexOf(star)>=0) kichiResults.push(ent);
      }
    }
  }

  return {board:board,c:c,kanshi:kanshi,jishi:jishi,gokou8:gokou8,anken8:anken8,hakai16:hakai16,doyou16:doyou16,daisango16:daisango16,tento16:tento16,maxResults:maxResults,kichiResults:kichiResults,senro:null};
}

// ---- UI ----
const MONTHS=[
  {label:"2026年4月",year:2026,month:3},{label:"2026年5月",year:2026,month:4},
  {label:"2026年6月",year:2026,month:5},{label:"2026年7月",year:2026,month:6},
  {label:"2026年8月",year:2026,month:7},{label:"2026年9月",year:2026,month:8},
  {label:"2026年10月",year:2026,month:9},{label:"2026年11月",year:2026,month:10},
  {label:"2026年12月",year:2026,month:11},{label:"2027年1月",year:2027,month:0},
];
const WD=["日","月","火","水","木","金","土"];

function SingleStarPicker(props){
  var label=props.label,value=props.value,onChange=props.onChange;
  return(
    <div>
      <div style={{fontSize:"11px",color:"#9a8070",marginBottom:"6px",letterSpacing:"1px"}}>
        {label} <span style={{color:"#b0987a"}}>（タップして選択）</span>
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:"5px"}}>
        {[1,2,3,4,5,6,7,8,9].map(function(n){
          var sel=value===n;
          return(
            <button key={n} onClick={function(){onChange(n);}} style={{
              padding:"6px 10px",borderRadius:"6px",fontSize:"13px",cursor:"pointer",
              border:sel?"1px solid #c9a96e":"1px solid rgba(180,140,90,0.2)",
              background:sel?"rgba(201,169,110,0.22)":"rgba(255,255,255,0.6)",
              color:sel?"#5a3e20":"#9a8a78",
            }}>{n}</button>
          );
        })}
      </div>
      <div style={{fontSize:"9px",color:"#b0987a",marginTop:"4px"}}>{KYUSEI[value]}</div>
    </div>
  );
}

function MultiStarPicker(props){
  var label=props.label,value=props.value,onChange=props.onChange,max=props.max;
  function toggle(n){
    if(value.indexOf(n)>=0) onChange(value.filter(function(x){return x!==n;}));
    else if(value.length<max) onChange(value.concat([n]));
  }
  return(
    <div>
      <div style={{fontSize:"11px",color:"#9a8070",marginBottom:"6px",letterSpacing:"1px"}}>
        {label} <span style={{color:"#b0987a"}}>（{max}個まで・なしも可）</span>
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:"5px"}}>
        {[1,2,3,4,5,6,7,8,9].map(function(n){
          var sel=value.indexOf(n)>=0;
          return(
            <button key={n} onClick={function(){toggle(n);}} style={{
              padding:"6px 10px",borderRadius:"6px",fontSize:"13px",cursor:"pointer",
              border:sel?"1px solid #c9a96e":"1px solid rgba(180,140,90,0.2)",
              background:sel?"rgba(201,169,110,0.22)":"rgba(255,255,255,0.6)",
              color:sel?"#5a3e20":"#9a8a78",
            }}>{n}</button>
          );
        })}
      </div>
      {value.length>0&&(
        <div style={{fontSize:"9px",color:"#b0987a",marginTop:"4px"}}>
          {value.map(function(n){return KYUSEI[n];}).join("　")}
        </div>
      )}
    </div>
  );
}

function Badges(props){
  var r=props.r,items=[],specDirs={};
  // スーパースペシャル（ゴールド）→スペシャル（ピンク）→通常の順
  r.maxResults.forEach(function(x){
    if(x.isSuperSpecial&&!specDirs[x.dir16]){specDirs[x.dir16]=true;items.push({col:"#f0c030",icon:"🌟",dir:x.dir16});}
    else if(x.isSpecial&&!specDirs[x.dir16]){specDirs[x.dir16]=true;items.push({col:"#ff6b9d",icon:"⭐",dir:x.dir16});}
  });
  r.kichiResults.forEach(function(x){
    if(x.isSuperSpecial&&!specDirs[x.dir16]){specDirs[x.dir16]=true;items.push({col:"#f0c030",icon:"🌟",dir:x.dir16});}
    else if(x.isSpecial&&!specDirs[x.dir16]){specDirs[x.dir16]=true;items.push({col:"#ff6b9d",icon:"⭐",dir:x.dir16});}
  });
  // 通常カードはdir8（60°）で表示
  r.maxResults.forEach(function(x){if(!x.hideNormal)items.push({col:"#c9a96e",icon:"◎",dir:x.dir8});});
  r.kichiResults.forEach(function(x){if(!x.hideNormal)items.push({col:"#6db87e",icon:"○",dir:x.dir8});});
  if(items.length===0)return null;
  return(
    <div style={{marginTop:"2px"}}>
      {items.slice(0,4).map(function(b,i){return <div key={i} style={{fontSize:"10px",color:b.col,lineHeight:1.5,fontWeight:"bold"}}>{b.icon} {b.dir}</div>;})}
      {items.length>4&&<div style={{fontSize:"8px",color:"#b0987a"}}>他{items.length-4}件</div>}
    </div>
  );
}

function Detail(props){
  var r=props.r,date=props.date,onClose=props.onClose;
  var kanshi=r.kanshi,jishi=r.jishi,maxResults=r.maxResults,kichiResults=r.kichiResults;
  var gokou8=r.gokou8,anken8=r.anken8,hakai16=r.hakai16,doyou16=r.doyou16,daisango16=r.daisango16;
  var dow=date.getDay();

  // スペシャル（重複除去）
  var specials=[],specDirs={};
  maxResults.forEach(function(x){
    if(x.isSpecial&&!specDirs[x.dir16]){specDirs[x.dir16]=true;specials.push({star:x.star,dir16:x.dir16,isSuperSpecial:x.isSuperSpecial,matchDaisango:x.matchDaisango,matchTento:x.matchTento});}
  });
  kichiResults.forEach(function(x){
    if(x.isSpecial&&!specDirs[x.dir16]){specDirs[x.dir16]=true;specials.push({star:x.star,dir16:x.dir16,isSuperSpecial:x.isSuperSpecial,matchDaisango:x.matchDaisango,matchTento:x.matchTento});}
  });

  var kyouItems=[];
  if(gokou8) kyouItems.push({l:"五黄殺",d:gokou8});
  if(anken8) kyouItems.push({l:"暗剣殺",d:anken8});
  kyouItems.push({l:"破壊殺",d:hakai16});
  if(doyou16) kyouItems.push({l:"土用殺",d:doyou16});

  var visMax=maxResults.filter(function(x){return !x.hideNormal;});
  var visKichi=kichiResults.filter(function(x){return !x.hideNormal;});
  var hasAny=specials.length>0||visMax.length>0||visKichi.length>0;

  return(
    <div style={{marginTop:"14px",background:"rgba(255,255,255,0.9)",border:"1px solid rgba(180,140,90,0.25)",borderRadius:"12px",padding:"16px",boxShadow:"0 4px 20px rgba(180,140,90,0.12)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"12px"}}>
        <div>
          <div style={{fontSize:"18px",color:(dow===0||r.holiday)?"#b04040":"#7a5c3a",letterSpacing:"2px"}}>
            {date.getMonth()+1}月{date.getDate()}日（{WD[dow]}）
            {r.holiday&&<span style={{fontSize:"13px",marginLeft:"8px",color:"#b04040"}}>{r.holiday}</span>}
          </div>
          <div style={{fontSize:"11px",color:"#9a8070",marginTop:"3px"}}>
            {kanshi}　地支：{jishi}　中宮：{r.c}
            {r.senro&&<span style={{marginLeft:"8px",color:"#c9a96e"}}>線路日 {r.senro}</span>}
            {r.enjitsu&&<span style={{marginLeft:"8px",color:"#e07090"}}>縁日 ♥</span>}
            {r.shingetsu&&<span style={{marginLeft:"8px"}}>🌑 新月</span>}
            {r.mangetsu&&<span style={{marginLeft:"8px",color:r.supermoon?"#e8a000":"#c8a040",fontWeight:"bold"}}>{r.supermoon?"🌕 スーパームーン":"🌕 満月"}</span>}
            {r.ehomairi&&<span style={{marginLeft:"8px",color:"#7040b0",fontWeight:"bold"}}>恵方参り</span>}
            {r.tensha&&<span style={{marginLeft:"8px",color:"#3060c0",fontWeight:"bold"}}>天赦日</span>}
            {r.ichiryuman&&<span style={{marginLeft:"8px",color:"#c07820",fontWeight:"bold"}}>一粒万倍日</span>}
          </div>
        </div>
        <button onClick={onClose} style={{background:"transparent",border:"none",color:"#b0987a",cursor:"pointer",fontSize:"18px",padding:"0 4px"}}>✕</button>
      </div>
      <div style={{height:"1px",background:"rgba(180,140,90,0.15)",marginBottom:"12px"}}/>

      <div style={{marginBottom:"14px"}}>
        <div style={{fontSize:"11px",color:"#9a7a50",letterSpacing:"3px",marginBottom:"8px"}}>◈ 吉方位</div>
        {!hasAny&&<div style={{color:"#b0987a",fontSize:"12px",padding:"4px 0"}}>本日は吉方位なし</div>}

        {specials.map(function(sp,i){
          var isSS=sp.isSuperSpecial;
          var bg=isSS?"rgba(255,245,210,0.9)":"rgba(255,220,235,0.8)";
          var border=isSS?"1px solid rgba(200,160,20,0.5)":"1px solid rgba(200,40,100,0.35)";
          var titleCol=isSS?"#8a6000":"#c0105a";
          var dirCol=isSS?"#8a6000":"#c0105a";
          var subCol=isSS?"#b09020":"#a07080";
          var title=isSS?"🌟 スーパースペシャル吉方位":"⭐ スペシャル吉方位";
          var reason=[];
          if(sp.matchDaisango)reason.push("大三合（"+daisango16+"）");
          if(sp.matchTento)reason.push("天道（"+r.tento16+"）");
          return(
            <div key={"sp"+i} style={{background:bg,border:border,borderRadius:"8px",padding:"10px 14px",marginBottom:"8px"}}>
              <div style={{fontSize:"10px",color:titleCol,marginBottom:"3px"}}>{title}</div>
              <div style={{fontSize:"22px",color:dirCol,letterSpacing:"4px"}}>{sp.dir16}</div>
              <div style={{fontSize:"9px",color:subCol,marginTop:"3px"}}>{KYUSEI[sp.star]}が廻座　✦ {reason.join("＆")}と一致</div>
            </div>
          );
        })}

        {visMax.map(function(x,i){
          return(
            <div key={"m"+i} style={{background:"rgba(201,169,110,0.13)",border:"1px solid rgba(201,169,110,0.4)",borderRadius:"8px",padding:"10px 14px",marginBottom:"8px"}}>
              <div style={{fontSize:"10px",color:"#c9a96e",marginBottom:"3px"}}>◎ 最大吉方位</div>
              <div style={{fontSize:"22px",color:"#7a5c3a",letterSpacing:"4px",fontWeight:"bold"}}>{x.dir8}</div>
              <div style={{fontSize:"9px",color:"#9a8070",marginTop:"3px"}}>{KYUSEI[x.star]}が廻座</div>
            </div>
          );
        })}

        {visKichi.map(function(x,i){
          return(
            <div key={"k"+i} style={{background:"rgba(109,184,126,0.1)",border:"1px solid rgba(109,184,126,0.35)",borderRadius:"8px",padding:"10px 14px",marginBottom:"8px"}}>
              <div style={{fontSize:"10px",color:"#6db87e",marginBottom:"3px"}}>○ 吉方位</div>
              <div style={{fontSize:"22px",color:"#2a6a3a",letterSpacing:"4px",fontWeight:"bold"}}>{x.dir8}</div>
              <div style={{fontSize:"9px",color:"#709080",marginTop:"3px"}}>{KYUSEI[x.star]}が廻座</div>
            </div>
          );
        })}
      </div>

      {r.isRyohan&&<div style={{marginBottom:"10px",background:"rgba(220,200,0,0.15)",border:"1px solid rgba(200,180,0,0.4)",borderRadius:"6px",padding:"6px 10px",fontSize:"11px",color:"#806000",fontWeight:"bold"}}>⚠ 凌犯期間</div>}
      <div style={{marginBottom:"14px"}}>
        <div style={{fontSize:"11px",color:"#b05050",letterSpacing:"3px",marginBottom:"8px"}}>◈ 凶方位</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:"5px"}}>
          {kyouItems.map(function(item){
            return(
              <div key={item.l} style={{background:"rgba(220,100,100,0.08)",border:"1px solid rgba(200,80,80,0.2)",borderRadius:"6px",padding:"5px 10px",fontSize:"11px"}}>
                <span style={{color:"#9a8070"}}>{item.l}：</span><span style={{color:"#c05050"}}>{item.d}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <div style={{fontSize:"11px",color:"#c9a96e",letterSpacing:"3px",marginBottom:"5px"}}>◈ 大三合・天道方位</div>
        <div style={{fontSize:"12px",color:"#9a8060",marginBottom:"4px"}}>大三合：{jishi}の日 → <span style={{color:"#c9a96e",fontSize:"14px"}}>{daisango16}</span></div>
        {r.tento16&&<div style={{fontSize:"12px",color:"#9a8060"}}>天道：<span style={{color:"#c9a96e",fontSize:"14px"}}>{r.tento16}</span></div>}
      </div>
    </div>
  );
}

export default function App(){
  var s0=useState("f");  var gender=s0[0];   var setGender=s0[1];
  var s1=useState(1);   var honmei=s1[0];   var setHonmei=s1[1];
  var s2=useState(4);   var tsukimei=s2[0]; var setTsukimei=s2[1];
  var s3=useState([]);  var enjitsu=s3[0];  var setEnjitsu=s3[1];
  var s5=useState(0);   var mi=s5[0];       var setMi=s5[1];
  var s6=useState(null);var sel=s6[0];      var setSel=s6[1];

  // 最大吉方星・吉方星を自動算出
  var maxK = getMaxKichiStars(honmei, tsukimei, gender);
  var kichi = getKichiStars(honmei, tsukimei, gender);
  var effTsuki = getEffectiveTsukimei(honmei, tsukimei, gender);

  var minfo=MONTHS[mi];
  var year=minfo.year,month=minfo.month,label=minfo.label;
  var dim=new Date(year,month+1,0).getDate();
  var fd=new Date(year,month,1).getDay();

  var cells=useMemo(function(){
    var arr=[];
    for(var i=0;i<fd;i++) arr.push(null);
    for(var d=1;d<=dim;d++){
      var date=new Date(year,month,d);
      var res=calcDay(date,[honmei],[effTsuki],maxK,kichi);
      res.day=d; res.date=date;
      res.senro=getSenro(honmei, res.jishi);
      res.enjitsu=enjitsu.indexOf(res.c)>=0;
      res.isSetsunyu=isSetsunyu(date);
      res.holiday=getHoliday(date);
      res.kinenbi=getKinenbi(date);
      res.ichiryuman=isIchiryuman(date);
      res.tensha=isTensha(date);
      res.ehomairi=isEhomairi(date);
      res.shingetsu=isShingetsu(date);
      res.mangetsu=getMangetsu(date);
      res.supermoon=isSuperMoon(date);
      // 土用期間チェック＋間日チェック
      var dtCheck=new Date(date.getFullYear(),date.getMonth(),date.getDate());
      var inDoyou=false;
      var isMaday=false;
      var MADAY_JISHI={
        "春":["巳","午","酉"],
        "夏":["卯","辰","申"],
        "秋":["未","酉","亥"],
        "冬":["寅","卯","巳"],
      };
      var DOYOU_SEASON=["春","夏","秋","冬"];
      for(var di=0;di<DOYOU.length;di++){
        var ds=new Date(DOYOU[di].s.getFullYear(),DOYOU[di].s.getMonth(),DOYOU[di].s.getDate());
        var de=new Date(DOYOU[di].e.getFullYear(),DOYOU[di].e.getMonth(),DOYOU[di].e.getDate());
        if(dtCheck>=ds&&dtCheck<=de){
          inDoyou=true;
          var season=DOYOU_SEASON[di];
          if(MADAY_JISHI[season].indexOf(res.jishi)>=0) isMaday=true;
          break;
        }
      }
      res.isDoyou=inDoyou;
      res.isMaday=isMaday;
      // 凌犯期間チェック
      var inRyohan=false;
      for(var ri=0;ri<RYOHAN.length;ri++){
        var rs=new Date(RYOHAN[ri].s.getFullYear(),RYOHAN[ri].s.getMonth(),RYOHAN[ri].s.getDate());
        var re=new Date(RYOHAN[ri].e.getFullYear(),RYOHAN[ri].e.getMonth(),RYOHAN[ri].e.getDate());
        if(dtCheck>=rs&&dtCheck<=re){inRyohan=true;break;}
      }
      res.isRyohan=inRyohan;
      // 節入りラベル（土用明けは立春/立夏/立秋/立冬）
      var SETSU_LABELS={"2026-5-5":"立夏","2026-8-7":"立秋","2026-11-7":"立冬","2027-2-3":"立春"};
      var setsuKey=(date.getFullYear())+"-"+(date.getMonth()+1)+"-"+date.getDate();
      res.setsuLabel=SETSU_LABELS[setsuKey]||null;
      arr.push(res);
    }
    return arr;
  },[year,month,dim,fd,honmei,tsukimei,gender,enjitsu]);

  var selData=null;
  for(var i=0;i<cells.length;i++){
    if(cells[i]&&cells[i].day===sel){selData=cells[i];break;}
  }

  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(150deg,#fdf8f2 0%,#f5ede0 50%,#faf5ee 100%)",fontFamily:"'Hiragino Maru Gothic ProN','Rounded Mplus 1c','BIZ UDPGothic',sans-serif",color:"#3a2e22",padding:"14px"}}>

      <div style={{textAlign:"center",marginBottom:"16px"}}>
        <div style={{fontSize:"10px",letterSpacing:"6px",color:"#9a7a50",marginBottom:"5px"}}>九星気学風水</div>
        <div style={{fontSize:"20px",letterSpacing:"3px",color:"#7a5c3a",fontWeight:"normal"}}>
          パーソナル吉方位カレンダー
        </div>
        <div style={{fontSize:"10px",color:"#b0987a",letterSpacing:"2px",marginTop:"4px"}}>designed by ぴぃ</div>
        <div style={{width:"90px",height:"1px",background:"linear-gradient(90deg,transparent,#c9a96e,transparent)",margin:"6px auto 0"}}/>
      </div>

      <div style={{background:"rgba(255,255,255,0.75)",border:"1px solid rgba(180,140,90,0.25)",borderRadius:"12px",padding:"14px",marginBottom:"14px",boxShadow:"0 2px 12px rgba(180,140,90,0.08)"}}>
        <div style={{fontSize:"11px",color:"#9a7a50",letterSpacing:"3px",marginBottom:"14px"}}>◈ 基本設定</div>
        <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>

          {/* 性別選択 */}
          <div>
            <div style={{fontSize:"11px",color:"#9a8070",marginBottom:"6px",letterSpacing:"1px"}}>性別</div>
            <div style={{display:"flex",gap:"8px"}}>
              {[["f","女性"],["m","男性"]].map(function(item){
                var sel=gender===item[0];
                return(
                  <button key={item[0]} onClick={function(){setGender(item[0]);setSel(null);}} style={{
                    flex:1,padding:"8px",borderRadius:"8px",fontSize:"13px",cursor:"pointer",
                    border:sel?"1px solid rgba(180,140,90,0.6)":"1px solid rgba(180,140,90,0.2)",
                    background:sel?"rgba(201,169,110,0.2)":"rgba(255,255,255,0.6)",
                    color:sel?"#5a3e20":"#9a8a78",letterSpacing:"2px",
                  }}>{item[1]}</button>
                );
              })}
            </div>
          </div>

          <SingleStarPicker label="本命星" value={honmei} onChange={function(v){setHonmei(v);setSel(null);}}/>
          <SingleStarPicker label="月命星" value={tsukimei} onChange={function(v){setTsukimei(v);setSel(null);}}/>

          {/* 最大吉方星（自動算出・表示のみ） */}
          <div>
            <div style={{fontSize:"11px",color:"#9a8070",marginBottom:"6px",letterSpacing:"1px"}}>最大吉方星 <span style={{color:"#b0987a"}}>（自動算出）</span></div>
            <div style={{display:"flex",flexWrap:"wrap",gap:"5px"}}>
              {maxK.length===0 && <div style={{fontSize:"12px",color:"#b0987a"}}>－</div>}
              {maxK.map(function(n){
                return <div key={n} style={{padding:"5px 10px",borderRadius:"6px",fontSize:"12px",background:"rgba(201,169,110,0.15)",border:"1px solid rgba(180,140,90,0.4)",color:"#5a3e20"}}>{n}　{KYUSEI[n]}</div>;
              })}
            </div>
            {honmei===tsukimei && (
              <div style={{fontSize:"9px",color:"#a09070",marginTop:"4px"}}>
                ※同星のため月命星を{effTsuki}（{KYUSEI[effTsuki]}）に変換して算出
              </div>
            )}
          </div>

          {/* 縁日（中宮）選択 */}
          <div>
            <div style={{fontSize:"11px",color:"#9a8070",marginBottom:"6px",letterSpacing:"1px"}}>縁日（中宮） <span style={{color:"#b0987a"}}>（2つまで選択）</span></div>
            <div style={{display:"flex",flexWrap:"wrap",gap:"5px"}}>
              {[1,2,3,4,5,6,7,8,9].map(function(n){
                var sel=enjitsu.indexOf(n)>=0;
                return(
                  <button key={n} onClick={function(){
                    if(sel) setEnjitsu(enjitsu.filter(function(x){return x!==n;}));
                    else if(enjitsu.length<2) setEnjitsu(enjitsu.concat([n]));
                    setSel(null);
                  }} style={{
                    padding:"6px 10px",borderRadius:"6px",fontSize:"13px",cursor:"pointer",
                    border:sel?"1px solid rgba(200,80,120,0.5)":"1px solid rgba(180,140,90,0.2)",
                    background:sel?"rgba(220,100,130,0.15)":"rgba(255,255,255,0.6)",
                    color:sel?"#8a2a40":"#9a8a78",
                  }}>{n}</button>
                );
              })}
            </div>
            {enjitsu.length>0&&(
              <div style={{fontSize:"9px",color:"#c07080",marginTop:"4px"}}>
                中宮{enjitsu.join("・")}の日が縁日 ♥
              </div>
            )}
          </div>

          {/* 吉方星（自動算出・表示のみ） */}
          <div>
            <div style={{fontSize:"11px",color:"#9a8070",marginBottom:"6px",letterSpacing:"1px"}}>吉方星 <span style={{color:"#b0987a"}}>（自動算出）</span></div>
            <div style={{display:"flex",flexWrap:"wrap",gap:"5px"}}>
              {kichi.length===0 && <div style={{fontSize:"12px",color:"#b0987a"}}>ナシ</div>}
              {kichi.map(function(n){
                return <div key={n} style={{padding:"5px 10px",borderRadius:"6px",fontSize:"12px",background:"rgba(109,184,126,0.12)",border:"1px solid rgba(90,160,100,0.4)",color:"#2a6a3a"}}>{n}　{KYUSEI[n]}</div>;
              })}
            </div>
          </div>
        </div>
      </div>

      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"10px"}}>
        <button onClick={function(){setMi(function(m){return Math.max(0,m-1);});setSel(null);}} disabled={mi===0}
          style={{background:"rgba(255,255,255,0.8)",border:"1px solid rgba(180,140,90,0.3)",color:"#9a7a50",borderRadius:"7px",padding:"7px 14px",cursor:"pointer",opacity:mi===0?0.3:1,fontSize:"14px"}}>◀</button>
        <div style={{fontSize:"17px",letterSpacing:"3px",color:"#5a3e20"}}>{label}</div>
        <button onClick={function(){setMi(function(m){return Math.min(MONTHS.length-1,m+1);});setSel(null);}} disabled={mi===MONTHS.length-1}
          style={{background:"rgba(255,255,255,0.8)",border:"1px solid rgba(180,140,90,0.3)",color:"#9a7a50",borderRadius:"7px",padding:"7px 14px",cursor:"pointer",opacity:mi===MONTHS.length-1?0.3:1,fontSize:"14px"}}>▶</button>
      </div>

      <div style={{background:"rgba(255,255,255,0.7)",border:"1px solid rgba(180,140,90,0.15)",borderRadius:"10px",padding:"10px 12px",marginBottom:"10px"}}>
        <div style={{fontSize:"10px",color:"#9a7a50",letterSpacing:"2px",marginBottom:"7px"}}>◈ 見方</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:"6px 14px"}}>
          {[
            {icon:"🌟",lbl:"スーパースペシャル吉方位"},
            {icon:"⭐",lbl:"スペシャル吉方位"},
            {icon:"◎",lbl:"最大吉方位",col:"#9a7a50"},
            {icon:"○",lbl:"吉方位",col:"#4a9a5a"},
          ].map(function(item){
            return(
              <div key={item.lbl} style={{display:"flex",alignItems:"center",gap:"4px",fontSize:"10px",color:item.col||"#5a4a3a"}}>
                <span>{item.icon}</span><span>{item.lbl}</span>
              </div>
            );
          })}
        </div>
        <div style={{height:"1px",background:"rgba(180,140,90,0.12)",margin:"7px 0"}}/>
        <div style={{display:"flex",flexWrap:"wrap",gap:"6px 14px"}}>
          {(function(){
            var icon=SENRO_ICON[SENRO_GROUP[honmei]];
            var groupName=SENRO_GROUP[honmei]==="天"?"天数系":SENRO_GROUP[honmei]==="人"?"人数系":"地数系";
            var jishiStr=SENRO_GROUP[honmei]==="天"?"戌・未・辰・丑":SENRO_GROUP[honmei]==="人"?"酉・午・卯・子":"亥・申・巳・寅";
            return [
              {icon:icon, lbl:"線路日"},
              {icon:"♥", lbl:"縁日", col:"#c07080"},
            ].map(function(item){
              return(
                <div key={item.lbl} style={{display:"flex",alignItems:"center",gap:"4px",fontSize:"10px",color:item.col||"#7a6a5a"}}>
                  <span style={{fontSize:"11px"}}>{item.icon}</span><span>{item.lbl}</span>
                </div>
              );
            });
          })()}
        </div>
        <div style={{height:"1px",background:"rgba(180,140,90,0.12)",margin:"7px 0"}}/>
        <div style={{display:"flex",flexDirection:"column",gap:"5px"}}>
          <div style={{display:"flex",alignItems:"center",gap:"8px",fontSize:"10px",color:"#7a6a5a"}}>
            <div style={{width:"28px",height:"5px",background:"rgba(180,130,70,0.45)",borderRadius:"2px",flexShrink:0}}/>
            <span>土用期間</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"8px",fontSize:"10px",color:"#7a6a5a"}}>
            <div style={{width:"28px",height:"5px",background:"rgba(220,200,0,0.6)",borderRadius:"2px",flexShrink:0}}/>
            <span>凌犯期間</span>
          </div>
        </div>
      </div>

      <div style={{background:"#ffffff",border:"1px solid rgba(180,140,90,0.25)",borderRadius:"12px",overflow:"hidden",boxShadow:"0 2px 16px rgba(180,140,90,0.12)"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)"}}>
          {WD.map(function(w,i){
            return <div key={w} style={{textAlign:"center",padding:"7px 2px",fontSize:"11px",color:i===0?"#b04040":i===6?"#4060b0":"#7a6a58",borderBottom:"1px solid rgba(180,140,90,0.2)",background:"rgba(240,228,210,0.6)",fontWeight:"bold"}}>{w}</div>;
          })}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)"}}>
          {cells.map(function(c,idx){
            if(!c)return <div key={"e"+idx} style={{minHeight:"80px"}}/>;
            var isSel=sel===c.day;
            var dow=(fd+c.day-1)%7;
            var hasSpec=c.maxResults.some(function(r){return r.isSpecial;})||c.kichiResults.some(function(r){return r.isSpecial;});
            var hasMax=c.maxResults.filter(function(r){return !r.hideNormal;}).length>0;
            var hasKichi=c.kichiResults.filter(function(r){return !r.hideNormal;}).length>0;
            var bg="transparent";
            return(
              <div key={c.day} onClick={function(){setSel(isSel?null:c.day);}} style={{minHeight:c.tensha||c.ichiryuman?"96px":"80px",padding:"5px 3px",display:"flex",flexDirection:"column",background:isSel?"rgba(201,169,110,0.15)":bg,border:isSel?"2px solid rgba(160,120,70,0.5)":"1px solid rgba(180,140,90,0.15)",borderLeft:c.isSetsunyu?"4px solid #9a7a50":isSel?"2px solid rgba(160,120,70,0.5)":"1px solid rgba(180,140,90,0.15)",cursor:"pointer",position:"relative"}}>
                <div style={{display:"flex",alignItems:"center",gap:"3px"}}>
                  <div style={{fontSize:"13px",color:(dow===0||c.holiday)?"#b04040":dow===6?"#4060b0":"#2a1e12"}}>{c.day}</div>
                  {c.shingetsu&&<div style={{width:"14px",height:"14px",borderRadius:"50%",background:"#1a1a2e",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <span style={{fontSize:"4px",color:"#ffffff",fontWeight:"bold",lineHeight:1}}>新月</span>
                  </div>}
                  {c.mangetsu&&<div style={{width:"14px",height:"14px",borderRadius:"50%",background:c.supermoon?"#e8a000":"#c8a040",border:c.supermoon?"1px solid #f0c000":"1px solid #a08030",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <span style={{fontSize:c.supermoon?"3.5px":"4px",color:"#ffffff",fontWeight:"bold",lineHeight:1,textAlign:"center"}}>{c.supermoon?"S満月":"満月"}</span>
                  </div>}
                  {c.senro&&<div style={{fontSize:"11px",color:"#9a7a40",lineHeight:1,fontWeight:"bold"}}>{c.senro}</div>}
                  {c.enjitsu&&<div style={{fontSize:"11px",color:"#d05070",lineHeight:1}}>♥</div>}
                </div>
                <div style={{fontSize:"8px",color:"#9a8060",marginBottom:"2px"}}>{c.kanshi}</div>
                {c.holiday&&<div style={{fontSize:"7px",color:"#b04040",fontWeight:"bold",marginBottom:"1px",lineHeight:1.2}}>{c.holiday}</div>}
                {c.kinenbi&&<div style={{fontSize:"7px",color:"#7a6a5a",fontWeight:"bold",marginBottom:"1px",lineHeight:1.2}}>{c.kinenbi}</div>}

                {c.isSetsunyu&&<div style={{fontSize:"7px",color:"#9a7a50",fontWeight:"bold",marginBottom:"1px",letterSpacing:"0.5px"}}>{c.setsuLabel||"節入り"}</div>}
                <Badges r={c}/>
                <div style={{display:"flex",flexWrap:"wrap",gap:"2px",marginTop:"auto",paddingBottom:c.isDoyou?"7px":"0px"}}>
                  {c.ehomairi&&<div style={{fontSize:"6px",color:"#ffffff",fontWeight:"bold",border:"1px solid #7040b0",borderRadius:"3px",padding:"0px 2px",lineHeight:1.5,background:"#7040b0"}}>恵方</div>}
                  {c.tensha&&<div style={{fontSize:"6px",color:"#3060c0",fontWeight:"bold",border:"1px solid #3060c0",borderRadius:"3px",padding:"0px 2px",lineHeight:1.5,background:"rgba(255,255,255,0.9)"}}>天赦日</div>}
                  {c.ichiryuman&&<div style={{fontSize:"6px",color:"#c07820",fontWeight:"bold",border:"1px solid #c07820",borderRadius:"3px",padding:"0px 2px",lineHeight:1.5,background:"rgba(255,255,255,0.9)"}}>一粒万倍</div>}
                </div>
                {c.isDoyou&&<div style={{position:"absolute",bottom:0,left:0,right:0,height:"5px",background:"rgba(180,130,70,0.35)",borderRadius:"0 0 2px 2px",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {c.isMaday&&<span style={{fontSize:"6px",color:"#6b3a1f",fontWeight:"bold",letterSpacing:"0.5px",lineHeight:1}}>間日</span>}
                </div>}
                {c.isRyohan&&<div style={{position:"absolute",bottom:c.isDoyou?"5px":0,left:0,right:0,height:"5px",background:"rgba(220,200,0,0.5)",borderRadius:c.isDoyou?"0":"0 0 2px 2px"}}/>}
              </div>
            );
          })}
        </div>
      </div>

      {selData&&<Detail r={selData} date={selData.date} onClose={function(){setSel(null);}}/>}

      <div style={{textAlign:"center",marginTop:"20px",fontSize:"9px",color:"#c0a880",letterSpacing:"2px"}}>
        九星気学風水 パーソナル吉方位カレンダー © 2026
      </div>
    </div>
  );
}
