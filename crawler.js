'use strict';
/*
 * =========================================================================
 * 赛道行情合规爬虫（仅供「不做牛马」平台自有聚合展示）
 *
 * 合规边界（务必遵守）：
 *   - 仅抓取公开可见页面（无需登录），不绕过任何登录 / 付费墙 / 验证码。
 *   - 遵守目标站点 robots.txt 与服务条款；若某站点明确禁止抓取，请停止对其请求。
 *   - 限速友好（每类间隔 ~2.5s、正常 UA、带超时），不进行高频并发。
 *   - 仅用于聚合公开行情摘要（价格 / 需求信号），不采集任何个人隐私（PII）。
 *   - 所有抓取结果写入 data/market.json（运行时数据，不入库、不下发密钥）。
 *   - 若运行环境无法访问外网或目标站限流，整体失败不影响主站（前端回退本地大库）。
 * =========================================================================
 */
const fs = require('fs');
const path = require('path');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
const TIMEOUT = 9000;

// 九大类对应的公开检索词（用于搜索引擎摘要抓取）
const CAT_KEYWORDS = {
  'AI 原生服务类':   'AI 原生服务 企业 接单 外包 报价',
  '本地商家赋能类': '本地商家 赋能 代运营 接单 需求',
  '情绪陪伴经济类': '情绪陪伴 树洞 陪聊 接单 需求',
  '数字产品内容类': '数字产品 内容 模板 售卖 价格',
  '便民生活服务类': '便民生活 上门服务 接单 需求',
  '轻技术工具类':   'AI 微 SaaS 工具 开发 订阅 价格',
  '内容生产变现类': '内容生产 变现 自媒体 接单 报价',
  '企业服务提效类': '企业服务 提效 外包 接单 报价',
  '视觉设计生产类': '视觉设计 接单 外包 价格 需求',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 抓取一个查询的公开搜索摘要（DuckDuckGo HTML 优先，Bing 兜底）
async function fetchSnippets(query) {
  const urls = [
    'https://html.duckduckgo.com/html/?q=' + encodeURIComponent(query),
    'https://www.bing.com/search?q=' + encodeURIComponent(query),
  ];
  for (const url of urls) {
    try {
      const r = await fetch(url, {
        headers: { 'User-Agent': UA, 'Accept-Language': 'zh-CN,zh;q=0.9' },
        signal: AbortSignal.timeout(TIMEOUT),
      });
      if (!r.ok) continue;
      const html = await r.text();
      const snippets = [];
      const ps = html.match(/<p[^>]*>([^<]{20,220})<\/p>/g) || [];
      ps.forEach((p) => {
        const t = p.replace(/<[^>]+>/g, '').trim();
        if (t && !/cookie|隐私|版权|©/i.test(t)) snippets.push(t);
      });
      // 兜底：抓取带 snippet 类的文本
      if (!snippets.length) {
        const re = /class="[^"]*(?:snippet|caption|result__snippet)[^"]*"[^>]*>([^<]{20,220})</g;
        let m;
        while ((m = re.exec(html))) snippets.push(m[1].trim());
      }
      if (snippets.length) return snippets.slice(0, 8);
    } catch (e) {
      /* 尝试下一个源 */
    }
  }
  return [];
}

// 从摘要文本提取价格信号（¥/$/元/月 等）
function extractPrices(text) {
  const prices = [];
  const re = /(¥|￥|\$|RMB|元)\s?\d[\d,]*(\.\d+)?\s*(?:元|元\/月|\/月|k|K|万)?/g;
  let m;
  while ((m = re.exec(text))) prices.push(m[0].trim());
  return [...new Set(prices)].slice(0, 8);
}

// 需求信号评分：摘要中需求相关词频 → 60~95
function signalScore(snippets) {
  const blob = snippets.join(' ');
  const words = ['需求', '接单', '外包', '火爆', '紧缺', '订单', '招', '急', '旺盛', '热门'];
  let n = 0;
  words.forEach((w) => { n += Math.max(0, blob.split(w).length - 1); });
  return Math.min(95, Math.max(60, 60 + Math.min(35, n)));
}

async function runCrawl(dataDir) {
  fs.mkdirSync(dataDir, { recursive: true });
  const out = {
    updatedAt: new Date().toISOString(),
    source: 'ddg+bing-public',
    note: '公开搜索摘要聚合，仅供参考，不承诺收益',
    cats: {},
  };
  for (const [cat, kw] of Object.entries(CAT_KEYWORDS)) {
    try {
      const snippets = await fetchSnippets(kw);
      if (snippets.length) {
        out.cats[cat] = {
          signal: signalScore(snippets),
          snippets: snippets.slice(0, 5),
          prices: extractPrices(snippets.join(' ')),
        };
      }
    } catch (e) {
      /* 跳过该分类 */
    }
    await sleep(2500); // 限速，友好
  }
  const file = path.join(dataDir, 'market.json');
  fs.writeFileSync(file, JSON.stringify(out, null, 2), 'utf8');
  console.log('[crawler] market.json 已更新：' + Object.keys(out.cats).length + ' 个分类');
  return out;
}

module.exports = { runCrawl };
