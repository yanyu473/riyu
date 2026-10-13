/* ===== 像素日语 · 主应用（路由 / 页面 / 训练模块） ===== */
const app = document.getElementById("app");
const VOCAB = () => window.VOCAB_N2 || [];

/* ---------- 工具 ---------- */
function h(html) { app.innerHTML = html; }
function toast(msg, cls) {
  const t = document.createElement("div");
  t.className = "toast-msg " + (cls || "");
  t.textContent = msg;
  document.getElementById("toast").appendChild(t);
  setTimeout(() => t.remove(), 2600);
}
function shuffle(a) { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const pick = a => a[Math.floor(Math.random() * a.length)];

/* ---------- 跨次训练防重复：优先出最近没做过的题（解决「题库单一、每次都一样」） ---------- */
function recentList(kind) { try { return JSON.parse(localStorage.getItem("px_recent_" + kind)) || []; } catch (e) { return []; } }
function saveRecent(kind, keys) {
  const all = [...new Set([...keys, ...recentList(kind)])].slice(0, 150);   // 每类只记最近150条
  try { localStorage.setItem("px_recent_" + kind, JSON.stringify(all)); } catch (e) {}
}
function freshShuffle(arr, keyFn, kind) {          // 没做过的排前面（各自洗牌），做过的垫底兜底
  const rec = new Set(recentList(kind));
  return [...shuffle(arr.filter(x => !rec.has(keyFn(x)))), ...shuffle(arr.filter(x => rec.has(keyFn(x))))];
}

/* ---------- 音效（Web Audio 像素蜂鸣） ---------- */
let AC = null;
function beep(type) {
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const notes = type === "ok" ? [660, 880] : type === "bad" ? [300, 180] : [523, 659, 784, 1046];
    notes.forEach((f, i) => {
      const o = AC.createOscillator(), g = AC.createGain();
      o.type = "square"; o.frequency.value = f;
      g.gain.setValueAtTime(.06, AC.currentTime + i * .09);
      g.gain.exponentialRampToValueAtTime(.001, AC.currentTime + i * .09 + .12);
      o.connect(g); g.connect(AC.destination);
      o.start(AC.currentTime + i * .09); o.stop(AC.currentTime + i * .09 + .13);
    });
  } catch (e) {}
}

/* ---------- TTS 日语朗读 ---------- */
let voices = [];
function refreshVoices() { try { voices = speechSynthesis.getVoices() || []; } catch (e) {} }
if ("speechSynthesis" in window) { refreshVoices(); speechSynthesis.onvoiceschanged = refreshVoices; }
let _kae = null;
function keepAlive() {
  if (_kae) clearInterval(_kae);
  _kae = setInterval(() => {
    try {
      if (speechSynthesis.speaking || speechSynthesis.pending) { if (speechSynthesis.paused) speechSynthesis.resume(); }
      else { clearInterval(_kae); _kae = null; }
    } catch (e) { clearInterval(_kae); _kae = null; }
  }, 4000);
}
function pickV(lang) {
  if (!voices.length) refreshVoices();
  const p = lang.slice(0, 2).toLowerCase();
  return voices.find(x => (x.lang || "").toLowerCase().replace("_", "-").startsWith(p)) || null;
}
function speak(text, rate, lang) {
  if (!("speechSynthesis" in window)) { toast("🚫 此浏览器不支持语音合成（vivo等国产浏览器已裁剪）——请用 Chrome 打开本页", "ach"); return; }
  refreshVoices();
  const L = lang || "ja-JP";
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = L; u.rate = rate || .9;
  const v = pickV(L);
  if (v) u.voice = v;
  u.onend = () => { if (_kae) { clearInterval(_kae); _kae = null; } };
  u.onerror = e => {
    if (_kae) { clearInterval(_kae); _kae = null; }
    const err = e && e.error;
    if (err && err !== "interrupted" && err !== "canceled")
      toast("🔇 播放失败：请点 ▶ 按钮重试，并确认手机媒体音量已打开", "ach");
  };
  speechSynthesis.speak(u);
  try { speechSynthesis.resume(); } catch (e) {}
  keepAlive();
}
let _voiceWarned = false;
function warnVoice(lang) {
  if (_voiceWarned) return;
  if (!("speechSynthesis" in window)) {
    _voiceWarned = true;
    toast("🚫 此浏览器不支持语音合成（vivo等国产浏览器已裁剪）——请用 Chrome 打开本页", "ach");
    return;
  }
  refreshVoices();
  const p = (lang || "ja-JP").slice(0, 2).toLowerCase();
  if (voices.length && !voices.some(x => (x.lang || "").toLowerCase().startsWith(p))) {
    _voiceWarned = true;
    toast("⚠ 未检测到日语语音包，可能无声：请在系统「设置 → 朗读/文字转语音」中添加日语", "ach");
  }
}

/* ---------- 看板娘互动 ---------- */
const MASCOT_IMG = "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt="
  + encodeURIComponent("pixel art cartoon anime chibi girl mascot, brown twin tails hair, navy sailor school uniform, holding a japanese textbook, cheerful waving, kawaii 16-bit game character, full body portrait, plain dark indigo background, clean chunky pixels, soft rim light, no text")
  + "&image_size=square_hd";

function mascotBar(line) {
  return `<div class="mascot-row"><img class="mascot-img" src="${MASCOT_IMG}" alt="看板娘">
    <div class="speech"><span class="m-name">看板娘 · こはる</span>${line}</div></div>`;
}
function hourGreet() {
  const hh = new Date().getHours(), g = window.MASCOT.greet;
  return pick(hh < 5 ? g.dawn : hh < 11 ? g.morning : hh < 18 ? g.noon : g.night);
}
function greetKey() { return "px_greet_" + Store.todayStr(); }
function cheerPop(txt, color) {
  const el = document.createElement("div");
  el.className = "cheer-pop";
  el.textContent = txt;
  el.style.color = color || "#ffd166";
  el.style.left = (25 + Math.random() * 45) + "%";
  el.style.top = "42%";
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}
function celebrate(lv) {
  const box = document.getElementById("modal-box");
  box.className = "modal-box pixel-panel celebrate";
  box.innerHTML = `<span class="big-emo">🎉</span>
    <div class="sec-title center" style="justify-content:center">LEVEL UP!</div>
    <p style="font-size:20px;color:var(--gold);line-height:1.8">${pick(window.MASCOT.levelUp(lv))}</p>
    <div class="center mt"><button class="pixel-btn primary" onclick="closeModal()">继续冒险 ▶</button></div>`;
  document.getElementById("modal").classList.remove("hidden");
  beep("win");
}
function closeModal() { document.getElementById("modal").classList.add("hidden"); }
document.getElementById("modal").onclick = e => { if (e.target.id === "modal") closeModal(); };

/* ---------- 训练会话引擎 ---------- */
let session = null;

function startSession(cfg) {
  warnVoice("ja-JP");
  session = Object.assign({ i: 0, correct: 0, combo: 0, bestCombo: 0, xp: 0, total: cfg.qs.length }, cfg);
  renderQuestion();
}

function renderQuestion() {
  const s = session;
  if (s.i >= s.total) return finishSession();
  const q = s.qs[s.i];
  const head = `
    <div class="learn-head">
      <span class="qidx">QUEST ${s.i + 1} / ${s.total}</span>
      <div class="bar blue" style="flex:1;max-width:320px"><i style="width:${s.i / s.total * 100}%"></i></div>
      <span class="badge gold">COMBO ×${s.combo}</span>
    </div>`;
  s.qStart = Date.now();                       // 智能评分：记录本题开始时间
  h(head + `<div id="qbody">${q.html}</div>`);
  q.mount && q.mount();
}

/* 智能评分：答题速度感知 SM-2（秒答=真会→EF加成间隔跃迁；犹豫=假会→放慢节奏） */
function speedGrade(g) {
  if (g < 2 || !session || !session.qStart) return g;
  const dt = (Date.now() - session.qStart) / 1000;
  if (dt < 8) return 3;          // 8秒内答对：真会 → EF 加成，复习间隔大幅延长
  if (dt <= 22) return 2;        // 正常节奏
  return 1;                      // 超过22秒：犹豫作答 → 按“困难”调度，早点再见面
}
function speedNote(ok) {
  if (!session || !session.qStart) return "";
  const dt = Math.round((Date.now() - session.qStart) / 1000);
  if (!ok) return `<br>⏱ 用时 ${dt}s`;
  if (dt < 8) return `<br><b style="color:var(--green)">⚡ ${dt}s 秒答！真会 → 记忆间隔大幅延长</b>`;
  if (dt > 22) return `<br><b style="color:var(--orange)">⏱ ${dt}s 犹豫作答 → 已放慢复习节奏，稍后会再见到它</b>`;
  return `<br>⏱ 用时 ${dt}s`;
}
function answer(ok, explainHtml) {
  const s = session, body = document.getElementById("qbody");
  if (s.locked) return;
  s.locked = true;
  if (ok) { s.correct++; s.combo++; s.bestCombo = Math.max(s.bestCombo, s.combo); s.xp += 10 + Math.min(s.combo - 1, 5) * 2; beep("ok"); }
  else {
    s.combo = 0; beep("bad");
    const m = s.qs[s.i] && s.qs[s.i].meta;
    if (m) Store.addWrong({ mod: m.mod, q: m.q, opts: m.opts, ans: m.ans, pass: m.pass || "",
      exp: (explainHtml || "").replace(/<[^>]+>/g, " ").trim().slice(0, 200) });
  }
  const line = ok
    ? (s.combo >= 3 ? pick(window.MASCOT.praiseCombo(s.combo)) : pick(window.MASCOT.praise))
    : pick(window.MASCOT.comfort);
  const emo = ok ? pick(["🎉", "⭐", "✨", "💪", "🌸"]) : pick(["🌱", "🩹", "📌", "🧩"]);
  const mc = `<div class="mascot-inline"><span class="mi-emo">${emo}</span><span>${line}</span></div>`;
  const ex = `<div class="explain">${(explainHtml || "")}${speedNote(ok)}</div>`;
  body.insertAdjacentHTML("beforeend", mc + ex + `<div class="center mt"><button class="pixel-btn primary" onclick="nextQ()">${s.i + 1 >= s.total ? "查看结果 ▶" : "下一题 ▶"}</button></div>`);
  cheerPop(ok ? "+" + (10 + Math.min(s.combo - 1, 5) * 2) + " XP" : "がんばれ！", ok ? "#ffd166" : "#7ee2a8");
  s.after && s.after(ok);
  saveStat(s, ok);
}

function saveStat(s, ok) {
  const st = Store.state.stats;
  const key = { word: "vocab", gram: "gram", listen: "listen", read: "read" }[s.kind];
  if (s.kind === "gram") { const pat = s.qs[s.i] && s.qs[s.i].meta && s.qs[s.i].meta.pat; if (pat) Store.gramMark(pat, ok); }
  if (!key) return;
  st[key + "Total"]++; if (ok) st[key + "Correct"]++;
  Store.save();
}

function nextQ() { session.locked = false; session.i++; renderQuestion(); }

function finishSession() {
  const s = session;
  const acc = s.total ? Math.round(s.correct / s.total * 100) : 0;   // 全部跳过时 total=0，防 NaN
  let bonus = 0, extra = "";
  if (acc === 100) { bonus = 30; Store.state.stats.perfect++; extra = `<div class="combo-pop">PERFECT +30</div>`; }
  if (s.kind === "speak") { Store.state.stats.speakCount++; Store.state.stats.speakBest = Math.max(Store.state.stats.speakBest, s.bestScore || 0); }
  if (s.kind === "unit") {
    const st = Store.state.units[s.unitNo] || (Store.state.units[s.unitNo] = { done: false, score: 0 });
    st.score = Math.max(st.score || 0, acc);
    if (acc >= 70) { if (!st.done) { st.done = true; extra += `<div class="combo-pop">UNIT CLEAR!</div>`; Store.log(`单元${s.unitNo} 通关（${acc}分）`); } }
  }
  const lv0 = levelOf(Store.state.xp);
  const totalXp = s.xp + bonus;
  Store.addXp(totalXp);
  Store.log(`${s.title}：${acc}分，+${totalXp}XP`);
  const taskMap = { word: "vocab", gram: "gram", listen: "listen", speak: "speak", read: "read" };
  if (taskMap[s.kind] && acc >= 60) Store.markTask(taskMap[s.kind]);
  const got = Store.checkAch();
  beep(acc >= 70 ? "win" : "bad");

  const grade = acc >= 90 ? "S" : acc >= 70 ? "A" : acc >= 50 ? "B" : "C";
  h(`
    <div class="q-panel result-box">
      ${mascotBar(pick(window.MASCOT.result(acc)))}
      <div class="sec-title">${s.title} · RESULT</div>
      ${extra}
      <div class="big">${grade}　${acc}分</div>
      <p class="dim">答对 ${s.correct} / ${s.total} · 最高连击 ×${s.bestCombo}</p>
      <p class="gain mt">+${totalXp} XP</p>
      ${got.map(a => `<p class="mt"><span class="badge gold">${a.ic} 成就解锁：${a.n}</span></p>`).join("")}
      <div class="center mt" style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
        <button class="pixel-btn blue" onclick="restartSession()">再来一次</button>
        ${s.next || `<button class="pixel-btn primary" onclick="location.hash='#/practice'">返回训练</button>`}
      </div>
    </div>`);
  renderUserBox();
  if (levelOf(Store.state.xp) > lv0) celebrate(levelOf(Store.state.xp));
}

function restartSession() { session && session.build ? session.build() : null; }

/* ---------- 真题构造器（往年真题 + 详细解析） ---------- */
function realQ(it) {
  const isListen = it.type === "listen" && it.t;
  const mod = { vocab: "单词·真题", gram: "语法·真题", read: "阅读·真题", listen: "听力·真题" }[it.type] || "真题";
  const stem = `<div class="q-panel">
    ${it.passage ? `<div class="passage">${it.passage}</div>` : ""}
    ${isListen ? `<div class="center mb"><button class="pixel-btn blue audio-btn" id="rp1">▶ 播放录音</button>
      <button class="pixel-btn ghost small" id="rp2">慢速重听</button></div>` : ""}
    ${it.type === "listen" && !it.t ? `<p class="dim center mb" style="font-size:12px">⚠ 该题暂无音频，以听力原文形式呈现（降级模式）</p>` : ""}
    <p class="dim center mb" style="color:var(--pink)">❓ ${it.q} <span class="badge gold">${it.src || "往年真题"}</span></p>`;
  return {
    meta: { mod, q: it.q, opts: it.opts, ans: it.opts[it.ans], pass: it.passage || "" },
    html: stem + it.opts.map((o, i) => `<button class="opt" data-i="${i}">${o}</button>`).join("") + `</div>`,
    mount() {
      if (isListen) {
        document.getElementById("rp1").onclick = () => speak(it.t, .95);
        document.getElementById("rp2").onclick = () => speak(it.t, .65);
        setTimeout(() => { if (document.getElementById("rp1")) speak(it.t, .95); }, 400);   // 已切走则不响
      }
      if (it.type === "vocab") {                    // 真题词题：匹配本地词库 → 挂反复播音条
        const V = window.VOCAB_N2 || [];
        const ansTxt = (it.opts || [])[it.ans] || "";
        const w = (ansTxt && V.find(v => v.r === ansTxt || v.m === ansTxt || v.w === ansTxt))   // 优先精确匹配正解（读音/词义/词形）
          || V.find(v => it.q && (it.q.includes("（" + v.w + "）") || it.q.includes("(" + v.w + ")")))   // 题干括号里的目标词
          || V.find(v => it.q && (it.q.includes("(" + v.r + ")") || it.q.includes("（" + v.r + "）")));   // 括号里是读音（不再做子串宽泛匹配，避免挂到无关词）
        attachPlayBar(w || null);
        if (!w) {
          const anchor = app.querySelector(".q-panel .passage") || app.querySelector(".q-panel p");
          if (anchor) anchor.insertAdjacentHTML("afterend",
            `<div class="center mt"><button class="pixel-btn small ghost" onclick="speak('${(it.q || "").replace(/<[^>]+>/g, "")}')">🔊 播放题干读音</button>
             <span class="dim" style="font-size:11px">（该词不在本地词库）</span></div>`);
        }
      }
      app.querySelectorAll(".opt").forEach(b => b.onclick = () => {
        const i = +b.dataset.i;
        app.querySelectorAll(".opt").forEach((x, j) => { x.disabled = true; if (j === it.ans) x.classList.add("correct"); else if (j === i) x.classList.add("wrong"); });
        answer(i === it.ans, `<b>📌 ${it.src || "往年真题"} · 详解</b><br>${it.exp}`);
        if (it.type === "listen" && i !== it.ans) requireErrTag();   // 听力答错必须标错因
      });
    }
  };
}
const REAL = t => [...(window.REALQ_N2 || []), ...(window.REALQ_N2_EXT || [])].filter(x => x.type === t);

/* ---------- 单词反复播音：罗马音 + 中文，点击一次连播5遍 ---------- */
function playBarHtml(word, rom) {
  return `<div class="center mt" style="display:flex;gap:8px;justify-content:center;align-items:center;flex-wrap:wrap">
      <button class="pixel-btn small ghost" onclick="speak('${word.r}')">🔊 日语读音</button>
      <button class="pixel-btn small purple" id="auLoop">🔁 日语连读 ×5</button>
      <span class="dim" style="font-size:12px">罗马音：${rom}</span>
    </div>`;
}
function attachPlayBar(word) {
  if (!word) return;
  const anchor = app.querySelector(".q-panel .flashcard") || app.querySelector(".q-panel .passage") || app.querySelector(".q-panel p");
  if (!anchor) return;
  const rom = kanaToRomaji(word.r);
  anchor.insertAdjacentHTML("afterend", playBarHtml(word, rom));
  const btn = document.getElementById("auLoop");
  if (btn) btn.onclick = () => repeatPlay5(word, btn, rom);
}
function kanaToRomaji(src) {
  const map = { あ:"a",い:"i",う:"u",え:"e",お:"o",か:"ka",き:"ki",く:"ku",け:"ke",こ:"ko",さ:"sa",し:"shi",す:"su",せ:"se",そ:"so",た:"ta",ち:"chi",つ:"tsu",て:"te",と:"to",な:"na",に:"ni",ぬ:"nu",ね:"ne",の:"no",は:"ha",ひ:"hi",ふ:"fu",へ:"he",ほ:"ho",ま:"ma",み:"mi",む:"mu",め:"me",も:"mo",や:"ya",ゆ:"yu",よ:"yo",ら:"ra",り:"ri",る:"ru",れ:"re",ろ:"ro",わ:"wa",を:"wo",ん:"n",
    が:"ga",ぎ:"gi",ぐ:"gu",げ:"ge",ご:"go",ざ:"za",じ:"ji",ず:"zu",ぜ:"ze",ぞ:"zo",だ:"da",ぢ:"ji",づ:"zu",で:"de",ど:"do",ば:"ba",び:"bi",ぶ:"bu",べ:"be",ぼ:"bo",ぱ:"pa",ぴ:"pi",ぷ:"pu",ぺ:"pe",ぽ:"po",
    きゃ:"kya",きゅ:"kyu",きょ:"kyo",しゃ:"sha",しゅ:"shu",しょ:"sho",ちゃ:"cha",ちゅ:"chu",ちょ:"cho",にゃ:"nya",にゅ:"nyu",にょ:"nyo",ひゃ:"hya",ひゅ:"hyu",ひょ:"hyo",みゃ:"mya",みゅ:"myu",みょ:"myo",りゃ:"rya",りゅ:"ryu",りょ:"ryo",ぎゃ:"gya",ぎゅ:"gyu",ぎょ:"gyo",じゃ:"ja",じゅ:"ju",じょ:"jo",びゃ:"bya",びゅ:"byu",びょ:"byo",ぴゃ:"pya",ぴゅ:"pyu",ぴょ:"pyo",ふぃ:"fi",てぃ:"ti",でぃ:"di",しぇ:"she",ちぇ:"che",つぁ:"tsa",つぃ:"tsi",つぇ:"tse",つぉ:"tso",うぃ:"wi",うぇ:"we",ゔぁ:"va",ゔぃ:"vi",ゔぇ:"ve",ゔぉ:"vo" };
  const s = String(src || "").replace(/[\u30A1-\u30F6]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60)); // 片→平
  let out = "", i = 0;
  while (i < s.length) {
    const two = s.substr(i, 2), one = s[i];
    if (map[two]) { out += map[two]; i += 2; continue; }
    if (map[one]) { out += map[one]; i += 1; continue; }
    if (one === "っ") { const r = map[s[i + 1]] || ""; out += r[0] || ""; i += 1; continue; }   // 促音→双写辅音
    if (one === "ー") { out += out.slice(-1); i += 1; continue; }                              // 长音→重复
    if (/[0-9A-Za-z\-· ]/.test(one)) { out += one; i += 1; continue; }
    i += 1;                                          // 拗音残余符号等跳过
  }
  return out;
}
let loopActive = false;
function repeatPlay5(word, btn, rom) {
  const ORIG = btn.innerHTML;
  if (loopActive) {                                  // 再点停止
    loopActive = false;
    speechSynthesis.cancel();
    if (_kae) { clearInterval(_kae); _kae = null; }
    btn.innerHTML = ORIG;
    return;
  }
  if (!("speechSynthesis" in window)) return;
  refreshVoices();
  speechSynthesis.cancel();
  loopActive = true;
  // 事件驱动逐条续播：第1条在点击手势链内激活语音会话，后续条在 onend 回调里续播
  // （兼容 iOS：多 utterance 一次性入队会被「只播第一条」bug 截断，setTimeout 续播会被手势链拦截）
  const seq = [];
  const jpText = word.w || word.r;                  // 读日语原词（TTS 对汉字词发音正确）
  for (let i = 0; i < 5; i++) { seq.push([jpText, "ja-JP", .9]); }   // 日语连读5遍
  let idx = 0;
  const step = () => {
    if (!loopActive) return;
    if (idx >= seq.length) {
      loopActive = false; btn.innerHTML = ORIG;
      if (_kae) { clearInterval(_kae); _kae = null; }
      return;
    }
    const [text, lang, rate] = seq[idx];
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang; u.rate = rate;
    const v = pickV(lang);
    if (v) u.voice = v;
    let fired = false;
    const next = () => {
      if (fired) return; fired = true;
      idx++;
      btn.innerHTML = `🔁 播放中 ${Math.min(5, idx)}/5 遍 …（点我停止）`;
      step();
    };
    u.onend = next; u.onerror = next;
    speechSynthesis.speak(u);
    try { speechSynthesis.resume(); } catch (e) {}   // iOS：防止 speak 后立即 paused
  };
  btn.innerHTML = `🔁 播放中 1/5 遍 …（点我停止）`;
  step();
  keepAlive();
}

/* 选项去重：词库存在同义词/同读音孪生条目（如 伯母さん/叔母さん、商店/ショップ），
   若同时被抽中会出现两个完全相同的选项、点哪个都可能被判错 */
function uniqOpts(o) {
  const seen = new Set(o.filter(x => x.ok).map(x => x.t));   // 正解文本先占位
  const out = [];
  for (const x of o) {
    if (x.ok) { out.push(x); continue; }
    if (seen.has(x.t)) continue;                              // 与正解重复或其他重复的干扰项丢弃
    seen.add(x.t); out.push(x);
  }
  return out;
}

/* ---------- 单词题目构造 ---------- */
function vocabQuestion(word) {
  const list = VOCAB(); if (list.length < 4) return null;
  // k：假名→词义（主练短板：见假名识义，不显示汉字）
  const mode = pick(["k", "k", "m", "r", "w"]);
  const others = () => shuffle(list.filter(v => v.w !== word.w)).slice(0, 3);
  let stem, opts, ans, exp;
  if (mode === "k") {
    stem = `<div class="flashcard" onclick="speak('${word.r}')"><span class="word" style="font-size:44px">${word.r}</span><span class="hint">💡 假名认义 · 点卡片听发音 · 想不出汉字没关系，先认意思</span></div>`;
    const o = shuffle([{ t: word.m, ok: 1 }, ...others().map(v => ({ t: v.m, ok: 0 }))]);
    opts = o; ans = o.findIndex(x => x.ok);
    exp = `假名 <span class="jp">${word.r}</span> → <span class="jp">${word.w}</span> = ${word.m}`;
  } else if (mode === "m") {
    stem = `<div class="flashcard" onclick="speak('${word.w}')"><span class="word">${word.w}</span><span class="kana">${word.r}</span><span class="hint">💡 点击卡片听发音 · 选出正确释义</span></div>`;
    const o = shuffle([{ t: word.m, ok: 1 }, ...others().map(v => ({ t: v.m, ok: 0 }))]);
    opts = o; ans = o.findIndex(x => x.ok); exp = `<span class="jp">${word.w}（${word.r}）</span> = ${word.m}`;
  } else if (mode === "r") {
    stem = `<div class="flashcard"><span class="word">${word.w}</span><span class="hint">选出正确的假名读音</span></div>`;
    const o = shuffle([{ t: word.r, ok: 1 }, ...others().map(v => ({ t: v.r, ok: 0 }))]);
    opts = o; ans = o.findIndex(x => x.ok); exp = `<span class="jp">${word.w}</span> 的读音是 <span class="jp">${word.r}</span>`;
  } else {
    stem = `<div class="flashcard"><span class="word" style="font-size:34px">${word.m}</span><span class="hint">选出对应的日语单词</span></div>`;
    const o = shuffle([{ t: word.w, ok: 1 }, ...others().map(v => ({ t: v.w, ok: 0 }))]);
    opts = o; ans = o.findIndex(x => x.ok); exp = `<span class="jp">${word.m}</span> → <span class="jp">${word.w}（${word.r}）</span>`;
  }
  opts = uniqOpts(opts); ans = opts.findIndex(x => x.ok);            // 去重后重算正确索引
  // 详细解析：答案说明 + 词性 + 分类型助记（无原解析时自制的详细版）
  const hasKanji = /[一-龥]/.test(word.w);
  const isKatakana = /^[ァ-ヶーー]+$/.test(word.w.replace(/[（(].*$/, ""));
  const tip = hasKanji ? `汉字词：先看字面义对应中文，再锁读音「${word.r}」（音读为主）`
    : isKatakana ? `外来语：假名「${word.r}」常与中文/英文谐音挂钩，出声读三遍`
    : `和语词：没有汉字提示，靠假名「${word.r}」的发音画面感硬记，大声朗读加深印象`;
  exp += `<br><b>词性</b>：${word.t || "—"} · <b>助记</b>：${tip}<br><b>自查</b>：遮住答案先说出意思，说得出才算会（主动回想 &gt; 反复重看）`;
  const meta = { mod: "单词", q: mode === "w" ? word.m : `${word.w}（${word.r}）`,
    opts: opts.map(x => x.t), ans: opts[ans].t };
  return {
    html: stem + opts.map((o, i) => `<button class="opt" data-i="${i}">${o.t}</button>`).join(""),
    meta,
    mount() {
      attachPlayBar(word);                        // 反复播音条（罗马音+中文×5）
      app.querySelectorAll(".opt").forEach(b => b.onclick = () => {
        const i = +b.dataset.i;
        app.querySelectorAll(".opt").forEach((x, j) => {
          x.disabled = true;
          if (opts[j].ok) x.classList.add("correct"); else if (j === i) x.classList.add("wrong");
        });
        const w = word;
        if (i === ans) Store.srsGrade(w.w, speedGrade(2));            // 答对=良好 → SM-2 间隔扩张
        else Store.srsGrade(w.w, 0);                      // 答错=重来 → 5分钟后回炉
        answer(i === ans, exp);
      });
    }
  };
}

function buildVocabSession(unitNo) {
  const list = VOCAB();
  if (list.length < 8) return toast("词汇数据加载中，请稍候…");
  let pool = list;
  if (unitNo) pool = unitWords(unitNo);
  const weak = pool.filter(w => (Store.state.words[w.w] || 0) < 2);
  const qs = [];
  const realN = unitNo ? 0 : Math.min(10, REAL("vocab").length);   // 真题优先直到用尽（不足才回退自编）
  if (realN) {
    const rv = freshShuffle(REAL("vocab"), it => it.q, "word").slice(0, realN);
    rv.forEach(it => qs.push(realQ(it)));
    saveRecent("word", rv.map(it => it.q));
  }
  const n = Math.min(10 - realN, pool.length);
  const chosen = shuffle(weak).slice(0, n);
  while (chosen.length < n) { const w = pick(pool); if (!chosen.includes(w)) chosen.push(w); }
  chosen.forEach(w => { const q = vocabQuestion(w); if (q) qs.push(q); });
  startSession({ qs, kind: "word", title: "单词记忆", build: () => buildVocabSession(unitNo) });
}

function unitWords(no) {
  const list = VOCAB(), u = window.UNITS_N2.find(x => x.no === no);
  const per = Math.ceil(list.length / 8);
  const idx = (no - 1) * per;
  const slice = list.slice(idx, idx + per);
  if (u && u.wRatio) return slice;
  return slice;
}

/* ---------- 语法题目构造 ---------- */
function gramQuestion(g) {
  const gs = window.GRAMMAR_N2;
  const mode = pick(["mean", "fill"]);
  if (mode === "mean" || gs.length < 4) {
    const o = uniqOpts(shuffle([{ t: g.m, ok: 1 }, ...shuffle(gs.filter(x => x.p !== g.p)).slice(0, 3).map(x => ({ t: x.m, ok: 0 }))]));
    const ans = o.findIndex(x => x.ok);
    return {
      html: `<div class="q-panel"><p class="dim center mb">句型的含义是？</p>
        <p class="sentence"><span class="blank">${g.p}</span></p>
        ${o.map((x, i) => `<button class="opt" data-i="${i}">${x.t}</button>`).join("")}</div>`,
      meta: { mod: "语法", q: g.p, pat: g.p, opts: o.map(x => x.t), ans: o[ans].t },
      mount() {
        app.querySelectorAll(".opt").forEach(b => b.onclick = () => {
          const i = +b.dataset.i;
          app.querySelectorAll(".opt").forEach((x, j) => { x.disabled = true; if (o[j].ok) x.classList.add("correct"); else if (j === i) x.classList.add("wrong"); });
          const wrongs = o.filter(x => !x.ok).map(x => "「" + x.t + "」").join("、");
          answer(i === ans, `<span class="jp">${g.e}</span><br>${g.z}<br>句型：<b>${g.p}</b> = ${g.m}${g.c ? `<br><b>接续</b>：${g.c}` : ""}<br><b>逐项排除</b>：其他选项是别的句型的含义——${wrongs}<br><b>记忆点</b>：把「${g.p}」和这句例句绑定背，考场上认例句比认定义快。`);
        });
      }
    };
  }
  // 填空题：挖掉例句中的句型部分
  const target = g.p.replace(/[～（）()]/g, m => m === "～" ? "" : "");
  const key = g.p.replace(/~/g, "").replace(/[（）()]/g, "");
  let sentence = g.e;
  const bare = key.replace(/[～]/g, "");
  if (sentence.includes(bare)) sentence = sentence.replace(bare, "\u0001");
  else return meanQ(g, gs);
  if (!sentence.includes("\u0001")) return meanQ(g, gs);
  const o = uniqOpts(shuffle([{ t: g.p, ok: 1 }, ...shuffle(gs.filter(x => x.p !== g.p)).slice(0, 3).map(x => ({ t: x.p, ok: 0 }))]));
  const ans = o.findIndex(x => x.ok);
  const shown = sentence.replace("\u0001", `<span class="blank">  </span>`);
  return {
    html: `<div class="q-panel"><p class="dim center mb">选出填入空格的正确句型</p>
      <p class="sentence">${shown}</p>
      ${o.map((x, i) => `<button class="opt" data-i="${i}">${x.t}</button>`).join("")}</div>`,
    meta: { mod: "语法", q: sentence.replace("\u0001", "＿＿"), pat: g.p, opts: o.map(x => x.t), ans: o[ans].t },
    mount() {
      app.querySelectorAll(".opt").forEach(b => b.onclick = () => {
        const i = +b.dataset.i;
        app.querySelectorAll(".opt").forEach((x, j) => { x.disabled = true; if (o[j].ok) x.classList.add("correct"); else if (j === i) x.classList.add("wrong"); });
        answer(i === ans, `<span class="jp">${g.e}</span><br>${g.z}<br><b>${g.p}</b> = ${g.m}${g.c ? `<br><b>接续</b>：${g.c}` : ""}<br><b>逐项排除</b>：错误选项分别是 ${o.filter(x => !x.ok).map(x => "「" + x.t + "」").join("、")}——它们是别的句型，代进空格意思不通。`);
      });
    }
  };
}
function meanQ(g, gs) {
  const o = uniqOpts(shuffle([{ t: g.m, ok: 1 }, ...shuffle(gs.filter(x => x.p !== g.p)).slice(0, 3).map(x => ({ t: x.m, ok: 0 }))]));
  const ans = o.findIndex(x => x.ok);
  return {
    html: `<div class="q-panel"><p class="dim center mb">句型含义</p><p class="sentence"><span class="blank">${g.p}</span></p>
      ${o.map((x, i) => `<button class="opt" data-i="${i}">${x.t}</button>`).join("")}</div>`,
    meta: { mod: "语法", q: g.p, pat: g.p, opts: o.map(x => x.t), ans: o[ans].t },
    mount() {
      app.querySelectorAll(".opt").forEach(b => b.onclick = () => {
        const i = +b.dataset.i;
        app.querySelectorAll(".opt").forEach((x, j) => { x.disabled = true; if (o[j].ok) x.classList.add("correct"); else if (j === i) x.classList.add("wrong"); });
        answer(i === ans, `<span class="jp">${g.e}</span><br>${g.z}<br><b>${g.p}</b> = ${g.m}${g.c ? `<br><b>接续</b>：${g.c}` : ""}<br><b>逐项排除</b>：错误选项分别是 ${o.filter(x => !x.ok).map(x => "「" + x.t + "」").join("、")} 对应的句型——注意句型与例句的绑定关系。`);
      });
    }
  };
}

function buildGramSession(unitNo) {
  const gs = window.GRAMMAR_N2;
  let pool = gs;
  if (unitNo) {
    const u = window.UNITS_N2.find(x => x.no === unitNo);
    if (u && u.grammar.length) pool = u.grammar.map(i => gs[i]).filter(Boolean);
  }
  const realN = unitNo ? 0 : Math.min(8, REAL("gram").length);    // 真题优先直到用尽
  const rg = freshShuffle(REAL("gram"), it => it.q, "gram").slice(0, realN);
  const selfG = freshShuffle(pool, g => g.p, "gram").slice(0, Math.min(8 - realN, pool.length));
  saveRecent("gram", [...rg.map(it => it.q), ...selfG.map(g => g.p)]);
  const qs = [...rg.map(realQ), ...selfG.map(g => gramQuestion(g)).filter(Boolean)];
  startSession({ qs, kind: "gram", title: "语法练习", build: () => buildGramSession(unitNo) });
}

/* ---------- 听力题目构造 ---------- */
function listenQuestion(item) {
  return {
    meta: { mod: "听力", q: item.q, opts: item.o, ans: item.o[item.a] },
    html: `<div class="q-panel">
      <p class="dim center mb">🎧 听录音，选择正确答案</p>
      <div class="center mb"><button class="pixel-btn blue audio-btn" id="play1">▶ 播放录音</button>
      <button class="pixel-btn ghost small" id="play2">慢速重听</button></div>
      <p class="dim center mb" style="font-size:13px">🗣 ${item.q}</p>
      ${item.o.map((t, i) => `<button class="opt" data-i="${i}">${t}</button>`).join("")}
    </div>`,
    mount() {
      document.getElementById("play1").onclick = () => speak(item.t, .95);
      document.getElementById("play2").onclick = () => speak(item.t, .65);
      setTimeout(() => { if (document.getElementById("play1")) speak(item.t, .95); }, 350);   // 已切走则不响
      app.querySelectorAll(".opt").forEach(b => b.onclick = () => {
        const i = +b.dataset.i;
        app.querySelectorAll(".opt").forEach((x, j) => { x.disabled = true; if (j === item.a) x.classList.add("correct"); else if (j === i) x.classList.add("wrong"); });
        answer(i === item.a, `<span class="jp">${item.t}</span>`);
        if (i !== item.a) requireErrTag();          // 答错必须标错因（四类错因补救方式完全不同）
      });
    }
  };
}

/* 答错 → 必须先标记错因才能继续（听力短板定位） */
function requireErrTag() {
  const body = document.getElementById("qbody");
  const nextBtn = body && body.querySelector('button[onclick="nextQ()"]');
  if (!nextBtn) return;
  const tags = ["词汇不懂", "语速太快", "没反应过来", "走神"];
  if (!nextBtn.dataset.next) nextBtn.dataset.next = nextBtn.textContent;   // 保留原文案（末题为「查看结果」）
  nextBtn.disabled = true; nextBtn.textContent = "请先标记错因 ↓ 再继续";
  const ex = body.querySelector(".explain");
  ex.insertAdjacentHTML("beforeend",
    `<div class="err-tags">${tags.map(t => `<span class="err-tag" data-t="${t}">${t}</span>`).join("")}</div>`);
  let recorded = false;                       // 只记一次，改选不重复计数
  body.querySelectorAll(".err-tag").forEach(el => el.onclick = () => {
    body.querySelectorAll(".err-tag").forEach(x => x.classList.remove("on"));
    el.classList.add("on");
    if (!recorded) { Store.recordErr(el.dataset.t); recorded = true; }
    nextBtn.disabled = false; nextBtn.textContent = nextBtn.dataset.next || "下一题 ▶";
  });
}
function buildListenSession(unitNo) {
  const kf = it => it.q + "|" + (it.t || "").slice(0, 16);
  if (unitNo) {
    const u = window.UNITS_N2.find(x => x.no === unitNo);
    const pool = freshShuffle(window.LISTEN_N2, kf, "listen").slice(0, u && u.listen ? u.listen : 8);
    saveRecent("listen", pool.map(kf));
    const qs = pool.map(listenQuestion);
    startSession({ qs, kind: "listen", title: "听力训练", build: () => buildListenSession(unitNo) });
    return;
  }
  const realN = Math.min(8, REAL("listen").length);                 // 真题优先直到用尽
  const rl = freshShuffle(REAL("listen"), kf, "listen").slice(0, realN);
  const sl = freshShuffle(window.LISTEN_N2, kf, "listen").slice(0, 8 - realN);
  saveRecent("listen", [...rl, ...sl].map(kf));
  const qs = [...rl.map(realQ), ...sl.map(listenQuestion)];
  startSession({ qs, kind: "listen", title: "听力训练", build: () => buildListenSession() });
}

/* ---------- 口语跟读 ---------- */
function similarity(a, b) {
  const norm = s => s.replace(/[\s、。．，,.!！?？]/g, "").toLowerCase();
  a = norm(a); b = norm(b);
  if (!a || !b) return 0;
  let m = 0;
  const bg = s => { const r = []; for (let i = 0; i < s.length - 1; i++) r.push(s.slice(i, i + 2)); return r.length ? r : [s]; };
  const A = bg(a), B = bg(b);
  const used = new Set();
  A.forEach(x => { const j = B.findIndex((y, i) => y === x && !used.has(i)); if (j >= 0) { used.add(j); m++; } });
  return Math.round(2 * m / (A.length + B.length) * 100);
}

function speakPage() {
  const items = shuffle(SPEAK_N2).slice(0, 6);
  let idx = 0, scores = [];
  function render() {
    const it = items[idx];
    h(`
      <div class="learn-head"><span class="qidx">SPEAK ${idx + 1} / ${items.length}</span>
        <span class="badge gold">平均 ${scores.length ? Math.round(scores.reduce((a, b) => a + b) / scores.length) : "--"} 分</span></div>
      <div class="q-panel">
        <p class="dim center mb">🎤 跟读下面的句子，点击录音后朗读</p>
        <p class="speak-target">${it.j}</p>
        <p class="center dim mt" style="font-size:15px">${it.z}</p>
        <div class="center mt" style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
          <button class="pixel-btn blue" id="btnDemo">▶ 示范发音</button>
          <button class="pixel-btn red" id="btnRec">● 开始跟读</button>
          <button class="pixel-btn ghost" id="btnSkip">跳过</button>
        </div>
        <div class="rec-state" id="recState"></div>
        <div class="sim-score hidden" id="simScore"></div>
        <div id="recAction" class="center mt hidden">
          <button class="pixel-btn primary" id="btnNext">${idx + 1 >= items.length ? "查看结果 ▶" : "下一句 ▶"}</button>
        </div>
      </div>`);
    document.getElementById("btnDemo").onclick = () => speak(it.j, .85);
    document.getElementById("btnSkip").onclick = () => { idx++; idx >= items.length ? done() : render(); };
    document.getElementById("btnNext").onclick = () => { idx++; idx >= items.length ? done() : render(); };
    document.getElementById("btnRec").onclick = rec;
    setTimeout(() => speak(it.j, .85), 300);

    function rec() {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      const st = document.getElementById("recState");
      if (!SR) { st.innerHTML = "⚠ 浏览器不支持语音识别，进行自我评分："; manual(); return; }
      const r = new SR(); r.lang = "ja-JP"; r.interimResults = false; r.maxAlternatives = 3;
      st.innerHTML = `<span class="rec-dot"></span>录音中…请朗读上面的句子`;
      document.getElementById("btnRec").disabled = true;
      r.onresult = e => {
        const alts = [...e.results[0]].map(a => a.transcript);
        const best = Math.max(...alts.map(t => similarity(t, it.j)));
        show(Math.max(best, Math.max(...alts.map(t => similarity(t, it.j.replace(/、|。/g, ""))))), alts[0]);
      };
      r.onerror = e => { st.textContent = "⚠ 没有听清（" + e.error + "），请自我评分："; manual(); };
      r.onend = () => { document.getElementById("btnRec").disabled = false; };
      try { r.start(); } catch (e) { manual(); }
    }
    function manual() {
      const st = document.getElementById("recState");
      st.innerHTML = `自我评分：<button class="pixel-btn small primary" data-s="90">很流利</button>
        <button class="pixel-btn small blue" data-s="70">一般</button>
        <button class="pixel-btn small ghost" data-s="50">需练习</button>`;
      st.querySelectorAll("[data-s]").forEach(b => b.onclick = () => show(+b.dataset.s, ""));
    }
    function show(score, heard) {
      scores.push(score);
      beep(score >= 70 ? "ok" : "bad");
      document.getElementById("simScore").classList.remove("hidden");
      document.getElementById("simScore").innerHTML = `${score} 分${heard ? `<div class="dim" style="font-size:13px;margin-top:8px">识别：${heard}</div>` : ""}`;
      document.getElementById("recState").textContent = score >= 80 ? "素晴らしい！发音很棒" : score >= 60 ? "不错，继续保持" : "再听一遍示范，注意节奏";
      document.getElementById("recAction").classList.remove("hidden");
    }
  }
  function done() {
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) || 0;
    session = { qs: [], total: scores.length, correct: scores.filter(s => s >= 60).length, bestCombo: 0, bestScore: avg, xp: scores.reduce((a, b) => a + (b >= 60 ? 8 : 0), 0), kind: "speak", title: "口语跟读", build: speakPage };
    finishSession();
  }
  render();
}

/* ---------- 即時応答专项（真题速答，不设倒计时） ---------- */
function buildSpeedSession() {
  const all = (window.REALQ_N2 || []).concat(window.REALQ_N2_EXT || []).filter(x => x.type === "listen");
  let pool = all.filter(x => (x.src || "").includes("即時応答"));
  if (pool.length < 5) pool = all;
  if (!pool.length) return toast("速答题库准备中");
  const sp = freshShuffle(pool, it => it.q, "listen").slice(0, Math.min(10, pool.length));
  saveRecent("listen", sp.map(it => it.q));
  const qs = sp.map(realQ);
  startSession({ qs, kind: "listen", title: "⚡ 即時応答速训",
    build: buildSpeedSession,
    next: `<button class="pixel-btn primary" onclick="location.hash='#/practice'">返回训练</button>` });
}

/* ---------- 汉字读音专项（音读/训读 → 假名） ---------- */
function buildKanjiSession() {
  const list = VOCAB().filter(w => /[一-龥]/.test(w.w) && w.w !== w.r);
  if (list.length < 8) return toast("词汇数据加载中");
  const qs = shuffle(list).slice(0, 10).map(word => {
    const o = uniqOpts(shuffle([{ t: word.r, ok: 1 }, ...shuffle(list.filter(v => v.w !== word.w)).slice(0, 3).map(v => ({ t: v.r, ok: 0 }))]));
    const ans = o.findIndex(x => x.ok);
    return {
      meta: { mod: "单词", q: `${word.w} 的读音`, opts: o.map(x => x.t), ans: o[ans].t },
      html: `<div class="q-panel"><p class="dim center mb">📖 汉字读音 · 音读训读の訓練 <span class="badge">自编题</span></p>
        <div class="flashcard" onclick="speak('${word.r}')"><span class="word">${word.w}</span>
        <span class="hint">💡 点卡片听正确读音 · 想音读规律（声旁相近读音相近）</span></div>
        ${o.map((x, i) => `<button class="opt" data-i="${i}">${x.t}</button>`).join("")}</div>`,
      mount() {
        app.querySelectorAll(".opt").forEach(b => b.onclick = () => {
          const i = +b.dataset.i;
          app.querySelectorAll(".opt").forEach((x, j) => { x.disabled = true; if (j === ans) x.classList.add("correct"); else if (j === i) x.classList.add("wrong"); });
          if (i === ans) Store.srsGrade(word.w, speedGrade(2)); else Store.srsGrade(word.w, 0);
          const on = /[一-龥]/.test(word.w);
          answer(i === ans, `<span class="jp">${word.w}</span> → <span class="jp">${word.r}</span> ＝ ${word.m}<br><b>读音提示</b>：${on ? "音读为主——记住声旁规律（如「青」=せい，清/情/精同音）" : ""}反复出声读3遍，把字形和读音绑在一起。`);
        });
      }
    };
  });
  startSession({ qs, kind: "word", title: "汉字读音专项", build: buildKanjiSession,
    next: `<button class="pixel-btn primary" onclick="location.hash='#/practice'">返回训练</button>` });
}

/* ---------- 听力组句：听句 → 按顺序点击词块 → 5秒三选一句意 ---------- */
function jpChunks(str) {
  const clean = String(str).replace(/[、。！？!?…「」『』（）()\s]/g, "");
  const P = ["について", "に対して", "によって", "から", "まで", "より", "だけ", "しか", "ほど", "ぐらい", "など", "って", "という", "ながら", "が", "は", "を", "に", "で", "と", "も", "へ", "や", "の"].sort((a, b) => b.length - a.length);
  const chunks = [];
  let buf = "";
  for (let i = 0; i < clean.length; i++) {
    buf += clean[i];
    const nx = clean[i + 1];
    for (const p of P) {
      if (buf.length > p.length && buf.endsWith(p)) {
        const head = buf.slice(0, -p.length);
        const nxOk = !nx || !/[ぁ-んァ-ヶー]/.test(nx) || P.some(pp => clean.startsWith(pp, i + 1));
        const smallKanaHead = head.length === 1 && /[ぁ-ん]/.test(head);   // 「あ・こ・そ」单假名词头
        if (head && nxOk && !(smallKanaHead && p === "の")) { chunks.push(head); chunks.push(p); buf = ""; }  // 连体词「あの」不切
        break;
      }
    }
  }
  if (buf) chunks.push(buf);
  return chunks.length >= 3 ? chunks : [clean];
}
function arrangeQuestion(item) {
  const chunks = jpChunks(item.s);
  const pool = shuffle(chunks.map((c, i) => ({ c, id: i, used: false })));
  const opts = shuffle([{ t: item.z, ok: 1 }, { t: item.d1, ok: 0 }, { t: item.d2, ok: 0 }]);
  const ansIdx = opts.findIndex(o => o.ok);
  let picked = [], timerIv = null, phase2 = false;
  return {
    meta: { mod: "听力", q: item.s, opts: opts.map(o => o.t), ans: item.z },
    html: `<div class="q-panel">
      <p class="dim center mb">🧩 听力组句 · 先听一遍，按听到的顺序点击词块组成句子</p>
      <div class="center mb" style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
        <button class="pixel-btn blue" id="apPlay">▶ 播放句子</button>
        <button class="pixel-btn ghost small" id="apSlow">慢速重听</button>
      </div>
      <div id="apMine" style="min-height:60px;border:3px dashed rgba(255,209,102,.6);border-radius:12px;padding:10px;display:flex;flex-wrap:wrap;gap:8px;justify-content:center;align-items:center;background:rgba(255,209,102,.06)">
        <span class="dim" id="apHint" style="font-size:13px">👇 点下方词块，按顺序拼出这句话</span></div>
      <div id="apPool" style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:14px"></div>
      <div class="center mt"><button class="pixel-btn primary" id="apDone" disabled>✓ 完成组句 → 听句选意</button></div>
      <div id="apP2" class="hidden mt">
        <div class="center" style="font-family:var(--font-pixel);font-size:20px;color:var(--gold)">
          ⏱ <span id="apT">5</span> <span style="font-size:13px;color:var(--dim)">秒 · 选句意（三选一）</span></div>
        <div style="display:flex;flex-direction:column;gap:10px;margin-top:10px">
          ${opts.map((o, i) => `<button class="opt apMean" data-i="${i}">${o.t}</button>`).join("")}
        </div>
      </div></div>`,
    mount() {
      const poolEl = document.getElementById("apPool"),
        mineEl = document.getElementById("apMine"),
        hintEl = document.getElementById("apHint"),
        doneBtn = document.getElementById("apDone"),
        p2 = document.getElementById("apP2");
      const draw = () => {
        poolEl.innerHTML = pool.filter(x => !x.used).map(x =>
          `<button class="pixel-btn small blue apP" data-id="${x.id}" style="font-size:16px">${x.c}</button>`).join("") ||
          `<span class="dim" style="font-size:12px">（词块已全部选用，点上面的句子可取回）</span>`;
        mineEl.querySelectorAll(".apM").forEach(e => e.remove());
        if (picked.length && hintEl) hintEl.style.display = "none";
        if (!picked.length && hintEl) hintEl.style.display = "";
        picked.forEach(id => mineEl.insertAdjacentHTML("beforeend",
          `<button class="pixel-btn small purple apM" data-id="${id}" style="font-size:16px">${chunks[id]}</button>`));
        doneBtn.disabled = picked.length !== chunks.length;
        poolEl.querySelectorAll(".apP").forEach(b => b.onclick = () => {
          if (phase2) return;
          picked.push(+b.dataset.id); pool.find(x => x.id === +b.dataset.id).used = true; draw();
        });
        mineEl.querySelectorAll(".apM").forEach(b => b.onclick = () => {
          if (phase2) return;
          const k = picked.indexOf(+b.dataset.id);
          if (k >= 0) { picked.splice(k, 1); pool.find(x => x.id === +b.dataset.id).used = false; draw(); }
        });
      };
      draw();
      const play = rate => {
        if (!("speechSynthesis" in window)) { toast("🚫 此浏览器不支持语音合成（vivo等已裁剪）——请用 Chrome 打开本页", "ach"); return; }
        const u = new SpeechSynthesisUtterance(item.s);
        u.lang = "ja-JP"; u.rate = rate || 0.95;
        speechSynthesis.cancel(); speechSynthesis.speak(u);
      };
      document.getElementById("apPlay").onclick = () => play(0.95);
      document.getElementById("apSlow").onclick = () => play(0.6);
      setTimeout(() => { if (document.getElementById("apPlay")) play(0.95); }, 350);   // 自动播放一遍（已切走则不响）
      doneBtn.onclick = () => {
        phase2 = true;
        document.getElementById("apPool").style.opacity = ".45";
        p2.classList.remove("hidden");
        p2.querySelectorAll(".apMean").forEach(b => b.disabled = true);   // 听完才可选
        // 播放完句子后，才启动 5 秒选意（started 防 onend/onerror 双触发导致双倍速计时）
        let u = null;
        try { if ("speechSynthesis" in window) { u = new SpeechSynthesisUtterance(item.s); u.lang = "ja-JP"; u.rate = 0.95; } } catch (e) {}   // 无语音合成不抛异常
        let started = false;
        const start5 = () => {
          if (started || !p2.isConnected || timerDone) return;
          started = true;
          p2.querySelectorAll(".apMean").forEach(b => b.disabled = false);
          let left = 5;
          const tEl = document.getElementById("apT");
          if (tEl) { tEl.textContent = left; tEl.style.color = ""; }
          timerIv = setInterval(() => {
            if (!p2.isConnected || timerDone) { clearInterval(timerIv); return; }
            left--;
            if (tEl) { tEl.textContent = Math.max(0, left); if (left <= 2) tEl.style.color = "var(--red)"; }
            if (left <= 0) { clearInterval(timerIv); judge(-1); }         // 超时判错
          }, 1000);
        };
        try { if (u) { speechSynthesis.cancel(); speechSynthesis.speak(u); u.onend = start5; u.onerror = start5; } } catch (e) {}
        setTimeout(start5, 6000);                              // 兜底：语音事件丢失/无语音合成时最多等6秒
      };
      let timerDone = false;
      const judge = idx => {
        if (timerDone) return;
        timerDone = true;
        if (timerIv) clearInterval(timerIv);
        const mineStr = picked.map(id => chunks[id]).join("");
        const orderOk = mineStr === chunks.join("") && picked.length === chunks.length;
        const meanOk = idx === ansIdx;
        p2.querySelectorAll(".apMean").forEach((b, j) => {
          b.disabled = true;
          if (j === ansIdx) b.classList.add("correct"); else if (j === idx) b.classList.add("wrong");
        });
        const exp = `<b>① 正确句</b>：${item.s}<br><b>② 句意</b>：${item.z}
          <br><b>③ 组句</b>：${orderOk ? "✔ 顺序正确——助词贴前、动词结句的节奏抓住了！" : `你的顺序「${mineStr || "（未拼完）"}」 → 正确顺序「${chunks.join("｜")}」`}
          <br><b>④ 句意选择</b>：${meanOk ? "✔ 正确" : idx === -1 ? "⏰ 超时未选——反应还要再快一点，重听抓关键词" : `✘ 选了「${opts[idx] ? opts[idx].t : "?"}」，另外两个是别的句子的翻译`}
          <br><span class="dim" style="font-size:12px">来源：${item.src}</span>`;
        answer(orderOk && meanOk, exp);
      };
      p2.querySelectorAll(".apMean").forEach(b => b.onclick = () => judge(+b.dataset.i));
    }
  };
}
function buildArrangeSession() {
  const list = window.ARRANGE_N2 || [];
  if (list.length < 6) return toast("组句题库加载中…");
  const arr = freshShuffle(list, x => x.s, "arrange");
  saveRecent("arrange", arr.slice(0, 6).map(x => x.s));
  const qs = arr.slice(0, 6).map(arrangeQuestion);
  startSession({ qs, kind: "listen", title: "🧩 听力组句",
    build: buildArrangeSession,
    next: `<button class="pixel-btn primary" onclick="location.hash='#/practice'">返回训练</button>` });
}

/* ---------- 主动回想记忆卡（艾宾浩斯×SM-2 复习队列） ---------- */
let flip = null;
function buildFlipSession() {
  const list = VOCAB();
  if (list.length < 4) return toast("词汇数据加载中，请稍候…");
  const q = Store.srsQueue();
  const words = [...q.due, ...q.fresh].map(w => list.find(v => v.w === w)).filter(Boolean);
  if (!words.length) return toast("🎉 今日复习已清空、新词额度已用完，明天记得来拦截遗忘！");
  flip = { words, i: 0, revealed: false, res: { ok: 0, hard: 0, miss: 0, xp: 0 }, dueN: q.due.length, newN: q.fresh.length };
  renderFlip();
}
function renderFlip() {
  const f = flip, v = f.words[f.i];
  f.revealed = false;
  h(`
    <div class="learn-head">
      <span class="qidx">MEMORY ${f.i + 1} / ${f.words.length}</span>
      <span class="badge">今日到期 ${f.dueN} · 新词 ${f.newN}</span>
      <span class="badge gold">想起 ${f.res.ok} · 模糊 ${f.res.hard} · 忘了 ${f.res.miss}</span>
    </div>
    <div class="flashcard" id="flipFront" onclick="flipReveal()">
      <span class="word" style="font-size:46px">${v.r}</span>
      <span class="hint">🧠 先别急着点 · 在心里努力回想它的意思 → 点卡片揭示（手机点一下 / 电脑按 Space）</span>
      <div class="center mt" style="border-top:2px dashed rgba(255,255,255,.25);padding-top:10px">
        <button class="pixel-btn small ghost" onclick="event.stopPropagation();speak('${v.r}')">🔊 读音</button>
        <button class="pixel-btn small purple" id="auLoop" onclick="event.stopPropagation();repeatPlay5(flip.words[flip.i], this, '${kanaToRomaji(v.r)}')">🔁 日语连读 ×5</button>
        <span class="dim" style="font-size:11px;display:block;margin-top:6px">罗马音：${kanaToRomaji(v.r)}</span>
      </div>
    </div>
    <div id="flipBack" class="hidden mt">
      <div class="q-panel center">
        <div class="sentence"><b>${v.w}</b> <span class="dim" style="font-size:18px">（${v.r}）</span></div>
        <p style="font-size:24px;color:var(--gold);margin-top:8px">${v.m}</p>
        <div class="center mt" style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
          <button class="pixel-btn primary" onclick="flipGrade(3)">1 · 秒懂</button>
          <button class="pixel-btn blue" onclick="flipGrade(1)">2 · 模糊</button>
          <button class="pixel-btn red" onclick="flipGrade(0)">3 · 忘了</button>
        </div>
        <p class="dim mt" style="font-size:12px">快捷键：Space 翻卡 · 1 秒懂 · 2 模糊 · 3 忘了（评分决定下次复习时间）</p>
      </div>
    </div>`);
}
function flipReveal() {
  if (!flip || flip.revealed) return;
  flip.revealed = true;
  const v = flip.words[flip.i];
  speak(v.r);
  document.getElementById("flipFront").classList.add("hidden");
  document.getElementById("flipBack").classList.remove("hidden");
}
function flipGrade(g) {
  const f = flip;
  if (!f || !f.revealed) return;
  const w = f.words[f.i];
  Store.srsGrade(w.w, g);                                  // 驱动艾宾浩斯×SM-2 调度
  if (g === 3) { f.res.ok++; f.res.xp += 8; beep("ok"); }
  else if (g === 1) { f.res.hard++; f.res.xp += 5; beep("ok"); }
  else { f.res.miss++; Store.addWrong({ mod: "单词", q: `${w.w}（${w.r}）`, opts: [], ans: w.m, exp: `${w.r} = ${w.m}` }); beep("bad"); }
  Store.state.stats.vocabTotal++; if (g >= 1) Store.state.stats.vocabCorrect++;
  Store.save();
  f.i++;
  if (f.i >= f.words.length) return flipFinish();
  renderFlip();
}
function flipFinish() {
  const f = flip;
  const total = f.words.length, done = f.res.ok + f.res.hard;
  Store.addXp(f.res.xp + (done === total ? 20 : 0));
  Store.log(`记忆卡 ${total} 张：想起${f.res.ok} 模糊${f.res.hard} 忘了${f.res.miss}，+${f.res.xp}XP`);
  if (total >= 5) Store.markTask("vocab");
  const got = Store.checkAch();
  beep("win");
  h(`
    <div class="q-panel result-box">
      <div class="sec-title">MEMORY · 今日记忆完成</div>
      <div class="big">${done}/${total}</div>
      <p class="dim">想起 ${f.res.ok} · 模糊 ${f.res.hard} · 忘了 ${f.res.miss}（忘了的 5 分钟后自动回炉）</p>
      <p class="gain mt">+${f.res.xp}XP · 下次复习按遗忘曲线自动安排</p>
      ${got.map(a => `<p class="mt"><span class="badge gold">${a.ic} 成就解锁：${a.n}</span></p>`).join("")}
      <div class="center mt"><button class="pixel-btn primary" onclick="buildFlipSession()">再来一组</button>
      <button class="pixel-btn blue" onclick="location.hash='#/practice'">返回训练</button></div>
    </div>`);
  renderUserBox();
}
document.addEventListener("keydown", e => {
  if (!flip || !document.getElementById("flipFront")) return;
  if (e.code === "Space") { e.preventDefault(); flipReveal(); }
  else if (flip.revealed && ["1", "2", "3"].includes(e.key)) flipGrade({ "1": 3, "2": 1, "3": 0 }[e.key]);
});

/* ---------- 单元页 ---------- */
function unitPage(no) {
  const u = window.UNITS_N2.find(x => x.no === +no);
  if (!u) return location.hash = "#/courses";
  const st = Store.state.units[u.no] || {};
  const wds = unitWords(u.no);
  h(`
    <div class="q-panel">
      <div class="sec-title">UNIT ${u.no} · ${u.name}</div>
      <p style="font-size:20px;color:var(--cream)">${u.zh}</p>
      <p class="dim mt" style="line-height:1.9">${u.desc}</p>
      <div class="stat-row">
        <div class="stat"><span class="num">${wds.length}</span><span class="lab">单元词汇</span></div>
        <div class="stat"><span class="num">${u.grammar.length}</span><span class="lab">语法点</span></div>
        <div class="stat"><span class="num">${u.listen || 0}</span><span class="lab">听力题</span></div>
        <div class="stat"><span class="num">${st.done ? st.score + "分" : "--"}</span><span class="lab">最高成绩</span></div>
      </div>
      ${u.grammar.length ? `<div class="mt"><span class="badge">本单元句型</span>${u.grammar.map(i => `<span class="badge green">${(window.GRAMMAR_N2[i] || {}).p || ""}</span>`).join("")}</div>` : ""}
      <div class="mt" style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="pixel-btn primary" onclick="buildVocabSession(${u.no})">🔤 单词特训</button>
        ${u.grammar.length ? `<button class="pixel-btn blue" onclick="buildGramSession(${u.no})">📜 语法特训</button>` : ""}
        ${u.listen ? `<button class="pixel-btn purple" onclick="buildListenSession(${u.no})">🎧 听力特训</button>` : ""}
        <button class="pixel-btn red" onclick="buildUnitExam(${u.no})">⚔ 单元考核（≥70分通关）</button>
      </div>
      <p class="dim mt" style="font-size:13px">状态：${st.done ? "✅ 已通关 · 最高 " + st.score + " 分" : "🔒 未通关"}</p>
    </div>`);
}

function buildUnitExam(no) {
  const u = window.UNITS_N2.find(x => x.no === +no);
  const list = VOCAB();
  if (list.length < 8) return toast("词汇数据加载中，请稍候…");
  const qs = [];
  shuffle(unitWords(no)).slice(0, 8).forEach(w => { const q = vocabQuestion(w); if (q) qs.push(q); });
  if (u.grammar.length) shuffle(u.grammar).map(i => window.GRAMMAR_N2[i]).filter(Boolean).slice(0, 5).forEach(g => qs.push(gramQuestion(g)));
  if (u.listen) shuffle(window.LISTEN_N2).slice(0, 3).forEach(it => qs.push(listenQuestion(it)));
  startSession({ qs, kind: "unit", unitNo: no, title: `单元${no}考核`,
    build: () => buildUnitExam(no), next: `<button class="pixel-btn primary" onclick="location.hash='#/courses'">返回课程地图</button>` });
}

/* ================= 页面 ================= */

function authPage(mode) {
  document.getElementById("topbar").classList.add("hidden");
  const isReg = mode === "reg";
  h(`
  <div class="auth-wrap">
    <div class="hero">
      <h1>像素日语<br>JLPT 在线考级学院</h1>
      <p>闯关式分级课程 · 单词/语法/听力/口语四维训练<br>进度追踪 · 个性化学习路径 · 成就激励<br>当前开放：<b style="color:var(--gold)">JLPT N2 冲刺</b></p>
      <img class="hero-art" alt="pixel cartoon anime classroom"
        src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent("pixel art cartoon anime style illustration, cute chibi girl student with brown hair and sailor uniform studying Japanese in a bright classroom, cherry blossom branches outside the window, blackboard with hiragana, soft pastel colors pink sky blue and cream, kawaii 16-bit game art, chunky clean pixels, cheerful mood, no text")}&image_size=landscape_16_9">
    </div>
    <div class="pixel-panel auth-card">
      <h2>${isReg ? "NEW PLAYER · 注册" : "CONTINUE · 登录"}</h2>
      <form id="authForm">
        <div class="field"><label>玩家名</label><input id="u" autocomplete="username" placeholder="输入用户名"></div>
        <div class="field"><label>密码</label><input id="p" type="password" autocomplete="current-password" placeholder="至少4位"></div>
        <div class="form-err" id="err"></div>
        <button class="pixel-btn primary" style="width:100%" type="submit">${isReg ? "创建角色 ▶" : "开始冒险 ▶"}</button>
      </form>
      <div class="auth-switch">${isReg ? "已有账号？" : "还没有账号？"}
        <a onclick="location.hash='${isReg ? "#/login" : "#/reg"}'">${isReg ? "去登录" : "去注册"}</a></div>
    </div>
  </div>`);
  document.getElementById("authForm").onsubmit = e => {
    e.preventDefault();
    const r = isReg ? Store.register(u.value, p.value) : Store.login(u.value, p.value);
    if (!r.ok) { document.getElementById("err").textContent = r.msg; beep("bad"); return; }
    beep("win"); renderUserBox(); location.hash = "#/home";
  };
}

function renderUserBox() {
  const box = document.getElementById("user-box");
  if (!Store.user) { box.innerHTML = ""; return; }
  const lv = levelOf(Store.state.xp);
  const cur = xpForLevel(lv), next = xpForLevel(lv + 1);
  const pct = Math.round((Store.state.xp - cur) / (next - cur) * 100);
  box.innerHTML = `<span>👤 ${Store.user}</span>
    <span class="xp-chip">Lv.${lv} ${Store.state.xp}XP</span>
    <a onclick="Store.logout();location.hash='#/login'">退出</a>`;
  document.getElementById("topbar").classList.remove("hidden");
}

function phaseInfo(dl) {
  if (dl > 49) return { n: "诊断期", tip: "先做一次全真模考摸底，把错题本建起来；开始过语法库" };
  if (dl > 30) return { n: "主攻期", tip: "每日固定顺序：记忆卡 → 语法 → 阅读题型 → 听力，周末局部模考" };
  if (dl > 10) return { n: "强化期", tip: "局部模考 + 错题重做，排序/检索/主张一致套路保持手感" };
  return { n: "收口期", tip: "停止学新的：错题本全量重做，只复习不新学，每天1.5小时就够" };
}

const DAY_TASKS = [
  { id: "vocab", ico: "🧠", name: "今日记忆 · 主动回想", min: 10, nav: "#/practice/flip", note: "到期复习优先 · 遗忘曲线拦截" },
  { id: "gram", ico: "📜", name: "语法练习 · 8题", min: 10, nav: "#/practice/grammar", note: "没记住的句型自动优先重现" },
  { id: "read", ico: "📚", name: "阅读题型专项", min: 15, nav: "#/practice/reading", note: "排序 / 信息检索 / 主张一致" },
  { id: "listen", ico: "🎧", name: "听力反应训练 · 8题", min: 12, nav: "#/practice/listening", note: "慢速精听 · 答错标错因" },
  { id: "speak", ico: "🎤", name: "口语影子跟读 · 6句", min: 8, nav: "#/practice/speaking", note: "跟读强化语感与瞬时反应" }
];

function homePage() {
  const st = Store.state, sc = Store.scores(), rec = Store.recommend(), srs = Store.srsStats();
  const lv = levelOf(st.xp), cur = xpForLevel(lv), next = xpForLevel(lv + 1);
  const pct = Math.round((st.xp - cur) / (next - cur) * 100);
  const dl = Store.daysLeft(), ph = phaseInfo(dl);
  const dayLearned = Object.values(st.srs).filter(v => (v.nd || "").slice(0, 10) === Store.todayStr()).length;
  const firstToday = !localStorage.getItem(greetKey());
  if (firstToday) localStorage.setItem(greetKey(), "1");
  const line = firstToday
    ? `${hourGreet()} <b>${Store.user}</b>！${dl <= 14 ? pick(window.MASCOT.examNear(dl)) : pick(window.MASCOT.streak(Math.max(1, st.streak)))}`
    : (dl <= 14 ? pick(window.MASCOT.examNear(dl)) : pick(window.MASCOT.daily));
  if (window.cdTimer) clearInterval(window.cdTimer);
  h(`
    ${mascotBar(line)}
    <div class="pixel-panel mb">
      <div class="sec-title">⚔ 冲刺倒计时 · ${ph.n}</div>
      <div class="countdown">
        <div class="cd-box ${dl <= 10 ? "urgent" : ""}"><b id="cdD">${dl}</b><span>DAYS 天</span></div>
        <div class="cd-box"><b id="cdH">--</b><span>HOURS 时</span></div>
        <div class="cd-box"><b id="cdM">--</b><span>MINUTES 分</span></div>
        <div style="flex:1;min-width:220px">
          <p style="font-size:14px">目标考试日：<b style="color:var(--gold)">${st.examDate}</b>
            <a onclick="setExamDatePrompt()" style="cursor:pointer;text-decoration:underline;font-size:12px">修改</a></p>
          <p class="dim" style="font-size:13px;margin-top:6px">${ph.tip}</p>
        </div>
      </div>
      <div class="stat-row">
        <div class="stat"><span class="num">${srs.due}</span><span class="lab">今日到期复习</span></div>
        <div class="stat"><span class="num">${Math.max(0, (Store.state.newLimit || 8) - dayLearned)}/${Store.state.newLimit || 8}</span><span class="lab">今日新词额度</span></div>
        <div class="stat"><span class="num">${st.streak}</span><span class="lab">连续学习天数 🔥</span></div>
        <div class="stat"><span class="num">Lv.${lv}</span><span class="lab">${st.xp} XP</span></div>
      </div>
    </div>

    <div class="pixel-panel mb">
      <div class="sec-title">今日计划 · ${DAY_TASKS.filter(t => Store.taskDone(t.id)).length}/${DAY_TASKS.length} 完成</div>
      ${DAY_TASKS.map(t => {
        const done = Store.taskDone(t.id);
        return `<div class="task-card ${done ? "done" : ""}" onclick="location.hash='${t.nav}'">
          <span class="t-ico">${t.ico}</span>
          <span class="t-name">${t.name}<br><span class="t-meta">${t.note}</span></span>
          <span class="t-meta">约${t.min}分钟</span>
          ${done ? '<span class="t-check">✓ DONE</span>' : '<span class="badge">去完成 ▶</span>'}
        </div>`;
      }).join("")}
      <div class="bar mt"><i style="width:${Math.round(DAY_TASKS.filter(t => Store.taskDone(t.id)).length / DAY_TASKS.length * 100)}%"></i>
        <span>${Math.round(DAY_TASKS.filter(t => Store.taskDone(t.id)).length / DAY_TASKS.length * 100)}%</span></div>
    </div>

    <div class="pixel-panel light mb">
      <div class="sec-title">🧠 记忆曲线 · 未来7天到期预报</div>
      <div class="chart" style="height:120px">
        ${srs.forecast.map((n, i) => `<div class="col"><em>${n}</em>
          <i class="${i === 0 ? "gold" : ""}" style="height:${Math.max(3, Math.min(100, n * 12))}%"></i>
          <b>${i === 0 ? "今天" : "+" + i + "天"}</b></div>`).join("")}
      </div>
      <div class="center mt"><button class="pixel-btn primary" onclick="location.hash='#/practice/flip'">▶ 开始今日记忆</button></div>
    </div>

    <div class="pixel-panel mb">
      <div class="sec-title">ようこそ · ${Store.user} さん</div>
      <div style="display:flex;gap:20px;flex-wrap:wrap;align-items:center">
        <div style="flex:1;min-width:240px">
          <p class="dim" style="font-size:13px">当前等级 <b style="color:var(--gold)">Lv.${lv}</b> · 成就 <b style="color:var(--pink)">${Object.keys(st.ach).length}/${window.ACHIEVEMENTS.length}</b></p>
          <div class="bar xp mt"><i style="width:${pct}%"></i><span>${st.xp} / ${next} XP</span></div>
        </div>
        <div class="badge gold" style="font-size:14px;padding:6px 12px">🏆 掌握词汇 ${sc.known}/${sc.wordTotal || "—"}</div>
      </div>
    </div>

    <div class="pixel-panel light mb">
      <div class="sec-title">今日推荐 · 个性化学习路径</div>
      <p class="dim mb" style="font-size:13px">依据你的各模块掌握度生成：${rec.why}</p>
      <div class="today-path">
        ${rec.steps.map((s, i) => `<span class="step-chip" onclick="location.hash='${s.nav}'"><b>${i + 1}.</b> ${s.label} ▶</span>`).join("")}
        <button class="pixel-btn small primary" onclick="completePath()">完成路径打卡 +20XP</button>
      </div>
      <div class="stat-row">
        ${[["vocab", "单词"], ["grammar", "语法"], ["listening", "听力"], ["speaking", "口语"]].map(([k, name]) =>
          `<div class="stat"><span class="num">${sc[k]}%</span><span class="lab">${name}掌握度</span>
            <div class="bar blue mt"><i style="width:${sc[k]}%"></i></div></div>`).join("")}
      </div>
    </div>

    <div class="grid c4">
      <div class="pixel-panel module-card" onclick="location.hash='#/courses'" style="cursor:pointer">
        <span class="ico">🗺️</span><h3>分级课程</h3><p>N5→N1 五级体系，当前开放 N2 冲刺</p></div>
      <div class="pixel-panel module-card" onclick="location.hash='#/practice'" style="cursor:pointer">
        <span class="ico">⚔️</span><h3>训练中心</h3><p>记忆卡·单词·语法·阅读·听力·口语</p></div>
      <div class="pixel-panel module-card" onclick="location.hash='#/progress'" style="cursor:pointer">
        <span class="ico">📈</span><h3>进度追踪</h3><p>掌握度曲线、错因统计、学习记录</p></div>
      <div class="pixel-panel module-card" onclick="location.hash='#/achievements'" style="cursor:pointer">
        <span class="ico">🎖️</span><h3>成就殿堂</h3><p>${window.ACHIEVEMENTS.length}枚徽章等你解锁</p></div>
    </div>`);
  if (firstToday) toast(`✓ 今日签到成功 · 连续学习 ${Math.max(1, st.streak)} 天`, "ach");
  tickCountdown();
  window.cdTimer = setInterval(tickCountdown, 30000);
}

function tickCountdown() {
  const d = document.getElementById("cdD"); if (!d) return;
  const e = new Date((Store.state.examDate || "2026-12-06") + "T00:00:00");
  const diff = Math.max(0, e - new Date());
  document.getElementById("cdD").textContent = Store.daysLeft();   // 与阶段判定同口径（原先 Math.ceil 会多显示1天）
  document.getElementById("cdH").textContent = String(Math.floor(diff / 36e5) % 24).padStart(2, "0");
  document.getElementById("cdM").textContent = String(Math.floor(diff / 6e4) % 60).padStart(2, "0");
}
function setExamDatePrompt() {
  const v = prompt("输入考试日期（YYYY-MM-DD）：", Store.state.examDate);
  if (v && Store.setExamDate(v.trim())) { toast("考试日期已更新"); homePage(); }
  else if (v) toast("日期格式不对，应为 YYYY-MM-DD");
}

function setNewLimitUI(n) {
  Store.setNewLimit(n);
  toast(`每日新词额度已设为 ${n} 词（8=稳扎稳打 · 20=冲刺期加量）`);
  practiceHub();
}

function completePath() {
  if (Store.taskDone("path")) return toast("今天已经打过卡了，明天再来 +20XP", "ach");
  Store.markTask("path");
  Store.addXp(20); Store.state.stats.pathDone++; Store.log("完成今日个性化路径打卡 +20XP");
  const got = Store.checkAch(); got.forEach(a => toast(`${a.ic} 成就解锁：${a.n}`, "ach"));
  beep("win"); toast("路径打卡成功 +20XP"); renderUserBox(); homePage();
}

function coursesPage() {
  const st = Store.state;
  h(`
    <div class="sec-title">分级课程体系 · CURRICULUM</div>
    <div class="map-track">
      ${window.COURSES.map(c => {
        const isActive = c.status === "now";
        const done = c.lv === "N2" ? Object.values(st.units).filter(u => u.done).length : 0;
        return `<div class="level-row ${c.status === "future" || c.status === "locked" ? "locked" : ""} ${isActive ? "now" : ""}">
          <div class="level-flag">${c.lv}<span style="font-size:9px;font-family:var(--font-jp)">${c.status === "now" ? "OPEN" : c.status === "locked" ? "LOCK" : "SOON"}</span></div>
          <div class="unit-list">
            ${isActive ? window.UNITS_N2.map(u => {
              const us = st.units[u.no] || {};
              const prevOk = u.no === 1 || (st.units[u.no - 1] || {}).done;
              const locked = !prevOk;
              return `<div class="unit-card ${us.done ? "done" : ""} ${locked ? "locked" : ""}" onclick="${locked ? "toast('先通关上一单元哦')" : `location.hash='#/unit/${u.no}'`}">
                <span class="u-no">UNIT ${u.no}</span>${us.done ? '<span class="u-star">★</span>' : ""}
                <div class="u-name">${u.zh}</div>
                <div class="u-meta">${u.name}</div>
                <div class="u-meta">${us.done ? `✅ ${us.score}分` : locked ? "🔒 通关上一单元解锁" : "未挑战"}</div>
              </div>`;
            }).join("") : `<div class="unit-card locked" onclick="toast('${c.status === "locked" ? "通过N2后解锁" : "开发中，敬请期待"}')">
                <span class="u-no">${c.status === "locked" ? "LOCKED" : "COMING SOON"}</span>
                <div class="u-name">${c.name}</div><div class="u-meta">${c.desc}</div></div>`}
          </div>
        </div>`;
      }).join("")}
    </div>`);
}

function practiceHub() {
  const st = Store.state.stats, sc = Store.scores(), srs = Store.srsStats();
  h(`
    <div class="sec-title">训练中心 · PRACTICE</div>
    <div class="pixel-panel light mb">
      <div class="sec-title">🧠 今日记忆 · 遗忘曲线拦截</div>
      <div class="stat-row" style="margin-top:0">
        <div class="stat"><span class="num">${srs.due}</span><span class="lab">今日到期（复习优先）</span></div>
        <div class="stat"><span class="num">${srs.learn}</span><span class="lab">学习中（5m/30m/12h拦截）</span></div>
        <div class="stat"><span class="num">${Math.max(0, (Store.state.newLimit || 8) - Object.values(Store.state.srs).filter(v => (v.nd || "").slice(0, 10) === Store.todayStr()).length)}/${Store.state.newLimit || 8}</span><span class="lab">今日新词额度</span></div>
        <div class="stat"><span class="num">${srs.total}</span><span class="lab">已进入记忆系统</span></div>
      </div>
      <div class="center mt"><button class="pixel-btn primary" onclick="location.hash='#/practice/flip'">▶ 开始今日记忆（主动回想）</button></div>
      <p class="center mt" style="font-size:12px;color:var(--dim)">每日新词额度：
        ${[8, 12, 20].map(n => `<button class="pixel-btn small ${ (Store.state.newLimit || 8) === n ? "primary" : "ghost"}" style="margin-left:6px" onclick="setNewLimitUI(${n})">${n}词</button>`).join("")}
        <span style="font-size:11px">（复习永远优先于新词）</span></p>
    </div>
    <div class="grid c2">
      <div class="pixel-panel module-card">
        <span class="ico">🔤</span><h3>单词记忆</h3>
        <p>闪卡式记忆 + 释义/读音/拼写三种题型，智能优先复习未掌握的词</p>
        <div class="mini-stat">答对 ${st.vocabCorrect}/${st.vocabTotal} · 掌握 ${sc.known}/${sc.wordTotal || "—"} 词</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="pixel-btn primary" onclick="buildVocabSession()">开始单词训练</button>
          <button class="pixel-btn ghost small" onclick="location.hash='#/practice/kanji'">📖 汉字读音专项</button>
        </div>
      </div>
      <div class="pixel-panel module-card">
        <span class="ico">📜</span><h3>语法练习</h3>
        <p>${window.GRAMMAR_N2.length}条N2核心句型：含义辨析 + 例句填空，没记住的自动优先重现</p>
        <div class="mini-stat">答对 ${st.gramCorrect}/${st.gramTotal} · 掌握度 ${sc.grammar}%</div>
        <p style="font-size:11px;color:var(--dim);line-height:1.7">解析标注体系：<b style="color:var(--gold)">A1</b>=一类(い)形容词 · <b style="color:var(--gold)">A2</b>=二类(な)形容词 · <b style="color:var(--gold)">V1</b>=一类(五段)动词 · <b style="color:var(--gold)">V2</b>=二类(一段)动词 · <b style="color:var(--gold)">V3</b>=三类(サ/カ変)动词 · N=名词</p>
        <button class="pixel-btn blue" onclick="buildGramSession()">开始语法训练</button>
      </div>
      <div class="pixel-panel module-card">
        <span class="ico">🎧</span><h3>听力训练</h3>
        <p>真实场景会话·通知·广播，支持原速与慢速重听</p>
        <div class="mini-stat">答对 ${st.listenCorrect}/${st.listenTotal} · 掌握度 ${sc.listening}%</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="pixel-btn purple" onclick="buildListenSession()">开始听力训练</button>
          <button class="pixel-btn ghost small" onclick="location.hash='#/practice/speed'">⚡ 即時応答速训</button>
          <button class="pixel-btn ghost small" onclick="location.hash='#/practice/arrange'">🧩 听力组句</button>
        </div>
      </div>
      <div class="pixel-panel module-card">
        <span class="ico">🎤</span><h3>口语跟读</h3>
        <p>日语发音示范 + 语音识别跟读评分（不支持时可自我评分）</p>
        <div class="mini-stat">跟读 ${st.speakCount} 次 · 最佳 ${st.speakBest} 分</div>
        <button class="pixel-btn red" onclick="speakPage()">开始口语训练</button>
      </div>
      <div class="pixel-panel module-card">
        <span class="ico">📚</span><h3>阅读题型专项</h3>
        <p>排序/信息检索/主张一致/短中篇 四类套路 + 长难句拆解工具</p>
        <div class="mini-stat">答对 ${st.readCorrect}/${st.readTotal} · 掌握度 ${sc.vocab >= 0 ? Math.round(st.readTotal ? st.readCorrect / st.readTotal * 100 : 0) : 0}%</div>
        <button class="pixel-btn blue" onclick="location.hash='#/practice/reading'">进入阅读专项</button>
      </div>
      <div class="pixel-panel module-card">
        <span class="ico">👑</span><h3>全真模考 / 错题本</h3>
        <p>按 N2 卷面组卷 · 倒计时 · 估分报告 · 错题自动归集</p>
        <div class="mini-stat">已考 ${st.mockCount} 次 · 错题 ${Store.state.wrongs.length} 道</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="pixel-btn gold" onclick="location.hash='#/mock'">去模考</button>
          <button class="pixel-btn ghost" onclick="location.hash='#/wrongbook'">错题本</button>
        </div>
      </div>
    </div>`);
}

/* 智能预测：按模考趋势线性外推考试日得分（启发式，非官方口径） */
function mockEst180(x) {                     // 局部模考单部分上限60/120 → 折算到180总分口径，避免拉低预测
  const parts = Math.max(1, String(x.part || "言語知識").split("＋").length);
  return Math.round((x.est || 0) / parts * 3);
}
function examPredict() {
  const h = (Store.state.mockHistory || []).filter(x => typeof x.est === "number");
  const days = Math.max(0, Store.daysLeft());
  if (h.length < 2) return { ready: false, days };
  const last = h[h.length - 1], prev = h[h.length - 2];
  const dDays = Math.max(1, Math.round((new Date(last.d) - new Date(prev.d)) / 864e5));
  const slope = (mockEst180(last) - mockEst180(prev)) / dDays;
  const pred = Math.round(Math.min(180, Math.max(0, mockEst180(last) + slope * days)));
  const trend = slope > 0.4 ? "📈 上升" : slope < -0.4 ? "📉 下滑" : "➡️ 平稳";
  return { ready: true, days, pred, slope: Math.round(slope * 10) / 10, trend, pass: pred >= 90, n: h.length };
}
function progressPage() {
  const sc = Store.scores(), st = Store.state;
  const es = st.errStats || {};
  const bars = [
    { k: "单词", v: sc.vocab }, { k: "语法", v: sc.grammar },
    { k: "听力", v: sc.listening }, { k: "口语", v: sc.speaking },
    { k: "单元", v: Math.round(sc.unitDone / 8 * 100) }
  ];
  const mastery = [0, 1, 2].map(lv => Object.values(st.words).filter(v => v === lv).length);
  const srs = Store.srsStats();
  h(`
    <div class="sec-title">学习进度 · PROGRESS</div>
    <div class="pixel-panel mb">
      <p class="dim mb" style="font-size:13px">各模块掌握度（答对率 + 完成度加权）</p>
      <div class="chart">
        ${bars.map(b => `<div class="col"><em>${b.v}%</em><i class="${b.v >= 70 ? "gold" : ""}" style="height:${Math.max(b.v, 3)}%"></i><b>${b.k}</b></div>`).join("")}
      </div>
    </div>
    <div class="pixel-panel light mb">
      <div class="sec-title">🧠 记忆系统状态 · 艾宾浩斯×SM-2</div>
      <div class="stat-row" style="margin-top:0">
        <div class="stat"><span class="num">${srs.total}</span><span class="lab">进入记忆系统</span></div>
        <div class="stat"><span class="num">${srs.due}</span><span class="lab">当前到期待复习</span></div>
        <div class="stat"><span class="num">${srs.learn}</span><span class="lab">学习中（当日拦截）</span></div>
        <div class="stat"><span class="num">${srs.review}</span><span class="lab">长期复习中</span></div>
      </div>
      <p class="dim mt" style="font-size:12px">间隔节奏：学完 → 5分钟 → 30分钟 → 12小时 → 1天 → 6天 → ×EF(2.5) 逐次拉长，答错自动5分钟回炉</p>
    </div>
    ${Object.keys(es).length ? `
    <div class="pixel-panel mb">
      <div class="sec-title">🎧 听力错因分布（补救方向）</div>
      <div class="stat-row" style="margin-top:0">
        ${Object.entries(es).map(([t, n]) => `<div class="stat"><span class="num">${n}</span><span class="lab">${t}</span></div>`).join("")}
      </div>
      <p class="dim mt" style="font-size:12px">「词汇不懂」→ 记忆卡加练 · 「语速太快/没反应过来」→ 慢速精听+影子跟读 · 「走神」→ 单次训练减量</p>
    </div>` : ""}
    <div class="grid c3 mb">
      <div class="pixel-panel center"><div class="stat"><span class="num">${sc.known}</span><span class="lab">已掌握词汇（2级）</span></div></div>
      <div class="pixel-panel center"><div class="stat"><span class="num">${mastery[1]}</span><span class="lab">学习中词汇（1级）</span></div></div>
      <div class="pixel-panel center"><div class="stat"><span class="num">${sc.unitDone}/8</span><span class="lab">通关单元</span></div></div>
    </div>
    ${(() => { const p = examPredict(); return p.ready ? `
    <div class="pixel-panel mb" style="border-color:${p.pass ? "var(--green)" : "var(--red)"}">
      <div class="sec-title">🎯 考试预测 · 目标日 ${st.examDate}</div>
      <p style="font-size:15px;line-height:2">近 ${p.n} 次模考趋势：<b>${p.trend}</b>（${p.slope > 0 ? "+" : ""}${p.slope} 分/天）<br>
        距考试 <b style="color:var(--gold)">${p.days} 天</b> · 预计得分 <b style="font-size:28px;color:${p.pass ? "var(--green)" : "var(--red)"}">${p.pred}</b><span class="dim"> / 180</span>
        ${p.pass ? `<span class="badge green">预计达线 ✅</span>` : `<span class="badge red">距 90 分达标线还差 ${Math.max(1, 90 - p.pred)} 分</span>`}</p>
      <p class="dim" style="font-size:12px">${p.pass ? "保持当前节奏，错题按排程回归即可。" : "全勤每日计划 + 错题回归清零，是当前最稳的提分路径。"} · 启发式预测，非官方口径</p>
    </div>` : `<div class="pixel-panel mb"><p class="dim center" style="font-size:13px">🎯 完成 2 次模考后解锁「考试预测」（按趋势外推你 12/06 的得分）</p></div>`; })()}
    ${(st.mockHistory || []).length ? `
    <div class="pixel-panel mb">
      <div class="sec-title">📈 模考估分趋势 · 近 ${st.mockHistory.length} 次（180分制·非官方口径）</div>
      <div class="chart" style="height:150px">
        ${st.mockHistory.map(x => `<div class="col"><em>${mockEst180(x)}</em>
          <i class="${mockEst180(x) >= 90 ? "gold" : ""}" style="height:${Math.max(4, Math.round(mockEst180(x) / 180 * 100))}%"></i>
          <b>${x.d.slice(5)}</b></div>`).join("")}
      </div>
      <p class="dim mt" style="font-size:12px">金色 = 估算达线（90分）· 最佳 ${st.stats.bestMock || "—"} · 看趋势比看单次更重要，策略有效与否一目了然</p>
    </div>` : ""}
    <div class="pixel-panel">
      <div class="sec-title">学习记录 · LOG</div>
      ${st.history.length ? `<ul class="timeline">${st.history.map(x => `<li>${x.text}<span>${x.d}</span></li>`).join("")}</ul>` : `<p class="dim center">还没有学习记录，去完成第一次训练吧！</p>`}
    </div>`);
}

function achievementsPage() {
  const got = Store.state.ach;
  h(`
    <div class="sec-title">成就殿堂 · ${Object.keys(got).length}/${window.ACHIEVEMENTS.length}</div>
    <div class="grid c4">
      ${window.ACHIEVEMENTS.map(a => `
        <div class="pixel-panel ach-card ${got[a.id] ? "got" : ""}">
          <span class="em">${a.ic}</span><h4>${a.n}</h4><p>${a.d}</p>
          ${got[a.id] ? `<span class="badge gold mt">✅ ${got[a.id]}</span>` : `<span class="badge mt">未解锁</span>`}
        </div>`).join("")}
    </div>`);
}

/* ---------- 路由 ---------- */
function route() {
  if (!Store.restore() && !location.hash.startsWith("#/login") && !location.hash.startsWith("#/reg")) {
    location.hash = "#/login"; return;
  }
  const hash = location.hash || "#/home";
  const auth = hash.startsWith("#/reg") || hash.startsWith("#/login");
  if (auth && Store.user) { location.hash = "#/home"; return; }
  document.querySelectorAll("#topbar nav a").forEach(a => a.classList.toggle("active", a.getAttribute("href") === hash));
  if (auth) return authPage(hash.startsWith("#/reg") ? "reg" : "login");
  if (!Store.user) { location.hash = "#/login"; return; }
  renderUserBox();
  if (window.cdTimer && !hash.startsWith("#/home")) { clearInterval(window.cdTimer); window.cdTimer = null; }
  if (mock && !mock.locked && !hash.startsWith("#/mock") && !hash.startsWith("#/wrongbook")) {
    if (mockTimer) { clearInterval(mockTimer); mockTimer = null; }        // 暂停：离开考场即停表
    mock.paused = true;
    toast("⏸ 已暂停未完成的" + (mock.partName || "考试") + "，回「模考」页可继续");
  }

  if (hash.startsWith("#/courses")) return coursesPage();
  if (hash.startsWith("#/unit/")) return unitPage(hash.split("/")[2]);
  if (hash.startsWith("#/practice/flip")) return buildFlipSession();
  if (hash.startsWith("#/practice/speed")) return buildSpeedSession();
  if (hash.startsWith("#/practice/kanji")) return buildKanjiSession();
  if (hash.startsWith("#/practice/arrange")) return buildArrangeSession();
  if (hash.startsWith("#/practice/reading")) return readingPage();
  if (hash.startsWith("#/practice/word")) return buildVocabSession();
  if (hash.startsWith("#/practice/grammar")) return buildGramSession();
  if (hash.startsWith("#/practice/listening")) return buildListenSession();
  if (hash.startsWith("#/practice/speaking")) return speakPage();
  if (hash.startsWith("#/practice")) return practiceHub();
  if (hash.startsWith("#/mock")) return mockPage();
  if (hash.startsWith("#/wrongbook")) return wrongbookPage();
  if (hash.startsWith("#/progress")) return progressPage();
  if (hash.startsWith("#/achievements")) return achievementsPage();
  homePage();
}
window.addEventListener("hashchange", route);
document.querySelector(".logo").onclick = () => location.hash = "#/home";
route();
