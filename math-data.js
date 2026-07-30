/* ============================================================
 * math-data.js — 数学小屋题库（三关递进）
 * 提供全局接口（供 script.js 调用）：
 *   MATH_LEVELS        关卡配置 [{id,name,icon}]
 *   makeMathQuestion(l) 生成题目 q
 *   mathOptions(ans)   四选一干扰项
 *   mathQuestionText(q) 中文朗读文本
 * 题目设计：
 *   l1 (10以内) 水果可视化，加法 / 减法随机
 *   l2 (20以内) 凑十法十格阵，纯加法
 *   l3 (100以内) 捆棒（十位📦/个位🟢），减法（不借位）
 * ============================================================ */

const MATH_LEVELS = [
  { id: 'l1', name: '10以内', icon: '🍎' },
  { id: 'l2', name: '20以内', icon: '🔟' },
  { id: 'l3', name: '100以内', icon: '📦' },
];

/* 水果 / 小物，用于 l1 可视化 */
const MATH_FRUITS = ['🍎', '🍊', '🍇', '🍓', '🍉', '🍌', '🍑', '🍒', '🥝', '🐟', '⭐', '🌸'];

function _ri(n) { return Math.floor(Math.random() * n); }
function _pick(arr) { return arr[_ri(arr.length)]; }
function _shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = _ri(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* 生成一道题：返回对象 q
 * 字段：level, type('add'|'sub'), a, b, total, sub, answer, fruit, tens, ones
 * 不同关卡使用不同字段，script.js 的 renderMathVisual / renderMathPlay 按需读取。
 */
function makeMathQuestion(level) {
  const fruit = _pick(MATH_FRUITS);

  if (level === 'l1') {
    // 10 以内：加法 / 减法各一半
    if (Math.random() < 0.5) {
      const a = 1 + _ri(9);            // 1..9
      const bMax = 10 - a;             // 保证 a+b <= 10
      const b = 1 + _ri(bMax);         // 1..bMax
      return { level, type: 'add', a, b, fruit, answer: a + b };
    } else {
      const total = 2 + _ri(9);        // 2..10
      const sub = 1 + _ri(total - 1);  // 1..total-1
      return { level, type: 'sub', total, sub, fruit, answer: total - sub };
    }
  }

  if (level === 'l2') {
    // 20 以内凑十法：十格显示 a 个（凑十），再加 b（剩下的）
    // 让 a+b 落在 11..19 区间，更能体现“先凑十再加”
    let a, b, sum;
    do {
      a = 1 + _ri(9);   // 十格填充 1..9
      b = 1 + _ri(9);   // 另一个加数 1..9
      sum = a + b;
    } while (sum < 11 || sum > 19);
    return { level, type: 'add', a, b, fruit, answer: sum };
  }

  // l3：100 以内捆棒减法（十位/个位），保证不借位
  const tens = 1 + _ri(9);     // 十位 1..9
  const ones = 1 + _ri(9);     // 个位 1..9（保证有借位空间）
  const total = tens * 10 + ones;
  const sub = 1 + _ri(ones);   // 1..ones（个位直接减，不借位）
  return { level, type: 'sub', total, sub, tens, ones, answer: total - sub };
}

/* 四选一干扰项：围绕正确答案上下浮动，均为非负整数且不重复 */
function mathOptions(answer) {
  const set = new Set([answer]);
  const deltas = [-3, -2, -1, 1, 2, 3];
  let guard = 0;
  while (set.size < 4 && guard++ < 50) {
    const cand = answer + _pick(deltas);
    if (cand >= 0) set.add(cand);
  }
  // 兜底：若仍不足 4 个（极端小答案），用 +1/+2 补足
  let k = 1;
  while (set.size < 4) {
    const cand = answer + k;
    if (cand !== answer) set.add(cand);
    k++;
  }
  return _shuffle([...set]);
}

/* 中文朗读文本 */
function mathQuestionText(q) {
  if (q.type === 'add') {
    return `${q.a} 加 ${q.b} 等于几`;
  }
  // 减法
  if (q.level === 'l1') {
    return `原来有 ${q.total} 个，拿走 ${q.sub} 个，还剩几个`;
  }
  return `${q.total} 减 ${q.sub} 等于几`;
}
