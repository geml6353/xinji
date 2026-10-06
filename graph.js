/* graph.js —— 五脏知识图谱（Obsidian 关系图谱式·力导向·纯原生）
   拖拽节点 / 悬停高亮邻域 / 点击查看详情 / 滚轮缩放 / 画布平移 */

const G_NODES = [
  // 五脏（大）
  { id: "心", cat: "zang", d: "君主之官，主血脉、藏神。心悸病位核心——《素问》心主血脉，《伤寒论》177 条心动悸。" },
  { id: "肝", cat: "zang", d: "将军之官，主疏泄、藏魂。怒伤肝，肝气逆乱扰心神——情志诱发心悸之源。" },
  { id: "脾", cat: "zang", d: "仓廪之官，气血生化之源。脾虚则血不养心（归脾汤法）——真实世界最常见证型背景。" },
  { id: "肺", cat: "zang", d: "相傅之官，主治节、朝百脉。肺气虚则宗气不足，心脉失助（张锡纯大气下陷致怔忡）。" },
  { id: "肾", cat: "zang", d: "作强之官，藏精主水。水亏火旺（阴虚火旺）/水饮凌心（心衰表型）——心肾相交之轴。" },
  // 五志/五体（小）
  { id: "怒", cat: "zhi", d: "肝之志——怒伤肝，肝气上逆扰心（《素问》悲哀愁忧则心动）。" },
  { id: "喜", cat: "zhi", d: "心之志——过喜伤心，神散不敛。" },
  { id: "思", cat: "zhi", d: "脾之志——思伤脾，思虑耗伤心血（《严氏济生方》汲汲富贵真血虚耗）。" },
  { id: "悲", cat: "zhi", d: "肺之志——悲伤肺，气消而宗气不足。" },
  { id: "恐", cat: "zhi", d: "肾之志——恐伤肾，精却而心无所依（《素问·举痛论》惊则心无所倚）。" },
  { id: "脉", cat: "ti", d: "心之体——心主血脉，脉结代心动悸为心病之征。" },
  { id: "舌", cat: "ti", d: "心之窍——舌为心之苗，舌尖红主心火，舌淡主心血虚。" },
  // 证型（朱砂）
  { id: "心虚胆怯", cat: "syn", d: "触事易惊、善惊心悸。治：镇惊定志——安神定志丸合酸枣仁汤。临床关联最强（HRV 降低）。", act: "syn" },
  { id: "心脾两虚", cat: "syn", d: "心悸气短、乏力纳呆、面色无华。治：补血养心——归脾汤。真实世界 902 例居首。", act: "syn" },
  { id: "阴虚火旺", cat: "syn", d: "心悸盗汗、口干烦躁、舌红少苔。治：滋阴降火——天王补心丹合黄连阿胶汤。", act: "syn" },
  { id: "心阳不振", cat: "syn", d: "心悸肢冷、畏寒气短、脉迟弱。治：温补心阳——桂甘龙牡汤合参附汤。EF↓BNP↑。", act: "syn" },
  { id: "水饮凌心", cat: "syn", d: "心悸浮肿、喘促尿少、苔腻脉滑。治：温阳利水——真武汤合苓桂术甘汤。BNP 最高表型。", act: "syn" },
  { id: "心脉瘀阻", cat: "syn", d: "胸痛胸闷、舌紫暗、脉涩结。治：活血化瘀——血府逐瘀汤。D-二聚体最高（促凝端）。", act: "syn" },
  { id: "痰火扰心", cat: "syn", d: "惊悸烦躁、失眠多梦、苔黄腻脉滑。治：清热化痰——黄连温胆汤。代谢表型。", act: "syn" },
  // 方剂（金）
  { id: "炙甘草汤", cat: "fang", d: "《伤寒论》177 条——脉结代心动悸第一方（复脉汤）。现代养心定悸汤 RCT 锚点。" },
  { id: "归脾汤", cat: "fang", d: "《严氏济生方》严用和八味原方——心脾两虚主方，全库归脾类 21 篇 RCT。" },
  { id: "真武汤", cat: "fang", d: "《伤寒论》82 条——阳虚水泛心下悸。水饮凌心/心衰主方。" },
  { id: "温胆汤", cat: "fang", d: "《严氏济生方》——心胆虚怯气郁生涎。《世医得效方》扩为十味温胆汤。" },
  { id: "桂甘龙牡汤", cat: "fang", d: "《伤寒论》118 条——心阳不振烦躁心悸。RCT 95.12% 锚点。" },
  { id: "天王补心丹", cat: "fang", d: "滋阴养血、补心安神——阴虚火旺怔忡不寐。" },
  { id: "血府逐瘀汤", cat: "fang", d: "活血化瘀、行气止痛——心脉瘀阻胸痛心悸。" },
  { id: "黄连阿胶汤", cat: "fang", d: "《伤寒论》——少阴阴虚火旺、心烦不得卧。交通心肾。" },
  { id: "安神定志丸", cat: "fang", d: "《医学心悟》——心虚胆怯善惊易恐。" },
  // 中药（青）
  { id: "甘草", cat: "yao", d: "炙甘草汤君药——益气补中、通经脉利血气。语境频次 2667 次居首。" },
  { id: "人参", cat: "yao", d: "益气安神核心——「人参入心者重」（《本草思辨录》）。语境 2340 次。" },
  { id: "茯苓", cat: "yao", d: "健脾宁心利水——现代病例 TOP1（49.3%）。苓桂法核心。" },
  { id: "远志", cat: "yao", d: "安神配伍枢纽——茯神+远志 lift 3.38（全库最高药对）。" },
  { id: "酸枣仁", cat: "yao", d: "养心安神敛汗——「酸枣仁最治虚汗」（《顾松园医镜》）。" },
  { id: "桂枝", cat: "yao", d: "温通心阳——桂枝甘草汤（64 条）核心，复脉法之基。" },
  { id: "附子", cat: "yao", d: "回阳救逆——真武汤/四逆汤用（有毒，遵医嘱）。郑钦安「重藏阳」。" },
  { id: "丹参", cat: "yao", d: "活血祛瘀清心——现代病例 TOP2（38.8%），活血治法强化标志。" },
  { id: "当归", cat: "yao", d: "养血和血——归脾/养心类核心，语境 1600 次。" },
  // 脉象（蓝）
  { id: "结代脉", cat: "mai", d: "178 条经典定义——结=能自还（预后较好），代=不能自还（难治）。结生代死。" },
  { id: "促脉", cat: "mai", d: "数而时一止——快速型不齐（房颤/房扑）。" },
  { id: "涩脉", cat: "mai", d: "细而迟短——低搏出量、血瘀（涩=低排）。" },
  // 经络（墨绿）
  { id: "手少阴心经", cat: "jing", d: "心系本经——神门、通里治悸要穴。" },
  { id: "手厥阴心包经", cat: "jing", d: "内关宽胸定悸——心悸针灸第一要穴。" },
  { id: "足少阴肾经", cat: "jing", d: "太溪滋水涵火——心肾相交之径。" },
  // 古籍（石色）
  { id: "伤寒论", cat: "book", d: "张仲景——177/178/64/82/118 条，心悸条文第一源。" },
  { id: "素问", cat: "book", d: "心主血脉/五脏藏象/虚里宗气诊——理论之源。" },
  { id: "金匮要略", cat: "book", d: "胸痹心痛短气篇——阳微阴弦总纲，栝蒌薤白三方。" },
  { id: "严氏济生方", cat: "book", d: "严用和——归脾八味原方+温胆汤方祖，惊悸怔忡健忘门。" },
  { id: "景岳全书", cat: "book", d: "张景岳——动气论「虚微者动亦甚」，戒妄清利。" },
];

const G_EDGES = [
  // 脏-志-体
  ["心","喜"],["心","脉"],["心","舌"],["肝","怒"],["脾","思"],["肺","悲"],["肾","恐"],
  // 脏-证型
  ["心","心虚胆怯"],["肝","心虚胆怯"],["心","心脾两虚"],["脾","心脾两虚"],["心","阴虚火旺"],["肾","阴虚火旺"],
  ["心","心阳不振"],["肾","心阳不振"],["心","水饮凌心"],["肾","水饮凌心"],["脾","水饮凌心"],
  ["心","心脉瘀阻"],["肝","心脉瘀阻"],["心","痰火扰心"],["肝","痰火扰心"],["脾","痰火扰心"],
  // 证型-方剂
  ["心虚胆怯","安神定志丸"],["心虚胆怯","温胆汤"],["心脾两虚","归脾汤"],["阴虚火旺","天王补心丹"],["阴虚火旺","黄连阿胶汤"],
  ["心阳不振","桂甘龙牡汤"],["心阳不振","真武汤"],["水饮凌心","真武汤"],["心脉瘀阻","血府逐瘀汤"],["痰火扰心","温胆汤"],
  ["心","炙甘草汤"],
  // 方剂-药
  ["炙甘草汤","甘草"],["炙甘草汤","人参"],["炙甘草汤","桂枝"],["归脾汤","当归"],["归脾汤","人参"],["归脾汤","酸枣仁"],
  ["真武汤","附子"],["真武汤","茯苓"],["温胆汤","茯苓"],["桂甘龙牡汤","桂枝"],["安神定志丸","远志"],["安神定志丸","茯苓"],
  ["血府逐瘀汤","丹参"],["血府逐瘀汤","当归"],["天王补心丹","酸枣仁"],["天王补心丹","当归"],
  // 脏-脉-经络
  ["心","结代脉"],["心","促脉"],["心","涩脉"],["心","手少阴心经"],["心","手厥阴心包经"],["肾","足少阴肾经"],
  // 脏-书
  ["心","伤寒论"],["心","素问"],["心","金匮要略"],["心","严氏济生方"],["心","景岳全书"],
];

const G_CAT = {
  zang: { r: 30, color: "#A6382C", font: 17, w: 600 },
  syn:  { r: 17, color: "#7E2820", font: 12.5, w: 500 },
  fang: { r: 15, color: "#B08D4F", font: 12, w: 500 },
  yao:  { r: 13, color: "#3E5C50", font: 11.5, w: 500 },
  mai:  { r: 13, color: "#33506B", font: 11.5, w: 500 },
  jing: { r: 13, color: "#5F7A6E", font: 11, w: 500 },
  book: { r: 14, color: "#6E6A5E", font: 11.5, w: 500 },
  zhi:  { r: 10, color: "#9A8F7A", font: 10.5, w: 400 },
  ti:   { r: 10, color: "#9A8F7A", font: 10.5, w: 400 },
};

function initGraph(canvasId, infoId) {
  const canvas = document.getElementById(canvasId);
  const info = document.getElementById(infoId);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let W, H, dpr = devicePixelRatio || 1;

  // 初始化位置（五脏五角+其余环绕）
  const nodes = G_NODES.map((n, i) => {
    const a = (i / G_NODES.length) * Math.PI * 2;
    return { ...n, x: Math.cos(a) * 220 + (Math.random()-.5)*60, y: Math.sin(a) * 180 + (Math.random()-.5)*60, vx: 0, vy: 0 };
  });
  const byId = Object.fromEntries(nodes.map(n => [n.id, n]));
  const edges = G_EDGES.map(([a, b]) => ({ a: byId[a], b: byId[b] })).filter(e => e.a && e.b);
  const neighbors = {};
  nodes.forEach(n => neighbors[n.id] = new Set());
  edges.forEach(e => { neighbors[e.a.id].add(e.b.id); neighbors[e.b.id].add(e.a.id); });

  let hover = null, drag = null, pan = { x: 0, y: 0 }, scale = 1;

  function resize() {
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize(); addEventListener("resize", resize);

  function step() {
    // 力：斥力 + 弹簧 + 向心
    for (const n of nodes) {
      if (n === drag) continue;
      let fx = 0, fy = 0;
      for (const m of nodes) {
        if (m === n) continue;
        let dx = n.x - m.x, dy = n.y - m.y;
        let d2 = dx*dx + dy*dy + 40;
        const rep = (G_CAT[n.cat].r + G_CAT[m.cat].r) * 22 / d2;
        fx += dx * rep; fy += dy * rep;
      }
      n.vx = (n.vx + fx * .02) * .82;
      n.vy = (n.vy + fy * .02) * .82;
    }
    for (const e of edges) {
      const dx = e.b.x - e.a.x, dy = e.b.y - e.a.y;
      const d = Math.sqrt(dx*dx + dy*dy) || 1;
      const rest = G_CAT[e.a.cat].r + G_CAT[e.b.cat].r + 46;
      const f = (d - rest) * .006;
      const ux = dx / d * f, uy = dy / d * f;
      if (e.a !== drag) { e.a.vx += ux; e.a.vy += uy; }
      if (e.b !== drag) { e.b.vx -= ux; e.b.vy -= uy; }
    }
    for (const n of nodes) {
      if (n === drag) continue;
      n.vx += -n.x * .0016; n.vy += -n.y * .0022;
      n.x += n.vx; n.y += n.vy;
    }
  }

  function draw() {
    step();
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(W/2 + pan.x, H/2 + pan.y);
    ctx.scale(scale, scale);
    const hovSet = hover ? neighbors[hover.id] : null;
    // 边
    for (const e of edges) {
      const lit = hover && (e.a === hover || e.b === hover);
      ctx.strokeStyle = lit ? "rgba(166,56,44,.55)" : "rgba(120,100,70,.18)";
      ctx.lineWidth = lit ? 1.6 : .8;
      ctx.beginPath(); ctx.moveTo(e.a.x, e.a.y); ctx.lineTo(e.b.x, e.b.y); ctx.stroke();
    }
    // 点
    for (const n of nodes) {
      const meta = G_CAT[n.cat];
      const dim = hover && n !== hover && !(hovSet && hovSet.has(n.id));
      ctx.globalAlpha = dim ? .18 : 1;
      ctx.beginPath(); ctx.arc(n.x, n.y, meta.r, 0, Math.PI*2);
      ctx.fillStyle = n.cat === "zang" ? "rgba(251,249,243,.95)" : "rgba(251,249,243,.85)";
      ctx.fill();
      ctx.lineWidth = n === hover ? 2.6 : 1.4;
      ctx.strokeStyle = meta.color;
      ctx.stroke();
      if (n === hover) { ctx.beginPath(); ctx.arc(n.x, n.y, meta.r + 5, 0, Math.PI*2); ctx.strokeStyle = "rgba(166,56,44,.35)"; ctx.lineWidth = 1.4; ctx.stroke(); }
      ctx.fillStyle = meta.color;
      ctx.font = `${meta.w} ${meta.font}px "Noto Serif SC","Songti SC",serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      const label = n.cat === "zang" ? n.id : (n.id.length > 5 ? n.id.slice(0,5) : n.id);
      ctx.fillText(label, n.x, n.y + (n.cat === "zang" ? 1 : .5));
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    requestAnimationFrame(draw);
  }
  draw();

  function pick(mx, my) {
    const x = (mx - W/2 - pan.x) / scale, y = (my - H/2 - pan.y) / scale;
    let best = null, bd = Infinity;
    for (const n of nodes) {
      const d = (n.x-x)**2 + (n.y-y)**2;
      const r = G_CAT[n.cat].r + 8;
      if (d < r*r && d < bd) { best = n; bd = d; }
    }
    return best;
  }
  function showInfo(n) {
    if (!info) return;
    if (!n) { info.innerHTML = `<div class="hint" style="color:var(--muted); font-size:13px">悬停节点看邻域 · 点击查看详情 · 拖拽移动 · 滚轮缩放</div>`; return; }
    const links = [...neighbors[n.id]].slice(0, 10);
    info.innerHTML = `
      <div style="display:flex; align-items:center; gap:10px">
        <div class="organ-seal" style="border-color:${G_CAT[n.cat].color}; color:${G_CAT[n.cat].color}">${n.id.slice(0,1)}</div>
        <div style="font-size:17px; letter-spacing:.14em">${n.id}</div>
      </div>
      <div style="font-size:12px; color:var(--muted); letter-spacing:.22em; margin:8px 0">${({zang:"五脏",syn:"证型",fang:"方剂",yao:"中药",mai:"脉象",jing:"经络",book:"古籍",zhi:"五志",ti:"五体"})[n.cat]}</div>
      <div style="font-size:13.5px; color:var(--ink-2); line-height:1.9">${n.d}</div>
      <div style="margin-top:10px; font-size:12px; color:var(--muted); letter-spacing:.12em">关 联</div>
      <div>${links.map(l=>`<span class="tag" onclick="graphFocus('${l}')" style="cursor:pointer">${l}</span>`).join("")}</div>
      ${n.act === "syn" ? `<div style="margin-top:10px"><a href="#" onclick="graphToSyn('${n.id}');return false">→ 证型罗盘查看方案</a></div>` : ""}`;
  }
  showInfo(null);

  // 交互
  let pdown = false;
  canvas.addEventListener("mousemove", e => {
    const r = canvas.getBoundingClientRect();
    const mx = e.clientX - r.left, my = e.clientY - r.top;
    if (drag) { drag.x = (mx - W/2 - pan.x)/scale; drag.y = (my - H/2 - pan.y)/scale; return; }
    const n = pick(mx, my);
    if (n !== hover) { hover = n; canvas.style.cursor = n ? "pointer" : "grab"; }
  });
  canvas.addEventListener("mousedown", e => {
    const r = canvas.getBoundingClientRect();
    const n = pick(e.clientX - r.left, e.clientY - r.top);
    if (n) { drag = n; showInfo(n); }
    else pdown = true;
    canvas.style.cursor = "grabbing";
  });
  addEventListener("mouseup", () => { drag = null; pdown = false; canvas.style.cursor = "grab"; });
  canvas.addEventListener("mousemove", e => {
    if (pdown) { pan.x += e.movementX; pan.y += e.movementY; }
  });
  canvas.addEventListener("wheel", e => {
    e.preventDefault();
    scale = Math.min(2.2, Math.max(.45, scale * (e.deltaY > 0 ? .92 : 1.08)));
  }, { passive: false });

  window.graphFocus = id => { hover = byId[id] || null; if (hover) showInfo(hover); };
  window.graphToSyn = id => {
    const items = [...document.querySelectorAll(".syn-item")];
    const el = items.find(x => x.textContent.includes(id));
    if (el) { el.click(); el.scrollIntoView({ behavior: "smooth", block: "center" }); }
  };
}
document.addEventListener("DOMContentLoaded", () => initGraph("wgGraph", "wgInfo"));
