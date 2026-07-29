// ===== 导航切换 =====
const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');
const pageTitle = document.getElementById('pageTitle');

const titles = {
  home: '首页', shizi: '识字', english: '英语', math: '数学',
  poem: '古诗', read: '阅读', think: '思维', other: '其他'
};

function switchPage(name) {
  navItems.forEach(n => n.classList.toggle('active', n.dataset.page === name));
  pages.forEach(p => p.classList.toggle('active', p.id === 'page-' + name));
  pageTitle.textContent = titles[name] || '首页';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

navItems.forEach(item => {
  item.addEventListener('click', () => switchPage(item.dataset.page));
});

// 首页卡片跳转
document.querySelectorAll('.card[data-jump]').forEach(card => {
  card.addEventListener('click', () => switchPage(card.dataset.jump));
});

// ===== 识字闪卡数据 =====
const shiziData = [
  { word: '日', py: 'rì' }, { word: '月', py: 'yuè' }, { word: '水', py: 'shuǐ' },
  { word: '火', py: 'huǒ' }, { word: '木', py: 'mù' }, { word: '山', py: 'shān' },
  { word: '花', py: 'huā' }, { word: '鸟', py: 'niǎo' }, { word: '鱼', py: 'yú' },
  { word: '人', py: 'rén' }, { word: '口', py: 'kǒu' }, { word: '手', py: 'shǒu' }
];
const shiziGrid = document.getElementById('shiziGrid');
shiziData.forEach(d => {
  const el = document.createElement('div');
  el.className = 'flash';
  el.innerHTML = `<div class="big">${d.word}</div><div class="py">${d.py}</div>`;
  el.addEventListener('click', () => el.classList.toggle('flip'));
  shiziGrid.appendChild(el);
});

// ===== 英语单词卡 =====
const englishData = [
  { word: 'Apple', py: '苹果 🍎' }, { word: 'Cat', py: '猫 🐱' }, { word: 'Dog', py: '狗 🐶' },
  { word: 'Sun', py: '太阳 ☀️' }, { word: 'Star', py: '星星 ⭐' }, { word: 'Fish', py: '鱼 🐟' },
  { word: 'Book', py: '书 📖' }, { word: 'Tree', py: '树 🌳' }, { word: 'Milk', py: '牛奶 🥛' }
];
const englishGrid = document.getElementById('englishGrid');
englishData.forEach(d => {
  const el = document.createElement('div');
  el.className = 'flash';
  el.innerHTML = `<div class="big">${d.word}</div><div class="py">${d.py}</div>`;
  el.addEventListener('click', () => el.classList.toggle('flip'));
  englishGrid.appendChild(el);
});

// ===== 数学题目 =====
const mathQ = document.getElementById('mathQ');
const mathOptions = document.getElementById('mathOptions');
const mathFeedback = document.getElementById('mathFeedback');

function newMathQuestion() {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  const answer = a + b;
  mathQ.textContent = `${a} + ${b} = ?`;
  const opts = new Set([answer]);
  while (opts.size < 4) opts.add(answer + Math.floor(Math.random() * 7) - 3);
  const arr = [...opts].sort(() => Math.random() - 0.5);
  mathOptions.innerHTML = '';
  mathFeedback.textContent = '';
  arr.forEach(v => {
    const btn = document.createElement('button');
    btn.className = 'opt';
    btn.textContent = v;
    btn.addEventListener('click', () => {
      if (v === answer) {
        btn.classList.add('correct');
        mathFeedback.textContent = '🎉 答对啦，真聪明！';
        setTimeout(newMathQuestion, 1200);
      } else {
        btn.classList.add('wrong');
        mathFeedback.textContent = '再想想哦～';
      }
    });
    mathOptions.appendChild(btn);
  });
}
newMathQuestion();

// ===== 古诗 =====
const poemData = [
  { title: '春晓', author: '唐 · 孟浩然', text: '春眠不觉晓，处处闻啼鸟。\n夜来风雨声，花落知多少。' },
  { title: '静夜思', author: '唐 · 李白', text: '床前明月光，疑是地上霜。\n举头望明月，低头思故乡。' },
  { title: '咏鹅', author: '唐 · 骆宾王', text: '鹅，鹅，鹅，曲项向天歌。\n白毛浮绿水，红掌拨清波。' }
];
const poemList = document.getElementById('poemList');
poemData.forEach(p => {
  const el = document.createElement('div');
  el.className = 'poem';
  el.innerHTML = `<h3>${p.title}</h3><div class="author">${p.author}</div><p>${p.text.replace(/\n/g, '<br>')}</p>`;
  poemList.appendChild(el);
});

// ===== 思维题交互 =====
const thinkFeedback = document.getElementById('thinkFeedback');
document.querySelectorAll('#page-think .opt').forEach(opt => {
  opt.addEventListener('click', () => {
    if (opt.dataset.correct === 'true') {
      opt.classList.add('correct');
      thinkFeedback.textContent = '🎉 答对啦！小汽车不是水果～';
    } else {
      opt.classList.add('wrong');
      thinkFeedback.textContent = '再想想，这个是水果哦～';
    }
  });
});

// ===== 首页开始按钮 =====
document.querySelector('.hero .btn-primary').addEventListener('click', () => switchPage('shizi'));
