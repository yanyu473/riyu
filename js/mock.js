/* ===== 模考引擎 + 错题本（按真实 N2 卷面结构 · 估分为非官方口径） ===== */

/* ---------- 静态题构造（模考不即时判分） ---------- */
function mockChoice(stem, opts, ans, explain) {
  return {
    key: ans, exp: explain, optsText: opts,
    html: `${stem}${opts.map((o, i) => `<button class="opt" data-i="${i}">${o}</button>`).join("")}`,
    mount() {
      app.querySelectorAll(".opt").forEach(b => b.onclick = () => {
        if (!mock || mock.locked) return;
        app.querySelectorAll(".opt").forEach(x => x.classList.remove("cur"));
        b.classList.add("cur");
        mock.ans[mock.i] = +b.dataset.i;
        mock.qs[mock.i].picked = +b.dataset.i;
        document.querySelectorAll(".qnav button")[mock.i]?.classList.add("ok");
        updateAnsCount();
      });
    }
  };
}
function mockVocabQ(word) {
  const list = VOCAB();
  const o = uniqOpts(shuffle([{ t: word.m, ok: 1 }, ...shuffle(list.filter(v => v.w !== word.w)).slice(0, 3).map(v => ({ t: v.m, ok: 0 }))]));
  const ans = o.findIndex(x => x.ok);
  return mockChoice(
    `<div class="q-panel"><div class="passage center" style="font-size:40px">${word.w}<br><span style="font-size:20px;color:var(--ice)">（${word.r}）</span></div>
     <p class="dim center mb">次の語の意味として正しいものはどれか。<span class="badge">自编题</span></p></div>`,
    o.map(x => x.t), ans, `${word.w}（${word.r}）＝ ${word.m}`);
}
function mockGramQ(g) {
  const gs = window.GRAMMAR_N2;
  const o = uniqOpts(shuffle([{ t: g.m, ok: 1 }, ...shuffle(gs.filter(x => x.p !== g.p)).slice(0, 3).map(x => ({ t: x.m, ok: 0 }))]));
  const ans = o.findIndex(x => x.ok);
  return mockChoice(
    `<div class="q-panel"><p class="dim center mb">文法形式「${g.p}」の意味として正しいものはどれか。<span class="badge">自编题</span></p>
     <div class="sentence"><span class="blank">${g.e}</span></div></div>`,
    o.map(x => x.t), ans, `${g.p}＝${g.m}${g.c ? `<br><b>接续</b>：${g.c}` : ""}。例：${g.e}（${g.z}）`);
}
function mockReadQ(t) {
  const o = [...t.opts];
  const q = mockChoice(
    `<div class="q-panel"><div class="passage">${t.passage}</div>
     <p class="dim center mb" style="color:var(--pink)">❓ ${t.q}　<span class="badge">自编题</span></p></div>`,
    o, t.ans, t.exp);
  q.pass = t.passage || "";
  q.qt = t.q;
  return q;
}
function mockListenQ(item) {
  return {
    key: item.a, exp: item.t,
    html: `<div class="q-panel">
      <div class="center mb"><button class="pixel-btn blue audio-btn" id="mplay">▶ 播放录音</button>
      <button class="pixel-btn ghost small" id="mslow">慢速重听</button><span class="badge" style="margin-left:6px">🎭 男女分声</span></div>
      <p class="dim center mb" style="font-size:13px">🗣 ${item.q}</p>
      ${item.o.map((t, i) => `<button class="opt" data-i="${i}">${t}</button>`).join("")}</div>`,
    mount() {
      document.getElementById("mplay").onclick = () => speakDialogue(item.t, .95);
      document.getElementById("mslow").onclick = () => speakDialogue(item.t, .68);
      setTimeout(() => { if (document.getElementById("mplay")) speakDialogue(item.t, .95); }, 400);   // 已切走则不响
      app.querySelectorAll(".opt").forEach(b => b.onclick = () => {
        if (mock.locked) return;
        app.querySelectorAll(".opt").forEach(x => x.classList.remove("cur"));
        b.classList.add("cur");
        mock.ans[mock.i] = +b.dataset.i;
        document.querySelectorAll(".qnav button")[mock.i]?.classList.add("ok");
      });
    }
  };
}

/* ---------- 真题静态构造器（模考内使用，不即时判分） ---------- */
function mockRealQ(it) {
  const isListen = it.type === "listen" && it.t;
  const stem = `<div class="q-panel">
    ${it.passage ? `<div class="passage">${it.passage}</div>` : ""}
    ${isListen ? `<div class="center mb"><button class="pixel-btn blue audio-btn" id="mplay">▶ 播放录音</button>
      <button class="pixel-btn ghost small" id="mslow">慢速重听</button><span class="badge" style="margin-left:6px">🎭 男女分声</span></div>` : ""}
    <p class="dim center mb" style="color:var(--pink)">❓ ${it.q} <span class="badge gold">${it.src || "往年真题"}</span></p>`;
  const q = mockChoice(stem, it.opts, it.ans, `<b>📌 ${it.src || "往年真题"} · 详解</b><br>${it.exp}`);
  q.listenT = isListen ? it.t : null;
  q.pass = it.passage || "";
  q.qt = it.q;
  const oldMount = q.mount;
  q.mount = function () {
    oldMount();
    if (q.listenT) {
      document.getElementById("mplay").onclick = () => speakDialogue(q.listenT, .95);
      document.getElementById("mslow").onclick = () => speakDialogue(q.listenT, .68);
      setTimeout(() => { if (document.getElementById("mplay")) speakDialogue(q.listenT, .95); }, 400);   // 已切走则不响
    }
  };
  return q;
}

/* ---------- 组卷 ---------- */
function buildMock(part) {
  if (mock && !mock.locked) return toast("有未完成的考试——请先到「模考」页继续或放弃本场");
  const list = VOCAB();
  if (list.length < 8) return toast("词汇数据加载中，请稍候…");
  const RQ = t => [...(window.REALQ_N2 || []), ...(window.REALQ_N2_EXT || [])].filter(x => x.type === t);
  const parts = [];
  if (part === "lang" || part === "all") {
    const rv = shuffle(RQ("vocab")).slice(0, 10), rg = shuffle(RQ("gram")).slice(0, 10);   // 真题用尽才回退自编
    const vs = [...rv.map(mockRealQ), ...shuffle(list).slice(0, 10 - rv.length).map(mockVocabQ)];
    const gs = [...rg.map(mockRealQ), ...shuffle(window.GRAMMAR_N2).slice(0, 10 - rg.length).map(mockGramQ)];
    parts.push({ name: "言語知識", qs: [...vs, ...gs], min: 35 });
  }
  if (part === "read" || part === "all") {
    const rr = shuffle(RQ("read")).slice(0, 20);
    const qs = [...rr.map(mockRealQ), ...shuffle(window.READ_QS).slice(0, 20 - rr.length).map(mockReadQ)];
    parts.push({ name: "読解", qs, min: 70 });
  }
  if (part === "listen" || part === "all") {
    const rl = shuffle(RQ("listen")).slice(0, 8);
    const qs = [...rl.map(mockRealQ), ...shuffle(window.LISTEN_N2).slice(0, 8 - rl.length).map(mockListenQ)];
    parts.push({ name: "聴解", qs, min: 15 });
  }
  const qs = parts.flatMap(p => p.qs);
  const minutes = part === "all" ? 120 : (parts[0] ? parts[0].min : 35);
  mock = { qs, i: 0, ans: {}, marked: {}, locked: false,
    partName: parts.map(p => p.name).join("＋"), part, secs: minutes * 60,
    bounds: parts.reduce((a, p, idx) => { a.push({ name: p.name, from: idx === 0 ? 0 : a[a.length - 1].to, to: (idx === 0 ? 0 : a[a.length - 1].to) + p.qs.length }); return a; }, []) };
  startMockTimer();
  renderMock();
}
let mock = null, mockTimer = null;
function startMockTimer() {
  if (mockTimer) clearInterval(mockTimer);
  mockTimer = setInterval(() => {
    if (!mock || mock.locked) return;
    mock.secs--;
    const el = document.getElementById("mockTime");
    if (el) { el.textContent = fmtTime(mock.secs); if (mock.secs <= 300) el.classList.add("warn"); }
    if (mock.secs <= 0) { finishMock(true); }
  }, 1000);
}
const fmtTime = s => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

function renderMock() {
  const m = mock, q = m.qs[m.i];
  h(`
    <div class="mock-head">
      <span class="badge gold">模考 · ${m.partName} <span class="dim">（估算非官方口径）</span></span>
      <span class="mock-timer" id="mockTime">${fmtTime(m.secs)}</span>
      <span>
        <button class="pixel-btn small ghost" onclick="toggleMark()">${m.marked[m.i] ? "★ 已标没把握" : "☆ 标记没把握"}</button>
        <button class="pixel-btn small red" onclick="finishMock(false)">交卷</button>
      </span>
    </div>
    <div class="learn-head"><span class="qidx">Q ${m.i + 1} / ${m.qs.length}</span>
      <span class="dim" style="font-size:12px" id="ansCount">已答 ${Object.keys(m.ans).length} 题 · 点选项即记录，无即时反馈</span></div>
    <div id="qbody">${q.html}</div>
    <div class="center mt" style="display:flex;gap:10px;justify-content:center">
      <button class="pixel-btn ghost" onclick="mockNav(${m.i - 1})" ${m.i === 0 ? "disabled" : ""}>← 上一题</button>
      <button class="pixel-btn primary" onclick="${m.i + 1 >= m.qs.length ? "finishMock(false)" : `mockNav(${m.i + 1})`}">${m.i + 1 >= m.qs.length ? "查看交卷 →" : "下一题 →"}</button>
    </div>
    <div class="qnav">${m.qs.map((_, i) => `<button class="${i === m.i ? "cur " : ""}${m.ans[i] !== undefined ? "ok " : ""}${m.marked[i] ? "marked" : ""}" onclick="mockNav(${i})">${i + 1}</button>`).join("")}</div>`);
  try { q.mount && q.mount(); } catch (e) { console.error("[mock] mount error:", e); }
  ensureMockInteractive();          // 兜底：mount 中断也能选/揭示
  window.scrollTo({ top: 0 });
}
/* 兜底交互绑定：保证选项记录与揭示按钮始终可用（幂等，已绑定的不覆盖） */
function updateAnsCount() {
  const el = document.getElementById("ansCount");
  if (el && mock) el.textContent = `已答 ${Object.keys(mock.ans).length} / ${mock.qs.length} 题 · ✓ 已选中即记录`;
}
function ensureMockInteractive() {
  if (!mock || mock.locked) return;
  const opts = document.querySelectorAll("#qbody .opt");
  opts.forEach(b => {
    if (b.onclick) return;
    b.onclick = () => {
      if (mock.locked) return;
      opts.forEach(x => x.classList.remove("cur"));
      b.classList.add("cur");
      mock.ans[mock.i] = +b.dataset.i;
      if (mock.qs[mock.i] && mock.qs[mock.i].optsText) mock.qs[mock.i].picked = +b.dataset.i;
      const nb = document.querySelectorAll(".qnav button")[mock.i];
      if (nb) nb.classList.add("ok");
      updateAnsCount();
    };
  });
  const rv = document.getElementById("revealBtn");
  if (rv && !rv.onclick) rv.onclick = () => { const t = document.getElementById("rv"); if (t) t.classList.remove("hidden"); };
  const okB = document.getElementById("rvOk");
  if (okB && !okB.onclick) okB.onclick = () => { mock.ans[mock.i] = 0; toast("记为「想起来」→ 下次回归间隔拉长 ✓"); rvGo(); };
  const noB = document.getElementById("rvNo");
  if (noB && !noB.onclick) noB.onclick = () => { mock.ans[mock.i] = 1; toast("记为「忘了」→ 明天重新回归"); rvGo(); };
}
function rvGo() { if (mock.i + 1 >= mock.qs.length) finishMock(false); else mockNav(mock.i + 1); }   // 揭示型评分后前进
function mockNav(i) { if (!mock || i < 0 || i >= mock.qs.length) return; mock.i = i; renderMock(); }
function toggleMark() { if (!mock || mock.locked) return; mock.marked[mock.i] = !mock.marked[mock.i]; renderMock(); }

/* ---------- 交卷与估分报告 ---------- */
function finishMock(auto) {
  if (!mock || mock.locked) return;
  mock.locked = true;
  if (mockTimer) clearInterval(mockTimer);
  const m = mock;
  const details = [];
  const stats = m.bounds.map(b => {
    let c = 0, t = 0;
    for (let i = b.from; i < b.to; i++) {
      t++;
      if (m.ans[i] === m.qs[i].key) {
        c++;
        if (m.isRedo && m.qs[i].origKey) Store.postponeWrong(m.qs[i].origKey);   // 回归答对 → 拉长下次间隔
      }
      else if (m.ans[i] !== undefined) {           // 只收录「已答但答错」，未作答不进错题本
        if (m.isRedo) { if (m.qs[i].origKey) Store.redelayWrong(m.qs[i].origKey); }   // 回归又错 → 明天重来
        else Store.addWrong({ mod: b.name, q: m.qs[i].qt || (m.qs[i].meta && m.qs[i].meta.q) || qText(m.qs[i]), opts: m.qs[i].optsText || [], ans: (m.qs[i].optsText || [])[m.qs[i].key] || "", pass: m.qs[i].pass || (m.qs[i].meta && m.qs[i].meta.pass) || "", exp: (m.qs[i].exp || "").replace(/<[^>]+>/g, " ").slice(0, 240) });
        details.push({ no: i + 1, q: qText(m.qs[i]),
          you: m.ans[i] === undefined ? "未作答" : ((m.qs[i].optsText || [])[m.ans[i]] || "?"),
          right: (m.qs[i].optsText || [])[m.qs[i].key] || "?",
          exp: m.qs[i].exp || "（解析整理中）" });
      }
    }
    return { name: b.name, c, t, rate: t ? c / t : 0 };
  });
  // 180分制估算：各部分正确率 × 60 分（三部分），局部模考按同口径折算并标注
  const est = Math.round(stats.reduce((a, s) => a + s.rate * 60, 0));
  const acc = Math.round(stats.reduce((a, s) => a + s.c, 0) / Math.max(1, stats.reduce((a, s) => a + s.t, 0)) * 100);
  if (!m.isRedo) {                                        // 错题回归≠模考：不计入考试次数/趋势/预测
    Store.state.stats.mockCount++;
    Store.state.stats.bestMock = Math.max(Store.state.stats.bestMock || 0, mockEst180({ est: est, part: m.partName }));   // 统一180口径
    Store.state.mockHistory = Store.state.mockHistory || [];
    Store.state.mockHistory.push({ d: Store.todayStr(), part: m.partName, est, acc });
    Store.state.mockHistory = Store.state.mockHistory.slice(-12);
    Store.save();
    Store.log(`模考[${m.partName}]：${acc}% 正确，估分 ${est}/180`);
  } else {
    Store.log(`错题回归：${acc}% 正确（不计入模考趋势）`);
    Store.save();
  }
  Store.addXp(30 + Math.round(acc / 5));
  const taskByPart = { lang: "gram", read: "read", listen: "listen" };
  if (m.part === "all") ["gram", "read", "listen"].forEach(t => Store.markTask(t));
  else if (taskByPart[m.part]) Store.markTask(taskByPart[m.part]);
  const got = Store.checkAch();
  beep(acc >= 50 ? "win" : "bad");

  const weak = [...stats].filter(s => s.t).sort((a, b) => a.rate - b.rate)[0];     // 最弱 = 正确率最低（原先用 pop() 取到了最高的，强弱判断反了）
  const strong = [...stats].filter(s => s.t).sort((a, b) => b.rate - a.rate)[0];   // 最强 = 正确率最高
  const onePart = stats.filter(s => s.t).length <= 1;
  const diag = onePart
    ? `💬 本卷只测 <b style="color:var(--pink)">${weak ? weak.name : "—"}</b>：正确率 ${Math.round((weak ? weak.rate : 0) * 100)}% —— ${weak && weak.rate < .5 ? "这里就是你最直接的提分空间，错题解析逐条啃掉" : "保持这个手感，冲80%以上！"}`
    : `💬 你现在最该补的不是 <b style="color:var(--ice)">${strong ? strong.name : "—"}</b>，而是 <b style="color:var(--pink)">${weak ? weak.name : "—"}</b>。`;
  const advice = {
    "言語知識": ["语法库按功能分组从头过一遍，错题本每天重做", "单词用记忆卡走艾宾浩斯队列，主攻假名认义", "句型填空每天10题保持手感"],
    "読解": ["排序题先找指代词和接続詞，各刷10题", "信息检索练「先读问题再扫表」的定位路线", "长难句拆解工具每天拆3句"],
    "聴解": ["盲听→做题→逐句回听，错因标记必须填", "慢速0.65倍精听同一篇直到能跟上", "影子跟读每天6句练瞬时反应"]
  }[weak ? weak.name : "言語知識"] || [];
  h(`
    <div class="q-panel result-box">
      <div class="sec-title">${m.isRedo ? "错题回归报告 · " : "模考报告 · "}${m.partName}</div>
      <div class="big">${mockEst180({ est: est, part: m.partName })}<span style="font-size:16px"> / 180</span></div>
      <p class="badge red">⚠ 估分为非官方口径：按题数正确率折算，JLPT 官方只公布总分不公布单部分分</p>
      ${m.bounds.length < 3 ? `<p class="dim" style="font-size:12px">局部模考（${m.partName}）已折算为180分制口径 · 本场原始贡献分 ${est}</p>` : ""}
      <div class="stat-row">
        ${stats.map(s => `<div class="stat"><span class="num">${Math.round(s.rate * 100)}%</span>
          <span class="lab">${s.name} ${s.c}/${s.t}</span></div>`).join("")}
      </div>
      <p class="mt" style="font-size:15px">${diag}</p>
      <div class="know-box mt" style="text-align:left"><h4>三条具体行动</h4><ol>${advice.map(a => `<li>${a}</li>`).join("")}</ol></div>
      ${details.length ? `
      <div class="mt" style="text-align:left">
        <div class="sec-title">📖 错题详细解析（${details.length}题）</div>
        ${details.map(d => `<div class="wrong-item">
          <span class="badge red">第${d.no}题</span>
          <p class="mt" style="font-size:15px">${d.q}</p>
          <p style="font-size:14px">你的答案：<b style="color:#ff9db3">${d.you}</b> ｜ 正确答案：<b style="color:var(--green)">${d.right}</b></p>
          <div class="explain mt" style="margin-top:8px">${d.exp}</div>
        </div>`).join("")}
      </div>` : `<p class="mt" style="color:var(--green)">🎉 全部答对，没有需要解析的题！</p>`}
      ${got.map(a => `<p class="mt"><span class="badge gold">${a.ic} 成就解锁：${a.n}</span></p>`).join("")}
      <div class="center mt" style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
        <button class="pixel-btn primary" onclick="location.hash='#/wrongbook'">📖 错题本（${Store.state.wrongs.length}）</button>
        <button class="pixel-btn blue" onclick="location.hash='#/mock'">再考一次</button>
      </div>
    </div>`);
  mock = null;
  renderUserBox();
}
/* 错题的阅读材料：优先用记录里的 pass；老记录缺失时按「题干+选项」回题库精确找回
   （多道排序题共用同一题干，仅凭题干会找错文章，因此选项必须完全一致，模糊就不显示） */
function passFor(x) {
  if (x.pass) return x.pass;
  const pool = (window.READ_QS || []).concat(window.REALQ_N2 || [], window.REALQ_N2_EXT || []);
  const sameOpts = q => x.opts && q.opts && q.opts.length === x.opts.length && q.opts.every((o, i) => o === x.opts[i]);
  const byQ = pool.filter(q => q && q.q === x.q);
  const exact = byQ.find(sameOpts);
  if (exact) return exact.passage || "";
  const byOpts = pool.filter(q => q && sameOpts(q));      // 旧模考错题的题干是截断材料 → 选项唯一匹配兜底
  if (byOpts.length === 1) return byOpts[0].passage || "";
  return byQ.length === 1 ? (byQ[0].passage || "") : "";
}
function qText(q) {
  const d = document.createElement("div"); d.innerHTML = q.html;
  const el = d.querySelector(".sentence, .passage") || d.querySelector("p") || d;
  return (el.textContent || "题目").replace(/\s+/g, " ").trim().slice(0, 60);
}

/* ---------- 模考入口页 ---------- */
function resumeMock() { if (!mock || mock.locked) return; mock.paused = false; startMockTimer(); renderMock(); }
function abandonMock() {
  if (!confirm("确定放弃本场？已作答内容不计入任何成绩")) return;
  if (mockTimer) clearInterval(mockTimer);
  mock = null; toast("已放弃本场"); mockPage();
}
function mockPage() {
  const st = Store.state.stats;
  h(`
    <div class="sec-title">全真模考 · MOCK EXAM</div>
    ${mock && !mock.locked ? `<div class="pixel-panel light mb" style="border-color:var(--gold)">
      <div class="sec-title">⏸ 未完成的${mock.isRedo ? "错题回归" : "考试"} · ${mock.partName}</div>
      <p class="dim mb" style="font-size:13px">剩余 <b style="color:var(--gold)">${fmtTime(mock.secs)}</b> · 已答 ${Object.keys(mock.ans).length}/${mock.qs.length} 题（离开考场时已自动暂停计时，现场保留）</p>
      <button class="pixel-btn primary" onclick="resumeMock()">▶ 继续本场</button>
      <button class="pixel-btn red small" onclick="abandonMock()">放弃本场</button>
    </div>` : ""}
    <p class="dim mb" style="font-size:14px">按真实 N2 卷面结构组卷 · 倒计时自动交卷 · 答题卡可标记「没把握」 · 交卷出估分报告<span class="badge red">估分非官方口径</span></p>
    <div class="grid c4 mb">
      <div class="pixel-panel module-card"><span class="ico">📝</span><h3>语言知识</h3>
        <p>文字·词汇10 + 语法10，35分钟</p>
        <div class="mini-stat">题量20 · 估分×60折算</div>
        <button class="pixel-btn primary" onclick="buildMock('lang')">开始局部模考</button></div>
      <div class="pixel-panel module-card"><span class="ico">📖</span><h3>读解</h3>
        <p>排序/检索/主张一致/短中篇 20题，70分钟</p>
        <div class="mini-stat">题量20 · 估分×60折算</div>
        <button class="pixel-btn blue" onclick="buildMock('read')">开始局部模考</button></div>
      <div class="pixel-panel module-card"><span class="ico">🎧</span><h3>听力</h3>
        <p>要点理解/即时应答类 8题，15分钟</p>
        <div class="mini-stat">题量8 · 估分×60折算</div>
        <button class="pixel-btn purple" onclick="buildMock('listen')">开始局部模考</button></div>
      <div class="pixel-panel module-card" style="border-color:var(--gold)"><span class="ico">👑</span><h3>全套模考</h3>
        <p>语言知识+读解+听力 120分钟耐力战</p>
        <div class="mini-stat">已考 ${st.mockCount} 次 · 最佳估分 ${st.bestMock || "—"}</div>
        <button class="pixel-btn red" onclick="buildMock('all')">挑战全套</button></div>
    </div>
    <div class="pixel-panel">
      <div class="sec-title">冲刺期用法（按阶段）</div>
      <div class="know-box"><h4>🗓 阶段策略</h4><ol>
        <li><b>第1周·诊断</b>：做一次全套模考 → 拿到分部分报告 → 只做两件事：过语法库、建错题本。</li>
        <li><b>第2-4周·主攻</b>：周末做一次局部模考（只做读解或只做语言知识）。</li>
        <li><b>最后7-10天·收口</b>：错题本全量重做，排序题和主张一致题各刷20题。</li>
        <li><b>考前3天</b>：只看错题本，不碰新题。</li>
      </ol></div>
    </div>`);
}

/* ---------- 错题本 ---------- */
function wrongbookPage() {
  const w = Store.state.wrongs, es = Store.state.errStats || {};
  const due = Store.dueWrongs(), tdy = Store.todayStr();
  const byMod = {};
  w.forEach(x => (byMod[x.mod] = byMod[x.mod] || []).push(x));
  h(`
    <div class="sec-title">错题本 · WRONG BOOK（${w.length}）</div>
    ${due.length ? `<div class="pixel-panel light mb" style="border-color:var(--gold)">
      <div class="sec-title">🔁 今日应回归 ${due.length} 题 · 艾宾浩斯排程</div>
      <p class="dim mb" style="font-size:13px">错题按 1→2→4→7 天自动回归：重做答对间隔拉长，答错明天重来——在快忘时拦截它。</p>
      <button class="pixel-btn primary" onclick="redoDue()">▶ 开始今日错题回归</button>
    </div>` : `<div class="pixel-panel light mb"><p class="center">🎉 今日没有到期待回归的错题，先把新错题收进来吧！</p></div>`}
    <div class="stat-row mb">
      ${Object.entries(byMod).map(([m, arr]) => `<div class="stat"><span class="num">${arr.length}</span><span class="lab">${m}</span></div>`).join("") || '<div class="dim center">还没有错题，去训练吧！</div>'}
      ${Object.entries(es).map(([t, n]) => `<div class="stat"><span class="num">${n}</span><span class="lab">听力错因·${t}</span></div>`).join("")}
    </div>
    ${Object.entries(byMod).map(([m, arr]) => `
      <div class="pixel-panel mb">
        <div class="sec-title">${m} · ${arr.length}题</div>
        ${arr.map(x => `
          <div class="wrong-item">
            <span class="w-mod">${x.mod}</span>
            <span class="badge red">错过 ${x.n} 次</span>
            ${x.due && x.due <= tdy ? '<span class="badge gold">📅 今日回归</span>' : `<span class="badge">回归 ${x.due || "—"}</span>`}
            ${x.lv ? `<span class="badge green">连对 ${x.lv} 次</span>` : ""}
            <span class="dim" style="font-size:11px">${x.date}</span>
            <p class="mt" style="font-size:16px">${x.q}</p>
            ${passFor(x) ? `<details class="dim" style="font-size:13px"><summary style="cursor:pointer">📄 展开阅读材料</summary><div class="passage" style="margin-top:6px">${passFor(x)}</div></details>` : ""}
            ${x.opts && x.opts.length ? `<p class="dim" style="font-size:13px">选项：${x.opts.join(" ／ ")}</p>` : ""}
            <p style="color:var(--gold)">✔ ${x.ans || ""}</p>
            ${x.exp ? `<p class="dim" style="font-size:13px">${x.exp}</p>` : ""}
            <div class="tag-row">
              <button class="pixel-btn small ghost" onclick="markMastered('${encodeURIComponent(x.mod + "|" + x.q)}')">✓ 已掌握，移出</button>
            </div>
          </div>`).join("")}
        <div class="center mt"><button class="pixel-btn small primary" onclick="redoWrong('${m}')">🔁 重做本组错题</button></div>
      </div>`).join("")}
    ${w.length ? `<div class="center"><button class="pixel-btn red small" onclick="if(confirm('清空全部错题本？')){Store.state.wrongs=[];Store.save();wrongbookPage()}">清空错题本</button></div>` : ""}
  `);
}
function markMastered(key) {
  Store.removeWrong(decodeURIComponent(key));
  toast("已移出错题本"); wrongbookPage();
}
function redoDue() {
  redoList(Store.dueWrongs(), "错题回归·今日");
}
function redoWrong(mod) {
  redoList(Store.state.wrongs.filter(x => x.mod === mod), `错题重做·${mod}`);
}
function redoList(items, title) {
  if (mock && !mock.locked) return toast("有未完成的考试——请先继续或放弃本场，再开始重做");
  if (!items.length) return toast("该组没有错题");
  const qs = items.map(x => {
    const origKey = x.mod + "|" + x.q;
    if (x.opts && x.opts.length >= 2) {
      const o = shuffle([{ t: x.ans, ok: 1 }, ...[...new Set(x.opts.filter(t => t !== x.ans))].map(t => ({ t, ok: 0 }))]);   // 去重防两个相同干扰项
      const ans = o.findIndex(v => v.ok);
      const q = mockChoice(`<div class="q-panel"><p class="dim center mb">错题重做 · ${x.mod}</p>
        ${passFor(x) ? `<div class="passage">${passFor(x)}</div>` : ""}
        <div class="sentence" style="font-size:22px">${x.q}</div>
        <p class="dim center mt" style="font-size:13px">选项</p>`,
        o.map(v => v.t), ans, x.exp || `正确答案：${x.ans}`);
      q.origKey = origKey;
      return q;
    }
    // 无存储选项但有正确答案（记忆卡/听力错题）→ 借同组其他题的答案自动生成选择题
    const distract = shuffle([...new Set(items.filter(o => o !== x && o.ans && o.ans !== x.ans).map(o => o.ans))]).slice(0, 3);   // 借来的答案去重
    if (x.ans && distract.length >= 2) {
      const o = shuffle([{ t: x.ans, ok: 1 }, ...distract.map(t => ({ t, ok: 0 }))]);
      const ans = o.findIndex(v => v.ok);
      const q = mockChoice(`<div class="q-panel"><p class="dim center mb">错题重做 · ${x.mod} · 选出正确答案</p>
        <div class="sentence" style="font-size:22px">${x.q}</div>`,
        o.map(v => v.t), ans, x.exp || `正确答案：${x.ans}`);
      q.origKey = origKey;
      return q;
    }
    // 无选项（如记忆卡）→ 揭示回忆型：揭示后用两个按钮选择「想起来/忘了」驱动排程
    return {
      key: 0, exp: x.exp, origKey, optsText: [x.ans || "（本题无存档答案）", "✗ 还是忘了"],
      html: `<div class="q-panel center"><p class="dim mb">错题重做 · 先回忆再揭示</p>
        ${passFor(x) ? `<div class="passage" style="text-align:left">${passFor(x)}</div>` : ""}
        <div class="sentence" style="font-size:26px">${x.q}</div>
        <button class="pixel-btn primary mt" id="revealBtn">揭示答案</button>
        <div id="rv" class="hidden mt"><p style="font-size:20px;color:var(--gold)">✔ ${x.ans}</p>
        ${x.exp ? `<p class="dim">${x.exp}</p>` : ""}
        <div class="center mt" style="display:flex;gap:12px;justify-content:center">
          <button class="pixel-btn green" id="rvOk">✓ 想起来了</button>
          <button class="pixel-btn red" id="rvNo">✗ 还是忘了</button>
        </div></div></div>`,
      mount() {
        document.getElementById("revealBtn").onclick = () => document.getElementById("rv").classList.remove("hidden");
        document.getElementById("rvOk").onclick = () => {
          mock.ans[mock.i] = 0;                       // 想起来 = 答对 → 下次间隔拉长
          toast("记为「想起来」→ 下次回归间隔拉长 ✓");
          rvGo();                                     // 记录后自动进下一题（原先原地重置，用户以为没生效）
        };
        document.getElementById("rvNo").onclick = () => {
          mock.ans[mock.i] = 1;                       // 忘了 = 答错 → 明天重来
          toast("记为「忘了」→ 明天重新回归");
          rvGo();
        };
      }
    };
  });
  mock = { qs, i: 0, ans: {}, marked: {}, locked: false, partName: title, secs: 600,
    bounds: [{ name: "错题", from: 0, to: qs.length }], isRedo: true };
  startMockTimer();
  renderMock();
}
