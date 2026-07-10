/* =========================================================================
 * OPC 一人公司赛道选型 SaaS —— Node 代理服务（零依赖，使用 Node 22 全局 fetch）
 *
 * 作用：
 *   1. 托管静态前端（index.html / assets/*）
 *   2. /api/status   返回是否接入混元大模型
 *   3. /api/chat     对话顾问：把用户自由文本发给混元，返回结构化建议
 *                       { online, reply, knownTracks[], unknownTopics[] }
 *   4. /api/track-info  为「库外赛道」生成一份结构化调研卡（混元自动回答）
 *
 * 安全：API Key 仅存于服务端（环境变量 / .env），绝不下发到浏览器。
 * 降级：未配置 HUNYUAN_API_KEY 时，所有接口返回 { online:false }，
 *       前端自动回退到本地规则引擎，站点始终可用。
 * ========================================================================= */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = __dirname;
const PORT = process.env.PORT || 8787;
/* 数据目录：默认 ROOT/data；部署到 Railway/Render 时可用挂载卷，例如 DATA_DIR=/var/data */
const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(ROOT, 'data');
const VIEWS_FILE = path.join(DATA_DIR, 'views.json');

/* ---------------- 配置加载 ---------------- */
function loadEnv() {
  const p = path.join(ROOT, '.env');
  if (!fs.existsSync(p)) return;
  fs.readFileSync(p, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  });
}
loadEnv();

const HUNYUAN_KEY = process.env.HUNYUAN_API_KEY || '';
// 默认值采用已验证可用的腾讯云 TokenHub 体系（hy3），本机零配置 node server.js 即可直接接通混元。
// Railway 等已通过环境变量 HUNYUAN_URL / HUNYUAN_MODEL / HUNYUAN_API_KEY 覆盖，不受此默认值影响。
const HUNYUAN_MODEL = process.env.HUNYUAN_MODEL || 'hy3';
const HUNYUAN_URL = process.env.HUNYUAN_URL || 'https://tokenhub-intl.tencentmaas.com/v1/chat/completions';
const FORCE_JSON = process.env.HUNYUAN_JSON !== '0'; // 默认要求 JSON 输出
const ONLINE = !!HUNYUAN_KEY;

/* ---------------- 载入数据（用于系统提示词 / 后台种子） ---------------- */
let TRACKS = [], CASES = [], PLANS = [];
try {
  const code = fs.readFileSync(path.join(ROOT, 'assets', 'data.js'), 'utf8')
    + '\nglobalThis.__T = { TRACKS, CASES, PLANS };';
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  TRACKS = (sandbox.__T && sandbox.__T.TRACKS) || [];
  CASES = (sandbox.__T && sandbox.__T.CASES) || [];
  PLANS = (sandbox.__T && sandbox.__T.PLANS) || [];
} catch (e) {
  console.warn('[warn] 数据载入失败:', e.message);
}

const trackSummary = TRACKS.map(t =>
  `- ${t.name}（id:${t.id}｜分类:${t.cat}｜启动${t.capital}元起｜月收益${t.incomeMin}-${t.incomeMax}元｜${t.friendly}）`
).join('\n');

function systemPrompt() {
  return `你是"OPC 一人公司赛道选型顾问"。我们已经收录了以下赛道：
${trackSummary}

任务：用户会用一段话描述自己的情况和想做的方向。请严格只输出 JSON，格式如下：
{
  "reply": "面向用户的口语化建议（中文、像创业伙伴、200 字内，可点名推荐库中赛道，也可给出起步动作）",
  "knownTracks": ["匹配到的、库中存在赛道 id 数组，可空"],
  "unknownTopics": ["用户想做的、但不在上面库里的话题 / 赛道名数组，可空"]
}
规则：
1. 若用户需求能对应库中某赛道，把其 id 放入 knownTracks，并在 reply 中给出口语化建议。
2. 若用户问到库里没有的赛道 / 生意（如某些小众或新兴方向），在 unknownTopics 写入主题词，并在 reply 中基于你的知识直接给出"如何起步、最低配置、风险、首单周期"的实用建议。
3. 始终使用中文，语气积极、专业；不要输出 JSON 以外的任何内容。${opsExtra()}`;
}
function opsExtra() {
  try {
    const e = loadStore().settings.ai && loadStore().settings.ai.systemExtra;
    return e ? '\n\n【运营额外话术要求】\n' + e : '';
  } catch (e) { return ''; }
}

/* ---------------- 调用混元 ---------------- */
async function callHunyuan(messages, opts = {}) {
  const body = {
    model: HUNYUAN_MODEL,
    messages,
    temperature: opts.temperature != null ? opts.temperature : 0.7,
  };
  if (FORCE_JSON) body.response_format = { type: 'json_object' };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 25000);
  try {
    const res = await fetch(HUNYUAN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + HUNYUAN_KEY,
      },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error('Hunyuan HTTP ' + res.status + ': ' + txt.slice(0, 300));
    }
    const data = await res.json();
    return (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
  } finally {
    clearTimeout(timer);
  }
}

function parseJSONSafe(s) {
  if (!s) return null;
  try { return JSON.parse(s); } catch (e) { /* ignore */ }
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) { try { return JSON.parse(fence[1]); } catch (e) { /* ignore */ } }
  const b = s.indexOf('{'), e = s.lastIndexOf('}');
  if (b >= 0 && e > b) { try { return JSON.parse(s.slice(b, e + 1)); } catch (e) { /* ignore */ } }
  return null;
}

/* ---------------- 路由辅助 ---------------- */
function sendJSON(res, code, obj) {
  const s = JSON.stringify(obj);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(s);
}
function readBody(req) {
  return new Promise(resolve => {
    let d = '';
    req.on('data', c => { d += c; if (d.length > 1e6) req.destroy(); });
    req.on('end', () => { try { resolve(JSON.parse(d || '{}')); } catch (e) { resolve({}); } });
  });
}

/* ---------------- 接口实现 ---------------- */
async function handleChat(req, res) {
  if (!ONLINE) return sendJSON(res, 200, { online: false });
  const body = await readBody(req);
  const message = String(body.message || '').slice(0, 2000);
  if (!message.trim()) return sendJSON(res, 400, { error: 'empty message' });

  const messages = [
    { role: 'system', content: systemPrompt() },
    { role: 'user', content: message },
  ];
  try {
    const text = await callHunyuan(messages);
    const parsed = parseJSONSafe(text);
    if (!parsed) {
      return sendJSON(res, 200, { online: true, parseError: true, reply: text.slice(0, 600) });
    }
    const known = (Array.isArray(parsed.knownTracks) ? parsed.knownTracks : [])
      .filter(id => TRACKS.find(t => t.id === id)).slice(0, 3);
    return sendJSON(res, 200, {
      online: true,
      reply: String(parsed.reply || ''),
      knownTracks: known,
      unknownTopics: Array.isArray(parsed.unknownTopics) ? parsed.unknownTopics : [],
    });
  } catch (e) {
    return sendJSON(res, 200, { online: true, error: true, message: e.message });
  }
}

async function handleTrackInfo(req, res) {
  if (!ONLINE) return sendJSON(res, 200, { online: false });
  const body = await readBody(req);
  const topic = String(body.topic || '').slice(0, 200);
  if (!topic.trim()) return sendJSON(res, 400, { error: 'empty topic' });

  const prompt = `请围绕主题"${topic}"生成一份结构化一人公司赛道调研卡。严格只输出 JSON：
{
  "name": "赛道名称",
  "cat": "分类（如 AI原生 / 内容变现 / 本地商家 / 视觉设计 等）",
  "capital": 数字（最低启动资金，单位元）,
  "incomeMin": 数字, "incomeMax": 数字（单人月收益参考区间，单位元）,
  "risk": 1至3（1低 2中 3高）,
  "aiReq": 1至3（AI 门槛），
  "target": ["适配人群一句话1", "适配人群一句话2"],
  "skills": ["核心技能1", "核心技能2"],
  "resourcesIdeal": ["理想资源1", "理想资源2"],
  "ability": "核心能力要求（一句话）",
  "logic": "商业模式一句话",
  "aiPoint": "AI 如何提效（一句话）",
  "friendly": "新手友好度（一句话）",
  "paybackSpeed": "回本速度（一句话）",
  "paybackLabel": "X 个月内",
  "config": "最低配置清单（一句话）",
  "firstOrder": "首单周期（一句话）",
  "coldStart": ["第一步动作", "第二步动作", "第三步动作"],
  "donts": ["千万别做1", "千万别做2", "千万别做3"],
  "opportunity": "今日商机（一句话）",
  "painpoint": "今日痛点（一句话）",
  "locked": "会员可解锁的完整落地资料（一句话）"
}
必须中文；字段齐全；coldStart 与 donts 各 3 条；不要输出 JSON 以外的任何内容。`;

  const messages = [
    { role: 'system', content: '你是严谨的赛道研究员，只输出符合要求的中文 JSON，不要任何解释。' },
    { role: 'user', content: prompt },
  ];
  try {
    const text = await callHunyuan(messages, { temperature: 0.8 });
    const parsed = parseJSONSafe(text);
    if (!parsed || !parsed.name) {
      return sendJSON(res, 200, { online: true, parseError: true, raw: text.slice(0, 800) });
    }
    return sendJSON(res, 200, { online: true, profile: parsed });
  } catch (e) {
    return sendJSON(res, 200, { online: true, error: true, message: e.message });
  }
}

/* ---------------- 每日商机 / 痛点（混元批量生成，按日期缓存） ---------------- */
let dailyCache = { date: '', data: null };
async function handleDaily(req, res) {
  if (!ONLINE) return sendJSON(res, 200, { online: false });
  const todayKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  if (dailyCache.date === todayKey && dailyCache.data) {
    return sendJSON(res, 200, { online: true, date: todayKey, count: dailyCache.data.length, updates: dailyCache.data });
  }
  const names = TRACKS.map(t => `${t.id}|${t.name}|${t.cat}`).join('\n');
  const prompt = `以下是 OPC 一人公司赛道的 32 个赛道（id|名称|分类）：
${names}

请基于当前真实市场节点，为「今天」的每一个赛道生成一条"今日商机"和一条"今日痛点"。
严格只输出 JSON：
{
  "updates": [
    {"id":"赛道id","opportunity":"今日商机（一句话，含当下热点/节点）","painpoint":"今日痛点（一句话，用户真实卡点）"}
  ]
}
要求：32 条全部覆盖、id 与上面一致、中文、每条 15-30 字、不要输出 JSON 以外的任何内容。`;
  const messages = [
    { role: 'system', content: '你是敏锐的一人公司赛道市场观察员，只输出符合要求的中文 JSON。' },
    { role: 'user', content: prompt },
  ];
  try {
    const text = await callHunyuan(messages, { temperature: 0.9 });
    const parsed = parseJSONSafe(text);
    const upd = (parsed && Array.isArray(parsed.updates)) ? parsed.updates : [];
    // 仅保留 id 命中的，按库顺序补全缺失
    const byId = {};
    upd.forEach(u => { if (u && u.id) byId[u.id] = u; });
    const full = TRACKS.map(t => byId[t.id] || { id: t.id, opportunity: '', painpoint: '' });
    dailyCache = { date: todayKey, data: full };
    return sendJSON(res, 200, { online: true, date: todayKey, count: full.length, updates: full });
  } catch (e) {
    return sendJSON(res, 200, { online: true, error: true, message: e.message });
  }
}

/* ---------------- 浏览量计数（自建轻量统计，写入 views.json） ---------------- */
function loadViews() {
  try {
    const d = JSON.parse(fs.readFileSync(VIEWS_FILE, 'utf8'));
    if (typeof d.total !== 'number') d.total = 0;
    if (!d.days || typeof d.days !== 'object') d.days = {};
    return d;
  } catch (e) {
    return { total: 0, days: {} };
  }
}
function saveViews(v) {
  try { fs.writeFileSync(VIEWS_FILE, JSON.stringify(v)); } catch (e) { /* 忽略写入失败 */ }
}
function todayKey() { return new Date().toISOString().slice(0, 10); }
async function handleView(req, res) {
  const v = loadViews();
  v.total = (v.total || 0) + 1;
  const k = todayKey();
  v.days[k] = (v.days[k] || 0) + 1;
  saveViews(v);
  return sendJSON(res, 200, { total: v.total, today: v.days[k] });
}
function handleViews(req, res) {
  const v = loadViews();
  return sendJSON(res, 200, { total: v.total || 0, today: v.days[todayKey()] || 0 });
}

/* ================= 后台管理（自建轻量，零依赖） ================= */
const crypto = require('crypto');
const STORE_FILE = path.join(DATA_DIR, 'store.json');
const ADMIN_PASS_FILE = path.join(DATA_DIR, 'admin-pass.txt');
/* 密码优先级：data/admin-pass.txt 文件 > ADMIN_PASS 环境变量 > 默认值 */
function loadAdminPass() {
  /* 优先级：data/admin-pass.txt 文件 > ADMIN_PASS 环境变量 > 随机生成（绝不回退到明文默认弱密码） */
  const env = (process.env.ADMIN_PASS || '').trim();
  if (env && env !== 'opc-admin-dev') return env;  // 环境变量最高优先级：用户明确意图，避免持久卷文件覆盖
  if (env === 'opc-admin-dev') { console.warn('[admin] 检测到 ADMIN_PASS 仍为默认弱密码 opc-admin-dev，已忽略。请在 Railway Variables 设置强密码。'); }
  try { if (fs.existsSync(ADMIN_PASS_FILE)) { const p = fs.readFileSync(ADMIN_PASS_FILE, 'utf8').trim(); if (p && p !== 'opc-admin-dev') return p; } } catch(e) {}
  /* 兜底：未配置或仍为默认弱密码 → 生成随机强密码写入文件，避免默认密码被登录 */
  const rand = crypto.randomBytes(9).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(ADMIN_PASS_FILE, rand, 'utf8');
    console.log('[admin] 已生成随机后台密码并写入 data/admin-pass.txt: ' + rand);
  } catch (e) { console.warn('[admin] 写入随机密码失败:', e.message); }
  return rand;
}
let ADMIN_PASS = loadAdminPass();
const adminTokens = new Set();
/* 支付页默认配置：收款码（data URL）、提示语、客服微信。后台可配，前端展示。 */
const PAY_DEFAULT = { enabled: false, wechatQR: '', alipayQR: '', note: '付款后添加客服微信，手动开通会员权限', csWechat: '' };

let store = null;
function loadStore() {
  if (store) return store;
  try {
    store = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));
  } catch (e) {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    store = {
      tracks: JSON.parse(JSON.stringify(TRACKS)),
      cases: JSON.parse(JSON.stringify(CASES)),
      users: [],
      events: [],
      memberships: PLANS.map(p => ({ id: p.id, name: p.name, price: p.price, period: p.period, feats: p.feats || [], cta: p.cta || '开通' })),
      orders: [],
      settings: {
        siteName: 'OPC 一人公司赛道选型',
        banner: { enabled: false, slides: [] },
        popup: { enabled: false, once: true, trigger: 'load', title: '', content: '', btnText: '', btnLink: '' },
        ai: { opening: '', examples: [], systemExtra: '' },
        pay: JSON.parse(JSON.stringify(PAY_DEFAULT)),
      },
    };
    saveStore();
    console.log('[store] 已从 data.js 种子化 store.json（' + store.tracks.length + ' 赛道 / ' + store.cases.length + ' 案例）');
  }
  if (!Array.isArray(store.tracks)) store.tracks = [];
  if (!Array.isArray(store.cases)) store.cases = [];
  if (!Array.isArray(store.users)) store.users = [];
  if (!Array.isArray(store.events)) store.events = [];
  if (!Array.isArray(store.memberships)) store.memberships = [];
  if (!store.settings) store.settings = {};
  if (!Array.isArray(store.orders)) store.orders = [];
  const st = store.settings;
  if (!st.banner || typeof st.banner !== 'object') st.banner = { enabled: false, slides: [] };
  if (!Array.isArray(st.banner.slides)) st.banner.slides = [];
  if (!st.popup || typeof st.popup !== 'object') st.popup = { enabled: false, once: true, trigger: 'load', title: '', content: '', btnText: '', btnLink: '' };
  if (!st.ai || typeof st.ai !== 'object') st.ai = { opening: '', examples: [], systemExtra: '' };
  if (!Array.isArray(st.ai.examples)) st.ai.examples = [];
  if (!st.pay || typeof st.pay !== 'object') st.pay = JSON.parse(JSON.stringify(PAY_DEFAULT));
  return store;
}
function saveStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2));
  } catch (e) { console.warn('[store] 写入失败:', e.message); }
}

function checkAuth(req) {
  const h = req.headers['x-admin-token'];
  if (h && adminTokens.has(h)) return true;
  const m = (req.url.split('?')[1] || '').match(/token=([^&]+)/);
  return m && adminTokens.has(m[1]);
}

/* ---- 公开：注册上报（让后台统计真实） ---- */
async function handleRegister(req, res) {
  const b = await readBody(req);
  const name = String(b.name || '').slice(0, 32);
  if (!name) return sendJSON(res, 400, { error: 'empty name' });
  const s = loadStore();
  let u = s.users.find(x => x.name === name);
  if (!u) {
    u = { id: 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          name, membership: b.membership || 'free', testUsed: 0, registeredAt: Date.now(), lastActive: Date.now() };
    s.users.push(u);
  } else {
    if (b.membership && b.membership !== 'none') u.membership = b.membership;
    u.lastActive = Date.now();
  }
  if (b.pwd) u.pwd = b.pwd;   // 演示：存储前端传来的哈希（生产应由后端自行哈希，勿存明文）
  saveStore();
  return sendJSON(res, 200, { ok: true, user: u });
}
/* ---- 公开：行为事件（测评完成等） ---- */
async function handleEvent(req, res) {
  const b = await readBody(req);
  const type = String(b.type || '');
  if (!type) return sendJSON(res, 400, { error: 'empty type' });
  const s = loadStore();
  s.events.push({ type, name: String(b.name || '').slice(0, 32), at: Date.now() });
  if (type === 'test' && b.name) {
    const u = s.users.find(x => x.name === b.name);
    if (u) { u.testUsed = (u.testUsed || 0) + 1; u.lastActive = Date.now(); }
  }
  saveStore();
  return sendJSON(res, 200, { ok: true });
}
/* ---- 公开：内容读取（前端优先用后台数据） ---- */
function handleTracks(req, res) { return sendJSON(res, 200, { tracks: loadStore().tracks }); }
function handleCases(req, res) { return sendJSON(res, 200, { cases: loadStore().cases }); }

/* ---- 后台登录 ---- */
async function handleAdminLogin(req, res) {
  const b = await readBody(req);
  if (String(b.password || '') === ADMIN_PASS) {
    const t = crypto.randomBytes(24).toString('hex');
    adminTokens.add(t);
    return sendJSON(res, 200, { ok: true, token: t });
  }
  return sendJSON(res, 401, { ok: false, error: '密码错误' });
}
function adminGuard(req, res) {
  if (!checkAuth(req)) { sendJSON(res, 401, { ok: false, error: '未授权' }); return false; }
  return true;
}
/* ---- 后台：概览统计 ---- */
function handleAdminStats(req, res) {
  const s = loadStore();
  const v = loadViews();
  const byTier = {};
  s.users.forEach(u => { byTier[u.membership] = (byTier[u.membership] || 0) + 1; });
  const tests = s.events.filter(e => e.type === 'test').length;
  return sendJSON(res, 200, {
    ok: true,
    total: s.users.length,
    tests,
    byTier,
    views: { total: v.total || 0, today: v.days[todayKey()] || 0 },
    tracks: s.tracks.length,
    cases: s.cases.length,
    casesBasic: s.cases.filter(c => (c.tier || 'free') === 'basic').length,
  });
}
function handleAdminUsers(req, res) {
  const s = loadStore();
  const list = s.users.slice().sort((a, b) => b.registeredAt - a.registeredAt).slice(0, 200)
    .map(u => ({ name: u.name, membership: u.membership, testUsed: u.testUsed || 0, registeredAt: u.registeredAt }));
  return sendJSON(res, 200, { ok: true, users: list });
}
function handleAdminMemberships(req, res) {
  return sendJSON(res, 200, { ok: true, memberships: loadStore().memberships });
}
async function handleAdminMembershipsPut(req, res) {
  const b = await readBody(req);
  if (!Array.isArray(b.memberships)) return sendJSON(res, 400, { error: 'invalid' });
  loadStore().memberships = b.memberships;
  saveStore();
  return sendJSON(res, 200, { ok: true });
}
/* ---- 后台：赛道 CRUD ---- */
function handleAdminTracks(req, res) {
  const s = loadStore();
  if (req.method === 'GET') return sendJSON(res, 200, { ok: true, tracks: s.tracks });
  if (req.method === 'POST') return adminUpsertTrack(req, res, null);
  if (req.method === 'PUT') return adminUpsertTrack(req, res, 'body');
  return sendJSON(res, 405, { error: 'method' });
}
async function adminUpsertTrack(req, res, mode) {
  const b = await readBody(req);
  const s = loadStore();
  const id = mode === 'body' ? String(b.id || '') : ('t' + Date.now().toString(36));
  let t = s.tracks.find(x => x.id === id);
  if (!t) { t = { id }; s.tracks.push(t); }
  ['name', 'cat', 'capital', 'incomeMin', 'incomeMax', 'risk', 'aiReq', 'friendly',
   'ability', 'logic', 'aiPoint', 'config', 'firstOrder', 'opportunity', 'painpoint', 'locked']
    .forEach(k => { if (b[k] !== undefined) t[k] = b[k]; });
  if (Array.isArray(b.target)) t.target = b.target;
  if (Array.isArray(b.skills)) t.skills = b.skills;
  if (Array.isArray(b.coldStart)) t.coldStart = b.coldStart;
  if (Array.isArray(b.donts)) t.donts = b.donts;
  saveStore();
  return sendJSON(res, 200, { ok: true, track: t });
}
async function handleAdminTrackDelete(req, res) {
  const id = (req.url.split('?')[1] || '').match(/id=([^&]+)/);
  if (!id) return sendJSON(res, 400, { error: 'no id' });
  const s = loadStore();
  const before = s.tracks.length;
  s.tracks = s.tracks.filter(t => t.id !== id[1]);
  saveStore();
  return sendJSON(res, 200, { ok: true, removed: before - s.tracks.length });
}
/* ---- 后台：案例 CRUD ---- */
function handleAdminCases(req, res) {
  const s = loadStore();
  if (req.method === 'GET') return sendJSON(res, 200, { ok: true, cases: s.cases });
  if (req.method === 'POST') return adminUpsertCase(req, res, null);
  if (req.method === 'PUT') return adminUpsertCase(req, res, 'body');
  return sendJSON(res, 405, { error: 'method' });
}
async function adminUpsertCase(req, res, mode) {
  const b = await readBody(req);
  const s = loadStore();
  const id = mode === 'body' ? String(b.id || '') : ('c' + Date.now().toString(36));
  let c = s.cases.find(x => x.id === id);
  if (!c) { c = { id }; s.cases.push(c); }
  ['cat', 'title', 'source', 'background', 'play', 'result', 'insight', 'tier']
    .forEach(k => { if (b[k] !== undefined) c[k] = b[k]; });
  saveStore();
  return sendJSON(res, 200, { ok: true, case: c });
}
async function handleAdminCaseDelete(req, res) {
  const id = (req.url.split('?')[1] || '').match(/id=([^&]+)/);
  if (!id) return sendJSON(res, 400, { error: 'no id' });
  const s = loadStore();
  const before = s.cases.length;
  s.cases = s.cases.filter(c => c.id !== id[1]);
  saveStore();
  return sendJSON(res, 200, { ok: true, removed: before - s.cases.length });
}

/* ---- 公开：运营配置读取（banner/popup/ai话术） ---- */
function handleOps(req, res) {
  const s = loadStore().settings || {};
  return sendJSON(res, 200, {
    ok: true,
    banner: s.banner || { enabled: false, slides: [] },
    popup: s.popup || { enabled: false },
    ai: s.ai || {},
  });
}
/* ---- 后台：运营配置读写 ---- */
async function handleAdminOps(req, res) {
  const s = loadStore();
  if (req.method === 'GET') return sendJSON(res, 200, { ok: true, settings: s.settings });
  if (req.method === 'PUT') {
    const b = await readBody(req);
    if (b.banner && typeof b.banner === 'object') s.settings.banner = b.banner;
    if (b.popup && typeof b.popup === 'object') s.settings.popup = b.popup;
    if (b.ai && typeof b.ai === 'object') s.settings.ai = b.ai;
    saveStore();
    return sendJSON(res, 200, { ok: true });
  }
  return sendJSON(res, 405, { error: 'method' });
}
/* ---- 公开：下单（沙箱，真实支付需替换为微信/支付宝下单） ---- */
async function handleCheckout(req, res) {
  const b = await readBody(req);
  const plan = String(b.plan || '');
  const name = String(b.name || '').slice(0, 32);
  const p = PLANS.find(x => x.id === plan);
  if (!p) return sendJSON(res, 400, { error: 'invalid plan' });
  if (!name) return sendJSON(res, 400, { error: 'empty name' });
  const s = loadStore();
  const order = {
    id: 'o' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    user: name, plan, amount: p.price, status: 'pending', createdAt: Date.now(), paidAt: null,
  };
  s.orders.push(order); saveStore();
  return sendJSON(res, 200, { ok: true, order });
}
/* ---- 公开：支付回调（沙箱；真实环境由微信/支付宝异步通知触发） ---- */
async function handlePay(req, res) {
  const b = await readBody(req);
  const id = String(b.orderId || '');
  const s = loadStore();
  const o = s.orders.find(x => x.id === id);
  if (!o) return sendJSON(res, 404, { error: 'no order' });
  if (o.status === 'paid') return sendJSON(res, 200, { ok: true, order: o });
  o.status = 'paid'; o.paidAt = Date.now();
  const u = s.users.find(x => x.name === o.user);
  if (u) { u.membership = o.plan; u.lastActive = Date.now(); }
  saveStore();
  return sendJSON(res, 200, { ok: true, order: o });
}
/* ---- 后台：订单列表 ---- */
function handleAdminOrders(req, res) {
  const s = loadStore();
  const list = s.orders.slice().sort((a, b) => b.createdAt - a.createdAt).slice(0, 300)
    .map(o => ({ id: o.id, user: o.user, plan: o.plan, amount: o.amount, status: o.status, createdAt: o.createdAt, paidAt: o.paidAt }));
  return sendJSON(res, 200, { ok: true, orders: list });
}

/* ---- 公开：支付页配置（收款码 / 提示语 / 客服微信） ---- */
function handlePayConfig(req, res) {
  const pay = (loadStore().settings && loadStore().settings.pay) || JSON.parse(JSON.stringify(PAY_DEFAULT));
  return sendJSON(res, 200, { ok: true, pay });
}
/* ---- 后台：支付页配置读写 ---- */
async function handleAdminPay(req, res) {
  const s = loadStore();
  if (req.method === 'GET') return sendJSON(res, 200, { ok: true, pay: s.settings.pay || PAY_DEFAULT });
  if (req.method === 'PUT') {
    const b = await readBody(req);
    if (b && typeof b === 'object') s.settings.pay = Object.assign({}, PAY_DEFAULT, b);
    saveStore();
    return sendJSON(res, 200, { ok: true });
  }
  return sendJSON(res, 405, { error: 'method' });
}
/* ---- 后台：手动设置用户会员等级（用户付款后，管理员人工开通） ---- */
async function handleAdminSetMembership(req, res) {
  const b = await readBody(req);
  const name = String(b.name || '').slice(0, 32);
  const membership = String(b.membership || '');
  if (!name || !membership) return sendJSON(res, 400, { error: 'invalid' });
  const s = loadStore();
  const u = s.users.find(x => x.name === name);
  if (!u) return sendJSON(res, 404, { error: 'no user' });
  u.membership = membership; u.lastActive = Date.now();
  saveStore();
  return sendJSON(res, 200, { ok: true, user: u });
}
/* ---- 后台：更新订单状态（付款核实 / 已发资料） ---- */
async function handleAdminOrderStatus(req, res) {
  const b = await readBody(req);
  const id = String(b.id || '');
  const status = String(b.status || '');
  if (!id || !status) return sendJSON(res, 400, { error: 'invalid' });
  const s = loadStore();
  const o = s.orders.find(x => x.id === id);
  if (!o) return sendJSON(res, 404, { error: 'no order' });
  o.status = status;
  if ((status === 'paid' || status === 'done') && !o.paidAt) o.paidAt = Date.now();
  saveStore();
  return sendJSON(res, 200, { ok: true, order: o });
}

async function handleAdminSetPassword(req, res) {
  const b = await readBody(req);
  const newPass = String(b.password || '').trim();
  if (!newPass || newPass.length < 4) return sendJSON(res, 400, { error: '密码至少 4 位' });
  if (newPass.length > 64) return sendJSON(res, 400, { error: '密码不超过 64 位' });
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(ADMIN_PASS_FILE, newPass, 'utf8');
    ADMIN_PASS = newPass;
    /* 使所有旧 token 失效（强制重新登录） */
    adminTokens.clear();
    return sendJSON(res, 200, { ok: true, message: '密码已更新，所有会话已失效，请用新密码重新登录' });
  } catch (e) {
    return sendJSON(res, 500, { error: '写入失败: ' + e.message });
  }
}

/* ---------------- 静态托管（防目录穿越） ---------------- */
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.txt': 'text/plain',
  '.webmanifest': 'application/manifest+json', '.webp': 'image/webp', '.mjs': 'text/javascript',
};
function serveStatic(req, res) {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  if (p === '/admin') p = '/admin.html';
  const safe = path.normalize(p).replace(/^(\.\.[/\\])+/, '');
  const fp = path.join(ROOT, safe);
  if (!fp.startsWith(ROOT)) { res.writeHead(403); return res.end('forbidden'); }
  fs.readFile(fp, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('404 Not Found');
    }
    res.writeHead(200, {
      'Content-Type': (MIME[path.extname(fp)] || 'application/octet-stream') + '; charset=utf-8',
      'Cache-Control': 'no-cache',
    });
    res.end(data);
  });
}

/* ---------------- 主服务 ---------------- */
const server = http.createServer(async (req, res) => {
  /* CORS：允许跨域访问 API（前端静态托管与后端分离部署时仍可连通） */
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-admin-token');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  const u = req.url.split('?')[0];
  try {
    if (u === '/api/status') return sendJSON(res, 200, { online: ONLINE, model: HUNYUAN_MODEL });
    if (u === '/api/chat' && req.method === 'POST') return await handleChat(req, res);
    if (u === '/api/track-info' && req.method === 'POST') return await handleTrackInfo(req, res);
    if (u === '/api/daily' && req.method === 'POST') return await handleDaily(req, res);
    if (u === '/api/view' && req.method === 'POST') return await handleView(req, res);
    if (u === '/api/views' && req.method === 'GET') return await handleViews(req, res);
/* ---- 公开：用户会员状态同步（前端 localStorage → 服务端 store.json 对齐） ---- */
function handleUserProfile(req, res) {
  // 从查询参数或注册时用的方式识别用户（name + hash 或仅 name）
  const name = String((req.url.match(/[?&]name=([^&]*)/) || [])[1] || '').trim().slice(0, 32);
  if (!name) return sendJSON(res, 200, { ok: true, membership: null });  // 未登录，不返回
  const s = loadStore();
  const u = s.users.find(x => x.name === name);
  if (!u) return sendJSON(res, 200, { ok: true, membership: null });     // 未注册
  return sendJSON(res, 200, { ok: true, membership: u.membership || 'free', name: u.name });
}

    /* 公开内容 / 上报 */
    if (u === '/api/tracks' && req.method === 'GET') return handleTracks(req, res);
    if (u === '/api/cases' && req.method === 'GET') return handleCases(req, res);
    if (u === '/api/register' && req.method === 'POST') return await handleRegister(req, res);
    if (u === '/api/event' && req.method === 'POST') return await handleEvent(req, res);
    /* 运营配置 / 支付订单（公开） */
    if (u === '/api/ops' && req.method === 'GET') return handleOps(req, res);
    if (u === '/api/pay-config' && req.method === 'GET') return handlePayConfig(req, res);
    if (u === '/api/checkout' && req.method === 'POST') return await handleCheckout(req, res);
    if (u === '/api/pay' && req.method === 'POST') return await handlePay(req, res);
    if (u === '/api/user/profile' && req.method === 'GET') return handleUserProfile(req, res);
    /* 后台鉴权入口 */
    if (u === '/api/admin/login' && req.method === 'POST') return await handleAdminLogin(req, res);
    /* 后台受保护接口 */
    if (u.startsWith('/api/admin/')) {
      if (!adminGuard(req, res)) return;
      if (u === '/api/admin/stats' && req.method === 'GET') return handleAdminStats(req, res);
      if (u === '/api/admin/users' && req.method === 'GET') return handleAdminUsers(req, res);
      if (u === '/api/admin/memberships' && req.method === 'GET') return handleAdminMemberships(req, res);
      if (u === '/api/admin/memberships' && req.method === 'PUT') return await handleAdminMembershipsPut(req, res);
      if (u === '/api/admin/tracks') return await handleAdminTracks(req, res);
      if (u === '/api/admin/track' && req.method === 'DELETE') return await handleAdminTrackDelete(req, res);
      if (u === '/api/admin/cases') return await handleAdminCases(req, res);
      if (u === '/api/admin/case' && req.method === 'DELETE') return await handleAdminCaseDelete(req, res);
      if (u === '/api/admin/ops') return await handleAdminOps(req, res);
      if (u === '/api/admin/pay') return await handleAdminPay(req, res);
      if (u === '/api/admin/orders' && req.method === 'GET') return handleAdminOrders(req, res);
      if (u === '/api/admin/set-membership' && req.method === 'POST') return await handleAdminSetMembership(req, res);
      if (u === '/api/admin/order-status' && req.method === 'POST') return await handleAdminOrderStatus(req, res);
      if (u === '/api/admin/set-password' && req.method === 'POST') return await handleAdminSetPassword(req, res);
      return sendJSON(res, 404, { error: 'not found' });
    }
    if (u.startsWith('/api/')) return sendJSON(res, 404, { error: 'not found' });
    return serveStatic(req, res);
  } catch (e) {
    sendJSON(res, 500, { error: e.message });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`OPC SaaS server  ➜  http://127.0.0.1:${PORT}`);
  console.log(`混元大模型状态  ➜  ${ONLINE ? 'ONLINE (' + HUNYUAN_MODEL + ')' : 'OFFLINE（使用本地规则引擎，配置 HUNYUAN_API_KEY 后启用）'}`);
});
