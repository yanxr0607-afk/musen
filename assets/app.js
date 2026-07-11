/* =========================================================================
 * OPC 一人公司赛道选型 SaaS（AI增强·双模式版）—— 前端应用逻辑
 * 模式一：对话框式 AI 顾问（3 轮出结果，引流）
 * 模式二：问卷式精准测评（分两阶：快速 6 题 + 精准 6 题，付费转化）
 * ========================================================================= */
(function () {
  'use strict';

  const STEPS = ['首页', '智能测评', '匹配结果', '赛道详情', '开通会员', '落地工具'];
  const UNLOCKED = ['basic', 'pro', 'vip'];

  /* 运营配置（OPS）：后台可配的 banner 轮播 / 弹窗 / AI 话术，前端实时展示 */
  const OPS_DEFAULT = {
    banner: { enabled: false, slides: [] },
    popup: { enabled: false, once: true, trigger: 'load', title: '', content: '', btnText: '', btnLink: '' },
    ai: { opening: '', examples: [], systemExtra: '' },
  };
  let OPS = JSON.parse(JSON.stringify(OPS_DEFAULT));
  let pendingPlan = null;

  /* 支付页配置（PAY）：后台上传的微信/支付宝收款码、提示语、客服微信，前端展示 */
  const PAY_DEFAULT = { enabled: false, wechatQR: '', alipayQR: '', note: '付款后添加客服微信，手动开通会员权限', csWechat: '' };
  let PAY = JSON.parse(JSON.stringify(PAY_DEFAULT));

  /* 后端基地址：默认同源（前端由 server.js 托管时无需配置）。
     若前端静态托管在别处（如 CloudStudio / GitHub Pages），而 server.js 单独部署，
     可在 index.html 里加 <meta name="api-base" content="https://你的后端域名"> 指向后端。 */
  const API_BASE = (function () {
    try {
      const m = document.querySelector('meta[name="api-base"]');
      if (m && m.content) return m.content.replace(/\/+$/, '');
    } catch (e) {}
    return (window.__API_BASE || '').replace(/\/+$/, '');
  })();
  function apiFetch(path, opts) { return fetch((API_BASE || '') + path, opts); }
  let backendOnline = false;

  /* 数据源：后台可用时优先用服务端数据，否则回退本地 data.js */
  let LIVE = { tracks: null, cases: null };
  function liveTracks() { return LIVE.tracks || (window.__BUNDLE_TRACKS || []); }
  function liveCases() { return LIVE.cases || (window.__BUNDLE_CASES || []); }
  async function loadServerContent() {
    try {
      const [a, b] = await Promise.all([
        apiFetch('/api/tracks').then(r => r.ok ? r.json() : null).catch(() => null),
        apiFetch('/api/cases').then(r => r.ok ? r.json() : null).catch(() => null),
      ]);
      if (a && Array.isArray(a.tracks) && a.tracks.length) LIVE.tracks = a.tracks;
      if (b && Array.isArray(b.cases) && b.cases.length) LIVE.cases = b.cases;
    } catch (e) { /* 后端不可用时静默回退本地数据 */ }
  }
  /* 后台上报：注册 / 测评完成（后端不可用则静默忽略）。register 时可附带密码哈希 */
  function reportEvent(type, name, pwd) {
    try {
      const body = type === 'register'
        ? { name: name, membership: state.membership, pwd: pwd || undefined }
        : { type: type, name: name };
      apiFetch('/api/' + (type === 'register' ? 'register' : 'event'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).catch(() => {});
    } catch (e) {}
  }

  const state = {
    mode: 'quiz',            // 'chat' | 'quiz'
    chatStep: 0,
    chatAnswers: {},
    quizStage: 1,            // 1 | 2
    quizStep: 0,
    answers: {},
    results: [],
    resultMode: 'quick',     // 'quick' | 'full'
    currentTrack: null,
    caseFilter: 'all',
    membership: loadMembership(),
    user: loadUser(),
    pendingAction: null,
    chatHasResult: false,
  };

  function loadMembership() { return localStorage.getItem('opc_membership') || 'none'; }
  function isUnlocked() { return UNLOCKED.includes(state.membership); }
  /* 安全网：有账号但 membership 异常时，回退到 free */
  function ensureValidMembership() {
    if (!state.user) return;                       // 没注册，不处理
    const valid = PLANS.map(p => p.id);            // ['free','basic','pro','vip']
    if (!valid.includes(state.membership)) {
      state.membership = 'free';
      localStorage.setItem('opc_membership', 'free');
    }
  }

  /* 账号体系（纯前端 localStorage，无后端；分享链接可直接用） */
  function loadUser() { try { return JSON.parse(localStorage.getItem('opc_user') || 'null'); } catch (e) { return null; } }
  function isRegistered() { return !!state.user; }
  function saveUser(u) { state.user = u; try { localStorage.setItem('opc_user', JSON.stringify(u)); } catch (e) {} renderAccount(); refreshMemberLabel(); }
  function logoutUser() { state.user = null; try { localStorage.removeItem('opc_user'); } catch (e) {} renderAccount(); refreshMemberLabel(); if (isUnlocked()) { renderHome(); } }
  function refreshMemberLabel() {
    const ml = $('#mnav-member-label'); if (!ml) return;
    const plan = PLANS.find(p => p.id === state.membership);
    if (plan) ml.textContent = plan.name;                 // 免费版/基础版/专业版/高端版，按当前套餐名显示
    else if (isRegistered()) ml.textContent = '升级会员';
    else ml.textContent = '开通会员';
    // 底部 TabBar 会员标签（付费套餐显示套餐名，其余统一「会员」）
    const tml = $('#tabbar-member-label');
    if (tml) tml.textContent = (plan && state.membership !== 'free') ? plan.name : '会员';
  }

  /* 向服务端同步会员状态：后台人工开通后，前端自动感知并更新 localStorage */
  async function syncMembership() {
    if (!state.user) return;   // 未登录不请求
    try {
      const resp = await apiFetch('/api/user/profile?name=' + encodeURIComponent(state.user.name));
      if (!resp || !resp.ok) return;
      const res = await resp.json().catch(() => null);
      if (!res || !res.membership) return;
      const serverMem = res.membership;
      if (serverMem !== state.membership) {
        const prev = state.membership;
        state.membership = serverMem;
        localStorage.setItem('opc_membership', serverMem);
        refreshMemberLabel();
        renderHome();
        toast('🎉 会员状态已更新：' + (PLANS.find(p => p.id === serverMem) || {}).name);
        console.log('[sync] membership changed: ' + prev + ' → ' + serverMem);
      }
    } catch(e) { /* 离线或后端不可达时静默 */ }
  }

  /* 账号密码（本地存储，演示用轻量哈希；生产环境应由后端用 bcrypt/argon2 存储） */
  function hashPwd(name, pass) {
    // 以昵称作盐：相同密码、不同账号哈希不同；同步实现，兼容非安全上下文（http 局域网）
    const s = String(name) + ':' + String(pass);
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
    return 'h' + h.toString(16);
  }
  function loadAccounts() { try { return JSON.parse(localStorage.getItem('opc_accounts') || '{}'); } catch (e) { return {}; } }
  function saveAccounts(a) { try { localStorage.setItem('opc_accounts', JSON.stringify(a)); } catch (e) {} }

  /* 强制注册：游客访问核心功能时拦截，弹注册框；注册成功后自动执行挂起动作 */
  function requireRegister(after) {
    if (isRegistered()) return true;
    state.pendingAction = typeof after === 'function' ? after : null;
    openRegister();
    toast('请先注册，注册即免费会员 🎁');
    return false;
  }
  /* 测试入口守卫：访客可免费体验 1 次，注册用户每日 3 次，会员不限 */
  function enterTestGuard() {
    if (state.user) {
      if (!canTest()) { showTestLimit(); return false; }
      return true;
    }
    if (dailyTestLeft() > 0) return true;             // 访客还有 1 次体验
    toast('注册即免费会员，每日可测评 3 次 🎁');
    openRegister();
    return false;
  }

  /* 免费版每日配额（按自然日重置，localStorage 存 日期+次数）
     1) 智能测评 / 匹配测试：每日 3 次（AI 顾问对话 + 问卷测评 合计）
     2) 每日商机"查看赛道详情"：每日 3 条 */
  const FREE_TEST_LIMIT = 3;          // 注册免费会员：每日 3 次测评
  const GUEST_TEST_LIMIT = 1;         // 未注册访客：终身 1 次体验
  const DAILY_DETAIL_LIMIT = 3;
  function todayKey() {
    const d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }
  function loadDailyQuota(key) {
    try {
      const raw = localStorage.getItem('opc_daily_' + key);
      if (!raw) return { date: todayKey(), count: 0 };
      const o = JSON.parse(raw);
      return o && o.date === todayKey() ? o : { date: todayKey(), count: 0 };
    } catch (e) { return { date: todayKey(), count: 0 }; }
  }
  function saveDailyQuota(key, count) {
    try { localStorage.setItem('opc_daily_' + key, JSON.stringify({ date: todayKey(), count })); } catch (e) {}
  }
  function guestTestUsed() { try { return +(localStorage.getItem('opc_guest_test_used') || 0); } catch (e) { return 0; } }
  function markGuestTest() { try { localStorage.setItem('opc_guest_test_used', '1'); } catch (e) {} }
  /* —— 智能测评 / 匹配测试 —— */
  function dailyTestLeft() {
    if (isUnlocked()) return Infinity;                                       // 会员不限次
    if (state.user) return Math.max(0, FREE_TEST_LIMIT - loadDailyQuota('test').count); // 注册免费版：每日 3 次
    return Math.max(0, GUEST_TEST_LIMIT - guestTestUsed());                 // 访客：终身 1 次
  }
  function canTest() { return isUnlocked() || dailyTestLeft() > 0; }
  function consumeTestQuota() {
    if (isUnlocked()) return;                                                // 会员不限次
    if (state.user) { const o = loadDailyQuota('test'); saveDailyQuota('test', Math.min(FREE_TEST_LIMIT, o.count + 1)); }
    else { markGuestTest(); }                                                // 访客用掉终身 1 次
  }
  function showTestLimit() {
    if (!state.user) { toast('注册即免费会员，每日可测评 3 次 🎁'); openRegister(); return; }
    toast('免费版今日测评已用完（每日 3 次）· 开通会员畅测全部赛道 🚀');
    openMembership();
  }
  /* —— 每日商机"查看赛道详情" —— */
  function dailyDetailLeft() { return isUnlocked() ? Infinity : Math.max(0, DAILY_DETAIL_LIMIT - loadDailyQuota('detail').count); }
  function canOpenDailyDetail() { return isUnlocked() || dailyDetailLeft() > 0; }
  function consumeDetailQuota() {
    if (isUnlocked()) return;                       // 会员不限次
    const o = loadDailyQuota('detail');
    saveDailyQuota('detail', Math.min(DAILY_DETAIL_LIMIT, o.count + 1));
  }
  function showDailyDetailLimit() {
    toast('免费版今日商机详情已看完（每日 3 条）· 开通会员解锁全部赛道 🚀');
    openMembership();
  }
  /* 访客测评结果页引导小字（仅未注册显示） */
  function guestTestHintHTML() {
    if (state.user) return '';
    return `<div class="guest-test-hint">🎁 你已免费体验 1 次测评 · <b>注册即免费会员，每日可测 3 次</b>，还能解锁落地工具与每日商机<button class="guest-go-register" type="button">立即注册 →</button></div>`;
  }
  function bindGuestHint(root) {
    const btn = (root || document).querySelector('.guest-go-register');
    if (btn) btn.addEventListener('click', openRegister);
  }

  /* 浏览量上报：每个浏览器会话计 1 次（sessionStorage 去重避免自刷暴涨） */
  // 浏览量改为不蒜子(busuanzi)前端计数，零后端，静态托管即可显示
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  function h(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
  function fmtMoney(n) { return '¥' + Number(n).toLocaleString('zh-CN'); }
  function arr(v) { return Array.isArray(v) ? v : (v == null ? [] : [v]); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  /* AI 话术（运营后台可配，回退本地 CHAT 默认值） */
  function getOpening() { return (OPS.ai && OPS.ai.opening) || CHAT.opening; }
  function getExamples() { return (OPS.ai && Array.isArray(OPS.ai.examples) && OPS.ai.examples.length) ? OPS.ai.examples : CHAT.examples; }
  function getSystemExtra() { return (OPS.ai && OPS.ai.systemExtra) || ''; }

  /* ====================== 扁平化图标系统（内联 SVG，单色描边） ====================== */
  const ICONS = {
    message: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
    clipboard: '<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1"/><path d="M9 11h6"/><path d="M9 15h4"/>',
    layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
    toolbox: '<path d="M14.7 6.3a4 4 0 0 1-5.4 5.4L3 19v2h2l7.3-6.3a4 4 0 0 1 5.4-5.4l-2.6 2.6-2-2 2.6-2.6z"/>',
    cpu: '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3"/><path d="M15 1v3"/><path d="M9 20v3"/><path d="M15 20v3"/><path d="M20 9h3"/><path d="M20 14h3"/><path d="M1 9h3"/><path d="M1 14h3"/>',
    home: '<path d="M3 11.5 12 3l9 8.5"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/>',
    rocket: '<path d="M5 15c-1.5 1.8-2 5-2 5s3.2-.5 5-2"/><path d="M9.5 13.5 7 16"/><path d="M9 14l3-3a9 9 0 0 0 6-8 9 9 0 0 0-8 6l-3 3"/><path d="M14.5 4.5a2.5 2.5 0 0 0 3.5 3.5"/><circle cx="14.5" cy="9.5" r="1.3"/>',
    zap: '<polygon points="13 2 4 14 12 14 11 22 20 10 12 10 13 2"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4"/>',
    'bar-chart': '<line x1="6" y1="20" x2="6" y2="11"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="18" y1="20" x2="18" y2="14"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    unlock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    'refresh-cw': '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    'alert-triangle': '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    flame: '<path d="M12 2c.8 2.8 3.5 4 3.5 7.5a3.5 3.5 0 0 1-7 0c0-.9.4-1.7 1-2.5C9.5 9 11 8 12 7c.5 1.5 1.5 2 2.5 2C13 5.5 12 3.5 12 2z"/>',
    'trending-up': '<polyline points="3 17 9 11 13 15 21 7"/><polyline points="15 7 21 7 21 13"/>',
    'arrow-right': '<line x1="4" y1="12" x2="20" y2="12"/><polyline points="13 5 20 12 13 19"/>',
    brain: '<path d="M12 5a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 3 2z"/><path d="M12 5a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-3 2"/>',
    tool: '<path d="M14.7 6.3a4 4 0 0 1-5.4 5.4L3 19v2h2l7.3-6.3a4 4 0 0 1 5.4-5.4l-2.6 2.6-2-2 2.6-2.6z"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/>',
    puzzle: '<path d="M9 3a2 2 0 0 1 4 0v1h3a2 2 0 0 1 2 2v3h1a2 2 0 0 1 0 4h-1v3a2 2 0 0 1-2 2h-3v-1a2 2 0 0 0-4 0v1H6a2 2 0 0 1-2-2v-3H3a2 2 0 0 1 0-4h1V6a2 2 0 0 1 2-2h3V3z"/>',
    crown: '<path d="M2 18h20l-2-9-5 4-3-7-3 7-5-4z"/><line x1="2" y1="18" x2="22" y2="18"/>',
    sparkle: '<path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
    search: '<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    'book-open': '<path d="M2 3h7a2 2 0 0 1 2 2v14a2 2 0 0 0 2-2h7a2 2 0 0 1 2 2v-14a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2z"/><path d="M2 3v16"/><path d="M22 3v16"/>'
  };
  function icon(name, size) {
    size = size || 20;
    const p = ICONS[name]; if (!p) return '';
    return '<svg class="ico" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
  }
  function mountIcons(root) {
    (root || document).querySelectorAll('[data-icon]').forEach(function (el) {
      const n = el.getAttribute('data-icon');
      const s = +el.getAttribute('data-size') || 20;
      el.innerHTML = icon(n, s);
    });
  }

  /* ====================== 匹配引擎（分层打分制） ====================== */
  function computeMatch(answers) {
    const persona = answers.persona;
    const maxCapital = answers.capital
      ? ({ '500': 500, '3000': 3000, '10000': 10000, '10001': Infinity }[answers.capital]) : Infinity;
    const tolerance = answers.risk ? +answers.risk : 2;
    const userSkills = arr(answers.skills).filter(v => v !== 'none');
    const userRes = arr(answers.resources).filter(v => v !== 'none');
    const userAi = answers.ai ? +answers.ai : 2;
    const workMode = answers.workmode || 'online';
    const target = answers.income ? +answers.income : 8000;
    const maxPay = answers.payback ? +answers.payback : 6;
    const focus = answers.focus || 'easy';

    let pool = liveTracks().filter(t => t.capital <= maxCapital && t.risk <= tolerance);
    if (pool.length < 3) pool = liveTracks().filter(t => t.capital <= maxCapital && t.risk <= tolerance + 1);
    if (pool.length < 3) pool = liveTracks().slice();

    const scored = pool.map(track => {
      const personaScore = track.target.includes(persona) ? 1 : 0.35;
      const skill = userSkills.length === 0 ? (track.skills.length === 0 ? 0.85 : 0.5)
        : Math.min(1, 0.4 + 0.6 * (track.skills.filter(s => userSkills.includes(s)).length / userSkills.length));
      const resource = userRes.length === 0 ? (track.resourcesIdeal.length === 0 ? 0.8 : 0.5)
        : (track.resourcesIdeal.length === 0 ? 0.8 : Math.min(1, 0.4 + 0.6 * (track.resourcesIdeal.filter(r => userRes.includes(r)).length / track.resourcesIdeal.length)));
      const income = Math.max(0.4, Math.min(1, ((track.incomeMin + track.incomeMax) / 2) / target));
      const payback = track.paybackMax <= maxPay ? 1 : 0.5;
      const ai = userAi >= track.aiReq ? 1 : 0.5 + 0.3 * (userAi / track.aiReq);
      const wm = track.workMode === workMode ? 1 : 0.6;

      let score = 40 * personaScore + 60 * (0.25 * skill + 0.15 * resource + 0.20 * income + 0.15 * payback + 0.15 * ai + 0.10 * wm);
      if (focus === 'easy' && track.capital <= 500) score += 4;
      if (focus === 'income' && track.incomeMax >= 20000) score += 4;
      if (focus === 'stable' && track.risk <= 1) score += 4;
      if (focus === 'grow' && (track.resourcesIdeal.length || track.skills.length >= 2)) score += 3;
      score = Math.min(99, Math.round(score));

      return { track, score, dims: { skill, resource, income, payback, ai, wm, persona: personaScore } };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 3).map(s => ({ track: s.track, score: s.score, reasons: buildReasons(s, answers) }));
  }

  function buildReasons(s, answers) {
    const { track, dims } = s; const r = [];
    if (dims.persona >= 1) r.push(`与你的身份高度契合`);
    if (dims.skill >= 0.85) r.push(`所需技能匹配你的核心优势`);
    if (track.capital <= 500) r.push(`启动仅 ${fmtMoney(track.capital)}，门槛低`);
    if (dims.income >= 0.9) r.push(`月收益上限 ${track.incomeMax.toLocaleString()} 元，覆盖目标`);
    if (dims.ai >= 1) r.push(`AI 门槛与你的熟练度匹配`);
    if (dims.payback >= 1) r.push(`回本约 ${track.paybackLabel}，符合预期`);
    return r.slice(0, 3);
  }

  /* ====================== 视图路由 ====================== */
  function showView(id) {
    $$('.view').forEach(v => v.classList.remove('is-active'));
    const view = $('#view-' + id);
    if (view) view.classList.add('is-active');
    const idx = STEPS.indexOf(id === 'home' ? '首页' : id === 'chat' || id === 'quiz' ? '智能测评'
      : id === 'result' ? '匹配结果' : id === 'detail' ? '赛道详情'
      : id === 'tools' ? '落地工具' : '首页');
    renderStepper(idx);
    setModuleActive(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function getCurrentView() {
    const v = $$('.view').find(x => x.classList.contains('is-active'));
    return v ? v.id.replace('view-', '') : 'home';
  }
  function setModuleActive(view) {
    const map = { home: 'home', chat: 'assess', quiz: 'assess', result: 'assess', detail: 'assess', tools: 'assess', daily: 'daily', cases: 'cases', member: 'member' };
    const active = map[view] || 'home';
    $$('.mnav-item, .tabbar-item').forEach(b => b.classList.toggle('active', b.dataset.go === active));
  }
  function goHome() {
    state.answers = {}; state.chatAnswers = {};
    renderHome(); showView('home');
  }
  /* 顶部 + 底部 TabBar 共用的导航逻辑 */
  function handleNav(go) {
    if (go === 'home') { goHome(); }
    else if (go === 'assess') {
      if (!$('#view-home').classList.contains('is-active')) showView('home');
      setModuleActive('assess');
      const el = document.getElementById('section-modes');
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'auto', block: 'start' }), 60);
    }
    else if (go === 'daily') { openDaily(); }
    else if (go === 'cases') { openCases(); }
    else if (go === 'member') { openMembership(); }
  }
  function renderStepper(activeIdx) {
    $('#stepper').innerHTML = STEPS.map((s, i) => {
      const cls = i === activeIdx ? 'active' : (i < activeIdx ? 'done' : '');
      return `<div class="step ${cls}"><span class="step-dot">${i < activeIdx ? icon('check') : i + 1}</span><span class="step-label">${s}</span></div>`;
    }).join('');
  }

  /* ====================== 运营配置（OPS）展示 ====================== */
  /* 后台可用时拉取运营配置（banner/popup/ai），加载完成后刷新首页展示 */
  async function loadServerOps() {
    try {
      const r = await apiFetch('/api/ops');
      if (!r.ok) return;
      const d = await r.json();
      if (d && d.ok) {
        OPS = {
          banner: Object.assign({ enabled: false, slides: [] }, d.banner || {}),
          popup: Object.assign({ enabled: false, once: true, trigger: 'load', title: '', content: '', btnText: '', btnLink: '' }, d.popup || {}),
          ai: Object.assign({ opening: '', examples: [], systemExtra: '' }, d.ai || {}),
        };
        if (!Array.isArray(OPS.banner.slides)) OPS.banner.slides = [];
        if (!Array.isArray(OPS.ai.examples)) OPS.ai.examples = [];
      }
    } catch (e) { /* 后端不可用时静默回退默认 OPS */ }
  }
  /* 支付页配置：后台上传的收款码/提示语/客服微信，前端支付页展示 */
  async function loadServerPay() {
    try {
      const r = await apiFetch('/api/pay-config');
      if (!r.ok) return;
      const d = await r.json();
      if (d && d.pay) PAY = Object.assign({}, PAY_DEFAULT, d.pay);
    } catch (e) { /* 后端不可用时静默回退默认 PAY */ }
  }

  let bannerTimer = null;
  function renderBanner() {
    const box = $('#home-banner'); if (!box) return;
    const b = OPS.banner;
    const slides = (b && b.slides ? b.slides : []).filter(s => s && s.active !== false)
      .sort((a, c) => (a.order || 0) - (c.order || 0));
    if (!b || !b.enabled || !slides.length) { box.innerHTML = ''; box.style.display = 'none'; return; }
    box.style.display = '';
    box.innerHTML =
      '<div class="bn-track">' + slides.map((s, i) => `
        <div class="bn-slide" data-i="${i}" style="background:${esc(s.bg || 'linear-gradient(135deg,#1b2740,#0b1020)')}">
          <div class="bn-content">
            <div class="bn-title">${esc(s.title || '')}</div>
            ${s.subtitle ? `<div class="bn-sub">${esc(s.subtitle)}</div>` : ''}
            ${s.link ? `<a class="btn btn-light btn-sm bn-cta" href="${esc(s.link)}" ${String(s.link).indexOf('http') === 0 ? 'target="_blank" rel="noopener"' : ''}>${esc(s.linkText || '查看详情')}</a>` : ''}
          </div>
        </div>`).join('') + '</div>' +
      (slides.length > 1 ? `<div class="bn-dots">${slides.map((_, i) => `<span class="bn-dot" data-i="${i}"></span>`).join('')}</div>` : '');
    // 自动轮播
    if (bannerTimer) { clearInterval(bannerTimer); bannerTimer = null; }
    const track = box.querySelector('.bn-track');
    const dots = Array.from(box.querySelectorAll('.bn-dot'));
    if (slides.length > 1 && track) {
      let idx = 0;
      const go = (n) => { idx = (n + slides.length) % slides.length; track.style.transform = `translateX(-${idx * 100}%)`; dots.forEach((d, i) => d.classList.toggle('on', i === idx)); };
      dots.forEach(d => d.addEventListener('click', () => go(+d.dataset.i)));
      go(0);
      bannerTimer = setInterval(() => go(idx + 1), 4500);
    }
  }

  /* 运营弹窗：trigger=load 在首屏展示，trigger=afterRegister 在注册后展示；once 记忆已读 */
  function maybeShowPopup(trigger) {
    const p = OPS.popup;
    if (!p || !p.enabled) return;
    if (p.trigger && p.trigger !== trigger) return;
    if (p.once) { try { if (localStorage.getItem('opc_popup_seen')) return; } catch (e) {} }
    const t = $('#ops-popup-title'), body = $('#ops-popup-body'), btn = $('#ops-popup-btn');
    if (t) t.textContent = p.title || '';
    if (body) body.textContent = p.content || '';
    if (btn) {
      if (p.btnText) { btn.textContent = p.btnText; btn.style.display = ''; btn.onclick = () => { closeOpsPopup(); if (p.btnLink) { try { window.open(p.btnLink, '_blank', 'noopener'); } catch (e) {} } }; }
      else btn.style.display = 'none';
    }
    const m = $('#ops-popup-modal'); if (m) m.classList.add('open');
    if (p.once) { try { localStorage.setItem('opc_popup_seen', '1'); } catch (e) {} }
  }
  function closeOpsPopup() { const m = $('#ops-popup-modal'); if (m) m.classList.remove('open'); }

  /* ====================== 首页 ====================== */
  function renderHome() {
    $('#module-grid').innerHTML = MODULES.map(m => `
      <div class="module-card">
        <div class="module-icon">${icon(m.icon, 28)}</div>
        <h3 class="module-cap">${m.title}</h3>
        <p>${m.desc}</p>
      </div>`).join('');
    $('#plan-grid-home').innerHTML = PLANS.map(p => `
      <div class="plan-card ${p.highlight ? 'plan-hot' : ''}" data-plan="${p.id}" role="button" tabindex="0" aria-label="开通${p.name}">
        ${p.highlight ? '<div class="plan-badge">最受欢迎</div>' : ''}
        <h4>${p.name}</h4>
        <div class="plan-price">${p.price}<span>${p.period}</span></div>
        <ul>${p.benefits.map(b => `<li>${b}</li>`).join('')}</ul>
        <div class="plan-cta">${p.id === 'free' ? '免费体验' : '立即开通 →'}</div>
      </div>`).join('');
    $$('#plan-grid-home .plan-card').forEach(c => {
      const go = () => { const id = c.dataset.plan; if (id === 'free') openMembership(); else pickPlan(id); };
      c.addEventListener('click', go);
      c.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    });
  }

  /* ====================== 模式选择 ====================== */
  function openChatMode() {
    if (!enterTestGuard()) return;
    state.mode = 'chat'; state.chatAnswers = {};
    const log = $('#chat-log'); log.innerHTML = '';
    const ta = $('#chat-input'); ta.value = ''; ta.style.height = 'auto';
    renderSuggest();
    appendBot(getOpening());
    checkChatStatus();
    showView('chat');
  }
  function startQuiz() {
    if (!enterTestGuard()) return;
    state.mode = 'quiz'; state.quizStage = 1; state.quizStep = 0; state.answers = {};
    renderStage(); showView('quiz');
  }

  /* ====================== 对话框式 AI 顾问（自由输入模式） ====================== */
  function appendBot(text) {
    const log = $('#chat-log');
    const d = h(`<div class="msg msg-bot"><div class="msg-ava">${icon('cpu')}</div><div class="msg-bubble">${text}</div></div>`);
    log.appendChild(d); log.scrollTop = log.scrollHeight;
  }
  function appendBotSafe(text) { // 模型输出走 textContent，防注入
    const log = $('#chat-log');
    const d = h(`<div class="msg msg-bot"><div class="msg-ava">${icon('cpu')}</div><div class="msg-bubble"></div></div>`);
    d.querySelector('.msg-bubble').textContent = text;
    log.appendChild(d); log.scrollTop = log.scrollHeight; return d;
  }
  function appendUser(text) {
    const log = $('#chat-log');
    const d = h(`<div class="msg msg-user"><div class="msg-bubble">${text}</div></div>`);
    log.appendChild(d); log.scrollTop = log.scrollHeight;
  }
  function showTyping() {
    const log = $('#chat-log');
    const d = h(`<div class="msg msg-bot" id="typing"><div class="msg-ava">${icon('cpu')}</div><div class="msg-bubble"><span class="dots"><i></i><i></i><i></i></span></div></div>`);
    log.appendChild(d); log.scrollTop = log.scrollHeight; return d;
  }
  function autoGrow(ta) { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'; }
  function renderSuggest() {
    $('#chat-suggest').innerHTML = getExamples().map(t => `<button class="chip-btn" data-ex="${esc(t)}">${esc(t)}</button>`).join('');
    $$('#chat-suggest .chip-btn').forEach(b => b.addEventListener('click', () => {
      const ta = $('#chat-input'); ta.value = b.dataset.ex; ta.focus(); autoGrow(ta);
    }));
  }
  /* ====================== 调用后端（混元大模型代理） ====================== */
  async function apiPost(url, payload) {
    try {
      const r = await apiFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!r.ok) return { online: false };
      return await r.json();
    } catch (e) { return { online: false }; }
  }
  async function callChatAPI(text) { return apiPost('/api/chat', { message: text }); }
  async function callTrackInfo(topic) { return apiPost('/api/track-info', { topic }); }

  async function checkChatStatus() {
    let proxyOnline = false;
    try { const r = await apiFetch('/api/status'); const j = await r.json(); proxyOnline = !!(j && j.online); } catch (e) { proxyOnline = false; }
    if (proxyOnline) updateChatStatus('proxy');
    else if (hasClientKey()) updateChatStatus('client');
    else updateChatStatus('off');
  }
  function updateChatStatus(mode) {
    const el = $('#chat-status'); if (!el) return;
    if (mode === 'proxy') { el.textContent = '混元大模型 · 在线'; el.className = 'chat-status on'; }
    else if (mode === 'client') { el.textContent = '混元 · 直连模式'; el.className = 'chat-status client'; }
    else { el.textContent = '本地引擎 · 离线'; el.className = 'chat-status off'; }
  }

  /* ====================== 客户端直连混元（用于静态部署 / 分享链接） ====================== */
  function loadClientCfg() {
    try { return JSON.parse(localStorage.getItem('opc_hunyuan_cfg') || 'null'); } catch (e) { return null; }
  }
  function hasClientKey() { const c = loadClientCfg(); return !!(c && c.key); }

  function clientSystemPrompt() {
    const summary = liveTracks().map(t =>
      `- ${t.name}（id:${t.id}｜分类:${t.cat}｜启动${t.capital}元起｜月收益${t.incomeMin}-${t.incomeMax}元｜${t.friendly}）`).join('\n');
    return `你是"OPC 一人公司赛道选型顾问"。我们已经收录了以下赛道：
${summary}

任务：用户会用一段话描述自己的情况和想做的方向。请严格只输出 JSON，格式如下：
{
  "reply": "面向用户的口语化建议（中文、像创业伙伴、200 字内，可点名推荐库中赛道，也可给出起步动作）",
  "knownTracks": ["匹配到的、库中存在赛道 id 数组，可空"],
  "unknownTopics": ["用户想做的、但不在上面库里的话题 / 赛道名数组，可空"]
}
规则：
1. 若用户需求能对应库中某赛道，把其 id 放入 knownTracks，并在 reply 中给出口语化建议。
2. 若用户问到库里没有的赛道 / 生意，在 unknownTopics 写入主题词，并在 reply 中基于你的知识直接给出"如何起步、最低配置、风险、首单周期"的实用建议。
3. 始终使用中文，语气积极、专业；不要输出 JSON 以外的任何内容。${getSystemExtra() ? '\n\n【运营额外话术要求】\n' + getSystemExtra() : ''}`;
  }
  function clientTrackInfoPrompt(topic) {
    return `请围绕主题"${topic}"生成一份结构化一人公司赛道调研卡。严格只输出 JSON：
{
  "name": "赛道名称", "cat": "分类", "capital": 数字, "incomeMin": 数字, "incomeMax": 数字,
  "risk": 1至3, "aiReq": 1至3, "target": ["适配人群1","适配人群2"], "skills": ["技能1","技能2"],
  "resourcesIdeal": ["资源1","资源2"], "ability": "核心能力要求", "logic": "商业模式一句话",
  "aiPoint": "AI 如何提效", "friendly": "新手友好度", "paybackSpeed": "回本速度", "paybackLabel": "X 个月内",
  "config": "最低配置清单", "firstOrder": "首单周期", "coldStart": ["第一步","第二步","第三步"],
  "donts": ["千万别做1","千万别做2","千万别做3"], "opportunity": "今日商机", "painpoint": "今日痛点",
  "locked": "会员解锁的完整落地资料"
}
必须中文；字段齐全；coldStart 与 donts 各 3 条；不要输出 JSON 以外的任何内容。`;
  }
  function parseJSONSafe(s) {
    if (!s) return null;
    try { return JSON.parse(s); } catch (e) {}
    const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fence) { try { return JSON.parse(fence[1]); } catch (e) {} }
    const b = s.indexOf('{'), e = s.lastIndexOf('}');
    if (b >= 0 && e > b) { try { return JSON.parse(s.slice(b, e + 1)); } catch (e) {} }
    return null;
  }
  async function callHunyuanRaw(messages, cfg, temperature) {
    const body = { model: cfg.model || 'hunyuan-turbo', messages, temperature: temperature != null ? temperature : 0.7, response_format: { type: 'json_object' } };
    const res = await fetch(cfg.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + cfg.key },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    return (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
  }
  async function callHunyuanDirectChat(text) {
    const cfg = loadClientCfg();
    const content = await callHunyuanRaw(
      [{ role: 'system', content: clientSystemPrompt() }, { role: 'user', content: text }], cfg, 0.7);
    const parsed = parseJSONSafe(content);
    if (!parsed) return { online: true, reply: content.slice(0, 600) };
    return {
      online: true,
      reply: String(parsed.reply || ''),
      knownTracks: (Array.isArray(parsed.knownTracks) ? parsed.knownTracks : []).filter(id => liveTracks().find(t => t.id === id)).slice(0, 3),
      unknownTopics: Array.isArray(parsed.unknownTopics) ? parsed.unknownTopics : [],
    };
  }
  async function callHunyuanDirectTrackInfo(topic) {
    const cfg = loadClientCfg();
    const content = await callHunyuanRaw(
      [{ role: 'system', content: '你是严谨的赛道研究员，只输出符合要求的中文 JSON，不要任何解释。' },
       { role: 'user', content: clientTrackInfoPrompt(topic) }], cfg, 0.8);
    const parsed = parseJSONSafe(content);
    if (!parsed || !parsed.name) return { online: true, parseError: true };
    return { online: true, profile: parsed };
  }

  function sendChat() {
    const ta = $('#chat-input'); const text = ta.value.trim();
    if (!text) return;
    if (!canTest() && !state.chatHasResult) { showTestLimit(); return; }
    appendUser(text); ta.value = ''; autoGrow(ta);
    const typing = showTyping();
    const parsed = parseFreeText(text);
    mergeChat(parsed);
    const summary = summarize(parsed);
    callChatAPI(text).then(res => {
      typing.remove();
      const online = res && res.online && !res.error;
      if (online) {
        updateChatStatus('proxy');
        renderApiResult(res, parsed, summary);
      } else if (hasClientKey()) {
        callHunyuanDirectChat(text).then(dr => {
          updateChatStatus('client');
          renderApiResult(dr, parsed, summary);
        }).catch(err => {
          updateChatStatus('off');
          appendBotSafe('（直连混元失败：' + (err && err.message ? err.message : '网络/跨域受限') + '，已切换本地引擎。如需稳定使用，可本地运行 node server.js）');
          fallbackChat(summary);
        });
      } else {
        updateChatStatus('off');
        fallbackChat(summary);
        if (res && res.online && res.error) appendBotSafe('（AI 接口暂时异常，已切换到本地引擎）');
      }
    }).catch(() => {
      typing.remove();
      if (hasClientKey()) {
        callHunyuanDirectChat(text).then(dr => { updateChatStatus('client'); renderApiResult(dr, parsed, summary); })
          .catch(err => { updateChatStatus('off'); fallbackChat(summary); });
      } else { updateChatStatus('off'); fallbackChat(summary); }
    });
  }

  /* 本地规则引擎兜底（无 Key / 接口异常时） */
  function fallbackChat(summary) {
    if (Object.keys(state.chatAnswers).length === 0) {
      appendBot('我还没太读懂你的描述～可以再具体一点吗？比如你现在的身份、每天能投入多少时间、大概有多少启动资金、有没有擅长的技能，我就能帮你匹配啦。');
      return;
    }
    const results = computeMatch(Object.assign({}, state.chatAnswers));
    renderChatResult(results, summary, []);
  }

  /* 渲染混元接口返回（代理 / 直连共用） */
  function renderApiResult(res, parsed, summary) {
    if (res && res.reply) appendBotSafe(res.reply);
    const known = arr(res.knownTracks);
    const unknown = arr(res.unknownTopics);
    if (Object.keys(parsed).length) {
      const results = computeMatch(Object.assign({}, state.chatAnswers));
      renderChatResult(results, summary, unknown);
    } else if (known.length) {
      renderChatKnownChips(known, unknown);
    } else if (unknown.length) {
      renderUnknownCard(unknown);
    } else {
      appendBotSafe('可以再具体说说你的身份、每天能投入的时间、启动预算或想做的方向，我帮你精准匹配～');
    }
  }

  /* 库外赛道：AI 补充卡 + 生成完整调研卡 */
  function renderUnknownCard(topics) {
    if (!topics || !topics.length) return;
    const card = h(`<div class="unknown-card">
      <div class="unknown-head">${icon('cpu')} AI 补充 · 库外赛道</div>
      <p>你提到的「${esc(topics.join('、'))}」暂未收录进我们的多个赛道库。我可以调用混元大模型单独为你生成一份调研卡（含起步配置、风险与首单周期）。</p>
      <button class="btn btn-primary btn-sm" id="gen-synthetic">用 AI 生成「${esc(topics[0])}」完整赛道卡 →</button>
    </div>`);
    $('#chat-log').appendChild(card);
    $('#chat-log').scrollTop = $('#chat-log').scrollHeight;
    $('#gen-synthetic').addEventListener('click', () => generateSynthetic(topics[0]));
  }
  async function generateSynthetic(topic) {
    const btn = $('#gen-synthetic');
    if (btn) { btn.disabled = true; btn.textContent = 'AI 生成中…'; }
    const typing = showTyping();
    let res = await callTrackInfo(topic);
    if ((!res || !res.online) && hasClientKey()) {
      try { res = await callHunyuanDirectTrackInfo(topic); } catch (e) { res = { online: false }; }
    }
    typing.remove();
    if (res && res.online && res.profile) {
      renderSyntheticDetail(res.profile);
    } else if (res && res.online && res.error) {
      appendBotSafe('生成失败：接口返回异常，请稍后再试。');
    } else {
      appendBotSafe('当前为「本地引擎」模式，无法生成库外赛道卡。可在设置中填入你自己的混元 Key 直连，或在服务端配置 API Key 后使用。');
    }
  }
  function renderSyntheticDetail(p) {
    const g = k => (p[k] != null ? p[k] : '');
    const A = v => (Array.isArray(v) ? v : (v ? [v] : []));
    const body = `
      <div class="detail-hero synth">
        <span class="detail-cat">${esc(g('cat') || '库外赛道')} · AI 生成</span>
        <h2>${esc(g('name'))}</h2>
        <div class="rc-tags"><span class="tag tag-ok">${esc(g('friendly'))}</span><span class="tag tag-ai">${esc(g('paybackSpeed'))}</span></div>
        <div class="detail-stats">
          <div><b>${fmtMoney(Number(g('capital') || 0))}</b><span>最低启动资金</span></div>
          <div><b>${Number(g('incomeMin') || 0).toLocaleString()}-${Number(g('incomeMax') || 0).toLocaleString()}</b><span>单人月收益(参考)</span></div>
          <div><b>${esc(g('firstOrder'))}</b><span>首单周期</span></div>
        </div>
      </div>
      <div class="dcard"><h4>${icon('target')} 商业模式</h4><p>${esc(g('logic'))}</p></div>
      <div class="dcard"><h4>${icon('rocket')} 落地三件套</h4><ul class="three"><li><b>第一步：</b>${esc(A(g('coldStart'))[0] || '')}</li><li><b>最低配置：</b>${esc(g('config'))}</li><li><b>首单周期：</b>${esc(g('firstOrder'))}</li></ul></div>
      <div class="detail-grid">
        <section class="dcard"><h4>${icon('zap')} AI 赋能提效点</h4><p>${esc(g('aiPoint'))}</p></section>
        <section class="dcard"><h4>${icon('brain')} 核心能力要求</h4><p>${esc(g('ability'))}</p></section>
        <section class="dcard"><h4>${icon('users')} 适配人群</h4><p>${A(g('target')).map(esc).join('、')}</p></section>
        <section class="dcard"><h4>${icon('tool')} 所需技能 / 理想资源</h4><p>${A(g('skills')).map(esc).join('、')} ｜ ${A(g('resourcesIdeal')).map(esc).join('、')}</p></section>
      </div>
      <section class="dcard"><h4>${icon('alert-triangle')} 风险避坑红线</h4><ul class="donts">${A(g('donts')).map(d => `<li>${esc(d)}</li>`).join('')}</ul></section>
      <section class="dcard dcard-premium"><h4>${icon('unlock')} 完整落地资料（AI 生成摘要）</h4><p>${esc(g('locked'))}</p></section>
      <div class="result-btns"><button class="btn btn-ghost" id="synth-back">← 返回对话</button></div>`;
    $('#detail-body').innerHTML = body;
    const sb = $('#synth-back'); if (sb) sb.addEventListener('click', () => showView('chat'));
    showView('detail');
  }
  function renderChatKnownChips(ids, topics) {
    const chips = ids.map(id => { const t = liveTracks().find(x => x.id === id); return t ? `<span class="ochip" data-track="${id}">${esc(t.name)}</span>` : ''; }).filter(Boolean).join('');
    const card = h(`<div class="chat-actions"><div class="chat-others">AI 推荐：${chips}</div></div>`);
    $('#chat-log').appendChild(card);
    $('#chat-log').scrollTop = $('#chat-log').scrollHeight;
    $$('#chat-log .ochip').forEach(c => c.addEventListener('click', () => openDetail(c.dataset.track, false)));
    if (topics && topics.length) renderUnknownCard(topics);
  }
  function mergeChat(p) {
    Object.assign(state.chatAnswers, p);
    if (p.skills) {
      if (p.skills.includes('none')) state.chatAnswers.skills = ['none'];
      else {
        const cur = arr(state.chatAnswers.skills).filter(v => v !== 'none');
        p.skills.forEach(s => { if (!cur.includes(s)) cur.push(s); });
        state.chatAnswers.skills = cur;
      }
    }
  }
  function summarize(p) {
    const parts = [];
    if (p.persona) parts.push(PERSONAS[p.persona] ? PERSONAS[p.persona].short : p.persona);
    if (p.capital) parts.push({ '500': '零成本', '3000': '启动<3千', '10000': '启动<1万', '10001': '资金充裕' }[p.capital]);
    if (p.time) parts.push({ '2': '每天<2h', '4': '每天2-4h', '8': '每天4h+' }[p.time]);
    if (p.skills) parts.push('会' + p.skills.filter(s => s !== 'none').map(s => SKILLS[s] || s).join('/'));
    if (p.workmode) parts.push({ online: '线上', hybrid: '线上线下', offline: '线下' }[p.workmode]);
    if (p.risk) parts.push({ '1': '低风险', '2': '中风险', '3': '高承受' }[p.risk]);
    if (p.ai) parts.push({ '1': '不会AI', '2': '会用AI', '3': 'AI熟练' }[p.ai]);
    if (p.income) parts.push('目标月入' + ({ '3000': '3k内', '8000': '3-8k', '20000': '8-20k', '20001': '20k+' }[p.income]));
    if (p.focus) parts.push({ easy: '求易上手', income: '求高收入', stable: '求稳', grow: '求积累' }[p.focus]);
    return parts.join(' · ');
  }
  function renderChatResult(results, summary, unknownTopics) {
    if (!isUnlocked() && !state.chatHasResult) consumeTestQuota();
    state.chatHasResult = true;
    if (state.user) reportEvent('test', state.user.name);  // 上报测评完成
    const top = results[0], t = top.track;
    appendBot(`<b>已识别：</b>${summary}。综合来看，最适合你的赛道是 <b>${t.name}</b>，匹配度 <b>${top.score}%</b>，${t.friendly}～`);
    appendBot(`${icon('arrow-right')} 明天就能做的第一步：${t.coldStart[0]}`);
    appendBot(`${icon('arrow-right')} 最低配置：${t.config}`);
    appendBot(`${icon('arrow-right')} 首单周期：${t.firstOrder}`);
    appendBot(`${icon('x')} 避坑提醒：${t.donts.join('；')}`);
    const bar = h(`<div class="chat-actions">
      <div class="chat-others">其他推荐：${results.slice(1).map(r => `<span class="ochip" data-track="${r.track.id}">${r.track.name} · ${r.score}%</span>`).join('')}</div>
      <div class="chat-act-btns">
        <button class="btn btn-primary" id="chat-todetail">查看「${t.name}」完整详情 →</button>
        <button class="btn btn-ghost" id="chat-toquiz">去做完整测评，拿 30 天启动 SOP →</button>
      </div>
      <p class="chat-hint">想更准？直接在下面补充，比如「我其实有 5000 预算、会用 AI」</p>
      ${guestTestHintHTML()}
    </div>`);
    $('#chat-log').appendChild(bar);
    $('#chat-log').scrollTop = $('#chat-log').scrollHeight;
    $('#chat-todetail').addEventListener('click', () => openDetail(t.id, false));
    $('#chat-toquiz').addEventListener('click', startQuiz);
    bindGuestHint($('#chat-log'));
    $$('#chat-log .ochip').forEach(c => c.addEventListener('click', () => openDetail(c.dataset.track, false)));
    if (unknownTopics && unknownTopics.length) renderUnknownCard(unknownTopics);
  }

  /* 自由文本 → 答案字段解析（关键词匹配，覆盖 12 题维度） */
  function parseFreeText(text) {
    const T = text, a = {};
    if (/(宝妈|妈妈|带娃|育儿|全职妈妈)/.test(T)) a.persona = 'parent';
    else if (/(学生|应届|大学生|在校|毕业|考研)/.test(T)) a.persona = 'student';
    else if (/(退休|银发|老人|大爷|大妈|老年|养老|50\s*岁|60\s*岁)/.test(T)) a.persona = 'silver';
    else if (/(转型|中年|失业|再就业|辞职|下岗|换行|全职创业|自己干|创业)/.test(T)) a.persona = 'midlife';
    else if (/(副业|兼职|赚零花|下班|空余|空闲|上班)/.test(T)) a.persona = 'sidehustle';

    const wan = T.match(/(\d+(?:\.\d+)?)\s*(万|w|W)/);
    const num = T.match(/(\d{2,6})\s*(元|块|块钱)?/);
    let cap = null;
    if (/(零成本|零投入|没多少钱|几乎没有|0\s*元|不要钱|低成本|几百块)/.test(T)) cap = '500';
    if (wan) { const v = parseFloat(wan[1]) * 10000; cap = v <= 500 ? '500' : v <= 3000 ? '3000' : v <= 10000 ? '10000' : '10001'; }
    else if (num) { const v = parseInt(num[1]); cap = v <= 500 ? '500' : v <= 3000 ? '3000' : v <= 10000 ? '10000' : '10001'; }
    else if (/(几万|有积蓄|有点钱|资金充裕|预算充足|不差钱)/.test(T)) cap = '10001';
    if (cap) a.capital = cap;

    const thr = T.match(/(\d+(?:\.\d+)?)\s*(小时|个?小时|h|H)/);
    if (thr) { const v = parseFloat(thr[1]); a.time = v <= 2 ? '2' : v <= 4 ? '4' : '8'; }
    else if (/(全天候|整天|全职|全天)/.test(T)) a.time = '8';
    else if (/(碎片|偶尔|半小时|一点点时间|时间少)/.test(T)) a.time = '2';

    const skills = [];
    if (/(文案|写作|码字|公众号|小红书文|内容运营)/.test(T)) skills.push('copy');
    if (/(设计|美工|PS|排版|审美|插画|画画)/.test(T)) skills.push('design');
    if (/(剪辑|视频|拍视频|短视频|抖音|拍摄)/.test(T)) skills.push('video');
    if (/(编程|代码|开发|技术|IT|建站|程序)/.test(T)) skills.push('dev');
    if (/(销售|卖货|谈单|商务|招商|人脉|沟通)/.test(T)) skills.push('sales');
    if (/(外语|英语|翻译|多语)/.test(T)) skills.push('language');
    if (/(法律|财税|会计|财务)/.test(T)) skills.push('legal');
    if (/(摄影|拍照)/.test(T)) skills.push('photo');
    if (/(配音|声音)/.test(T)) skills.push('voice');
    if (/(不会|没有技能|没特长|无技能|啥也不会|啥都不懂)/.test(T)) skills.push('none');
    if (skills.length) a.skills = skills;

    if (/(线上|居家|远程|电脑|网)/.test(T) && !/(线下|实体|门店|地推)/.test(T)) a.workmode = 'online';
    else if (/(线下|本地|实体|门店|地推)/.test(T) && !/(线上|居家|远程)/.test(T)) a.workmode = 'offline';
    else if (/(线上线下|结合|都做|混合)/.test(T)) a.workmode = 'hybrid';

    if (/(保守|求稳|怕亏|不冒险|风险小|低风险|风险低|安全)/.test(T)) a.risk = '1';
    else if (/(激进|高风险|搏一搏|能承受|接受亏|敢)/.test(T)) a.risk = '3';
    else if (/(中等风险|接受一定风险|适中)/.test(T)) a.risk = '2';

    if (/(不会AI|没用过AI|不懂AI|不会用AI|没接触)/.test(T)) a.ai = '1';
    else if (/(会用多种AI|AI熟练|会画图|会AI剪辑|深度用AI|技术做AI)/.test(T)) a.ai = '3';
    else if (/(会用AI|懂AI|用过AI|接触过AI|会用聊天AI|会用豆包|会用文心|会用ChatGPT|会用AI)/.test(T)) a.ai = '2';

    const inc = T.match(/月[收赚挣][入钱]?\s*(\d{3,6})/);
    if (inc) { const v = parseInt(inc[1]); a.income = v <= 3000 ? '3000' : v <= 8000 ? '8000' : v <= 20000 ? '20000' : '20001'; }
    else if (/(想多赚|上限高|赚得多|高收入|月入过万)/.test(T)) a.income = '20001';
    else if (/(够花就行|稳定收入|月入几千|养家)/.test(T)) a.income = '8000';

    if (/(门槛低|简单|容易|快上手|上手快)/.test(T)) a.focus = 'easy';
    else if (/(收入上限|多赚|上限高|赚钱多)/.test(T)) a.focus = 'income';
    else if (/(稳定|风险小|安全|长期)/.test(T)) a.focus = 'stable';
    else if (/(积累|成长|经验|资源)/.test(T)) a.focus = 'grow';

    return a;
  }

  /* ====================== 每日商机 & 痛点雷达 ====================== */
  function openDaily() {
    if (!requireRegister()) return;
    renderDaily($('#daily-board'), $('#daily-date'));
    const rf = $('#daily-refresh');
    if (rf) rf.onclick = () => refreshDailyAI(false);
    showView('daily');
  }
  function dailyHeat(id, date) {
    const seed = id.split('').reduce((s, c) => s + c.charCodeAt(0), 0)
      + date.getFullYear() * 372 + (date.getMonth() + 1) * 31 + date.getDate();
    const v = Math.abs(Math.sin(seed) * 10000) % 40;
    return 60 + Math.round(v); // 60-99，按日期稳定、跨天变化
  }
  function renderDaily(boardEl, dateEl, limit, aiMap) {
    if (!boardEl) return;
    const today = new Date();
    if (dateEl) {
      let txt = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日 · 共 ${DAILY_BOARD.length} 个赛道 · 热度随日期动态变化`;
      if (!isUnlocked() && dailyDetailLeft() < DAILY_DETAIL_LIMIT) txt += ` · 免费版今日还可看 ${dailyDetailLeft()} 条赛道详情`;
      dateEl.textContent = txt;
    }
    const ranked = DAILY_BOARD.map(d => {
      const t = liveTracks().find(x => x.id === d.id);
      const ai = aiMap && aiMap[d.id];
      const opp = (ai && ai.opportunity) ? ai.opportunity : d.opportunity;
      const pnt = (ai && ai.painpoint) ? ai.painpoint : d.painpoint;
      return { d: { id: d.id, opportunity: opp, painpoint: pnt }, t, heat: dailyHeat(d.id, today) };
    }).sort((a, b) => b.heat - a.heat);
    const list = limit ? ranked.slice(0, limit) : ranked;
    boardEl.innerHTML = list.map((r, i) => `
      <article class="daily-card ${i === 0 && !limit ? 'daily-top' : ''}" data-track="${r.d.id}">
        <div class="daily-card-head">
          <span class="daily-cat">${r.t.cat}</span>
          <span class="daily-heat">${icon('flame')} 热度 ${r.heat}</span>
        </div>
        <h4 class="daily-name">${r.t.name}</h4>
        <div class="daily-row"><span class="daily-ico">${icon('trending-up')} 商机</span><p>${r.d.opportunity}</p></div>
        <div class="daily-row"><span class="daily-ico daily-pain">${icon('alert-triangle')} 痛点</span><p>${r.d.painpoint}</p></div>
        <button class="btn btn-ghost btn-sm daily-more" data-track="${r.d.id}">查看赛道详情 →</button>
      </article>`).join('');
    $$('#' + boardEl.id + ' [data-track]').forEach(el =>
      el.addEventListener('click', e => {
        e.stopPropagation();
        if (!canOpenDailyDetail()) { showDailyDetailLimit(); return; }
        consumeDetailQuota();
        openDetail(el.dataset.track, false);
      }));
  }
  /* 每日商机：若混元在线，拉取 AI 生成的当日商机/痛点（需求 1） */
  async function refreshDailyAI(homeLimit) {
    const btn = $('#daily-refresh');
    if (btn) { btn.disabled = true; btn.textContent = '🔄 AI 生成中…'; }
    const res = await apiPost('/api/daily', {});
    if (btn) { btn.disabled = false; btn.textContent = '🔄 用 AI 刷新今日商机'; }
    if (!res || !res.online || !Array.isArray(res.updates)) {
      toast('当前为本地引擎，每日商机为内置参考内容');
      return;
    }
    const aiMap = {};
    res.updates.forEach(u => { if (u && u.id) aiMap[u.id] = u; });
    renderDaily($('#daily-board'), $('#daily-date'), null, aiMap);
    if (homeLimit) renderDaily($('#daily-board-home'), null, 6, aiMap);
    toast('✅ 已用混元大模型更新今日商机与痛点');
  }

  /* ====================== OPC 真实案例 ====================== */
  function pickRandom(arr, n) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a.slice(0, Math.min(n, a.length));
  }
  function caseTier(c) { return c.tier || 'free'; }
  function caseUnlocked(c) { return caseTier(c) === 'free' || isUnlocked(); }
  function renderCaseCard(c) {
    const tier = caseTier(c);
    const badge = tier === 'basic'
      ? '<span class="case-tier tier-basic">基础会员</span>'
      : '<span class="case-tier tier-free">免费</span>';
    if (!caseUnlocked(c)) {
      return `<article class="case-card case-locked">
        <div class="case-top"><span class="case-cat">${esc(c.cat)}</span>${badge}</div>
        <h3 class="case-title">${esc(c.title)}</h3>
        <div class="case-lock">
          <span class="case-lock-ico">${icon('lock', 18)}</span>
          <p>开通基础会员，解锁「基础案例库」全部 SaaS 赛道实战案例</p>
          <button class="btn btn-primary btn-sm" type="button" data-open-member>开通基础会员解锁 →</button>
        </div>
      </article>`;
    }
    return `<article class="case-card">
      <div class="case-top">
        <span class="case-cat">${esc(c.cat)}</span>
        ${badge}
        <span class="case-src">${icon('file', 13)} ${esc(c.source)}</span>
      </div>
      <h3 class="case-title">${esc(c.title)}</h3>
      <div class="case-body">
        <div class="case-row"><span class="case-ico">${icon('message', 15)} 背景共鸣</span><p>${esc(c.background)}</p></div>
        <div class="case-row"><span class="case-ico">${icon('zap', 15)} 落地玩法</span><p>${esc(c.play)}</p></div>
        <div class="case-row"><span class="case-ico">${icon('bar-chart', 15)} 真实数据</span><p>${esc(c.result)}</p></div>
        <div class="case-row"><span class="case-ico case-ico-gold">${icon('sparkle', 15)} 可复用启发</span><p>${esc(c.insight)}</p></div>
      </div>
    </article>`;
  }
  function bindCaseMember(root) {
    if (!root) return;
    root.querySelectorAll('[data-open-member]').forEach(b => b.addEventListener('click', openMembership));
  }
  function renderCases() {
    const board = $('#case-board'); if (!board) return;
    let pool;
    if (state.caseFilter === 'all') pool = liveCases();
    else if (state.caseFilter === 'basic') pool = liveCases().filter(c => caseTier(c) === 'basic');
    else pool = liveCases().filter(c => c.cat === state.caseFilter);
    const count = 3 + (Math.random() < 0.5 ? 0 : 1); // 每次 3-4 个
    if (pool.length === 0) { board.innerHTML = '<p class="empty">该分类暂无案例</p>'; return; }
    board.innerHTML = pickRandom(pool, count).map(renderCaseCard).join('');
    bindCaseMember(board);
  }
  function renderCaseFilters() {
    const el = $('#case-filters'); if (!el) return;
    const cats = ['all', 'basic'].concat(Array.from(new Set(liveCases().map(c => c.cat))));
    el.innerHTML = cats.map(cat => `<button class="chip ${state.caseFilter === cat ? 'chip-on' : ''}" data-cat="${esc(cat)}">${cat === 'all' ? '全部' : cat === 'basic' ? '基础案例库' : esc(cat)}</button>`).join('');
    $$('#case-filters .chip').forEach(b => b.addEventListener('click', () => {
      state.caseFilter = b.dataset.cat; renderCaseFilters(); renderCases();
    }));
  }
  function renderCasesHome() {
    const board = $('#case-board-home'); if (!board) return;
    const freePool = liveCases().filter(c => caseTier(c) === 'free');
    const basicCount = liveCases().filter(c => caseTier(c) === 'basic').length;
    const cards = pickRandom(freePool, Math.min(3, freePool.length)).map(renderCaseCard).join('');
    let hint;
    if (isUnlocked()) {
      hint = `<button class="case-hint case-hint-ok" type="button" data-go-cases>${icon('check', 15)} 基础案例库已解锁 · 查看全部 ${liveCases().length} 个实战案例 →</button>`;
    } else {
      hint = `<button class="case-hint" type="button" data-open-member>${icon('lock', 15)} 已解锁 ${freePool.length} 个免费案例 · 开通基础会员再得 ${basicCount} 个 SaaS 实战案例 →</button>`;
    }
    board.innerHTML = cards + hint;
    bindCaseMember(board);
    board.querySelectorAll('[data-go-cases]').forEach(b => b.addEventListener('click', openCases));
  }
  function openCases() {
    if (!requireRegister()) return;
    showView('cases');
    renderCaseFilters();
    renderCases();
  }

  /* ====================== 问卷式（两阶） ====================== */
  function renderStage() {
    const list = state.quizStage === 1 ? STAGE1 : STAGE2;
    const q = list[state.quizStep];
    const total = list.length;
    const stageName = state.quizStage === 1 ? '第一阶 · 快速测评' : '第二阶 · 精准升级';
    const answered = q.single ? !!state.answers[q.id] : arr(state.answers[q.id]).length > 0;
    const optionsHtml = q.options.map(o => {
      const selected = q.single ? state.answers[q.id] === o.value : arr(state.answers[q.id]).includes(o.value);
      return `<button class="opt ${selected ? 'opt-on' : ''}" data-value="${o.value}" role="option" aria-selected="${!!selected}">
                <span class="opt-mark">${q.single ? '○' : '☐'}</span>${o.label}</button>`;
    }).join('');
    $('#quiz-card').innerHTML = `
      <div class="quiz-progress"><div class="quiz-bar" style="width:${((state.quizStep) / total) * 100}%"></div></div>
      <div class="quiz-meta"><b>${stageName}</b> · 第 ${state.quizStep + 1} / ${total} 题${q.hint ? ` · <em>${q.hint}</em>` : ''}</div>
      <h2 class="quiz-q">${q.title}</h2>
      <div class="opt-list" role="listbox">${optionsHtml}</div>
      <div class="quiz-actions">
        <button class="btn btn-ghost" id="q-back">上一步</button>
        <button class="btn btn-primary" id="q-next" ${answered ? '' : 'disabled'}>${state.quizStep === total - 1 ? (state.quizStage === 1 ? '生成简版结果 →' : '生成完整报告 →') : '下一步'}</button>
      </div>`;
    $$('#quiz-card .opt').forEach(b => b.addEventListener('click', () => onSelect(q, b)));
    $('#q-back').addEventListener('click', onBack);
    $('#q-next').addEventListener('click', onNext);
  }
  function onSelect(q, btn) {
    const val = btn.dataset.value;
    if (q.single) {
      state.answers[q.id] = val;
      $$('#quiz-card .opt').forEach(b => b.classList.remove('opt-on'));
      btn.classList.add('opt-on');
      $('#q-next').disabled = false;
      setTimeout(() => { if (state.answers[q.id] === val) onNext(); }, 260);
    } else {
      const cur = arr(state.answers[q.id]);
      const i = cur.indexOf(val);
      if (i >= 0) cur.splice(i, 1); else cur.push(val);
      if (val === 'none') { cur.length = 0; cur.push('none'); }
      else { const n = cur.indexOf('none'); if (n >= 0) cur.splice(n, 1); }
      state.answers[q.id] = cur;
      btn.classList.toggle('opt-on', cur.includes(val));
      $('#q-next').disabled = cur.length === 0;
    }
  }
  function onBack() {
    if (state.quizStep > 0) { state.quizStep--; renderStage(); }
    else if (state.quizStage === 2) { generateQuickResult(); }
    else { showView('home'); }
  }
  function onNext() {
    const list = state.quizStage === 1 ? STAGE1 : STAGE2;
    const q = list[state.quizStep];
    const ok = q.single ? !!state.answers[q.id] : (arr(state.answers[q.id]).length > 0 || !q.required);
    if (!ok) return;
    if (state.quizStep < list.length - 1) { state.quizStep++; renderStage(); }
    else if (state.quizStage === 1) { generateQuickResult(); }
    else { generateFullResult(); }
  }

  /* ====================== 匹配结果（4 模块结构） ====================== */
  function generateQuickResult() {
    consumeTestQuota();
    state.resultMode = 'quick';
    state.results = computeMatch(state.answers);
    if (state.user) reportEvent('test', state.user.name);  // 上报测评完成
    renderResult();
  }
  function generateFullResult() {
    state.resultMode = 'full';
    state.results = computeMatch(state.answers);
    renderResult();
  }
  function renderResult() {
    const quick = state.resultMode === 'quick';
    $('#result-intro').innerHTML = quick
      ? `<div class="result-avatar">${icon('zap')}</div><p>快速测评完成！基于你的核心条件，先给你 <b>3 个</b> 高匹配赛道；<b>补充 6 题</b> 可解锁更精准的完整启动报告。</p>`
      : `<div class="result-avatar">${icon('target')}</div><p>完整测评完成！结合你的全部条件，为你生成 <b>3 个</b> 最优赛道与 30 天落地方案。</p>`;
    $('#result-list').innerHTML = state.results.map((r, i) => renderResultCard(r, i, quick)).join('');
    const slot = $('#guest-hint-slot');
    if (slot) { slot.innerHTML = guestTestHintHTML(); bindGuestHint(slot); }
    $$('#result-list [data-track]').forEach(b =>
      b.addEventListener('click', () => { if (b.hasAttribute('data-locked')) openMembership(); else openDetail(b.dataset.track, false); }));
    $$('#result-list [data-continue]').forEach(b => b.addEventListener('click', continueStage2));
    $$('#result-list [data-benefit]').forEach(b => b.addEventListener('click', openMembership));
    showView('result');
  }
  function renderResultCard(r, i, quick) {
    const t = r.track;
    const head = `
      <div class="result-rank">TOP ${i + 1}</div>
      <div class="result-head">
        <div><div class="result-cat">${t.cat}</div><h3 class="result-name">${t.name}</h3></div>
        <div class="match-ring" style="--p:${r.score}"><span>${r.score}<small>%</small></span><em>匹配度</em></div>
      </div>
      <div class="rc-tags"><span class="tag tag-ok">${t.friendly}</span><span class="tag tag-ai">${t.paybackSpeed}</span></div>`;
    if (quick) {
      return `<article class="result-card">
        ${head}
        <p class="rc-adv"><b>核心优势：</b>${t.aiPoint}</p>
        <div class="rc-step"><span class="rc-step-ico">${icon('arrow-right')}</span><div><b>第一步：</b>${t.coldStart[0]}</div></div>
        <div class="result-btns">
          <button class="btn btn-primary" data-track="${t.id}">查看详情</button>
          <button class="btn btn-ghost" data-continue>补充 6 题 · 解锁完整报告 →</button>
        </div>
        <button class="member-link" type="button" data-benefit>${icon('crown', 15)} <span>查看「${t.name}」对应会员权益</span></button>
      </article>`;
    }
    const three = `
      <div class="rc-three">
        <div><span>${icon('rocket')} 第一步</span><p>${t.coldStart[0]}</p></div>
        <div><span>${icon('toolbox')} 最低配置</span><p>${t.config}</p></div>
        <div><span>${icon('calendar')} 首单周期</span><p>${t.firstOrder}</p></div>
      </div>`;
    const donts = `<div class="rc-donts"><span class="rc-donts-h">${icon('alert-triangle')} 避坑红线（千万别做）</span>${t.donts.map(d => `<p>· ${d}</p>`).join('')}</div>`;
    return `<article class="result-card result-card-full">
      ${head}
      <p class="rc-concl">综合你的条件，<b>${t.name}</b> 与你的匹配度 ${r.score}%，${t.friendly}、${t.paybackSpeed}，适合作为起步方向。</p>
      ${three}
      ${donts}
      <div class="result-btns">
        <button class="btn btn-primary" data-track="${t.id}">查看赛道详情</button>
        <button class="btn btn-ghost" data-track="${t.id}" data-locked>解锁全部 →</button>
      </div>
      <button class="member-link" type="button" data-benefit>${icon('crown', 15)} <span>查看「${t.name}」对应会员权益</span></button>
    </article>`;
  }
  function continueStage2() {
    state.quizStage = 2; state.quizStep = 0; startQuizFromStage2();
  }
  function startQuizFromStage2() {
    state.mode = 'quiz'; state.quizStage = 2; state.quizStep = 0;
    renderStage(); showView('quiz');
  }

  /* ====================== 赛道详情（付费锁） ====================== */
  function openDetail(trackId) {
    const t = liveTracks().find(x => x.id === trackId);
    if (!t) return;
    state.currentTrack = t;
    const unlocked = isUnlocked();
    const skillLabels = t.skills.length ? t.skills.map(s => SKILLS[s]).join('、') : '无特殊技能要求';
    const resLabels = t.resourcesIdeal.length ? t.resourcesIdeal.map(r => RESOURCES[r]).join('、') : '无需特殊资源';
    const overview = `
      <div class="detail-hero">
        <span class="detail-cat">${t.cat}</span>
        <h2>${t.name}</h2>
        <div class="rc-tags"><span class="tag tag-ok">${t.friendly}</span><span class="tag tag-ai">${t.paybackSpeed}</span><span class="tag">${t.paybackLabel}回本</span></div>
        <div class="detail-stats">
          <div><b>${fmtMoney(t.capital)}</b><span>最低启动资金</span></div>
          <div><b>${t.income}</b><span>单人月收益(参考)</span></div>
          <div><b>${t.firstOrder}</b><span>首单周期</span></div>
        </div>
        <button class="btn btn-ghost btn-sm detail-ai-btn" id="detail-ai">${icon('message')} 用 AI 顾问咨询这个赛道</button>
      </div>
      <div class="dcard"><h4>${icon('target')} 匹配结论</h4><p>综合你的条件，<b>${t.name}</b> 与你的匹配度较高，${t.friendly}、${t.paybackSpeed}，适合作为起步方向。</p></div>
      <div class="dcard"><h4>${icon('rocket')} 落地三件套</h4><ul class="three"><li><b>第一步：</b>${t.coldStart[0]}</li><li><b>最低配置：</b>${t.config}</li><li><b>首单周期：</b>${t.firstOrder}</li></ul></div>
      <div class="detail-grid">
        <section class="dcard"><h4>${icon('zap')} AI 赋能提效点</h4><p>${t.aiPoint}</p></section>
        <section class="dcard"><h4>${icon('brain')} 核心能力要求</h4><p>${t.ability}</p></section>
        <section class="dcard"><h4>${icon('users')} 核心适配人群</h4><p>${t.target.map(x => PERSONAS[x].label).join('、')}</p></section>
        <section class="dcard"><h4>${icon('tool')} 所需技能 / 理想资源</h4><p>${skillLabels} ｜ ${resLabels}</p></section>
      </div>
      <section class="dcard"><h4>${icon('toolbox')} 推荐工具箱（本行业）</h4><div class="tool-list">${t.tools.map(o => `<div class="tool-item"><b>${esc(o.name)}</b><span>${esc(o.desc)}</span></div>`).join('')}</div></section>
      <section class="dcard"><h4>${icon('alert-triangle')} 风险避坑红线（千万别做）</h4><ul class="donts">${t.donts.map(d => `<li>${d}</li>`).join('')}</ul></section>
      <section class="dcard"><h4>${icon('puzzle')} 冷启动 3 步核心动作</h4><ol class="cold-list">${unlocked ? t.coldStart.map(s => `<li>${s}</li>`).join('') : `<li>${t.coldStart[0]}</li>`}</ol></section>`;
    const premium = unlocked
      ? `<section class="dcard dcard-premium"><h4>${icon('unlock')} 会员专享 · 完整落地资料</h4><p>${t.locked}</p><div class="premium-cta"><button class="btn btn-primary" id="to-tools">使用落地工具 / 经营助手 →</button></div></section>`
      : `<section class="dcard dcard-locked"><div class="lock-overlay"><div class="lock-icon">${icon('lock')}</div><h4>剩余 2 步冷启动 SOP + 完整落地资料已锁定</h4><p>开通会员后解锁全部字段、30 天启动 SOP、投入产出计算器与 AI 工具包。</p><button class="btn btn-primary" id="open-member">开通会员解锁全部 →</button></div></section>`;
    $('#detail-body').innerHTML = overview + premium;
    const tb = $('#to-tools'); if (tb) tb.addEventListener('click', () => { renderTools(); showView('tools'); });
    const mb = $('#open-member'); if (mb) mb.addEventListener('click', openMembership);
    const ai = $('#detail-ai'); if (ai) ai.addEventListener('click', () => askAIAbout(t));
    showView('detail');
  }
  function askAIAbout(t) {
    openChatMode();
    const ta = $('#chat-input');
    ta.value = `请详细分析「${t.name}」（${t.cat}）这个赛道：具体怎么起步、必备工具、常见坑、首单怎么开？`;
    autoGrow(ta);
    sendChat();
  }

  /* ====================== 会员开通 ====================== */
  function openMembership() {
    syncMembership();  // 打开弹窗时同步一次，确保后台开通后即时显示
    $('#member-grid').innerHTML = PLANS.map(p => `
      <div class="plan-card ${p.highlight ? 'plan-hot' : ''} ${state.membership === p.id ? 'plan-current' : ''}">
        ${p.highlight ? '<div class="plan-badge">最受欢迎</div>' : ''}
        ${state.membership === p.id ? '<div class="plan-badge plan-badge-ok">当前套餐</div>' : ''}
        <h4>${p.name}</h4>
        <div class="plan-price">${p.price}<span>${p.period}</span></div>
        <div class="plan-target">${p.target}</div>
        <ul>${p.benefits.map(b => `<li>${b}</li>`).join('')}</ul>
        <button class="btn ${p.id === 'free' ? 'btn-ghost' : 'btn-primary'} member-pick" data-plan="${p.id}">${p.cta}</button>
      </div>`).join('');
    $$('#member-grid .member-pick').forEach(b => b.addEventListener('click', () => pickPlan(b.dataset.plan)));
    $('#member-modal').classList.add('open');
    setModuleActive('member');
  }
  function closeMembership() { $('#member-modal').classList.remove('open'); setModuleActive(getCurrentView()); }
  function pickPlan(plan) {
    if (plan === 'free') { closeMembership(); return; }
    if (!requireRegister(() => pickPlan(plan))) return;
    openPay(plan);   // 点击会员 → 跳转支付页（展示收款码）
  }
  /* 开通支付页：展示后台上传的微信/支付宝收款码；用户扫码付款后联系客服，后台手动开通 */
  function openPay(plan) {
    const p = PLANS.find(x => x.id === plan); if (!p) return;
    pendingPlan = plan;
    const nm = $('#pay-plan-name'), pr = $('#pay-plan-price');
    if (nm) nm.textContent = p.name;
    if (pr) pr.textContent = (p.price || '') + (p.period || '');
    renderPayPage();
    const body = $('#pay-body'), succ = $('#pay-success');
    if (body) body.style.display = '';
    if (succ) succ.style.display = 'none';
    const modal = $('#pay-modal'); if (modal) modal.classList.add('open');
    setModuleActive('member');
  }
  function renderPayPage() {
    const pay = PAY || {};
    const qr = $('#pay-qr');
    if (!qr) return;
    let html = '';
    if (pay.wechatQR) html += `<div class="qr-col"><div class="qr-cap">微信扫码付款</div><img class="pay-qr" src="${pay.wechatQR}" alt="微信收款码" /></div>`;
    if (pay.alipayQR) html += `<div class="qr-col"><div class="qr-cap">支付宝扫码付款</div><img class="pay-qr" src="${pay.alipayQR}" alt="支付宝收款码" /></div>`;
    if (!html) html = '<p class="pay-empty">收款码尚未配置，请直接在公众号 / 客服处付款，或联系客服获取收款码。</p>';
    qr.innerHTML = html;
    const note = $('#pay-note'); if (note) note.textContent = pay.note || '付款后添加客服微信，手动开通会员权限';
    const cs = $('#pay-cs');
    if (cs) {
      if (pay.csWechat) {
        cs.style.display = '';
        cs.innerHTML = '客服微信：<b class="cs-id">' + esc(pay.csWechat) + '</b> <button class="btn btn-ghost btn-sm" id="pay-copy-cs" type="button">复制</button>';
        const cp = $('#pay-copy-cs');
        if (cp) cp.onclick = async () => { try { await navigator.clipboard.writeText(pay.csWechat); toast('已复制客服微信'); } catch (e) { toast('复制失败，请手动添加'); } };
      } else cs.style.display = 'none';
    }
  }
  function closePay() { const m = $('#pay-modal'); if (m) m.classList.remove('open'); pendingPlan = null; }
  async function submitPay() {
    const plan = pendingPlan; if (!plan) return;
    const p = PLANS.find(x => x.id === plan);
    const name = state.user ? state.user.name : '';
    const btn = $('#pay-submit');
    if (!name) { toast('请先注册'); closePay(); openRegister(); return; }
    if (btn) { btn.disabled = true; btn.textContent = '提交中…'; }
    const cs = (PAY && PAY.csWechat) ? PAY.csWechat : '';
    const succHTML = (ok) => {
      const head = ok ? '✅ 开通申请已提交！' : '已记录你的开通意向';
      const tip = ok
        ? `请添加客服微信 ${cs ? '<b>' + esc(cs) + '</b>' : ''} 并发送你的昵称「${esc(name)}」，客服核实付款后将为你开通「${esc(p.name)}」会员权限并发送对应资料包。`
        : `（当前环境未连接服务器，请直接联系客服微信 ${cs ? '<b>' + esc(cs) + '</b>' : ''} 开通）`;
      return `<div class="pay-ok">${head}<br><span class="pay-ok-tip">${tip}</span></div>`;
    };
    try {
      const c = await apiPost('/api/checkout', { plan, name });
      if (!c || !c.ok || !c.order) throw new Error('order failed');
      const body = $('#pay-body'), succ = $('#pay-success');
      if (body) body.style.display = 'none';
      if (succ) { succ.innerHTML = succHTML(true); succ.style.display = ''; }
      toast('申请已提交，请按提示联系客服开通 🎁');
    } catch (e) {
      const body = $('#pay-body'), succ = $('#pay-success');
      if (body) body.style.display = 'none';
      if (succ) { succ.innerHTML = succHTML(false); succ.style.display = ''; }
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = '我已付款 · 提交开通申请'; }
    }
  }

  /* ====================== 注册 / 登录（强制注册入口） ====================== */
  function openRegister() {
    const err = $('#register-err'); if (err) err.textContent = '';
    const n = $('#reg-name'); if (n) n.value = '';
    const p = $('#reg-pass'); if (p) p.value = '';
    const sh = $('#reg-show'); if (sh) sh.checked = false;
    setPassType('password');
    setTimeout(() => { if (n) n.focus(); }, 60);
    $('#register-modal').classList.add('open');
  }
  function setPassType(t) {
    const a = $('#reg-pass');
    if (a) a.type = t;
  }
  function closeRegister() { $('#register-modal').classList.remove('open'); }
  function doRegister() {
    const nameInp = $('#reg-name'); const name = (nameInp.value || '').trim();
    const passInp = $('#reg-pass'); const pass = passInp.value || '';
    const err = $('#register-err');
    if (!name) { if (err) err.textContent = '请输入昵称'; return; }
    if (name.length > 16) { if (err) err.textContent = '昵称不超过 16 字'; return; }
    if (pass.length < 6 || pass.length > 20) { if (err) err.textContent = '密码需 6-20 位'; return; }

    const accounts = loadAccounts();
    let isLogin = false;
    if (accounts[name]) {
      // 已有账号 → 校验密码（登录）
      if (accounts[name].hash !== hashPwd(name, pass)) { if (err) err.textContent = '密码错误，请重试'; return; }
      isLogin = true;
    } else {
      // 新账号 → 创建并默认免费会员
      accounts[name] = { hash: hashPwd(name, pass), createdAt: Date.now() };
      saveAccounts(accounts);
      state.membership = 'free'; localStorage.setItem('opc_membership', 'free');
    }

    const hash = accounts[name].hash;
    saveUser({ name: name });
    reportEvent('register', name, hash);   // 上报后台（含哈希，后端可选存储）
    closeRegister();
    toast(isLogin ? '👋 欢迎回来，' + name + '！' : '🎉 注册成功，你已是免费会员！');
    renderHome();
    const pending = state.pendingAction; state.pendingAction = null;
    if (pending) pending();
    else maybeShowPopup('afterRegister');   // 注册后触发运营弹窗（若后台配置）
  }
  function renderAccount() {
    const box = $('#nav-account'); if (!box) return;
    if (isRegistered()) {
      box.innerHTML = `<span class="nav-user" title="已登录"><span class="ico" data-icon="users" data-size="15"></span> ${esc(state.user.name)}</span>` +
        `<button class="nav-logout" type="button" id="logout-btn">退出</button>`;
      const lb = $('#logout-btn'); if (lb) lb.addEventListener('click', logoutUser);
    } else {
      box.innerHTML = `<button class="btn btn-ghost btn-sm" type="button" id="open-register">注册 / 登录</button>`;
      const ob = $('#open-register'); if (ob) ob.addEventListener('click', openRegister);
    }
    mountIcons(box);
  }

  /* ====================== 落地工具 / 经营助手 ====================== */
  function renderTools() {
    if (!requireRegister()) return;
    if (!isUnlocked()) {
      $('#tools-body').innerHTML = `
        <div class="gate"><div class="gate-icon">${icon('lock')}</div><h3>落地工具箱与经营助手为会员专享</h3>
        <p>开通专业版 / 高端版后，可使用投入产出计算器、AI 启动方案、经营复盘等全部工具。</p>
        <button class="btn btn-primary" id="gate-member">开通会员解锁 →</button></div>`;
      $('#gate-member').addEventListener('click', openMembership);
      return;
    }
    $('#tools-body').innerHTML = `
      <div class="tool-tabs">
        <button class="tool-tab active" data-tab="roi">${icon('bar-chart')} 投入产出计算器</button>
        <button class="tool-tab" data-tab="assistant">${icon('users')} 经营助手 · 月度复盘</button>
      </div>
      <div class="tool-panel" id="panel-roi"><div class="calc">
        <div class="calc-in">
          <label>客单价（元）<input type="number" id="roi-price" value="199" min="0"></label>
          <label>预计月销量（单）<input type="number" id="roi-qty" value="120" min="0"></label>
          <label>月固定成本（元）<input type="number" id="roi-fixed" value="1500" min="0"></label>
          <label>单件变动成本（元）<input type="number" id="roi-var" value="40" min="0"></label>
          <label>启动总投入（元）<input type="number" id="roi-start" value="2000" min="0"></label>
          <button class="btn btn-primary" id="roi-go">计算回本周期</button>
        </div>
        <div class="calc-out" id="roi-out"></div>
      </div></div>
      <div class="tool-panel hidden" id="panel-assistant"><div class="calc">
        <div class="calc-in">
          <label>本月收入（元）<input type="number" id="as-income" value="8000" min="0"></label>
          <label>本月支出（元）<input type="number" id="as-cost" value="3500" min="0"></label>
          <label>上月净利润（元，可空）<input type="number" id="as-last" value="3000" min="0"></label>
          <button class="btn btn-primary" id="as-go">生成复盘报告</button>
        </div>
        <div class="calc-out" id="as-out"></div>
      </div></div>`;
    $$('.tool-tab').forEach(t => t.addEventListener('click', () => {
      $$('.tool-tab').forEach(x => x.classList.remove('active')); t.classList.add('active');
      $('#panel-roi').classList.toggle('hidden', t.dataset.tab !== 'roi');
      $('#panel-assistant').classList.toggle('hidden', t.dataset.tab !== 'assistant');
    }));
    $('#roi-go').addEventListener('click', calcROI);
    $('#as-go').addEventListener('click', calcAssistant);
    calcROI(); calcAssistant();
  }
  function calcROI() {
    const price = +$('#roi-price').value || 0, qty = +$('#roi-qty').value || 0, fixed = +$('#roi-fixed').value || 0,
      vari = +$('#roi-var').value || 0, start = +$('#roi-start').value || 0;
    const revenue = price * qty, profit = revenue - fixed - vari * qty, margin = price - vari;
    const bep = margin > 0 ? Math.ceil(fixed / margin) : Infinity;
    const payback = profit > 0 ? (start / profit) : Infinity;
    $('#roi-out').innerHTML = stat('月营收', fmtMoney(revenue)) + stat('月净利润', fmtMoney(profit), profit < 0 ? 'neg' : 'pos')
      + stat('盈亏平衡销量', isFinite(bep) ? bep + ' 单/月' : '—') + stat('预计回本周期', isFinite(payback) ? payback.toFixed(1) + ' 个月' : '当前模型亏损')
      + `<p class="calc-note">* 测算结果为参考区间，实际因行业与执行而异。</p>`;
  }
  function calcAssistant() {
    const income = +$('#as-income').value || 0, cost = +$('#as-cost').value || 0, last = $('#as-last').value === '' ? null : +$('#as-last').value;
    const profit = income - cost, rate = income > 0 ? (profit / income * 100) : 0, delta = last != null ? (profit - last) : null;
    const save = Math.round(profit * 0.3), reinvest = Math.round(profit * 0.4);
    $('#as-out').innerHTML = stat('本月净利润', fmtMoney(profit), profit < 0 ? 'neg' : 'pos') + stat('利润率', rate.toFixed(1) + '%', rate < 20 ? 'warn' : 'pos')
      + stat('环比上月', delta == null ? '—' : (delta >= 0 ? '+' : '') + fmtMoney(delta), delta == null ? '' : delta >= 0 ? 'pos' : 'neg')
      + stat('建议下月储蓄', fmtMoney(save)) + stat('建议再投入', fmtMoney(reinvest))
      + `<p class="calc-note">* 经营复盘模板由 AI 辅助生成，数据仅供参考，不构成财务建议。</p>`;
  }
  function stat(label, val, cls = '') { return `<div class="stat ${cls}"><span class="stat-val">${val}</span><span class="stat-label">${label}</span></div>`; }

  /* ====================== 通用 ====================== */
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 3200); }

  /* ====================== 混元设置面板（客户端直连） ====================== */
  function openHunyuanModal() {
    const c = loadClientCfg() || {};
    $('#hunyuan-key').value = c.key || '';
    $('#hunyuan-url').value = c.url || 'https://api.hunyuan.cloud.tencent.com/v1/chat/completions';
    $('#hunyuan-model').value = c.model || 'hunyuan-turbo';
    $('#hunyuan-test').textContent = '';
    $('#hunyuan-modal').classList.add('open');
  }
  function closeHunyuanModal() { $('#hunyuan-modal').classList.remove('open'); }
  function saveClientCfg() {
    const key = $('#hunyuan-key').value.trim();
    const url = $('#hunyuan-url').value.trim() || 'https://api.hunyuan.cloud.tencent.com/v1/chat/completions';
    const model = $('#hunyuan-model').value.trim() || 'hunyuan-turbo';
    if (!key) { toast('请先填写 API Key'); return; }
    localStorage.setItem('opc_hunyuan_cfg', JSON.stringify({ key, url, model }));
    closeHunyuanModal();
    toast('✅ 已保存，对话顾问将直连混元大模型');
    checkChatStatus();
  }
  function clearClientCfg() {
    localStorage.removeItem('opc_hunyuan_cfg');
    openHunyuanModal();
    toast('已清除混元配置，切换回本地引擎');
    checkChatStatus();
  }
  async function testClientCfg() {
    const key = $('#hunyuan-key').value.trim();
    const url = $('#hunyuan-url').value.trim() || 'https://api.hunyuan.cloud.tencent.com/v1/chat/completions';
    const model = $('#hunyuan-model').value.trim() || 'hunyuan-turbo';
    const fixBox = $('#cors-fix');
    fixBox.style.display = 'none';
    if (!key) { $('#hunyuan-test').textContent = '⚠ 请先填写 API Key'; $('#hunyuan-test').className = 'hunyuan-test err'; return; }
    $('#hunyuan-test').textContent = '测试中…'; $('#hunyuan-test').className = 'hunyuan-test';
    try {
      const content = await callHunyuanRaw(
        [{ role: 'user', content: '回复 JSON {"ok":true}' }], { key, url, model }, 0.3);
      const p = parseJSONSafe(content);
      if (p && p.ok) { $('#hunyuan-test').textContent = '✅ 连接成功！混元大模型已就绪'; $('#hunyuan-test').className = 'hunyuan-test ok'; }
      else { $('#hunyuan-test').textContent = '⚠ 返回异常：' + content.slice(0, 80); $('#hunyuan-test').className = 'hunyuan-test err'; }
    } catch (e) {
      const msg = (e && e.message) || '';
      const isCORS = /Failed to fetch|NetworkError|CORS|cross-origin|blocked/i.test(msg);
      if (isCORS) {
        $('#hunyuan-test').textContent = '❌ 浏览器跨域限制（CORS）— 需要本地代理';
        $('#hunyuan-test').className = 'hunyuan-test err';
        // 生成含用户 Key 的可复制命令
        const cmd = 'cd "C:\\Users\\Admin\\WorkBuddy\\2026-07-07-21-54-07\\OPC-SaaS" && set HUNYUAN_API_KEY=' + key + ' && node server.js';
        $('#cors-cmd').textContent = cmd;
        fixBox.style.display = '';
        $('#cors-copy').onclick = () => {
          navigator.clipboard.writeText(cmd).then(() => { $('#cors-copy').textContent = '✅ 已复制！粘贴到终端回车即可'; });
        };
      } else {
        $('#hunyuan-test').textContent = '❌ 连接失败：' + (msg || '网络异常');
        $('#hunyuan-test').className = 'hunyuan-test err';
      }
    }
  }

  /* ====================== 初始化 ====================== */
  function init() {
    mountIcons();
    renderHome(); renderBanner(); renderStepper(0);
    $('#mode-chat').addEventListener('click', openChatMode);
    $('#mode-quiz').addEventListener('click', startQuiz);
    $('#hero-start').addEventListener('click', startQuiz);
    $('#start-quiz').addEventListener('click', startQuiz);
    $('#nav-start').addEventListener('click', e => { e.preventDefault(); goHome(); });
    $$('.mnav-item, .tabbar-item').forEach(b => b.addEventListener('click', () => handleNav(b.dataset.go)));
    refreshMemberLabel();
    const xs = $('#nav-start3'); if (xs) xs.addEventListener('click', goHome);
    $('#quiz-home').addEventListener('click', goHome);
    $('#result-home').addEventListener('click', goHome);
    $('#detail-home').addEventListener('click', goHome);
    $('#tools-home').addEventListener('click', goHome);
    $('#result-restart').addEventListener('click', startQuiz);
    $('#detail-back').addEventListener('click', () => showView('result'));
    $('#chat-back').addEventListener('click', goHome);
    $('#chat-gear').addEventListener('click', openHunyuanModal);
    $('#hunyuan-close').addEventListener('click', closeHunyuanModal);
    $('#hunyuan-modal').addEventListener('click', e => { if (e.target.id === 'hunyuan-modal') closeHunyuanModal(); });
    $('#hunyuan-save').addEventListener('click', saveClientCfg);
    $('#hunyuan-clear').addEventListener('click', clearClientCfg);
    $('#hunyuan-testbtn').addEventListener('click', testClientCfg);
    $('#daily-back').addEventListener('click', goHome);
    $('#home-daily').addEventListener('click', openDaily);
    $('#cases-home').addEventListener('click', goHome);
    $('#home-cases').addEventListener('click', openCases);
    $('#cases-shuffle').addEventListener('click', renderCases);
    const ci = $('#chat-input');
    $('#chat-send').addEventListener('click', sendChat);
    ci.addEventListener('input', () => autoGrow(ci));
    ci.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); } });
    renderDaily($('#daily-board-home'), null, 6);
    renderCasesHome();
    $('#member-close').addEventListener('click', closeMembership);
    $('#member-modal').addEventListener('click', e => { if (e.target.id === 'member-modal') closeMembership(); });
    $('#register-close').addEventListener('click', closeRegister);
    $('#register-modal').addEventListener('click', e => { if (e.target.id === 'register-modal') closeRegister(); });
    $('#register-go').addEventListener('click', doRegister);
    /* 运营弹窗 + 支付弹窗 */
    $('#ops-popup-close').addEventListener('click', closeOpsPopup);
    $('#ops-popup-modal').addEventListener('click', e => { if (e.target.id === 'ops-popup-modal') closeOpsPopup(); });
    $('#pay-close').addEventListener('click', closePay);
    $('#pay-modal').addEventListener('click', e => { if (e.target.id === 'pay-modal') closePay(); });
    $('#pay-submit').addEventListener('click', submitPay);
    const regInp = $('#reg-name'); if (regInp) regInp.addEventListener('keydown', e => { if (e.key === 'Enter') doRegister(); });
    const regPass = $('#reg-pass'); if (regPass) regPass.addEventListener('keydown', e => { if (e.key === 'Enter') doRegister(); });
    const regShow = $('#reg-show'); if (regShow) regShow.addEventListener('change', e => setPassType(e.target.checked ? 'text' : 'password'));
    renderAccount();
    ensureValidMembership();   // 有账号但 membership 异常时回退 free
    refreshMemberLabel();      // 确保标签同步
    syncMembership();          // 向服务端同步会员状态（后台开通后前端自动生效）
    setInterval(syncMembership, 30000);  // 后台开通会员后，前端每 30 秒自动感知并刷新
    $('#go-tools').addEventListener('click', () => { renderTools(); showView('tools'); });
    $('#tools-back').addEventListener('click', () => showView('detail'));
    showView('home');
    registerServiceWorker();
    /* 后台可用时拉取服务端数据（赛道/案例），加载完成后刷新已渲染内容 */
    loadServerContent().then(() => {
      renderCasesHome();
      if ($('#view-cases') && $('#view-cases').classList.contains('is-active')) renderCases();
    });
    loadServerPay();   // 拉取支付页配置（收款码 / 提示语 / 客服微信）
    checkBackend();    // 检测后端连接状态并在页脚提示
    /* 运营配置：拉取后刷新 banner 并触发 load 类弹窗 */
    loadServerOps().then(() => {
      renderBanner();
      maybeShowPopup('load');
    });
  }
  /* 注册 Service Worker，让 H5 Web App 可「添加到主屏幕」并支持离线 */
  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }
  /* 后端在线状态检测：决定注册/配置能否落库到后台 */
  async function checkBackend() {
    const el = $('#backend-status');
    try {
      const r = await apiFetch('/api/status', { method: 'GET' });
      backendOnline = r.ok;
    } catch (e) { backendOnline = false; }
    if (!el) return;
    if (backendOnline) {
      el.className = 'backend-status is-on';
      el.textContent = '后端：已连接 ✓';
      el.title = '注册与支付数据将实时写入后台';
    } else {
      el.className = 'backend-status is-off';
      el.textContent = '后端：未连接（仅本机模式）';
      el.title = '当前未连到后端：注册/支付数据不会写入后台。请用运行 server.js 的地址访问，或配置 <meta name="api-base">';
    }
  }
  document.addEventListener('DOMContentLoaded', init);
})();
