/* ===== 阅读题型专项（P1 刷分关键）· 自编题 =====
   N2 考试读解：短篇/中篇/长篇 + 信息检索5 + 段落排序7 + 主张一致5
   本文件题目均为「自编题」，非历年真题原文。 */

window.READ_TYPES = [
  { id: "sort", ico: "🧩", name: "段落排序", sub: "文章構成 · 7题", en: "纯逻辑题，不读懂全文也能拿分" },
  { id: "info", ico: "🔍", name: "信息检索", sub: "情報検索 · 5题", en: "先看问题关键词，再去表中定位" },
  { id: "claim", ico: "💡", name: "主张一致", sub: "主張一致 · 5题", en: "只找作者主张，对话选项迅速排除" },
  { id: "short", ico: "📄", name: "短中篇读解", sub: "短篇·中篇", en: "主旨/推理/词义题的解题步骤" }
];

window.READ_KNOW = {
  sort: `<h4>🧩 段落排序题 · 解题三步法</h4><ol>
    <li><b>先看首句候选</b>：段落首句多为主题句，不含「この」「それ」等指代开头的句子大概率在前。</li>
    <li><b>抓指代词绑定</b>：「これ」「それ」「この〜」必须先找到它指代的名词——指代在前，被指代在后。</li>
    <li><b>用接続詞锁顺序</b>：「しかし」前必有铺垫；「そこで」前必有问题；「つまり」前必有说明。</li>
    <li>例句特征：「例 → 主张」顺序固定，举例不会出现在主张之前。</li></ol>`,
  info: `<h4>🔍 信息检索题 · 定位路线</h4><ol>
    <li><b>先读问题</b>：圈出关键词（人数/日期/条件/否定）。</li>
    <li><b>再扫表格</b>：只找关键词所在的行，不逐字读全文。</li>
    <li><b>警惕否定与条件</b>：「〜を除く」「満たない場合は」是设错高发区。</li>
    <li>找到行后，用问题条件逐项核对，选出完全匹配项。</li></ol>`,
  claim: `<h4>💡 主张一致题 · 排除法</h4><ol>
    <li><b>只盯作者观点</b>：文中出现的他人观点（「〜という人もある」）一般不是答案。</li>
    <li><b>对话型选项先删</b>：选项里出现具体对话内容的，通常是细节干扰。</li>
    <li><b>范围过大过小都错</b>：「必ず」「全て」型绝对化选项多为错项；以偏概全同样错。</li>
    <li>答案常在「〜と思う」「〜すべきだ」「〜ではないか」附近。</li></ol>`,
  short: `<h4>📄 短中篇 · 三类题的步骤</h4><ol>
    <li><b>主旨题</b>：答案在首段或末段的概括句，选"覆盖全文"的选项。</li>
    <li><b>推理题</b>：不选文中明说的，选"顺着文意必然得出"的。</li>
    <li><b>词义题</b>：回原文看该词前后文，用代入法验证，不凭印象。</li>
    <li><b>常见干扰</b>：偷换主语、把"可能"说成"必然"、张冠李戴原因。</li></ol>`
};

/* ---------- 题库（全部自编，标注自编题） ---------- */
window.READ_QS = [
  /* ===== 段落排序 5题 ===== */
  { t: "sort", q: "次の文を並べ替えて、正しい順番を選べ。",
    opts: ["③②①④", "③①②④", "②③①④", "①③②④"], ans: 0,
    passage: `次の4文を正しく並べ替える問題です。<br>① そこで、私たちは町の図書館に相談に行った。<br>② 環境問題に関心を持つ若者が増えているのだ。<br>③ 最近、ボランティア活動に参加する人が増えてきた。<br>④ すると、市の担当者は喜んで協力してくれた。`,
    exp: "③现象→②解释原因→①接着「そこで」采取行动→④「すると」结果。指代与接续词锁定顺序。" },
  { t: "sort", q: "文の並べ替えとして正しいものは？",
    opts: ["②④①③", "④②③①", "②①④③", "①②④③"], ans: 2,
    passage: `① まず、予算を確認する必要がある。<br>② 新しい企画を始めたいと考えている。<br>③ その結果、役員会で承認してもらえた。<br>④ そこで、詳しい計画書を作成した。`,
    exp: "②意图→①先确认预算→④据此写计划书→③「その結果」承認。" },
  { t: "sort", q: "並べ替えの正しい順序は？",
    opts: ["①③②④", "①②③④", "③①②④", "②①③④"], ans: 3,
    passage: `① しかし、実際にはあまり効果が見られなかった。<br>② 健康のため、毎朝走ることにした。<br>③ 三ヶ月経っても、体重はほとんど変わらなかった。<br>④ 原因を調べてみると、走ったあとに間食をしていたことが分かった。`,
    exp: "②行动→①「しかし」转折→③具体结果→④「原因を調べてみると」追溯原因。" },
  { t: "sort", q: "文の流れとして正しい順番は？",
    opts: ["②④③①", "④②①③", "②③④①", "③②④①"], ans: 2,
    passage: `① 今では、この町に住んで良かったと思っている。<br>② 最初は都会の便利さが恋しかった。<br>③ ところが、子どもが小学校に入学してから、近所の人とよく顔を見るようになった。<br>④ 段々とこの町の生活に慣れてきた。`,
    exp: "②最初不满→③「ところが」转折变化→④习惯→①总结现在的心情。" },
  { t: "sort", q: "正しい並べ替えを選べ。",
    opts: ["③①②④", "①③④②", "③④①②", "①④③②"], ans: 0,
    passage: `① この方法なら、短い時間でも効果的に勉強できる。<br>② 例えば、駅で待っている五分間も単語を復習するのに使える。<br>③ まとまった時間が取れない人は、時間を細かく分けるのがおすすめだ。<br>④ 重要なのは、毎日続けることである。`,
    exp: "③提出方法→①方法的效果→②「例えば」举例→④总结主张。" },

  /* ===== 信息检索 5题（共用表格） ===== */
  { t: "info", q: "土曜日に参加できる高1の生徒は、何をしなければならないか？",
    passage: `<b>町内ボランティア募集表</b><br><table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr style="background:rgba(94,234,212,.15)"><td style="border:1px solid #4b4083;padding:6px">日時</td><td style="border:1px solid #4b4083;padding:6px">活動</td><td style="border:1px solid #4b4083;padding:6px">対象</td><td style="border:1px solid #4b4083;padding:6px">持ち物</td></tr>
      <tr><td style="border:1px solid #4b4083;padding:6px">10/18(土) 9:00</td><td style="border:1px solid #4b4083;padding:6px">川の清掃</td><td style="border:1px solid #4b4083;padding:6px">中学生以上</td><td style="border:1px solid #4b4083;padding:6px">軍手・帽子</td></tr>
      <tr><td style="border:1px solid #4b4083;padding:6px">10/19(日) 13:00</td><td style="border:1px solid #4b4083;padding:6px">図書館の手伝い</td><td style="border:1px solid #4b4083;padding:6px">高校生以上</td><td style="border:1px solid #4b4083;padding:6px">なし</td></tr>
      <tr><td style="border:1px solid #4b4083;padding:6px">10/25(土) 10:00</td><td style="border:1px solid #4b4083;padding:6px">花壇の整備</td><td style="border:1px solid #4b4083;padding:6px">どなたでも</td><td style="border:1px solid #4b4083;padding:6px">軍手・軍手代わりの手袋</td></tr></table>`,
    opts: ["軍手と帽子を持っていく", "何も持たなくてよい", "保護者の許可証が必要", "前日までに電話で連絡する"], ans: 0,
    exp: "土曜=10/18か10/25。高1=高校生以下なので10/18(中学生以上)は？中学生以上に高校生は含まれる→10/18参加可、持ち物=軍手・帽子。10/25も可（どなたでも）だが持ち物は軍手系。設問条件に完全一致する選択肢は「軍手と帽子」。" },
  { t: "info", q: "火曜日だけ空いている 사람은、どの講座を選べばよいか？",
    passage: `<b>市民講座の時間割</b><br><table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr style="background:rgba(94,234,212,.15)"><td style="border:1px solid #4b4083;padding:6px">講座</td><td style="border:1px solid #4b4083;padding:6px">曜日</td><td style="border:1px solid #4b4083;padding:6px">時間</td><td style="border:1px solid #4b4083;padding:6px">定員</td></tr>
      <tr><td style="border:1px solid #4b4083;padding:6px">パソコン基礎</td><td style="border:1px solid #4b4083;padding:6px">月・水</td><td style="border:1px solid #4b4083;padding:6px">19:00-20:30</td><td style="border:1px solid #4b4083;padding:6px">残り2名</td></tr>
      <tr><td style="border:1px solid #4b4083;padding:6px">英会話入門</td><td style="border:1px solid #4b4083;padding:6px">火・木</td><td style="border:1px solid #4b4083;padding:6px">18:30-20:00</td><td style="border:1px solid #4b4083;padding:6px">満員</td></tr>
      <tr><td style="border:1px solid #4b4083;padding:6px">書道</td><td style="border:1px solid #4b4083;padding:6px">火</td><td style="border:1px solid #4b4083;padding:6px">19:00-20:00</td><td style="border:1px solid #4b4083;padding:6px">残り5名</td></tr></table>`,
    opts: ["書道", "英会話入門", "パソコン基礎", "どの講座も選べない"], ans: 0,
    exp: "火曜=英会話（満員不可）と書道（残り5名）→書道のみ選べる。満員条件の見落としが典型設問。" },
  { t: "info", q: "二人で5,000円以下で夕食を食べたい場合、正しい説明は？",
    passage: `<b>レストランメニュー</b><br>・定食A 1,800円（税込）<br>・定食B 2,400円（税込）<br>・夜のブッフェ（18時以降） 大人 3,000円／中学生以下 1,500円<br>※ブッフェは予約が必要です。飲み物は別料金。`,
    opts: ["定食Aを2つ注文すれば5,000円以下", "ブッフェを2人分予約すれば5,000円以下", "どの組み合わせでも5,000円以下になる", "定食Bを2つなら4,000円以下"], ans: 0,
    exp: "定食A×2＝3,600円で確実に5,000円以下（正解）。ブッフェ×2＝6,000円で条件外（B✗）；定食B×2＝4,800円は4,000円以下ではない（D✗）；どの組み合わせも成立は誤り（C✗）。逐一算出是信息检索的正解路线。" },
  { t: "info", q: "ギガ制プランを使いたい人は、どの条件を満たすべきか？",
    passage: `<b>スマホ料金プラン</b><br>・スタンダード：月額2,980円／データ3GB<br>・ギガ制：月額4,980円／データ10GB（契約はオンラインのみ・解約は1年以内不可）<br>・ファミリー：月額6,980円／データ無制限（2回線以上から）`,
    opts: ["オンラインで契約し、1年以内に解約しない", "家族と2回線まとめて契約する", "3GB以下しか使わない", "オンラインか店頭かを選べる"], ans: 0,
    exp: "ギガ制の条件=オンラインのみ+1年縛り。Bはファミリーの条件、Cはスタンダード向き。" },
  { t: "info", q: "図書館で「貸出ができない」のはどの本か？",
    passage: `<b>市立図書館のお知らせ</b><br>・一般図書は2週間まで貸出可（1回のみ延長）。<br>・雑誌・新聞・参考書は館内閲覧のみ。<br>・CD・DVDは3日まで貸出可、延長不可。<br>・予約本は到着後3日以内に受け取らないと自動キャンセル。`,
    opts: ["雑誌", "一般の小説", "CD（貸出期間内）", "予約した本（到着済み）"], ans: 0,
    exp: "雑誌=館内閲覧のみで貸出不可。Cは期間内なら可、Dも期間内なら可。" },

  /* ===== 主张一致 5题 ===== */
  { t: "claim", q: "筆者の主張に最も近いものはどれか。",
    passage: `　毎日新しい言葉を100個覚えたとしても、復習しなければ一週間後にはほとんど残らない。大切なのは量ではなく、忘れる前に繰り返し思い出すことだ。だからこそ、少しずつでも毎日復習するほうが、新しいことを詰め込むより効果的である。`,
    opts: ["毎日復習するほうが新しい言葉を詰め込むより効果的だ", "100個ずつ覚えるのは非効率だからやめるべきだ", "一週間後に残るのはほとんど新しい言葉である", "量を増やせば忘れにくくなる"], ans: 0,
    exp: "末句「〜ほうが効果的である」が筆者主張。量より忘れる前の復習、を支える比較構文。" },
  { t: "claim", q: "筆者が最も言いたいことはどれか。",
    passage: `　リモートワークが広がる一方で、対面でしか得られない情報もある。雑談のついでに共有される社内の動きや、先輩の仕事の進め方を近くで見ることだ。だから、全面的なリモート化ではなく、出社と在宅を組み合わせる工夫が必要なのだろう。`,
    opts: ["出社と在宅を組み合わせる工夫が必要だ", "リモートワークは全面的に広げるべきだ", "対面でしか得られない情報は存在しない", "雑談は業務に必要な時間である"], ans: 0,
    exp: "「〜必要なのだろう」=筆者の主張。前文は根拠。Cは「ある」を「存在しない」にすり替えた干渉項。" },
  { t: "claim", q: "筆者の考えと合うものはどれか。",
    passage: `　初心者が楽器を習うとき、最初から長い曲を目指すと挫折しやすい。まずは数小節の短い区間を正確に弾けるようになり、それを積み重ねるほうが、結果的には遠回りに見えて近道なのである。`,
    opts: ["短い区間を正確に弾けるよう積み上げることが近道だ", "長い曲を目指したほうが上達は早い", "挫折する人は楽器をやめるべきだ", "数小節を弾けたら上級者と言える"], ans: 0,
    exp: "「遠回りに見えて近道」=核心比喻。Bは筆者と逆、Dは範囲過大。" },
  { t: "claim", q: "筆者の主張はどれか。",
    passage: `　多くの人は、意見が言える人は才能があると思う。しかし、意見を言えるかどうかは、事前にどれだけ調べて準備したかでほぼ決まる。準備さえしていれば、特別な才能がなくても十分に自分の考えを伝えられるのだ。`,
    opts: ["意見を言えるかどうかは準備でほぼ決まる", "意見を言う才能は一部の人にしかない", "伝え方より内容のほうが重要である", "準備しても言えない人は多い"], ans: 0,
    exp: "「〜でほぼ決まる」「十分に伝えられる」が主張。Bは筆者が否定する前提、Cの比較は文にない。" },
  { t: "claim", q: "筆者の态度として最も適切なものはどれか。",
    passage: `　AIに仕事を奪われるという不安の声もあるが、歴史的に見ても技術の進歩は新しい仕事を生んできた。問題は技術そのものではなく、使い方を決める人間の姿勢にあるのではないか。`,
    opts: ["技術の使い方を決める人間の姿勢が問題だ", "AIは確実に多くの仕事を奪う", "技術の進歩は不安を生まない", "AIの使い方を人間が決めるべきではない"], ans: 0,
    exp: "「〜ではないか」=婉曲な主張。Aが同内容。Bは筆者が懸念を示す側でない、Dは逆。" },

  /* ===== 短中篇 5题 ===== */
  { t: "short", q: "この文章の話題は何ですか。",
    passage: `　先週、会社の近くにできた新しいカフェに行ってみた。飲み物は普通の味だが、店内がとても静かで、仕事の合間に本を読むのにはちょうどよかった。値段も手頃だし、また利用したいと思う。`,
    opts: ["新しいカフェの利用感想", "会社の近くの飲食店の紹介", "仕事の合間に本を読むこと", "静かな場所での仕事の進め方"], ans: 0,
    exp: "味・静かさ・値段→感想を全部カバーするAが主旨。C・Dは内容の一部（以偏概全干扰）。" },
  { t: "short", q: "「そのような人」にあたる人はどんな人か。",
    passage: `　漢字の学習では、書き方を覚えることと、読む音を覚えることを分けたほうが効率的だ。つまり、そのような人は、一度にすべてを身につけようとしないのである。`,
    opts: ["一度にすべてを覚えようとしない人", "漢字の書き方だけを覚える人", "読む音を先に覚える人", "漢字の学習をやめている人"], ans: 0,
    exp: "「つまり」が結論を言い換える直後に定義あり。指示語の直後を探すのが定石。" },
  { t: "short", q: "筆者は子どもに親が教えることについてどう考えているか。",
    passage: `　宿題でわからないことがあると、親がすぐに答えを教えてしまうケースが多い。しかし、答えをすぐに教えてもらう経験が続くと、子どもは自分で考える力を十分に身につけられない。時には、わからなくてもそのままにしておくことも必要なのだ。`,
    opts: ["すぐに教えず、自分で考えさせることも必要だ", "親が積極的に教えてもらうべきだ", "宿題は親が一緒にやるべきだ", "わからなくても気にしないほうがよい"], ans: 0,
    exp: "「〜ことも必要だ」=筆者主張。Bは逆、D是曲解（不是不关心，是留白让其思考）。" },
  { t: "short", q: "「これ」が指しているのはどれか。",
    passage: `　企画書の提出期限が明日なのに、まだデータの集計が終わっていない。これで間に合うはずがない。まずは上司に相談し、期限の延長を申し出る必要がある。`,
    opts: ["データの集計が終わっていない状態", "企画書の提出期限が明日であること", "上司に相談すること", "期限を延長してもらうこと"], ans: 0,
    exp: "「これ」直前の文=集计未完成的状态。「これで間に合うはずがない」の主語は状態。" },
  { t: "short", q: "筆者がこの文章で最も伝えたいことは何ですか。",
    passage: `　旅行の計画を立てるとき、すべてを決めてしまうと、その通りにいかない場合にがっかりする。逆に、行き先だけを決めてあとは流されるようにすると、思いがけない発見を楽しむことができる。計画はあくまで参考程度にしておくにこしたことはない。`,
    opts: ["計画は参考程度にしておいたほうがよい", "旅行はしっかり計画すべきだ", "思いがけない発見はがっかりのもとだ", "行き先を決めるだけで十分だ"], ans: 0,
    exp: "末句「〜にこしたことはない」=主張。B与筆者相反、D过度（原文只说其余随意）。" }
];

/* ---------- 长难句拆解工具 ---------- */
function analyzeSentence(raw) {
  const text = (raw || "").trim();
  if (!text) return "请输入日文句子。";
  const conj = ["ところが", "しかし", "けれども", "けれど", "が", "また", "そして", "つまり", "なぜなら", "そのため", "その結果", "そこで", "すると", "一方", "むしろ", "ただし", "ちなみに", "なぜかというと"];
  const conjZh = { "しかし": "转折", "けれども": "转折", "けれど": "转折", "ところが": "意外转折", "が": "转折/接续", "また": "并列", "そして": "递进", "つまり": "总结", "なぜなら": "原因说明", "そのため": "因果", "その結果": "因果", "そこで": "顺承采取行动", "すると": "顺承结果", "一方": "对比", "むしろ": "对比", "ただし": "条件例外", "ちなみに": "补充", "なぜかというと": "自问说明" };
  const soshi = ["これ", "それ", "あれ", "この", "その", "あの", "こう", "そう", "あれ", "ここ", "そこ", "あれ"];
  const sentences = text.split(/[。．]/).map(s => s.trim()).filter(Boolean);
  const foundConj = [], foundSoshi = [];
  sentences.forEach(s => {
    conj.forEach(c => { if (s.includes(c) && c.length > 1 || (c === "が" && /[^ぁ-んa-zA-Zが]が[^ぁ-ん]/.test(s))) if (s.includes(c)) foundConj.push(c); });
    soshi.forEach(w => { if (s.includes(w) && !foundSoshi.includes(w)) foundSoshi.push(w); });
  });
  const uniq = a => [...new Set(a)];
  return `
    <div class="know-box"><h4>✂️ 拆解结果 · 共 ${sentences.length} 句</h4>
      <p><b>接続詞（逻辑线索）：</b>${uniq(foundConj).length ? uniq(foundConj).map(c => `<span class="badge red">${c} → ${conjZh[c] || "接续"}</span>`).join("") : '<span class="dim">未发现（注意が/ので隐性接续）</span>'}</p>
      <p class="mt"><b>指示词（指代线索）：</b>${uniq(foundSoshi).length ? uniq(foundSoshi).map(c => `<span class="badge gold">${c}…</span>`).join("") + '<br><span class="dim">→ 答案常在指代词前文，回原文找它指的名词</span>' : '<span class="dim">未发现</span>'}</p>
    </div>
    <div class="know-box"><h4>逐句读法</h4><ol>${sentences.map(s => `<li>${s}</li>`).join("")}</ol>
      <p class="dim" style="font-size:12px">口诀：先剥接续词定逻辑 → 指示词回指前文 → 主干（〜は〜だ）先抓，修饰语后放。</p></div>`;
}

/* ---------- 阅读页面 ---------- */
function readingPage() {
  const cnt = id => window.READ_QS.filter(x => x.t === id).length;
  const sessN = id => id === "short" ? 15 + Math.min(5, cnt(id)) : Math.min(10, cnt(id));
  h(`
    <div class="sec-title">阅读题型专项 · READING（自编题）</div>
    <div class="grid c4 mb">
      ${window.READ_TYPES.map(t => `
        <div class="pixel-panel module-card" style="cursor:pointer" onclick="buildReadSession('${t.id}')">
          <span class="ico">${t.ico}</span><h3>${t.name}</h3>
          <div class="mini-stat">题库${cnt(t.id)}题 · 每次${sessN(t.id)}题</div><p>${t.en}</p>
          <button class="pixel-btn blue small">开始${sessN(t.id)}题 ▶</button>
        </div>`).join("")}
    </div>
    <div class="pixel-panel mb">
      <div class="sec-title">📖 解题方法论 · 先懂套路再刷题</div>
      <div class="grid c2">
        ${Object.values(window.READ_KNOW).map(k => `<div class="know-box">${k}</div>`).join("")}
      </div>
    </div>
    <div class="pixel-panel sentence-tool">
      <div class="sec-title">✂️ 长难句拆解工具</div>
      <p class="dim mb" style="font-size:13px">粘贴日文长句 → 自动标出接续词逻辑、指示词指代、逐句结构（练3-4天明显提速）</p>
      <textarea id="senIn" placeholder="例：彼は毎日勉強しているのに、成績が上がらない。そこで、先生に相談した。"></textarea>
      <div class="center mt"><button class="pixel-btn primary" onclick="doAnalyze()">拆解分析 ✂</button>
      <button class="pixel-btn ghost" onclick="document.getElementById('senIn').value=''">清空</button></div>
      <div id="senOut" class="mt"></div>
    </div>`);
}
function doAnalyze() {
  beep("ok");
  document.getElementById("senOut").innerHTML = analyzeSentence(document.getElementById("senIn").value);
}

function readQuestion(t) {
  const meta = { mod: "阅读", q: t.q, opts: t.opts, ans: t.opts[t.ans], pass: t.passage || "" };
  return {
    meta,
    html: `<div class="q-panel">
      <div class="passage">${t.passage}</div>
      <p class="dim center mb" style="color:var(--pink)">❓ ${t.q}　<span class="badge">自编题</span></p>
      ${t.opts.map((o, i) => `<button class="opt" data-i="${i}">${o}</button>`).join("")}</div>`,
    mount() {
      app.querySelectorAll(".opt").forEach(b => b.onclick = () => {
        const i = +b.dataset.i;
        app.querySelectorAll(".opt").forEach((x, j) => { x.disabled = true; if (j === t.ans) x.classList.add("correct"); else if (j === i) x.classList.add("wrong"); });
        answer(i === t.ans, `<b>解析：</b>${t.exp}`);
      });
    }
  };
}
function buildReadSession(typeId) {
  const pool = window.READ_QS.filter(q => q.t === typeId);
  // 往年真题读解（未细分题型）集中进「短中篇」组
  const allRead = (window.REALQ_N2 || []).concat(window.REALQ_N2_EXT || []).filter(x => x.type === "read");
  const rk = x => x.q + "|" + (x.opts || [])[0];   // 同题干多题(最多x4)用首选项区分，避免共享key
  const realRead = typeId === "short" ? freshShuffle(allRead, rk, "read").slice(0, 15) : [];
  const selfQs = freshShuffle(pool, rk, "read").slice(0, typeId === "short" ? 5 : 10);
  saveRecent("read", [...realRead.map(rk), ...selfQs.map(rk)]);
  const qs = [...realRead.map(realQ), ...selfQs.map(readQuestion)];
  if (!qs.length) return toast("该题型题目准备中");
  const name = (window.READ_TYPES.find(t => t.id === typeId) || {}).name || "阅读";
  startSession({ qs, kind: "read", title: `阅读·${name}${realRead.length ? "（含真题）" : ""}`,
    build: () => buildReadSession(typeId),
    next: `<button class="pixel-btn primary" onclick="location.hash='#/practice/reading'">返回阅读专项</button>` });
}
