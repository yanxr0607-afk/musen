'use strict';
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const TOKEN_KEY = 'opc_admin_token';
  const TIERS = [['free', '免费版'], ['basic', '基础版'], ['pro', '专业版'], ['vip', '高端版']];
  let PAY_DRAFT = { wechatQR: '', alipayQR: '' };

  /* 后端基地址：默认同源（admin.html 由 server.js 托管时无需配置）。
     若 admin.html 静态托管在别处（如 CloudStudio），而 server.js 单独部署，
     请在 <head> 加 <meta name="api-base" content="https://你的后端域名"> 指向后端。 */
  const API_BASE = (function () {
    try {
      const m = document.querySelector('meta[name="api-base"]');
      if (m && m.content) return m.content.replace(/\/+$/, '');
    } catch (e) {}
    return (window.__API_BASE || '').replace(/\/+$/, '');
  })();

  function getToken() { try { return sessionStorage.getItem(TOKEN_KEY); } catch (e) { return ''; } }
  function setToken(t) { try { sessionStorage.setItem(TOKEN_KEY, t); } catch (e) {} }
  function clearToken() { try { sessionStorage.removeItem(TOKEN_KEY); } catch (e) {} }

  function toast(msg) {
    const el = $('#toast-mini');
    el.textContent = msg; el.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove('show'), 1800);
  }

  async function api(path, opts = {}) {
    const token = getToken();
    const headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
    if (token) headers['x-admin-token'] = token;
    const res = await fetch(API_BASE + path, Object.assign({ headers }, opts));
    let data = {};
    try { data = await res.json(); } catch (e) {}
    if (res.status === 401) { clearToken(); showLogin('登录已失效，请重新登录'); throw new Error('unauthorized'); }
    return data;
  }

  function showLogin(err) {
    $('#login-view').classList.remove('hidden');
    $('#dash-view').classList.add('hidden');
    if (err) $('#login-err').textContent = err;
  }
  function showDash() {
    $('#login-view').classList.add('hidden');
    $('#dash-view').classList.remove('hidden');
  }

  /* ---------- 登录 ---------- */
  async function doLogin() {
    const pw = $('#admin-pass').value;
    const err = $('#login-err'); if (err) err.textContent = '';
    try {
      const r = await fetch(API_BASE + '/api/admin/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw }),
      });
      // 后端不可达时静态托管通常会回退返回 HTML（SPA fallback），据此给出明确提示
      const ct = r.headers.get('content-type') || '';
      if (!ct.includes('application/json')) {
        if (err) err.textContent = '未检测到后台接口：请确认 Node 后端已部署，并在 admin.html 的 <head> 配置 <meta name="api-base"> 指向后端域名';
        return;
      }
      const d = await r.json().catch(() => ({}));
      if (d.ok && d.token) { setToken(d.token); if (err) err.textContent = ''; enter(); }
      else if (err) err.textContent = (d.error || '登录失败');
    } catch (e) {
      if (err) err.textContent = '无法连接后台服务，请确认 Node 后端已启动 / 已配置 api-base';
    }
  }

  async function enter() {
    try {
      const s = await api('/api/admin/stats');
      if (!s.ok) return showLogin('登录已失效');
      showDash();
      loadStats();
    } catch (e) { /* handled */ }
  }

  /* ---------- Tabs ---------- */
  function bindTabs() {
    $$('.admin-tab').forEach(b => b.addEventListener('click', () => {
      $$('.admin-tab').forEach(x => x.classList.remove('active'));
      $$('.panel').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      $('#tab-' + b.dataset.tab).classList.add('active');
      const t = b.dataset.tab;
      if (t === 'overview') loadStats();
      if (t === 'tracks') loadTracks();
      if (t === 'cases') loadCases();
      if (t === 'users') loadUsers();
      if (t === 'plans') loadPlans();
      if (t === 'ops') loadOps();
      if (t === 'orders') loadOrders();
      if (t === 'pay') loadPay();
    }));
  }

  /* ---------- 概览 ---------- */
  async function loadStats() {
    const s = await api('/api/admin/stats');
    if (!s.ok) return;
    const tiers = Object.entries(s.byTier || {}).map(([k, v]) => `${k}: ${v}`).join(' · ') || '免费版: 0';
    const cards = [
      { num: s.total, lbl: '注册用户' },
      { num: s.tests, lbl: '完成测评' },
      { num: s.views.total, lbl: '累计浏览' },
      { num: s.views.today, lbl: '今日浏览' },
      { num: s.tracks, lbl: '赛道数量' },
      { num: s.cases, lbl: '案例总数' },
      { num: s.casesBasic, lbl: '基础会员案例' },
      { num: tiers, lbl: '会员分布' },
    ];
    $('#stat-grid').innerHTML = cards.map(c =>
      `<div class="stat-card"><div class="num">${c.num}</div><div class="lbl">${c.lbl}</div></div>`).join('');
  }

  /* ---------- 赛道 ---------- */
  async function loadTracks() {
    const d = await api('/api/admin/tracks');
    if (!d.ok) return;
    $('#track-list').innerHTML = d.tracks.map(t => `
      <tr>
        <td data-label="ID">${t.id}</td>
        <td data-label="名称">${esc(t.name || '')}</td>
        <td data-label="分类">${esc(t.cat || '')}</td>
        <td data-label="资金">${(t.capital != null ? t.capital : '-')}</td>
        <td data-label="月收益">${t.incomeMin != null ? t.incomeMin + '-' + (t.incomeMax || '') : '-'}</td>
        <td data-label="操作" class="row-actions">
          <button class="btn btn-ghost btn-sm" data-edit-tk="${t.id}">编辑</button>
          <button class="btn btn-ghost btn-sm" data-del-tk="${t.id}">删除</button>
        </td>
      </tr>`).join('');
    $$('[data-edit-tk]').forEach(b => b.addEventListener('click', () => editTrack(b.dataset.editTk, d.tracks)));
    $$('[data-del-tk]').forEach(b => b.addEventListener('click', () => delTrack(b.dataset.delTk)));
  }
  function editTrack(id, tracks) {
    const t = tracks.find(x => x.id === id); if (!t) return;
    $('#tk-id').value = t.id;
    $('#tk-name').value = t.name || ''; $('#tk-cat').value = t.cat || '';
    $('#tk-capital').value = t.capital != null ? t.capital : '';
    $('#tk-incomeMin').value = t.incomeMin != null ? t.incomeMin : '';
    $('#tk-incomeMax').value = t.incomeMax != null ? t.incomeMax : '';
    $('#tk-risk').value = t.risk != null ? t.risk : '';
    $('#tk-aiReq').value = t.aiReq != null ? t.aiReq : '';
    $('#tk-friendly').value = t.friendly || ''; $('#tk-logic').value = t.logic || '';
    $('#tk-ability').value = t.ability || ''; $('#tk-aiPoint').value = t.aiPoint || '';
    $('#tk-form-title').textContent = '编辑赛道：' + t.id;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function resetTrackForm() { $('#tk-id').value = ''; $('#track-form').querySelectorAll('input,textarea').forEach(i => i.value = ''); $('#tk-form-title').textContent = '新增赛道'; }
  async function saveTrack() {
    const id = $('#tk-id').value;
    const body = {
      name: $('#tk-name').value, cat: $('#tk-cat').value,
      capital: num($('#tk-capital')), incomeMin: num($('#tk-incomeMin')), incomeMax: num($('#tk-incomeMax')),
      risk: num($('#tk-risk')), aiReq: num($('#tk-aiReq')),
      friendly: $('#tk-friendly').value, logic: $('#tk-logic').value,
      ability: $('#tk-ability').value, aiPoint: $('#tk-aiPoint').value,
    };
    if (!body.name) return toast('请填写名称');
    const r = id
      ? await api('/api/admin/tracks', { method: 'PUT', body: JSON.stringify(Object.assign({ id }, body)) })
      : await api('/api/admin/tracks', { method: 'POST', body: JSON.stringify(body) });
    if (r.ok) { toast('已保存'); resetTrackForm(); loadTracks(); }
    else toast('保存失败');
  }
  async function delTrack(id) {
    if (!confirm('确认删除赛道 ' + id + '？')) return;
    const r = await api('/api/admin/track?id=' + encodeURIComponent(id), { method: 'DELETE' });
    if (r.ok) { toast('已删除'); loadTracks(); } else toast('删除失败');
  }

  /* ---------- 案例 ---------- */
  async function loadCases() {
    const d = await api('/api/admin/cases');
    if (!d.ok) return;
    $('#case-list').innerHTML = d.cases.map(c => `
      <tr>
        <td data-label="ID">${c.id}</td>
        <td data-label="标题">${esc(c.title || '')}</td>
        <td data-label="分类">${esc(c.cat || '')}</td>
        <td data-label="层级">${c.tier === 'basic' ? '<span class="badge lock">基础</span>' : '<span class="badge">免费</span>'}</td>
        <td data-label="来源">${esc(c.source || '')}</td>
        <td data-label="操作" class="row-actions">
          <button class="btn btn-ghost btn-sm" data-edit-cs="${c.id}">编辑</button>
          <button class="btn btn-ghost btn-sm" data-del-cs="${c.id}">删除</button>
        </td>
      </tr>`).join('');
    $$('[data-edit-cs]').forEach(b => b.addEventListener('click', () => editCase(b.dataset.editCs, d.cases)));
    $$('[data-del-cs]').forEach(b => b.addEventListener('click', () => delCase(b.dataset.delCs)));
  }
  function editCase(id, cases) {
    const c = cases.find(x => x.id === id); if (!c) return;
    $('#cs-id').value = c.id;
    $('#cs-title').value = c.title || ''; $('#cs-cat').value = c.cat || '';
    $('#cs-source').value = c.source || ''; $('#cs-tier').value = c.tier || 'free';
    $('#cs-background').value = c.background || ''; $('#cs-play').value = c.play || '';
    $('#cs-result').value = c.result || ''; $('#cs-insight').value = c.insight || '';
    $('#cs-form-title').textContent = '编辑案例：' + c.id;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function resetCaseForm() { $('#cs-id').value = ''; $('#case-form').querySelectorAll('input,textarea').forEach(i => i.value = ''); $('#cs-tier').value = 'free'; $('#cs-form-title').textContent = '新增案例'; }
  async function saveCase() {
    const id = $('#cs-id').value;
    const body = {
      title: $('#cs-title').value, cat: $('#cs-cat').value, source: $('#cs-source').value,
      tier: $('#cs-tier').value, background: $('#cs-background').value, play: $('#cs-play').value,
      result: $('#cs-result').value, insight: $('#cs-insight').value,
    };
    if (!body.title) return toast('请填写标题');
    const r = id
      ? await api('/api/admin/cases', { method: 'PUT', body: JSON.stringify(Object.assign({ id }, body)) })
      : await api('/api/admin/cases', { method: 'POST', body: JSON.stringify(body) });
    if (r.ok) { toast('已保存'); resetCaseForm(); loadCases(); } else toast('保存失败');
  }
  async function delCase(id) {
    if (!confirm('确认删除案例 ' + id + '？')) return;
    const r = await api('/api/admin/case?id=' + encodeURIComponent(id), { method: 'DELETE' });
    if (r.ok) { toast('已删除'); loadCases(); } else toast('删除失败');
  }

  /* ---------- 用户 ---------- */
  async function loadUsers() {
    const d = await api('/api/admin/users');
    if (!d.ok) return;
    $('#user-list').innerHTML = (d.users || []).map(u => `
      <tr>
        <td data-label="昵称">${esc(u.name)}</td>
        <td data-label="会员"><span class="badge ${u.membership === 'free' ? '' : 'lock'}">${u.membership}</span></td>
        <td data-label="测评次数">${u.testUsed || 0}</td>
        <td data-label="注册时间">${new Date(u.registeredAt).toLocaleString('zh-CN')}</td>
        <td data-label="开通会员"><select class="input um-sel">${TIERS.map(t => `<option value="${t[0]}" ${u.membership === t[0] ? 'selected' : ''}>${t[1]}</option>`).join('')}</select></td>
        <td data-label="操作" class="row-actions"><button class="btn btn-ghost btn-sm" data-set-um="${esc(u.name)}">设为</button></td>
      </tr>`).join('') || '<tr><td colspan="6" style="color:var(--muted)">暂无注册用户</td></tr>';
    $$('[data-set-um]').forEach(b => b.addEventListener('click', () => {
      const tr = b.closest('tr');
      const sel = tr && tr.querySelector('.um-sel');
      if (sel) setUserMembership(b.dataset.setUm, sel.value);
    }));
  }

  /* ---------- 会员配置 ---------- */
  async function loadPlans() {
    const d = await api('/api/admin/memberships');
    if (!d.ok) return;
    $('#plan-list').innerHTML = (d.memberships || []).map((p, i) => `
      <div class="form-grid" data-pi="${i}">
        <div><label>ID</label><input class="input" value="${p.id}" disabled></div>
        <div><label>名称</label><input class="input plan-name" value="${esc(p.name || '')}"></div>
        <div><label>价格</label><input class="input plan-price" value="${esc(p.price || '')}"></div>
        <div><label>周期</label><input class="input plan-period" value="${esc(p.period || '')}"></div>
        <div class="full"><label>权益（每行一条）</label><textarea class="input plan-feats" rows="3">${((p.feats || []).join('\n'))}</textarea></div>
      </div>`).join('');
  }
  async function savePlans() {
    const ms = $$('#plan-list .form-grid').map(g => ({
      id: g.querySelector('input').value,
      name: g.querySelector('.plan-name').value,
      price: g.querySelector('.plan-price').value,
      period: g.querySelector('.plan-period').value,
      feats: g.querySelector('.plan-feats').value.split('\n').map(s => s.trim()).filter(Boolean),
    }));
    const r = await api('/api/admin/memberships', { method: 'PUT', body: JSON.stringify({ memberships: ms }) });
    if (r.ok) toast('会员配置已保存'); else toast('保存失败');
  }

  /* ---------- 运营配置 ---------- */
  let OPS_STATE = { banner: { enabled: false, slides: [] }, popup: {}, ai: {} };
  async function loadOps() {
    const d = await api('/api/admin/ops');
    if (!d.ok) return;
    OPS_STATE = d.settings || { banner: { enabled: false, slides: [] }, popup: {}, ai: {} };
    if (!OPS_STATE.banner) OPS_STATE.banner = { enabled: false, slides: [] };
    if (!Array.isArray(OPS_STATE.banner.slides)) OPS_STATE.banner.slides = [];
    if (!OPS_STATE.popup) OPS_STATE.popup = {};
    if (!OPS_STATE.ai) OPS_STATE.ai = {};
    $('#bn-enabled').checked = !!OPS_STATE.banner.enabled;
    $('#pop-enabled').checked = !!OPS_STATE.popup.enabled;
    $('#pop-trigger').value = OPS_STATE.popup.trigger || 'load';
    $('#pop-once').checked = OPS_STATE.popup.once !== false;
    $('#pop-title').value = OPS_STATE.popup.title || '';
    $('#pop-content').value = OPS_STATE.popup.content || '';
    $('#pop-btnText').value = OPS_STATE.popup.btnText || '';
    $('#pop-btnLink').value = OPS_STATE.popup.btnLink || '';
    $('#ai-opening').value = OPS_STATE.ai.opening || '';
    $('#ai-examples').value = (OPS_STATE.ai.examples || []).join('\n');
    $('#ai-extra').value = OPS_STATE.ai.systemExtra || '';
    renderBannerList();
  }
  function renderBannerList() {
    const slides = OPS_STATE.banner.slides.slice().sort((a, b) => (a.order || 0) - (b.order || 0));
    $('#bn-list').innerHTML = slides.map((s, i) => `
      <tr>
        <td>${esc(s.title || '')}</td>
        <td>${s.order != null ? s.order : 0}</td>
        <td>${s.active === false ? '<span class="badge">隐藏</span>' : '<span class="badge lock">显示</span>'}</td>
        <td class="row-actions">
          <button class="btn btn-ghost btn-sm" data-edit-bn="${i}">编辑</button>
          <button class="btn btn-ghost btn-sm" data-del-bn="${i}">删除</button>
        </td>
      </tr>`).join('') || '<tr><td colspan="4" style="color:var(--muted)">暂无 Banner</td></tr>';
    $$('[data-edit-bn]').forEach(b => b.addEventListener('click', () => editBanner(+b.dataset.editBn)));
    $$('[data-del-bn]').forEach(b => b.addEventListener('click', () => delBanner(+b.dataset.delBn)));
  }
  function editBanner(i) {
    const s = OPS_STATE.banner.slides[i]; if (!s) return;
    $('#bn-id').value = i;
    $('#bn-title-i').value = s.title || '';
    $('#bn-sub-i').value = s.subtitle || '';
    $('#bn-bg-i').value = s.bg || 'linear-gradient(135deg,#1b2740,#0b1020)';
    $('#bn-link-i').value = s.link || '';
    $('#bn-text-i').value = s.linkText || '';
    $('#bn-order-i').value = s.order != null ? s.order : 0;
    $('#bn-active-i').value = s.active === false ? '0' : '1';
    $('#bn-form-title').textContent = '编辑 Banner：' + (s.title || i);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function resetBannerForm() {
    $('#bn-id').value = '';
    $('#bn-form').querySelectorAll('input,textarea').forEach(i => i.value = '');
    $('#bn-bg-i').value = 'linear-gradient(135deg,#1b2740,#0b1020)';
    $('#bn-order-i').value = 0; $('#bn-active-i').value = '1';
    $('#bn-form-title').textContent = '新增 Banner';
  }
  function saveBanner() {
    const title = $('#bn-title-i').value.trim();
    if (!title) return toast('请填写标题');
    const idx = $('#bn-id').value;
    const slide = {
      title,
      subtitle: $('#bn-sub-i').value.trim(),
      bg: $('#bn-bg-i').value.trim() || 'linear-gradient(135deg,#1b2740,#0b1020)',
      link: $('#bn-link-i').value.trim(),
      linkText: $('#bn-text-i').value.trim(),
      order: num($('#bn-order-i')) || 0,
      active: $('#bn-active-i').value === '1',
    };
    if (idx === '') OPS_STATE.banner.slides.push(slide);
    else OPS_STATE.banner.slides[+idx] = slide;
    resetBannerForm(); renderBannerList(); toast('已加入列表（记得点「保存运营配置」）');
  }
  function delBanner(i) {
    if (!confirm('确认删除该 Banner？')) return;
    OPS_STATE.banner.slides.splice(i, 1); renderBannerList(); toast('已删除（记得保存）');
  }
  async function saveOps() {
    OPS_STATE.banner.enabled = $('#bn-enabled').checked;
    OPS_STATE.popup = {
      enabled: $('#pop-enabled').checked,
      trigger: $('#pop-trigger').value,
      once: $('#pop-once').checked,
      title: $('#pop-title').value,
      content: $('#pop-content').value,
      btnText: $('#pop-btnText').value,
      btnLink: $('#pop-btnLink').value,
    };
    OPS_STATE.ai = {
      opening: $('#ai-opening').value,
      examples: $('#ai-examples').value.split('\n').map(s => s.trim()).filter(Boolean),
      systemExtra: $('#ai-extra').value,
    };
    const r = await api('/api/admin/ops', { method: 'PUT', body: JSON.stringify({ banner: OPS_STATE.banner, popup: OPS_STATE.popup, ai: OPS_STATE.ai }) });
    if (r.ok) toast('运营配置已保存 ✅'); else toast('保存失败');
  }

  /* ---------- 订单管理 ---------- */
  async function loadOrders() {
    const d = await api('/api/admin/orders');
    if (!d.ok) return;
    $('#order-list').innerHTML = (d.orders || []).map(o => {
      const st = o.status === 'done' ? '已处理' : o.status === 'paid' ? '已付款' : '待付款';
      return `
      <tr>
        <td data-label="订单号">${esc(o.id)}</td>
        <td data-label="用户">${esc(o.user)}</td>
        <td data-label="套餐">${esc(o.plan)}</td>
        <td data-label="金额">${esc(o.amount)}</td>
        <td data-label="状态"><span class="badge ${o.status === 'paid' || o.status === 'done' ? 'lock' : ''}">${st}</span></td>
        <td data-label="创建时间">${new Date(o.createdAt).toLocaleString('zh-CN')}</td>
        <td data-label="操作" class="row-actions"><button class="btn btn-ghost btn-sm" data-done-o="${esc(o.id)}">标记已处理</button></td>
      </tr>`;
    }).join('') || '<tr><td colspan="7" style="color:var(--muted)">暂无订单</td></tr>';
    $$('[data-done-o]').forEach(b => b.addEventListener('click', () => setOrderStatus(b.dataset.doneO, 'done')));
  }

  /* ---------- 支付配置（收款码上传 + 提示语 + 客服微信） ---------- */
  function bindPayUploads() {
    const wh = $('#pay-wechat-file'), al = $('#pay-alipay-file');
    if (wh) wh.addEventListener('change', e => readQR(e, 'wechat'));
    if (al) al.addEventListener('change', e => readQR(e, 'alipay'));
  }
  function readQR(e, key) {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      PAY_DRAFT[key + 'QR'] = r.result;
      const prev = key === 'wechat' ? $('#pay-wechat-prev') : $('#pay-alipay-prev');
      if (prev) prev.innerHTML = `<img class="pay-prev-img" src="${r.result}" alt="预览" />`;
    };
    r.readAsDataURL(f);
  }
  async function loadPay() {
    const d = await api('/api/admin/pay');
    if (!d.ok) return;
    const p = d.pay || {};
    $('#pay-note').value = p.note || '付款后添加客服微信，手动开通会员权限';
    $('#pay-cs').value = p.csWechat || '';
    $('#pay-wechat-prev').innerHTML = p.wechatQR ? `<img class="pay-prev-img" src="${p.wechatQR}" alt="微信收款码" />` : '';
    $('#pay-alipay-prev').innerHTML = p.alipayQR ? `<img class="pay-prev-img" src="${p.alipayQR}" alt="支付宝收款码" />` : '';
    PAY_DRAFT.wechatQR = p.wechatQR || '';
    PAY_DRAFT.alipayQR = p.alipayQR || '';
  }
  async function savePay() {
    const body = {
      wechatQR: PAY_DRAFT.wechatQR || '',
      alipayQR: PAY_DRAFT.alipayQR || '',
      note: $('#pay-note').value.trim() || '付款后添加客服微信，手动开通会员权限',
      csWechat: $('#pay-cs').value.trim(),
    };
    const r = await api('/api/admin/pay', { method: 'PUT', body: JSON.stringify(body) });
    if (r.ok) toast('支付配置已保存 ✅'); else toast('保存失败');
  }
  async function setUserMembership(name, membership) {
    const r = await api('/api/admin/set-membership', { method: 'POST', body: JSON.stringify({ name, membership }) });
    if (r.ok) { toast('已设为 ' + membership); loadUsers(); } else toast('操作失败');
  }
  async function setOrderStatus(id, status) {
    const r = await api('/api/admin/order-status', { method: 'POST', body: JSON.stringify({ id, status }) });
    if (r.ok) { toast('订单状态已更新'); loadOrders(); } else toast('操作失败');
  }

  /* ---------- 工具 ---------- */
  function num(el) { const v = parseFloat(el.value); return isNaN(v) ? undefined : v; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  /* ---------- 绑定 ---------- */
  function bind() {
    $('#admin-login').addEventListener('click', doLogin);
    $('#admin-pass').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
    $('#admin-logout').addEventListener('click', () => { clearToken(); showLogin(); });
    $('#tk-save').addEventListener('click', saveTrack);
    $('#tk-reset').addEventListener('click', resetTrackForm);
    $('#cs-save').addEventListener('click', saveCase);
    $('#cs-reset').addEventListener('click', resetCaseForm);
    $('#plan-save').addEventListener('click', savePlans);
    $('#bn-save').addEventListener('click', saveBanner);
    $('#bn-reset').addEventListener('click', resetBannerForm);
    $('#ops-save').addEventListener('click', saveOps);
    $('#pay-save').addEventListener('click', savePay);
    bindPayUploads();
    bindTabs();
  }

  bind();
  if (getToken()) enter(); else showLogin();
})();
