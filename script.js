/* ===== 恋恋开心学习养成岛 · 交互逻辑 ===== */

/* ---------- 存储 ---------- */
function load(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }
function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

let stars = load('ll_stars', 12);
function renderStars() { const el = document.getElementById('starCount'); if (el) el.textContent = stars; }

/* ---------- 设置状态 ---------- */
const settings = load('ll_settings', { fs: 1, tts: 'on', auto: 'on', sound: 'on' });
let ttsEnabled = settings.tts === 'on';
let autoReadSong = settings.auto === 'on';
let soundOn = settings.sound === 'on';

function applySettings() {
  document.documentElement.style.setProperty('--ts', settings.fs);
  ttsEnabled = settings.tts === 'on';
  autoReadSong = settings.auto === 'on';
  soundOn = settings.sound === 'on';
  markGroup(document.getElementById('fontBtns'), 'fs', settings.fs);
  markGroup(document.getElementById('ttsBtns'), 'v', settings.tts);
  markGroup(document.getElementById('autoBtns'), 'v', settings.auto);
  markGroup(document.getElementById('soundBtns'), 'v', settings.sound);
}
function markGroup(container, attr, val) {
  if (!container) return;
  container.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset[attr] === String(val)));
}

/* ---------- 音效 / 朗读 ---------- */
let audioCtx;
function beep() {
  if (!soundOn) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    o.type = 'sine'; o.frequency.value = 680;
    g.gain.setValueAtTime(0.06, audioCtx.currentTime);
    o.start(); o.stop(audioCtx.currentTime + 0.12);
  } catch (e) {}
}
/* 在线 TTS（tts.wangwangit.com · 微软 Edge 神经语音，音质更自然） */
const TTS_API = 'https://tts.wangwangit.com/v1/audio/speech';
function voiceForLang(lang) { return lang === 'en-US' ? 'en-US-JennyNeural' : 'zh-CN-XiaoxiaoNeural'; }
let onlineAudio = null;
function fetchTTS(text, lang) {
  return fetch(TTS_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input: text, voice: voiceForLang(lang), speed: 0.8, pitch: '0', style: 'general', volume: '0' })
  }).then(r => { if (!r.ok) throw new Error('TTS ' + r.status); return r.blob(); });
}
function speakFallback(text, lang) {
  if (!('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang || 'zh-CN'; u.rate = 0.85; u.pitch = 1.1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}
function speak(text, lang) {
  if (!ttsEnabled || !text) return;
  fetchTTS(text, lang).then(blob => {
    if (onlineAudio) { try { onlineAudio.pause(); } catch (e) {} }
    onlineAudio = new Audio(URL.createObjectURL(blob));
    onlineAudio.play().catch(() => speakFallback(text, lang));
  }).catch(() => speakFallback(text, lang));
}
function speakQueue(list, lang) {
  if (!ttsEnabled || !list.length) return;
  let i = 0;
  (function next() {
    if (i >= list.length) return;
    fetchTTS(list[i], lang).then(blob => {
      const a = new Audio(URL.createObjectURL(blob));
      a.onended = () => { i++; next(); };
      a.play().catch(() => { i++; next(); });
    }).catch(() => { i++; next(); });
  })();
}

/* ---------- 页面切换 ---------- */
const titles = { home: '首页', shizi: '识字乐园', english: '英语小屋', math: '数学城堡', poem: '古诗花园', read: '阅读小船', song: '儿歌角', think: '思维乐园', settings: '设置', other: '其他', draw: '涂鸦板', task: '亲子小任务' };
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const el = document.getElementById('page-' + id);
  if (el) el.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === id));
  const t = document.getElementById('pageTitle');
  if (t) t.textContent = titles[id] || '';
  beep();
  if (id === 'draw') resizeCanvas();
  window.scrollTo(0, 0);
}
document.querySelectorAll('.nav-item').forEach(b => b.addEventListener('click', () => showPage(b.dataset.page)));
document.querySelectorAll('[data-jump]').forEach(c => c.addEventListener('click', () => showPage(c.dataset.jump)));

/* ---------- 识字 ---------- */
const shiziData = {
  '动物': [['🐱', '猫', 'māo'], ['🐶', '狗', 'gǒu'], ['🐰', '兔', 'tù'], ['🐯', '虎', 'hǔ'], ['🐘', '象', 'xiàng'], ['🐼', '熊猫', 'xióng māo'], ['🐟', '鱼', 'yú'], ['🐤', '鸟', 'niǎo']],
  '水果': [['🍎', '苹果', 'píng guǒ'], ['🍌', '香蕉', 'xiāng jiāo'], ['🍓', '草莓', 'cǎo méi'], ['🍉', '西瓜', 'xī guā'], ['🍇', '葡萄', 'pú táo'], ['🍊', '橘子', 'jú zi']],
  '数字': [['1', '一', 'yī'], ['2', '二', 'èr'], ['3', '三', 'sān'], ['4', '四', 'sì'], ['5', '五', 'wǔ'], ['6', '六', 'liù'], ['7', '七', 'qī'], ['8', '八', 'bā'], ['9', '九', 'jiǔ'], ['10', '十', 'shí']],
  '自然': [['🌞', '太阳', 'tài yáng'], ['🌙', '月亮', 'yuè liang'], ['⭐', '星星', 'xīng xing'], ['🌈', '彩虹', 'cǎi hóng'], ['🌸', '花', 'huā'], ['🌳', '树', 'shù']]
};
let curCat = '动物';
function renderShiziTabs() {
  const wrap = document.getElementById('shiziTabs');
  wrap.innerHTML = '';
  Object.keys(shiziData).forEach(cat => {
    const b = document.createElement('button');
    b.className = 'tab' + (cat === curCat ? ' on' : '');
    b.textContent = cat;
    b.onclick = () => { curCat = cat; renderShiziTabs(); renderShiziGrid(); beep(); };
    wrap.appendChild(b);
  });
}
function renderShiziGrid() {
  const wrap = document.getElementById('shiziGrid');
  wrap.innerHTML = '';
  shiziData[curCat].forEach(([emoji, word, py]) => {
    const d = document.createElement('div');
    d.className = 'flash';
    d.innerHTML = `<div class="emoji">${emoji}</div><div class="big">${word}</div><div class="py">${py}</div>`;
    d.onclick = () => { speak(word); beep(); d.style.transform = 'scale(1.1)'; setTimeout(() => d.style.transform = '', 150); };
    wrap.appendChild(d);
  });
}
document.getElementById('shiziReadAll').onclick = () => speakQueue(shiziData[curCat].map(x => x[1]));

/* ---------- 字卡乐园（数据来自 shizileyuan，见 shizi-blocks.js） ---------- */
let blocksSet = BLOCKS.length ? BLOCKS[0].id : '';
let shiziMode = 'basic';
function renderShiziModeTabs() {
  document.querySelectorAll('#shiziModeTabs .tab').forEach(t => {
    t.classList.toggle('on', t.dataset.mode === shiziMode);
    t.onclick = () => {
      shiziMode = t.dataset.mode;
      document.getElementById('basicArea').style.display = shiziMode === 'basic' ? '' : 'none';
      document.getElementById('blocksArea').style.display = shiziMode === 'blocks' ? '' : 'none';
      renderShiziModeTabs(); beep();
    };
  });
}
function curBlocksSet() { return BLOCKS.find(s => s.id === blocksSet) || BLOCKS[0]; }
function renderBlocksSetTabs() {
  const wrap = document.getElementById('blocksSetTabs');
  if (!wrap) return;
  wrap.innerHTML = '';
  BLOCKS.forEach(s => {
    const b = document.createElement('button');
    b.className = 'tab sub' + (s.id === blocksSet ? ' on' : '');
    b.textContent = s.name;
    b.onclick = () => { blocksSet = s.id; renderBlocksSetTabs(); renderBlocksGrid(); beep(); };
    wrap.appendChild(b);
  });
}
function renderBlocksGrid() {
  const wrap = document.getElementById('blocksGrid');
  if (!wrap) return;
  wrap.innerHTML = '';
  const set = curBlocksSet();
  if (!set) return;
  set.chars.forEach(c => {
    const d = document.createElement('div');
    d.className = 'flash';
    d.innerHTML = `<div class="big">${c.char}</div><div class="py">${c.py}</div>`;
    d.onclick = () => { speak(c.char); beep(); openBlockModal(c); };
    wrap.appendChild(d);
  });
  const rd = document.getElementById('blocksReadAll');
  if (rd) rd.onclick = () => speakQueue(set.chars.map(c => c.char));
}
function openBlockModal(c) {
  const mask = document.getElementById('blocksModal');
  if (!mask) return;
  document.getElementById('bmChar').textContent = c.char;
  document.getElementById('bmPy').textContent = c.py;
  const ww = document.getElementById('bmWords');
  ww.innerHTML = '';
  c.words.forEach(w => {
    const b = document.createElement('button');
    b.className = 'word-chip';
    b.innerHTML = `${w.w}${w.p ? `<span class="wp">${w.p}</span>` : ''}`;
    b.onclick = () => speak(w.w);
    ww.appendChild(b);
  });
  document.getElementById('bmSent').onclick = () => speak(c.sent);
  mask.style.display = 'flex';
}
function closeBlockModal() { const m = document.getElementById('blocksModal'); if (m) m.style.display = 'none'; }

/* ---------- 英语（数据来自 pico-english，见 english-data.js） ---------- */
let enCat = EN_CATS.length ? EN_CATS[0].id : '';
let enLesson = '';
function enCurCat() { return EN_CATS.find(c => c.id === enCat) || EN_CATS[0]; }
function enCurLesson() {
  const c = enCurCat();
  if (!c) return null;
  return c.lessons.find(l => l.id === enLesson) || c.lessons[0];
}
function renderEnCats() {
  const wrap = document.getElementById('enCats');
  if (!wrap) return;
  wrap.innerHTML = '';
  EN_CATS.forEach(c => {
    const b = document.createElement('button');
    b.className = 'tab' + (c.id === enCat ? ' on' : '');
    b.textContent = c.icon + ' ' + c.name;
    b.onclick = () => { enCat = c.id; enLesson = ''; renderEnCats(); renderEnLessons(); beep(); };
    wrap.appendChild(b);
  });
}
function renderEnLessons() {
  const wrap = document.getElementById('enLessons');
  if (!wrap) return;
  const c = enCurCat();
  wrap.innerHTML = '';
  c.lessons.forEach(l => {
    const b = document.createElement('button');
    b.className = 'tab sub' + (l.id === (enCurLesson() && enCurLesson().id) ? ' on' : '');
    b.textContent = l.icon + ' ' + l.name;
    b.onclick = () => { enLesson = l.id; renderEnLessons(); renderEnWords(); beep(); };
    wrap.appendChild(b);
  });
}
function renderEnWords() {
  const wrap = document.getElementById('englishGrid');
  if (!wrap) return;
  const lesson = enCurLesson();
  wrap.innerHTML = '';
  if (!lesson) return;
  lesson.words.forEach(w => {
    const d = document.createElement('div');
    d.className = 'flash';
    d.innerHTML = `<div class="big">${w.en}</div><div class="py">${w.cn}</div><div class="en-spk">🔊</div>`;
    d.onclick = () => {
      speak(w.en, 'en-US'); beep();
      d.style.transform = 'scale(1.08)';
      setTimeout(() => d.style.transform = '', 150);
    };
    wrap.appendChild(d);
  });
  const rd = document.getElementById('enReadAll');
  if (rd) rd.onclick = () => speakQueue(lesson.words.map(w => w.en), 'en-US');
}

/* ---------- 数学：数一数 ---------- */
let curCount = 3;
function renderCount() {
  curCount = 2 + Math.floor(Math.random() * 6);
  document.getElementById('countShow').textContent = '🍎'.repeat(curCount);
  const opts = [curCount, curCount + 1, Math.max(1, curCount - 1), curCount + 2].sort(() => Math.random() - 0.5);
  const wrap = document.getElementById('countOpts');
  wrap.innerHTML = '';
  const fb = document.getElementById('countFeedback');
  fb.textContent = '';
  opts.forEach(n => {
    const b = document.createElement('button');
    b.className = 'opt'; b.textContent = n;
    b.onclick = () => {
      if (n === curCount) { b.classList.add('correct'); fb.textContent = '✅ 答对啦，真棒！'; speak('答对啦，真棒'); addStar(1); }
      else { b.classList.add('wrong'); fb.textContent = '再数一数哦～'; speak('再数一数'); }
      setTimeout(renderCount, 1200);
    };
    wrap.appendChild(b);
  });
}
function addStar(n) { stars += n; save('ll_stars', stars); renderStars(); }

/* ---------- 数学：加法 ---------- */
function renderMath() {
  const a = 1 + Math.floor(Math.random() * 9), b = 1 + Math.floor(Math.random() * 9);
  const ans = a + b;
  document.getElementById('mathQ').textContent = `${a} + ${b} = ?`;
  const opts = [ans, ans + 1, ans - 1, ans + 2].filter(x => x >= 0).sort(() => Math.random() - 0.5);
  const wrap = document.getElementById('mathOptions');
  wrap.innerHTML = '';
  const fb = document.getElementById('mathFeedback'); fb.textContent = '';
  opts.forEach(n => {
    const b = document.createElement('button');
    b.className = 'opt'; b.textContent = n;
    b.onclick = () => {
      if (n === ans) { b.classList.add('correct'); fb.textContent = '✅ 真聪明！'; speak('真聪明'); addStar(1); }
      else { b.classList.add('wrong'); fb.textContent = '再想想～'; speak('再想想'); }
      setTimeout(renderMath, 1200);
    };
    wrap.appendChild(b);
  });
}

/* ---------- 古诗（数据来自 chinese-poetry 唐诗三百首，见 poems-data.js） ---------- */
const POEM_CATS = ['启蒙精选', '五言绝句', '七言绝句', '五言律诗', '七言律诗', '全部'];
const POEM_PAGE = 12;
let poemCat = '启蒙精选';
let poemShown = POEM_PAGE;
function poemsOfCat() {
  const all = (typeof POEMS !== 'undefined') ? POEMS : [];
  if (poemCat === '启蒙精选') return all.filter(p => p.s);
  if (poemCat === '全部') return all;
  return all.filter(p => p.c === poemCat);
}
function renderPoemTabs() {
  const wrap = document.getElementById('poemTabs');
  if (!wrap) return;
  wrap.innerHTML = '';
  POEM_CATS.forEach(cat => {
    const b = document.createElement('button');
    b.className = 'tab' + (cat === poemCat ? ' on' : '');
    b.textContent = cat;
    b.onclick = () => { poemCat = cat; poemShown = POEM_PAGE; renderPoemTabs(); renderPoems(); beep(); };
    wrap.appendChild(b);
  });
}
function renderPoems() {
  const wrap = document.getElementById('poemList');
  if (!wrap) return;
  wrap.innerHTML = '';
  const list = poemsOfCat();
  list.slice(0, poemShown).forEach(po => {
    const d = document.createElement('div');
    d.className = 'poem';
    const lines = po.p.map(l => `<p>${l}</p>`).join('');
    d.innerHTML = `<h3>${po.t} <span class="poem-read">🔊</span></h3><div class="author">${po.a}</div>${lines}`;
    d.onclick = () => speak(po.t + '。' + po.p.join(''));
    wrap.appendChild(d);
  });
  const more = document.getElementById('poemMore');
  if (more) {
    more.style.display = poemShown < list.length ? '' : 'none';
    more.onclick = () => { poemShown += POEM_PAGE; renderPoems(); beep(); };
  }
}

/* ---------- 阅读 ---------- */
document.getElementById('readStory').onclick = () => speak('小熊走呀走，遇见了小兔、小鸟和小鹿，大家一起做游戏，开心极了！');

/* ---------- 儿歌角 ---------- */
const songData = [
  { t: '小星星', e: '⭐', l: '一闪一闪亮晶晶，\n满天都是小星星，\n挂在天上放光明，\n好像许多小眼睛。' },
  { t: '两只老虎', e: '🐯', l: '两只老虎，两只老虎，\n跑得快，跑得快，\n一只没有耳朵，\n一只没有尾巴，\n真奇怪，真奇怪。' },
  { t: '找朋友', e: '🤝', l: '找呀找呀找朋友，\n找到一个好朋友，\n敬个礼，握握手，\n你是我的好朋友。' },
  { t: '小兔子乖乖', e: '🐰', l: '小兔子乖乖，把门儿开开，\n快点儿开开，我要进来。\n不开不开我不开，\n妈妈没回来，谁来也不开。' },
  { t: '数鸭子', e: '🦆', l: '门前大桥下，\n游过一群鸭，\n快来快来数一数，\n二四六七八。' },
  { t: '拔萝卜', e: '🥕', l: '拔萝卜，拔萝卜，\n嘿哟嘿哟拔萝卜，\n老婆婆，快快来，\n快来帮我们拔萝卜。' }
];
function renderSongs() {
  const wrap = document.getElementById('songList');
  wrap.innerHTML = '';
  songData.forEach(s => {
    const d = document.createElement('div');
    d.className = 'song';
    d.innerHTML = `<div class="song-emoji">${s.e}</div><h3>${s.t}</h3>`;
    d.onclick = () => {
      beep();
      document.getElementById('songDetail').style.display = 'block';
      document.getElementById('songTitle').textContent = s.t;
      document.getElementById('songLyrics').textContent = s.l;
      if (autoReadSong) speak(s.t + '。' + s.l.replace(/\n/g, '。'));
    };
    wrap.appendChild(d);
  });
}
document.getElementById('songPlay').onclick = () => {
  const t = document.getElementById('songTitle').textContent;
  const l = document.getElementById('songLyrics').textContent.replace(/\n/g, '。');
  speak(t + '。' + l);
};

/* ---------- 思维 ---------- */
document.querySelectorAll('#page-think .opt').forEach(o => {
  o.onclick = () => {
    if (o.dataset.correct === 'true') { o.classList.add('correct'); document.getElementById('thinkFeedback').textContent = '✅ 答对啦！'; speak('答对啦'); addStar(1); }
    else { o.classList.add('wrong'); document.getElementById('thinkFeedback').textContent = '再想一想～'; speak('再想一想'); }
  };
});

/* ---------- 设置面板 ---------- */
document.getElementById('fontBtns').addEventListener('click', e => {
  if (e.target.dataset.fs) { settings.fs = parseFloat(e.target.dataset.fs); save('ll_settings', settings); applySettings(); }
});
document.getElementById('ttsBtns').addEventListener('click', e => {
  if (e.target.dataset.v) { settings.tts = e.target.dataset.v; save('ll_settings', settings); applySettings(); if (settings.tts === 'on') speak('点读发音已打开'); }
});
document.getElementById('autoBtns').addEventListener('click', e => {
  if (e.target.dataset.v) { settings.auto = e.target.dataset.v; save('ll_settings', settings); applySettings(); }
});
document.getElementById('soundBtns').addEventListener('click', e => {
  if (e.target.dataset.v) { settings.sound = e.target.dataset.v; save('ll_settings', settings); applySettings(); if (settings.sound === 'on') beep(); }
});
document.getElementById('resetStars').onclick = () => { stars = 0; save('ll_stars', stars); renderStars(); };

/* ---------- 涂鸦板 ---------- */
const canvas = document.getElementById('paint');
const ctx = canvas.getContext('2d');
let painting = false, lastX = 0, lastY = 0, curColor = '#ff7a7a';
function setPen() { ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 6; ctx.strokeStyle = curColor; }
function resizeCanvas() {
  const r = canvas.getBoundingClientRect();
  if (!r.width) return;
  canvas.width = r.width * devicePixelRatio;
  canvas.height = r.height * devicePixelRatio;
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  setPen();
}
function pos(e) { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
canvas.addEventListener('pointerdown', e => { painting = true; const p = pos(e); lastX = p.x; lastY = p.y; });
canvas.addEventListener('pointermove', e => {
  if (!painting) return;
  const p = pos(e);
  ctx.beginPath(); ctx.moveTo(lastX, lastY); ctx.lineTo(p.x, p.y); ctx.stroke();
  lastX = p.x; lastY = p.y;
});
canvas.addEventListener('pointerup', () => painting = false);
canvas.addEventListener('pointerleave', () => painting = false);
document.querySelectorAll('.swatch').forEach(s => {
  s.onclick = () => {
    curColor = s.dataset.c; setPen();
    document.querySelectorAll('.swatch').forEach(x => x.classList.remove('on'));
    s.classList.add('on'); beep();
  };
});
document.getElementById('paintClear').onclick = () => {
  canvas.width = canvas.width; setPen(); beep();
};

/* ---------- 亲子小任务 ---------- */
const taskData = ['自己刷牙', '收拾玩具', '读一本绘本', '唱一首儿歌', '画一幅画', '和妈妈说我爱你'];
let taskDone = load('ll_tasks', {});
function renderTasks() {
  const wrap = document.getElementById('taskList');
  wrap.innerHTML = '';
  taskData.forEach((name, i) => {
    const done = !!taskDone[i];
    const d = document.createElement('div');
    d.className = 'task-item' + (done ? ' done' : '');
    d.innerHTML = `<div class="tick">${done ? '✓' : ''}</div><div class="task-text">${name}</div>`;
    d.onclick = () => {
      if (taskDone[i]) { delete taskDone[i]; addStar(-1); }
      else { taskDone[i] = true; addStar(1); speak('真棒'); }
      save('ll_tasks', taskDone); renderTasks();
    };
    wrap.appendChild(d);
  });
}

/* ---------- 初始化 ---------- */
applySettings();
renderStars();
renderShiziTabs(); renderShiziGrid();
renderShiziModeTabs(); renderBlocksSetTabs(); renderBlocksGrid();
renderEnCats(); renderEnLessons(); renderEnWords();
renderCount(); renderMath();
renderPoemTabs(); renderPoems();
renderSongs();
renderTasks();

/* 字卡详情弹窗关闭 */
const bmClose = document.getElementById('blocksModalClose');
if (bmClose) bmClose.onclick = closeBlockModal;
const bmMask = document.getElementById('blocksModal');
if (bmMask) bmMask.onclick = e => { if (e.target === bmMask) closeBlockModal(); };
