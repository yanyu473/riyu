/* ===== 像素日语 · 用户/进度/成就 状态层（localStorage） ===== */
const Store = (() => {
  const UKEY = "px_users", SKEY = "px_state_", PKEY = "px_session";

  const hash = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h.toString(36); };
  const pad = n => String(n).padStart(2, "0");
  // 必须用本地日期（toISOString 是 UTC，北京时间 0-8 点会记到前一天）
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
  const dayOffset = n => { const d = new Date(Date.now() + n * 864e5); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };

  const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  function defState() {
    return {
      xp: 0, streak: 0, lastDay: "", created: today(),
      examDate: "2026-12-06",              // N2 考试日（12月考试，可修改）
      newLimit: 8,                          // 每日新词额度（可调 8/12/20）
      mockHistory: [],                      // [{d, part, est, acc}] 模考趋势
      dayTasks: {},                        // {"2026-10-11": {vocab:true, gram:true}}
      units: {},                       // {1:{done,score},...}
      words: {},                       // {单词: 0新/1学中/2掌握}
      srs: {},                         // {单词:{e:2.5,i:0,due:"2026-10-11",l:0}} L0学习中 L1困难 L2复习
      wrongs: [],                      // [{mod,q,opts,ans,exp,date,err}]
      stats: { logins: 0, vocabCorrect: 0, vocabTotal: 0, gramCorrect: 0, gramTotal: 0,
               listenCorrect: 0, listenTotal: 0, speakCount: 0, speakBest: 0, perfect: 0, pathDone: 0,
               readCorrect: 0, readTotal: 0, mockCount: 0, bestMock: 0 },
      ach: {},                         // {id: date}
      history: []                      // [{d, text}]
    };
  }

  let cur = null, user = null;

  function register(name, pass) {
    name = (name || "").trim();
    if (name.length < 2) return { ok: false, msg: "用户名至少2个字符" };
    if ((pass || "").length < 4) return { ok: false, msg: "密码至少4位" };
    const users = read(UKEY, {});
    if (users[name]) return { ok: false, msg: "用户名已存在，直接登录吧" };
    users[name] = { h: hash(pass), c: Date.now() };
    write(UKEY, users);
    return login(name, pass);
  }

  function login(name, pass) {
    name = (name || "").trim();
    const users = read(UKEY, {});
    if (!users[name]) return { ok: false, msg: "用户不存在，请先注册" };
    if (users[name].h !== hash(pass || "")) return { ok: false, msg: "密码错误" };
    user = name;
    write(PKEY, user);
    cur = loadState();
    touchDay();
    save();
    return { ok: true };
  }

  function loadState() {
    const saved = read(SKEY + user, null);
    const s = Object.assign(defState(), saved || {});
    s.stats = Object.assign(defState().stats, (saved && saved.stats) || {});
    // 旧数据迁移：错题补排程字段（无 due 视为今天到期回归）
    (s.wrongs || []).forEach(w => { if (!w.due) w.due = today(); if (w.lv == null) w.lv = 0; });
    return s;
  }

  function restore() {
    const u = read(PKEY, null);
    if (u && read(UKEY, {})[u]) { user = u; cur = loadState(); touchDay(); save(); return true; }
    return false;
  }

  function logout() { localStorage.removeItem(PKEY); cur = null; user = null; }

  function touchDay() {
    const t = today();
    if (cur.lastDay === t) return;
    const y = dayOffset(-1);
    cur.streak = (cur.lastDay === y) ? cur.streak + 1 : 1;
    cur.lastDay = t;
    cur.stats.logins++;
  }

  const save = () => { if (user) write(SKEY + user, cur); };

  /* ---- 奖励 ---- */
  function addXp(n) { cur.xp += n; save(); }
  function log(text) { cur.history.unshift({ d: today(), text }); cur.history = cur.history.slice(0, 40); save(); }

  function checkAch() {
    const got = [];
    for (const a of window.ACHIEVEMENTS) {
      if (!cur.ach[a.id] && a.c(cur)) { cur.ach[a.id] = today(); got.push(a); }
    }
    if (got.length) save();
    return got;
  }

  /* ---- 今日任务 & 考试倒计时 ---- */
  function markTask(id) {
    const d = today();
    cur.dayTasks[d] = cur.dayTasks[d] || {};
    if (!cur.dayTasks[d][id]) { cur.dayTasks[d][id] = true; save(); return true; }
    save(); return false;
  }
  const taskDone = id => !!(cur.dayTasks || {})[today()] && cur.dayTasks[today()][id];
  function daysLeft() {
    const e = new Date((cur.examDate || "2026-12-06") + "T00:00:00");
    const n = new Date(today() + "T00:00:00");
    return Math.max(0, Math.round((e - n) / 864e5));
  }
  function setExamDate(d) { if (/^\d{4}-\d{2}-\d{2}$/.test(d)) { cur.examDate = d; save(); return true; } return false; }

  /* ---- 错题本（艾宾浩斯排程：1/2/4/7 天回归，答对拉长、答错重置） ---- */
  const REDO_GAP = [1, 2, 4, 7, 15, 30];
  function addWrong(item) {
    const key = item.mod + "|" + item.q;
    const old = cur.wrongs.find(w => w.mod + "|" + w.q === key);
    if (old) { old.n++; old.date = today(); old.due = dayOffset(1); old.lv = 0;
      if (item.pass && !old.pass) old.pass = item.pass;          // 老记录缺阅读材料/解析时补上
      if (item.exp && !old.exp) old.exp = item.exp; }
    else cur.wrongs.unshift(Object.assign({ date: today(), n: 1, lv: 0, due: dayOffset(1) }, item));
    cur.wrongs = cur.wrongs.slice(0, 300);
    save();
  }
  function removeWrong(key) { cur.wrongs = cur.wrongs.filter(w => w.mod + "|" + w.q !== key); save(); }
  function postponeWrong(key) {                     // 重做答对 → 按 1/2/4/7 天拉长下次回归
    const w = cur.wrongs.find(x => (x.mod + "|" + x.q) === key);
    if (!w) return false;
    w.lv = (w.lv || 0) + 1;
    w.due = dayOffset(REDO_GAP[Math.min(w.lv, REDO_GAP.length - 1)]);
    w.ok = (w.ok || 0) + 1;
    save(); return true;
  }
  function redelayWrong(key) {                      // 重做又错 → 回到明天重来
    const w = cur.wrongs.find(x => (x.mod + "|" + x.q) === key);
    if (!w) return false;
    w.n++; w.lv = 0; w.due = dayOffset(1); w.date = today();
    save(); return true;
  }
  const dueWrongs = () => cur.wrongs.filter(w => (w.due || today()) <= today());

  /* ---- 语法掌握画像：没记住的条目优先重现 ---- */
  function gramMark(pat, ok) {
    cur.gramMap = cur.gramMap || {};
    const g = cur.gramMap[pat] || { n: 0, ok: 0 };
    g.n++; g.ok = ok ? Math.min(9, g.ok + 1) : Math.max(-4, g.ok - 2);
    cur.gramMap[pat] = g;
    save();
  }
  const gramKnown = pat => ((cur.gramMap || {})[pat] || {}).ok >= 2;

  /* ---- 听力错因统计 ---- */
  function recordErr(tag) {
    cur.errStats = cur.errStats || {};
    cur.errStats[tag] = (cur.errStats[tag] || 0) + 1;
    save();
  }

  /* ---- SRS 记忆引擎：艾宾浩斯学习步(5m/30m/12h) × SM-2 间隔扩张 ----
     卡片 {e:EF初值2.5, i:当前间隔天, due:"YYYY-MM-DD HH:MM", l:0学习中/2复习中,
           st:学习步序号, nd:首学日, n:复习次数} */
  const nowStr = () => { const d = new Date();
    const p = n => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`; };
  const shiftMin = m => { const d = new Date(Date.now() + m * 6e4);
    const p = n => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`; };
  const shiftDay = n => { const d = new Date(); d.setDate(d.getDate() + n);
    const p = x => String(x).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} 00:00`; };

  function srsDue(limit, ns) {                  // 到期队列：学习中(拦截复习)优先，再复习中
    const t = nowStr();                          // ns="g:" 只取语法句型；省略时只取单词（排除语法前缀）
    const inNs = k => ns ? k.startsWith(ns) : !k.startsWith("g:");
    const all = Object.entries(cur.srs).filter(([k, v]) => inNs(k) && v.due <= t);
    const l0 = all.filter(([, v]) => v.l === 0), l2 = all.filter(([, v]) => v.l === 2);
    return [...l0, ...l2].slice(0, limit).map(([w]) => w);
  }
  function srsNew(limit) {                       // 新词：日限额度（复习永远优先于新词）
    const cap = limit || cur.newLimit || 8;
    const d = today();
    const started = new Set(Object.keys(cur.srs));
    const pool = (window.VOCAB_N2 || []).filter(v => !started.has(v.w));
    const todayNew = Object.values(cur.srs).filter(v => (v.nd || "").slice(0, 10) === d).length;
    return pool.slice(0, Math.max(0, cap - todayNew)).map(v => v.w);
  }
  const setNewLimit = n => { if ([8, 12, 20].includes(n)) { cur.newLimit = n; save(); } };
  function srsQueue(newLimit) {
    const due = srsDue(40), fresh = srsNew(newLimit);   // 不传时按用户设置的每日额度
    return { due, fresh, has: due.length + fresh.length > 0 };
  }
  function srsGrade(w, q) {          // q: 0重来 1困难 2良好 3简单
    const c = cur.srs[w] || { e: 2.5, i: 0, due: nowStr(), l: 0, st: 0, nd: today(), n: 0 };
    const quality = [1, 3, 4, 5][q];                     // 映射 SM-2 的 0-5 质量分
    // EF 更新（SM-2 公式，下限 1.3）
    c.e = Math.max(1.3, c.e + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
    if (quality < 3) {                                    // 忘了 → 回炉：5分钟后重来（艾宾浩斯第1节点）
      c.l = 0; c.st = 0; c.i = 0; c.due = shiftMin(5); c.e = Math.max(1.3, c.e - 0.2);
      cur.words[w] = 0;
    } else if (c.l === 0) {                               // 学习阶段：5分钟 → 30分钟 → 12小时 → 毕业
      c.st = (c.st || 0) + 1;
      if (c.st === 1) c.due = shiftMin(5);
      else if (c.st === 2) c.due = shiftMin(30);
      else { c.due = shiftMin(720); c.l = 2; c.i = 1; c.st = 0; c.n = 1; }   // 12小时后毕业，次日首复习
      cur.words[w] = Math.min(2, (cur.words[w] || 0) + 1);
    } else {                                              // 复习阶段：SM-2 间隔扩张 1天→6天→×EF
      c.n = (c.n || 0) + 1;
      c.i = c.i <= 1 ? 6 : Math.max(2, Math.round(c.i * c.e));
      c.due = shiftDay(c.i);
      cur.words[w] = Math.min(2, (cur.words[w] || 0) + 1);
    }
    if (!c.nd) c.nd = today();
    cur.srs[w] = c;
    save();
  }
  function srsStats() {
    const v = Object.entries(cur.srs).filter(([k]) => !k.startsWith("g:")).map(([, x]) => x), t = nowStr();   // 只统计单词空间
    const days = [0, 1, 2, 3, 4, 5, 6].map(d => {
      const a = shiftDay(d).slice(0, 10), b = shiftDay(d + 1).slice(0, 10);
      return v.filter(x => x.due.slice(0, 10) >= a && x.due.slice(0, 10) < b).length;
    });
    return { learn: v.filter(x => x.l === 0).length, review: v.filter(x => x.l === 2).length,
      due: v.filter(x => x.due <= t).length, total: v.length, forecast: days };
  }

  /* ---- 智能分析引擎：从真实学习数据算出「现在最该做什么」+ 遗忘预警 ---- */
  function insight() {
    const t = nowStr();
    const W = Object.entries(cur.srs).filter(([k]) => !k.startsWith("g:")).map(([w, v]) => Object.assign({ w }, v));
    const G = Object.entries(cur.srs).filter(([k]) => k.startsWith("g:")).map(([k, v]) => Object.assign({ p: k.slice(2) }, v));
    const dueW = W.filter(x => x.due <= t), dueG = G.filter(x => x.due <= t);
    // 风险分：EF 越低越易忘 + 回炉次数越多越不稳 + 停在学习中(l=0)说明还没拿下
    const riskOf = xs => xs.map(x => Object.assign({}, x, {
        risk: (2.5 - (Number(x.e) || 2.5)) * 2 + (x.n || 0) * 0.6 + (x.l === 0 ? 1.5 : 0) }))
      .filter(x => x.e < 2.3 || (x.n || 0) >= 3 || x.l === 0)
      .sort((a, b) => b.risk - a.risk);
    const riskW = riskOf(W), riskG = riskOf(G);
    const s = cur.stats, acc = k => s[k + "Total"] ? Math.round(s[k + "Correct"] / s[k + "Total"] * 100) : null;
    const es = Object.entries(cur.errStats || {}).sort((a, b) => b[1] - a[1]);
    const hotWrong = [...(cur.wrongs || [])].sort((a, b) => (b.n || 0) - (a.n || 0));
    const repWrong = hotWrong.filter(x => (x.n || 0) >= 2).length;

    const tips = [];
    if (dueW.length + dueG.length)
      tips.push({ ico: "🧠", txt: `${dueW.length} 个词 + ${dueG.length} 个句型已到期——正处在遗忘临界点，现在复习效率最高`, nav: "#/practice/flip", btn: "开始记忆" });
    if (riskW.length >= 3)
      tips.push({ ico: "⚠", txt: `检测到 ${riskW.length} 个「难记词」（反复回炉或 EF 偏低），集中攻一遍收益最大`, nav: "#/practice/word", btn: "强化单词" });
    if (riskG.length >= 2)
      tips.push({ ico: "📜", txt: `${riskG.length} 个句型你反复记不牢——它们是语法提分的最近空间`, nav: "#/practice/grammar", btn: "攻克语法" });
    if (es.length && es[0][1] >= 3)
      tips.push({ ico: "🎧", txt: `听力错因最集中在「${es[0][0]}」(${es[0][1]} 次)，针对性训练见效最快`, nav: "#/practice/listening", btn: "听力训练" });
    const vA = acc("vocab");
    if (vA !== null)
      tips.push({ ico: "📊", txt: `词汇正确率 ${vA}%${vA < 60 ? "，偏低——优先「假名认义」题型补短板" : vA >= 85 ? "，很稳——可多挑战真题词汇" : "，保持即可"}`, nav: "#/practice/word", btn: "去训练" });
    if (repWrong)
      tips.push({ ico: "🔁", txt: `错题本有 ${repWrong} 道反复错的题，重做它们记忆最深`, nav: "#/wrongbook", btn: "重做错题" });
    if (!tips.length)
      tips.push({ ico: "🌱", txt: "还没有学习记录——先做一次记忆卡，系统就开始追踪你的遗忘曲线", nav: "#/practice/flip", btn: "开始" });

    return { dueW: dueW.length, dueG: dueG.length, riskW: riskW.slice(0, 8), riskG: riskG.slice(0, 5),
      tips: tips.slice(0, 3), acc: { vocab: vA, gram: acc("gram"), listen: acc("listen") }, days: daysLeft() };
  }

  /* ---- 模块掌握度（进度追踪 & 推荐依据） ---- */
  function scores() {
    const s = cur.stats;
    const pct = (c, t) => t ? Math.round(c / t * 100) : 0;
    const wordList = window.VOCAB_N2 || [];
    const known = Object.values(cur.words).filter(v => v >= 2).length;
    const units = window.UNITS_N2;
    const unitDone = Object.values(cur.units).filter(u => u.done).length;
    return {
      vocab: Math.round(pct(s.vocabCorrect, s.vocabTotal) * .5 + (wordList.length ? known / wordList.length * 100 : 0) * .5),
      grammar: Math.round(pct(s.gramCorrect, s.gramTotal) * .6 + unitDone / units.length * 100 * .4),
      listening: pct(s.listenCorrect, s.listenTotal),
      speaking: Math.min(100, s.speakBest),
      unitDone, unitTotal: units.length, known, wordTotal: wordList.length
    };
  }

  /* ---- 个性化学习路径推荐 ---- */
  function recommend() {
    const sc = scores();
    const steps = [];
    const mods = [
      { k: "vocab", label: "单词记忆", nav: "#/practice/word", v: sc.vocab },
      { k: "grammar", label: "语法练习", nav: "#/practice/grammar", v: sc.grammar },
      { k: "listening", label: "听力训练", nav: "#/practice/listening", v: sc.listening },
      { k: "speaking", label: "口语跟读", nav: "#/practice/speaking", v: sc.speaking }
    ].sort((a, b) => a.v - b.v);

    const nextUnit = window.UNITS_N2.find(u => !cur.units[u.no] || !cur.units[u.no].done);
    if (nextUnit) steps.push({ label: `单元${nextUnit.no} ${nextUnit.zh}`, nav: `#/unit/${nextUnit.no}` });

    steps.push({ label: `补强：${mods[0].label}（${mods[0].v}%）`, nav: mods[0].nav });
    steps.push({ label: `巩固：${mods[1].label}（${mods[1].v}%）`, nav: mods[1].nav });

    const why = sc.vocab < 50 ? "词汇掌握度是当前短板"
              : sc.listening < 40 ? "听力正确率偏低，优先强化"
              : sc.grammar < 50 ? "语法熟练度不足，跟上单元更稳"
              : "各模块均衡，按单元推进即可";
    return { steps, why, scores: sc };
  }

  return { register, login, restore, logout,
    get state() { return cur; }, get user() { return user; },
    addXp, log, checkAch, save, scores, recommend,
    markTask, taskDone, daysLeft, setExamDate,
    addWrong, removeWrong, postponeWrong, redelayWrong, dueWrongs,
    srsDue, srsNew, srsQueue, srsGrade, srsStats,
    gramMark, gramKnown, recordErr, todayStr: today, setNewLimit, insight };
})();
