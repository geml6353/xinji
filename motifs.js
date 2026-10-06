/* motifs.js —— xinji.wiki 雅致纹样组件
   ①团龙图腾水印（hero 背景）②祥云纹注入 ③回纹角饰 ④五脏风险精致盘
   参考 neijing.wiki 雅致路线；全部 SVG 手绘，无外部依赖。 */

/* ───── 团龙图腾（抽象夔龙戏珠·缓慢旋转） ───── */
function dragonMedallion(size = 560, opacity = 0.085) {
  const ring = Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2;
    const r1 = 250, r2 = 262;
    const x1 = 280 + Math.cos(a) * r1, y1 = 280 + Math.sin(a) * r1;
    const x2 = 280 + Math.cos(a + 0.09) * r2, y2 = 280 + Math.sin(a + 0.09) * r2;
    return `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} A${r1} ${r1} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="currentColor" stroke-width="2.4" fill="none"/>`;
  }).join("");
  // 四条夔龙身（S 形卷尾绕珠）
  const dragon = (rot) => `
    <g transform="rotate(${rot} 280 280)">
      <path d="M280 118 C 350 128, 396 168, 398 216 C 400 252, 372 268, 352 252 C 336 238, 344 216, 362 220"
            stroke="currentColor" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M280 118 C 240 100, 208 108, 196 132 C 186 152, 200 166, 214 158"
            stroke="currentColor" stroke-width="5" fill="none" stroke-linecap="round"/>
      <circle cx="362" cy="220" r="6" fill="currentColor"/>
    </g>`;
  return `<svg class="dragon-medallion" viewBox="0 0 560 560" width="${size}" style="opacity:${opacity}">
    <g class="dragon-ring">${ring}</g>
    <circle cx="280" cy="280" r="238" stroke="currentColor" stroke-width="1.2" fill="none" opacity=".6"/>
    <circle cx="280" cy="280" r="196" stroke="currentColor" stroke-width="1.2" fill="none" opacity=".45"/>
    ${[0, 90, 180, 270].map(dragon).join("")}
    <!-- 火珠 -->
    <circle cx="280" cy="280" r="34" stroke="currentColor" stroke-width="3" fill="none"/>
    <circle cx="280" cy="280" r="12" fill="currentColor" opacity=".55"/>
    ${[0, 45, 90, 135, 180, 225, 270, 315].map(a => {
      const r = 52 + (a % 90 === 0 ? 12 : 0);
      const x = 280 + Math.cos(a * Math.PI / 180) * r, y = 280 + Math.sin(a * Math.PI / 180) * r;
      return `<path d="M280 280 L${x.toFixed(1)} ${y.toFixed(1)}" stroke="currentColor" stroke-width="${a % 90 === 0 ? 2.6 : 1.4}" opacity=".5"/>`;
    }).join("")}
    <!-- 祥云四角 -->
    ${[[100, 100], [460, 100], [100, 460], [460, 460]].map(([x, y]) => `
      <path d="M${x - 34} ${y} c 4 -18, 26 -22, 34 -8 c 12 -14, 34 -8, 32 8 c 10 2, 10 18, -4 20 l -58 0 c -12 -2, -12 -16, -4 -20 z"
            stroke="currentColor" stroke-width="2.2" fill="none" opacity=".75"/>`).join("")}
  </svg>`;
}

/* ───── 祥云纹横带（分节线） ───── */
function cloudBand() {
  return `<svg class="cloud-band" viewBox="0 0 960 26" preserveAspectRatio="none">
    <path d="M0 18 C 60 4, 120 4, 170 14 C 210 22, 250 22, 290 12 C 330 2, 390 2, 430 14 C 470 24, 520 24, 560 12 C 600 2, 660 2, 700 14 C 740 24, 800 24, 850 12 C 890 3, 930 6, 960 14"
          stroke="currentColor" stroke-width="1.4" fill="none" opacity=".55"/>
    <path d="M0 22 C 70 10, 130 10, 180 19 C 230 26, 280 24, 320 16 C 370 6, 420 8, 470 18 C 520 26, 580 24, 620 15 C 670 5, 730 8, 780 18 C 830 26, 900 22, 960 19"
          stroke="currentColor" stroke-width="1" fill="none" opacity=".35"/>
  </svg>`;
}

/* ───── 五脏风险精致盘 ─────
   organRisk: {肝:0-3, 心:0-3, 脾:0-3, 肺:0-3, 肾:0-3}  0=平 1=低 2=中 3=高 */
const ORGAN_META = {
  肝: { color: "#3E5C50", bg: "rgba(62,92,80,.08)",  fang: "木",  warn: "肝气逆乱扰心（怒伤肝）" },
  心: { color: "#A6382C", bg: "rgba(166,56,44,.09)", fang: "火",  warn: "心神失养/心脉痹阻" },
  脾: { color: "#B08D4F", bg: "rgba(176,141,79,.10)", fang: "土", warn: "气血生化不足/痰饮内生" },
  肺: { color: "#6E6A5E", bg: "rgba(110,106,94,.08)", fang: "金", warn: "宗气不足/治节失司" },
  肾: { color: "#33506B", bg: "rgba(51,80,107,.08)", fang: "水", warn: "水火失济/水饮凌心" }
};
const LEVEL_NAME = ["平", "低", "中", "高"];

function renderOrganRisk(el, organRisk, caption = "") {
  const order = ["肝", "心", "脾", "肺", "肾"];
  el.innerHTML = `
    <div class="organ-board">
      ${caption ? `<div class="organ-caption">${caption}</div>` : ""}
      <div class="organ-row">
        ${order.map(o => {
          const m = ORGAN_META[o], lv = organRisk[o] ?? 1;
          const dots = Array.from({ length: 3 }, (_, i) =>
            `<span class="odot${i < lv ? " on" : ""}" style="${i < lv ? `background:${m.color}` : ""}"></span>`).join("");
          return `<div class="organ-card" style="--oc:${m.color}; --ocb:${m.bg}">
            <div class="organ-seal">${o}</div>
            <div class="organ-fang">${m.fang}行</div>
            <div class="organ-dots">${dots}</div>
            <div class="organ-lv" style="color:${m.color}">${LEVEL_NAME[lv]}</div>
            <div class="organ-warn">${m.warn}</div>
          </div>`;
        }).join("")}
      </div>
    </div>`;
}

/* ───── 证型→五脏风险等级（病机推演·知识库依据） ───── */
const SYNDROME_ORGAN_RISK = {
  "心虚胆怯": { 肝: 2, 心: 3, 脾: 1, 肺: 1, 肾: 1 },
  "心脾两虚": { 肝: 1, 心: 3, 脾: 3, 肺: 1, 肾: 2 },
  "阴虚火旺": { 肝: 2, 心: 3, 脾: 1, 肺: 1, 肾: 3 },
  "心阳不振": { 肝: 1, 心: 3, 脾: 2, 肺: 2, 肾: 3 },
  "水饮凌心": { 肝: 1, 心: 3, 脾: 3, 肺: 2, 肾: 3 },
  "心脉瘀阻": { 肝: 2, 心: 3, 脾: 1, 肺: 2, 肾: 1 },
  "痰火扰心": { 肝: 3, 心: 3, 脾: 2, 肺: 2, 肾: 1 }
};

/* ───── 回纹角饰注入（面板四角） ───── */
function injectFretCorners() {
  const fret = `<svg viewBox="0 0 34 34" width="15" height="15"><path d="M2 32 L2 2 L32 2 M8 32 L8 8 L32 8 M14 32 L14 14 L32 14" stroke="currentColor" stroke-width="2" fill="none"/></svg>`;
  document.querySelectorAll(".panel.corner").forEach(p => {
    if (p.querySelector(".fret-corner")) return;
    ["tl", "tr", "bl", "br"].forEach(pos => {
      const d = document.createElement("div");
      d.className = `fret-corner fret-${pos}`;
      d.innerHTML = fret;
      p.appendChild(d);
    });
  });
}

/* 自动注入：hero 团龙 + 分节祥云带 */
document.addEventListener("DOMContentLoaded", () => {
  const hero = document.querySelector("header");
  if (hero && !hero.querySelector(".dragon-medallion")) {
    const holder = document.createElement("div");
    holder.className = "dragon-holder";
    holder.innerHTML = dragonMedallion();
    hero.prepend(holder);
  }
  document.querySelectorAll(".section-lead").forEach(sl => {
    if (sl.querySelector(".cloud-band")) return;
    const b = document.createElement("div");
    b.className = "cloud-band-holder";
    b.innerHTML = cloudBand();
    sl.prepend(b);
  });
  injectFretCorners();
});
