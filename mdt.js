// mdt.js —— 多学科智能体会诊引擎（DeLiriuMAgents 式五段流水线）
// ①EHRPromptAgent 叙事化 → ②ModelPhysicianAgent 评分 → ③三专科智能体 → ④MedEvidenceAgent RAG → ⑤主任医师终裁
(function(){
"use strict";

// —— 真实模型权重（model/regression/tables/table5_risk_score.csv·AUC 0.784）——
const WEIGHTS = [
  ["喘憋",1.5747,10],["双下肢水肿",0.9536,6],["脉短",1.0171,6],["气短",0.7899,5],["憋气",0.7799,5],
  ["胸闷",0.7503,5],["乏力",0.5019,3],["间断胸闷",0.3391,2],["脉沉",0.3234,2],["脉代",0.1989,1],
  ["心慌",-0.1760,-1],["舌红",-0.1407,-1],["心悸",-0.2100,-1],["脉滑",-0.2057,-1],["舌老",-0.1918,-1],
  ["脉弦",-0.2428,-2],["舌黄",-0.4691,-3],["言语不利",-0.8475,-5],["咳嗽",-0.7163,-5],["阵发心慌",-0.8205,-5],
  ["头晕",-0.8719,-6],["头痛",-1.1907,-8],["口干",-1.3417,-9]
];
const CUT = [-0.192, 0.667];       // 三分位切点（5,850 例复算）
const TIER_RATE = {low:0.063, mid:0.149, high:0.460}; // 层内事件率
const LAB_REF = { // 名称:[单位, 参考下限, 参考上限]
  "NT-proBNP":["pg/mL",0,300], "hs-CRP":["mg/L",0,3], "D-二聚体":["mg/L FEU",0,0.5],
  "血红蛋白":["g/L",115,150], "白蛋白":["g/L",35,52], "肌酐":["μmol/L",41,81],
  "尿酸":["μmol/L",150,420], "糖化血红蛋白":["%",4,6], "LDL-C":["mmol/L",0,3.4],
  "左房内径":["mm",25,40], "射血分数":["%",50,75], "心率":["次/分",60,100],
  "收缩压":["mmHg",90,140], "舒张压":["mmHg",60,90]
};

function $(id){ return document.getElementById(id); }
function checked(name){ return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map(e=>e.value); }
function esc(s){ return String(s).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c])); }

// ═══ ①EHRPromptAgent：结构化 EHR→临床叙事（单位+参考范围+偏离方向）═══
function ehrPrompt(case_){
  const L=[];
  if(case_.name||case_.age||case_.sex) L.push(`患者 ${case_.name||"（未记名）"}，${case_.age||"?"} 岁 ${case_.sex||""}。`);
  if(case_.chief) L.push(`主诉：${case_.chief}。`);
  if(case_.syms.length) L.push(`现症：${case_.syms.join("、")}。`);
  if(case_.tongue.length||case_.pulse.length) L.push(`舌脉：舌${case_.tongue.join("")||"（未记）"}，脉${case_.pulse.join("")||"（未记）"}。`);
  for(const [k,v] of Object.entries(case_.labs)){
    if(v===""||v==null) continue;
    const ref=LAB_REF[k]; if(!ref){ L.push(`${k}: ${v}。`); continue; }
    const x=parseFloat(v); if(isNaN(x)){ L.push(`${k}: ${v}。`); continue; }
    const dir = x<ref[1] ? "↓低于" : x>ref[2] ? "↑高于" : "在";
    const range = dir==="在" ? "参考范围内" : `参考范围 ${ref[1]}–${ref[2]}`;
    L.push(`${k}：${x} ${ref[0]}（${dir}${range}）。`);
  }
  if(case_.hist.length) L.push(`既往史：${case_.hist.join("、")}。`);
  return L;
}

// ═══ ②ModelPhysicianAgent：评分模型+关键变量归因 ═══
function modelAgent(case_){
  const feat = new Set([...case_.syms, ...case_.pulse.map(p=>"脉"+p), ...case_.tongue.map(t=>"舌"+t)]);
  const rows=[]; let S=0;
  for(const [name,beta,pts] of WEIGHTS){
    if(feat.has(name)){ S+=beta; rows.push({name,beta,pts}); }
  }
  rows.sort((a,b)=>b.beta-a.beta);
  const tier = S<=CUT[0] ? "low" : S<=CUT[1] ? "mid" : "high";
  const tierCN = {low:"低危",mid:"中危",high:"高危"}[tier];
  return {S, tier, tierCN, rate:TIER_RATE[tier], top:rows.slice(0,6), all:rows};
}

// ═══ ③三专科智能体 ═══
function specialistCardio(case_, m){
  const stasis=["喘憋","双下肢水肿","气短","憋气","胸闷","间断胸闷"].filter(s=>case_.syms.includes(s));
  const bnp=parseFloat(case_.labs["NT-proBNP"]), ef=parseFloat(case_.labs["射血分数"]);
  const high = m.tier==="high" || (stasis.includes("喘憋")&&stasis.includes("双下肢水肿")) || bnp>300 || ef<50;
  const q=[];
  q.push("房颤患者抗凝指征如何按 CHA2DS2-VASc 分层");
  if(stasis.length>=2) q.push("心衰容量超负荷的利尿与监测方案");
  q.push("房颤节律控制与室率控制的选择");
  return {
    name:"心血管专科智能体", ver:high?"高危":"低危", queries:q,
    reasoning:[
      `心肺淤血症状 ${stasis.length} 项（${stasis.join("、")||"无"}）${stasis.length>=2?"聚集出现，提示容量超负荷/心功能不全风险":"零散出现"}。`,
      `模型侧：累计分 ${m.S.toFixed(2)}（${m.tierCN}，锚定事件率 ${(m.rate*100).toFixed(1)}%）。`,
      "处理轴：①CHA₂DS₂-VASc 评估抗凝指征；②容量管理（限钠限水+袢利尿剂评估）；③室率/节律控制（β 阻滞剂一线）。",
      "需查：NT-proBNP、超声心动图（LA/LVEF）、动态心电图。"
    ]
  };
}
function specialistTcm(case_, m){
  const P=(window.MODEL_PRIORS&&window.MODEL_PRIORS.PRIOR)||{};
  const ALIAS={"双下肢水肿":"浮肿","喘憋":"喘促","间断胸闷":"胸闷"}; // 临床同义→先验要素名
  const raw=[...case_.syms,...case_.pulse.map(p=>"脉"+p),...case_.tongue.map(t=>"舌"+t)];
  const input=new Set([...raw,...raw.map(s=>ALIAS[s]).filter(Boolean)]);
  const scored=[];
  for(const [sz,ws] of Object.entries(P)){
    let s=0,hit=[];
    for(const [f,w] of Object.entries(ws)) if(input.has(f)){ s+=w; hit.push(f); }
    scored.push({sz,s,hit});
  }
  scored.sort((a,b)=>b.s-a.s);
  const top=scored[0]||{sz:"（证候不足）",s:0,hit:[]};
  const fp=(window.MODEL_PRIORS&&window.MODEL_PRIORS.FORMULA_PRIOR&&window.MODEL_PRIORS.FORMULA_PRIOR[top.sz])||{};
  const formulas=Object.keys(fp).slice(0,2);
  const water=["水饮凌心","心阳不振"].includes(top.sz);
  const q=[`${top.sz}证的治法方剂依据`,"水饮凌心与阳虚水停的经方证据","脉沉与水饮证的经典依据"];
  return {
    name:"中医辨证智能体", ver:water?"高危":"低危", queries:q,
    reasoning:[
      `四诊合参：舌${case_.tongue.join("")||"未记"}，脉${case_.pulse.join("")||"未记"}，症见${case_.syms.join("、")||"未记"}。`,
      `辨证：${top.sz}（契合度 ${top.s.toFixed(2)}；契合要素：${top.hit.join("、")||"不足"}）。`,
      `治法方剂：${formulas.length?formulas.join(" / ")+"（随证加减）":"辨证证据不足，暂缓拟方"}。`,
      top.sz==="水饮凌心"||top.sz==="心阳不振" ? "脉沉+喘憋水肿=阳虚水停经典指征，与统计 OR 互证（脉沉 OR 1.56）。" : "证候路径与心肺淤血主轴不同，注意随访转化。"
    ]
  };
}
function specialistGeneral(case_, m){
  const metab=["糖尿病","高血压","高血脂","肥胖","甲状腺疾病"].filter(h=>case_.hist.includes(h));
  const high = metab.length>=2 || case_.hist.includes("心力衰竭") || m.tier==="high";
  const q=["房颤合并代谢综合征的综合管理","中药处方十八反十九畏核对要点"];
  return {
    name:"全科与用药安全智能体", ver:high?"高危":"低危", queries:q,
    reasoning:[
      `共病负荷：${metab.join("、")||"无代谢共病"}${case_.hist.includes("心力衰竭")?"；合并心衰史":""}。`,
      `代谢/炎症背景${metab.length>=2?"重":"轻"}${case_.labs["hs-CRP"]&&parseFloat(case_.labs["hs-CRP"])>3?"；hs-CRP>3 提示炎症效应修饰（交互 p=0.003）":""}。`,
      "用药安全：拟方前核对十八反（甘草反甘遂/大戟/海藻/芫花；乌头反半夏/瓜蒌等）、十九畏；⚠️ 附子先煎 30–60 分钟减毒，毒剧药仅遵医嘱。",
      "监测：体重/容量状态每日；电解质、肾功能、甲功定期复查。"
    ]
  };
}

// ═══ ④MedEvidenceAgent：关键词重叠检索 Top-3 ═══
function ragRetrieve(queries){
  const KB=window.EVIDENCE_KB||[];
  const used=new Map(); // id → [query]
  for(const q of queries){
    const scored=KB.map(e=>{
      const hay=(e.kw.join(" ")+" "+e.text+" "+e.tag);
      let s=0;
      for(const kw of e.kw) if(q.includes(kw)) s+=3;
      for(const ch of q.replace(/[，。？、的如何与按和]/g,"")) if(hay.includes(ch)) s+=0.12;
      return {e,s};
    }).sort((a,b)=>b.s-a.s).slice(0,3);
    for(const {e} of scored){ if(!used.has(e.id)) used.set(e.id, q); }
  }
  return [...used.entries()].map(([id,q])=>({e:KB.find(k=>k.id===id),q})).slice(0,9);
}

// ═══ ⑤DeliriumDecisionAgent（主任医师终裁）═══
function director(case_, m, agents, rag){
  const votes=agents.map(a=>a.ver);
  const highVotes=votes.filter(v=>v==="高危").length;
  const modelHigh=m.tier==="high";
  const consensusHigh=highVotes>=2;
  const override = consensusHigh!==modelHigh;
  const finalHigh = consensusHigh;
  const cite = id => { const r=rag.find(x=>x.e.id===id); return r?`[${id}]`:""; };
  const KEY={}; rag.forEach(r=>KEY[r.e.id]=r.e);
  const section={
    verdict:{
      final: finalHigh?"高危":"低危",
      override, modelHigh, consensusHigh, highVotes,
      rate: finalHigh?TIER_RATE.high:(m.tier==="low"?TIER_RATE.low:TIER_RATE.mid),
      text: override
        ? `专科共识（${highVotes}/3）${finalHigh?"高于":"低于"}模型判定（${m.tierCN}）——<b>推翻模型判定</b>，采纳专科共识。模型累积分 ${m.S.toFixed(2)} 仅供参照。`
        : `专科共识与模型判定一致（${m.tierCN}）——<b>同意模型判定</b>，采纳 ${m.tierCN} 分层。`
    },
    keyVars: m.all.slice(0,8).map(r=>({name:r.name, pts:r.pts, beta:r.beta})),
    chain:[
      {step:"数据锚定", text:`EHR 叙事化后模型累积分 ${m.S.toFixed(2)}，落入${m.tierCN}层（锚定事件率 ${(m.rate*100).toFixed(1)}%）${cite("E03")}。`},
      {step:"症状群判读", text:`心肺淤血症状群权重最高（喘憋 OR 4.83）${cite("E01")}；症状组合超线性叠加${cite("E10")}。`},
      {step:"中西互证", text:`脉沉与水饮/阳虚证统计互证（OR 1.56）${cite("E04")}，经方锚点：苓桂术甘汤/真武汤${cite("E21")}${cite("E22")}。`},
      {step:"证据综合", text:`RAG 检索 ${rag.length} 条证据（指南/古籍/本库统计），声明级引用见上标。`},
      {step:"终裁", text: override ? "多源合成纠正模型判读边界病例——多智能体增值点。" : "多源合议确认模型判读。"}
    ],
    monitor: [
      "容量状态：体重、出入量、水肿程度（每日）",
      "NT-proBNP 动态变化；电解质/肾功能（利尿剂使用时）"+cite("E19"),
      case_.pulse.includes("沉")||case_.pulse.includes("代") ? "脉象变化（沉/代脉动态记录）" : "脉律变化（心悸主诉时即查心电）",
      case_.labs["hs-CRP"]&&parseFloat(case_.labs["hs-CRP"])>3 ? "炎症指标 hs-CRP 复查（效应修饰因子）"+cite("E05") : "感染征象与精神状态波动"
    ],
    intervene:[
      `非药物：限钠限水、出入量记录、适度活动、避免诱因（感染/失眠/情绪）。`,
      `药物评估：室率控制一线 β 阻滞剂${cite("E17")}；CHA₂DS₂-VASc 评估抗凝指征${cite("E15")}（出血风险 HAS-BLED 平行评估${cite("E16")}）；容量超负荷评估袢利尿剂${cite("E18")}。`,
      `中医治法：${agents[1].reasoning[2]}`,
      `⚠️ 处方安全：十八反/十九畏逐条核对${cite("E29")}${cite("E30")}；附子先煎减毒${cite("E31")}。`
    ]
  };
  return section;
}

// ═══ 渲染 ═══
function agentCard(title, badge, badgeCls, lines, extra){
  return `<div class="mdt-card"><div class="mdt-card-h"><span class="mdt-title">${title}</span><span class="mdt-badge ${badgeCls}">${badge}</span></div>
  <div class="mdt-lines">${lines.map(l=>`<div class="mdt-line">${l}</div>`).join("")}</div>${extra||""}</div>`;
}
function render(id, html){ const el=$(id); if(el) el.innerHTML=html; }

function runMDT(){
  const case_ = {
    name: ($("mName")||{}).value || "", age: ($("mAge")||{}).value || "", sex: (($("mSex")||{}).value)||"",
    chief: ($("mChief")||{}).value || "",
    syms: checked("msym"), pulse: checked("mpulse"), tongue: checked("mtongue"), hist: checked("mhist"),
    labs: {}
  };
  for(const k of Object.keys(LAB_REF)){ const el=$("lab_"+k.replace(/[^A-Za-z\u4e00-\u9fa5-]/g,"")); if(el) case_.labs[k]=el.value; }
  ["NT-proBNP","hs-CRP","D-二聚体","血红蛋白","白蛋白","肌酐","尿酸","糖化血红蛋白","LDL-C","左房内径","射血分数"].forEach(k=>{
    const el=document.querySelector(`[data-lab="${k}"]`); if(el) case_.labs[k]=el.value;
  });

  // ① EHRPrompt
  const lines=ehrPrompt(case_);
  render("stage1", agentCard("① EHRPromptAgent","叙事化完成","ok", lines.map(esc),`<div class="mdt-meta">输出 EHRText：${lines.length} 条临床叙述（单位+参考范围+偏离方向）</div>`));

  // ② Model
  const m=modelAgent(case_);
  const rows=m.top.map(r=>`<tr><td>${r.name}</td><td>${r.beta>0?"+":""}${r.beta.toFixed(2)}</td><td>${r.pts>0?"+":""}${r.pts}</td></tr>`).join("");
  render("stage2", agentCard("② ModelPhysicianAgent（CatBoost 同族·AUC 0.784）",`${m.tierCN} S=${m.S.toFixed(2)}`, m.tier==="high"?"high":m.tier==="mid"?"mid":"low",
    [`累积分 <b>${m.S.toFixed(2)}</b>（切点 低危≤${CUT[0]} / 中危≤${CUT[1]} / 高危&gt;${CUT[1]}）`,
     `分层事件率锚定：${m.tierCN} <b>${(m.rate*100).toFixed(1)}%</b>（5,850 例三分位验证）`],
    `<table class="mdt-table"><tr><th>关键变量</th><th>β</th><th>分值</th></tr>${rows}</table>`));

  // ③ 三专科
  const a1=specialistCardio(case_,m), a2=specialistTcm(case_,m), a3=specialistGeneral(case_,m);
  const agents=[a1,a2,a3];
  render("stage3", agents.map(a=>agentCard(a.name, a.ver, a.ver==="高危"?"high":"low", a.reasoning.map(esc))).join(""));

  // ④ RAG
  const queries=[...new Set(agents.flatMap(a=>a.queries))];
  const rag=ragRetrieve(queries);
  const evHtml=rag.map(r=>`<div class="mdt-ev"><span class="mdt-ev-id">[${r.e.id}]</span><b>${esc(r.e.src)}</b>｜${esc(r.e.tag)}<div>${esc(r.e.text)}</div><div class="mdt-ev-q">触发查询：${esc(r.q)}</div></div>`).join("");
  render("stage4", `<div class="mdt-card"><div class="mdt-card-h"><span class="mdt-title">④ MedEvidenceAgent（本地知识库 RAG）</span><span class="mdt-badge ok">${rag.length} 条证据</span></div>
    <div class="mdt-lines"><div class="mdt-line">结构化查询 ${queries.length} 条：${queries.map(esc).join("；")}</div></div>${evHtml}</div>`);

  // ⑤ 终裁
  const sec=director(case_,m,agents,rag);
  const kv=sec.keyVars.map(r=>`<tr><td>${r.name}</td><td>${r.pts>0?"+":""}${r.pts}</td></tr>`).join("");
  render("stage5", `<div class="mdt-card mdt-final">
    <div class="mdt-card-h"><span class="mdt-title">⑤ DeliriumDecisionAgent·主任医师终裁</span>
    <span class="mdt-badge ${sec.verdict.final==="高危"?"high":"low"}">${sec.verdict.final}${sec.verdict.override?"（推翻模型）":"（同意模型）"}</span></div>
    <div class="mdt-report">
      <h4>一、最终风险判定</h4><div>${sec.verdict.text}</div>
      <h4>二、关键变量</h4><table class="mdt-table"><tr><th>变量</th><th>分值</th></tr>${kv}</table>
      <h4>三、推理链（证据声明级引用）</h4>${sec.chain.map(c=>`<div class="mdt-line"><b>${c.step}</b>：${esc(c.text)}</div>`).join("")}
      <h4>四、需监测因素</h4><ul>${sec.monitor.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>
      <h4>五、干预建议</h4><ul>${sec.intervene.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>
    </div></div>`);
  const sum=$("mdtSummary"); if(sum){ sum.textContent=`会诊完成：模型 ${m.tierCN} → 终裁 ${sec.verdict.final}${sec.verdict.override?"（专科共识推翻模型）":"（多源一致）"}｜RAG 证据 ${rag.length} 条`; sum.style.display="block"; }
  document.querySelectorAll(".mdt-stage").forEach((s,i)=>setTimeout(()=>s.classList.add("lit"), i*220));
}

// 语音/文本一键导入（从智能问诊带入）
function importCase(){
  try{
    const raw=localStorage.getItem("mdt_case");
    if(!raw) return;
    const c=JSON.parse(raw);
    if(c.chief&&$("mChief")) $("mChief").value=c.chief;
    (c.syms||[]).forEach(s=>{ const el=document.querySelector(`input[name="msym"][value="${s}"]`); if(el) el.checked=true; });
    (c.pulse||[]).forEach(s=>{ const el=document.querySelector(`input[name="mpulse"][value="${s}"]`); if(el) el.checked=true; });
    (c.tongue||[]).forEach(s=>{ const el=document.querySelector(`input[name="mtongue"][value="${s}"]`); if(el) el.checked=true; });
  }catch(e){}
}

document.addEventListener("DOMContentLoaded", function(){
  importCase();
  const btn=$("runMDT");
  if(btn) btn.addEventListener("click", runMDT);
});
})();
