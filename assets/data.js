/* =========================================================================
 * OPC 一人公司赛道选型与落地 SaaS —— 核心数据资产
 * 数据来源：《OPC一人公司赛道选型与落地SaaS 全方案汇总》
 * 20 个精选赛道（2026 环境适配 · AI 增强版），每条含文档定义的 10 项标准字段
 * ========================================================================= */

// 五类核心目标用户画像（文档 Table 1）
const PERSONAS = {
  student:  { label: '在校学生 / 应届毕业生', short: '应届生',   tone: 'encourage' },
  sidehustle:{ label: '职场人（想做副业）',    short: '副业党',   tone: 'rational' },
  parent:   { label: '全职宝妈 / 宝爸',       short: '宝妈宝爸', tone: 'empathy' },
  midlife:  { label: '中年转型 / 离职创业',    short: '中年转型', tone: 'steady' },
  silver:   { label: '退休 / 自由时间充足（50岁+）', short: '银发创业', tone: 'plain' },
  other:    { label: '其他',                 short: '其他',     tone: 'rational' },
};

// 技能标签
const SKILLS = {
  copy:  '文案写作 / 内容运营',
  design:'设计 / 审美',
  dev:   '编程 / 技术开发',
  sales: '沟通谈单 / 销售',
  video: '视频剪辑 / 拍摄',
  legal: '财务 / 法律专业知识',
};

// 资源标签
const RESOURCES = {
  local:  '本地商家 / 人脉资源',
  supply: '供应链 / 货源资源',
  traffic:'自媒体账号 / 流量资源',
};

// 经营方式
const WORKMODES = {
  online:    '纯线上，居家就能做',
  hybrid:    '线上为主，偶尔线下',
  offline:   '线下本地为主',
};

/* -------------------------------------------------------------------------
 * 赛道数据库（核心资产）
 * 字段：id 名称 cat 分类 capital 最低启动资金
 *       income 收益区间 incomeMin incomeMax
 *       paybackLabel paybackMax(月) risk(1-3)
 *       skills 所需技能 target 适配人群 aiReq(AI门槛1-3) workMode
 *       resourcesIdeal 理想资源 ability 能力要求 logic 适配逻辑
 *       coldStart 冷启动3步 aiPoint AI赋能点 risks 风险避坑
 *       locked 付费解锁详情（免费仅预览首步）
 * ----------------------------------------------------------------------- */
const TRACKS = [
  {
    id: 't01', name: '本地商家 AI 自动化流程搭建', cat: 'AI 原生服务类',
    capital: 300, income: '6000-25000 元', incomeMin: 6000, incomeMax: 25000,
    paybackLabel: '1-2 个月', paybackMax: 2, risk: 2,
    skills: ['dev', 'sales'], target: ['sidehustle', 'midlife', 'student'],
    aiReq: 3, workMode: 'hybrid', resourcesIdeal: ['local'],
    ability: '懂基础办公软件、愿意学低代码工具；有销售/谈单底气更佳',
    logic: 'AI 自动生成客服、客户登记、数据统计流程，一键搭建行业工作流，无需写代码即可交付',
    coldStart: ['梳理 1 个本地行业（如美业/教培）的标准业务流程', '用低代码 + 大模型搭出可演示的自动化样板', '带着样板上门谈 3 家店，按效果收费'],
    aiPoint: 'AI 自动生成客服话术、客户登记表、数据统计看板，一键搭建行业工作流，无需代码',
    risks: '避免一次性收高额年费；先交付小模块验证价值再续费，防范商家不续约风险',
    locked: '含行业工作流模板库（美业/餐饮/教培各 1 套）、标准报价单、交付 SOP 与回款节点，付费会员可一键复制套用。'
  },
  {
    id: 't02', name: 'AI 数字人门店短视频代运营', cat: 'AI 原生服务类',
    capital: 500, income: '5000-20000 元', incomeMin: 5000, incomeMax: 20000,
    paybackLabel: '1-2 个月', paybackMax: 2, risk: 2,
    skills: ['video', 'copy'], target: ['student', 'sidehustle', 'parent'],
    aiReq: 2, workMode: 'online', resourcesIdeal: ['local', 'traffic'],
    ability: '会基础剪辑、懂一点门店经营痛点',
    logic: 'AI 数字人生成口播、批量剪辑、一键多平台分发、自动配文案字幕，单人可服务多家门店',
    coldStart: ['选定 1 个垂直门店类型（如餐饮/美容）', '用数字人生成 10 条样片建立作品集', '在本地生活平台接单或地推谈首家门店'],
    aiPoint: 'AI 数字人生成口播、批量剪辑、一键多平台分发、自动配文案字幕',
    risks: '数字人需标注“AI 生成”避免虚假宣传；合同明确更新频次与版权归属',
    locked: '含分行业短视频脚本模板 30 套、数字人形象配置教程、多平台分发排期表，会员可下载复用。'
  },
  {
    id: 't03', name: '企业 / 商家 AI 合规文案审核', cat: 'AI 原生服务类',
    capital: 200, income: '4000-18000 元', incomeMin: 4000, incomeMax: 18000,
    paybackLabel: '1-2 个月', paybackMax: 2, risk: 2,
    skills: ['legal', 'copy'], target: ['sidehustle', 'midlife'],
    aiReq: 2, workMode: 'online', resourcesIdeal: ['local'],
    ability: '有法务/运营/文案背景者最佳，细心、懂平台规则',
    logic: 'AI 批量检测广告法 / 平台规则违禁点，自动生成合规改写方案，按篇或包月收费',
    coldStart: ['整理高频违禁词与各行业审核清单', '用大模型搭一个审核规则工作流', '向 5 家电商/本地商家提供免费试审换取案例'],
    aiPoint: 'AI 批量检测广告法 / 平台规则违禁点，自动生成合规改写方案',
    risks: '不出具法律意见、不做“保证过审”承诺；审核结果标注“参考，以人工为准”',
    locked: '含违禁词库（按行业分类）、审核报告模板、包月服务报价方案，会员专享更新。'
  },
  {
    id: 't04', name: 'AI 批量数据处理外包服务', cat: 'AI 原生服务类',
    capital: 0, income: '3000-15000 元', incomeMin: 3000, incomeMax: 15000,
    paybackLabel: '当月', paybackMax: 1, risk: 1,
    skills: ['dev', 'copy'], target: ['student', 'sidehustle'],
    aiReq: 2, workMode: 'online', resourcesIdeal: [],
    ability: '会用 Excel/表格，愿意学 AI 提取工具即可',
    logic: 'AI 自动提取 PDF / 图片 / 表格信息，批量整理、分类、对账，效率是人工 10 倍，零成本启动',
    coldStart: ['在接单平台挂出“数据整理/录入”服务', '用 AI 工具做出 1 个处理前后对比样例', '接 3 单小活跑通流程并积累好评'],
    aiPoint: 'AI 自动提取 PDF / 图片 / 表格信息，批量整理、分类、对账，效率是人工 10 倍',
    risks: '注意客户数据隐私，签订保密约定；不碰敏感个人信息',
    locked: '含数据处理 SOP、常用 AI 提取工具清单、报价梯度表与接单话术，会员可复制。'
  },
  {
    id: 't05', name: '垂直行业 AI 提示词 + 工作流定制', cat: 'AI 原生服务类',
    capital: 100, income: '3000-12000 元', incomeMin: 3000, incomeMax: 12000,
    paybackLabel: '当月', paybackMax: 1, risk: 1,
    skills: ['copy', 'dev'], target: ['student', 'sidehustle'],
    aiReq: 2, workMode: 'online', resourcesIdeal: [],
    ability: '表达清晰、善于拆解岗位任务',
    logic: '针对岗位定制专属提示词库 + 标准化 AI 工作流，打包售卖，边际成本为零',
    coldStart: ['选 1 个你熟悉的岗位（如新媒体/客服）', '沉淀 20 条高价值提示词与配套流程', '上架到模板平台或私域售卖'],
    aiPoint: '针对岗位定制专属提示词库 + 标准化 AI 工作流，打包售卖，边际成本为零',
    risks: '提示词易被复制，需持续更新与社群绑定提升复购',
    locked: '含 5 大岗位提示词包、工作流搭建视频课、上架与定价指南，会员专享。'
  },
  {
    id: 't06', name: '社区小店 AI 私域代运营', cat: '本地商家赋能类',
    capital: 300, income: '5000-20000 元', incomeMin: 5000, incomeMax: 20000,
    paybackLabel: '1-2 个月', paybackMax: 2, risk: 2,
    skills: ['copy', 'sales'], target: ['parent', 'midlife', 'student'],
    aiReq: 2, workMode: 'online', resourcesIdeal: ['local'],
    ability: '会写朋友圈文案、懂基础社群运营',
    logic: 'AI 自动生成朋友圈 / 社群文案、客户分层、活动方案、自动回复话术，居家可服务多家社区店',
    coldStart: ['锁定 1 个社区业态（如便利店/水果店）', '搭建内容日历与自动回复模板', '谈下首家门店做月度代运营'],
    aiPoint: 'AI 自动生成朋友圈 / 社群文案、客户分层、活动方案、自动回复话术',
    risks: '效果需以到店/复购衡量，避免承诺销量；按月收费降低商家决策门槛',
    locked: '含社区店内容日历模板、客户分层话术库、代运营服务合同范本，会员可下载。'
  },
  {
    id: 't07', name: '本地服务 AI 获客工作室', cat: '本地商家赋能类',
    capital: 0, income: '4000-18000 元', incomeMin: 4000, incomeMax: 18000,
    paybackLabel: '1-2 个月', paybackMax: 2, risk: 1,
    skills: ['sales', 'copy'], target: ['midlife', 'silver'],
    aiReq: 1, workMode: 'offline', resourcesIdeal: ['local'],
    ability: '本地人脉广、会聊天、肯跑腿',
    logic: 'AI 批量生成同城短视频文案、自动回复咨询、匹配派单，赚信息差佣金，零成本起步',
    coldStart: ['盘点本地高频服务需求（家政/维修/搬家）', '用 AI 生成同城引流内容矩阵', '组建师傅/商家资源池做派单中介'],
    aiPoint: 'AI 批量生成同城短视频文案、自动回复咨询、匹配派单，赚信息差佣金',
    risks: '派单需把控服务方质量，建立评价机制防客诉',
    locked: '含同城内容模板、派单管理表、佣金结算方案，会员专享。'
  },
  {
    id: 't08', name: '餐饮门店 AI 食安台账 + 经营助手', cat: '本地商家赋能类',
    capital: 200, income: '3000-15000 元', incomeMin: 3000, incomeMax: 15000,
    paybackLabel: '1-3 个月', paybackMax: 3, risk: 2,
    skills: ['copy', 'legal'], target: ['parent', 'midlife'],
    aiReq: 2, workMode: 'offline', resourcesIdeal: ['local'],
    ability: '细心、懂基础餐饮合规要求',
    logic: 'AI 自动生成合规台账、食材保质期预警、经营数据复盘、营销活动生成，帮小餐饮降本增效',
    coldStart: ['研究本地食安台账合规要点', '搭出自动台账与预警模板', '向 5 家小餐饮免费试用换案例'],
    aiPoint: 'AI 自动生成合规台账、食材保质期预警、经营数据复盘、营销活动生成',
    risks: '台账为辅助工具，不替代法定记录；明确“仅供参考”',
    locked: '含食安台账模板、预警规则配置、经营复盘看板，会员专享。'
  },
  {
    id: 't09', name: 'AI + 垂直情感陪伴树洞服务', cat: '情绪陪伴经济类',
    capital: 300, income: '4000-20000 元', incomeMin: 4000, incomeMax: 20000,
    paybackLabel: '1-2 个月', paybackMax: 2, risk: 2,
    skills: ['copy', 'sales'], target: ['student', 'sidehustle'],
    aiReq: 2, workMode: 'online', resourcesIdeal: [],
    ability: '共情力强、表达温和、有边界感',
    logic: '大模型微调做情绪疏导、深夜倾听，搭配人工兜底，按次 / 包月收费',
    coldStart: ['明确服务边界（不替代心理咨询）', '用大模型搭倾听话术与转介机制', '在社群/内容平台引流首批用户'],
    aiPoint: '大模型微调做情绪疏导、深夜倾听，搭配人工兜底，按次 / 包月收费',
    risks: '严守心理危机转介红线，不越界做诊疗；做好隐私保护',
    locked: '含倾听话术库、危机转介流程、包月服务方案，会员专享。'
  },
  {
    id: 't10', name: '宠物 AI 成长记录 + 问诊助手', cat: '情绪陪伴经济类',
    capital: 200, income: '3000-12000 元', incomeMin: 3000, incomeMax: 12000,
    paybackLabel: '1-2 个月', paybackMax: 2, risk: 1,
    skills: ['copy', 'design'], target: ['parent', 'student'],
    aiReq: 2, workMode: 'online', resourcesIdeal: ['traffic'],
    ability: '爱宠物、会做图、懂基础养宠知识',
    logic: 'AI 生成成长日记、识别常见病症建议、定制喂养方案，搭配社群增值',
    coldStart: ['做一个宠物成长记录小程序/模板', '沉淀常见病症科普与喂养方案库', '在宠物社群引流并推增值服务'],
    aiPoint: 'AI 生成成长日记、识别常见病症建议、定制喂养方案，搭配社群增值',
    risks: '问诊建议标注“非专业医疗”，引导线下就医',
    locked: '含成长记录模板、病症科普库、喂养方案生成器，会员专享。'
  },
  {
    id: 't11', name: 'AI 定制行业报告 / 方案售卖', cat: '数字产品内容类',
    capital: 100, income: '3000-15000 元', incomeMin: 3000, incomeMax: 15000,
    paybackLabel: '1-2 个月', paybackMax: 2, risk: 2,
    skills: ['copy', 'dev'], target: ['sidehustle', 'midlife'],
    aiReq: 2, workMode: 'online', resourcesIdeal: [],
    ability: '信息检索与整合能力强',
    logic: 'AI 抓取行业数据，自动生成结构化报告，人工润色，单份 / 会员制售卖',
    coldStart: ['选定 1 个高频需求行业（如本地生活）', '搭报告自动生成工作流', '上架到文库/私域做首单'],
    aiPoint: 'AI 抓取行业数据，自动生成结构化报告，人工润色，单份 / 会员制售卖',
    risks: '数据需注明来源与时效，避免误导决策',
    locked: '含报告模板、数据采集工作流、定价与交付规范，会员专享。'
  },
  {
    id: 't12', name: 'AI 虚拟素材 / 模板垂直店铺', cat: '数字产品内容类',
    capital: 100, income: '2000-10000 元', incomeMin: 2000, incomeMax: 10000,
    paybackLabel: '1-2 个月', paybackMax: 2, risk: 1,
    skills: ['design', 'copy'], target: ['student', 'parent', 'sidehustle'],
    aiReq: 2, workMode: 'online', resourcesIdeal: [],
    ability: '会基础设计、审美在线',
    logic: 'AI 批量生成 PPT、海报、简历、脚本模板，分行业上架，一次制作永久收益',
    coldStart: ['选 1 个垂直场景（如简历/PPT）', '用 AI 批量产出 30 套模板', '上架模板平台并设置自动交付'],
    aiPoint: 'AI 批量生成 PPT、海报、简历、脚本模板，分行业上架，一次制作永久收益',
    risks: '注意字体/素材版权，使用可商用授权',
    locked: '含模板制作 SOP、可商用素材清单、店铺运营与引流指南，会员专享。'
  },
  {
    id: 't13', name: '短剧 / 短视频 AI 剪辑 + 分发', cat: '数字产品内容类',
    capital: 300, income: '3000-15000 元', incomeMin: 3000, incomeMax: 15000,
    paybackLabel: '1-2 个月', paybackMax: 2, risk: 2,
    skills: ['video', 'copy'], target: ['student', 'sidehustle'],
    aiReq: 2, workMode: 'online', resourcesIdeal: ['traffic'],
    ability: '会剪辑、懂平台节奏',
    logic: 'AI 批量切片、配字幕 BGM、适配多平台比例，流量分成或代运营收费',
    coldStart: ['选定 1 个内容方向（如影视解说）', '用 AI 搭批量剪辑流水线', '多平台分发跑量并接代运营'],
    aiPoint: 'AI 批量切片、配字幕 BGM、适配多平台比例，流量分成或代运营收费',
    risks: '注意版权与平台规则，避免搬运侵权',
    locked: '含剪辑流水线配置、多平台比例预设、代运营报价单，会员专享。'
  },
  {
    id: 't14', name: 'AI 儿童定制绘本 / 故事售卖', cat: '数字产品内容类',
    capital: 200, income: '2000-8000 元', incomeMin: 2000, incomeMax: 8000,
    paybackLabel: '1-2 个月', paybackMax: 2, risk: 1,
    skills: ['design', 'copy'], target: ['parent', 'student'],
    aiReq: 2, workMode: 'online', resourcesIdeal: [],
    ability: '会写故事、做简单插画',
    logic: 'AI 生成插画 + 文案，定制专属姓名绘本，按单制作或模板打包售卖',
    coldStart: ['做 3 套可定制模板绘本', '在母婴/亲子社群展示样张', '开通按单定制与模板打包两种售卖'],
    aiPoint: 'AI 生成插画 + 文案，定制专属姓名绘本，按单制作或模板打包售卖',
    risks: '插画注意版权与内容合规，适合儿童的内容需健康正向',
    locked: '含绘本模板、定制接单流程、亲子社群引流话术，会员专享。'
  },
  {
    id: 't15', name: '银发群体 AI 数字助手服务', cat: '便民生活服务类',
    capital: 0, income: '2000-8000 元', incomeMin: 2000, incomeMax: 8000,
    paybackLabel: '1-2 个月', paybackMax: 2, risk: 1,
    skills: ['sales', 'copy'], target: ['parent', 'midlife', 'silver'],
    aiReq: 1, workMode: 'offline', resourcesIdeal: ['local'],
    ability: '耐心、本地人脉广、肯上门',
    logic: '教老年人用智能手机 / AI 工具，提供照片修复、证件照制作等，按次 / 包月',
    coldStart: ['整理老年人最高频的 10 个数字需求', '准备照片修复/证件照等标准服务包', '在社区/广场地推首单'],
    aiPoint: '教老年人用智能手机 / AI 工具，提供照片修复、证件照制作等，按次 / 包月',
    risks: '防骗提醒到位，绝不代办转账/理财，守住安全底线',
    locked: '含老年数字需求清单、服务包定价、社区地推话术，会员专享。'
  },
  {
    id: 't16', name: '家用智能设备租赁 + AI 指导', cat: '便民生活服务类',
    capital: 1000, income: '3000-10000 元', incomeMin: 3000, incomeMax: 10000,
    paybackLabel: '2-3 个月', paybackMax: 3, risk: 2,
    skills: ['sales'], target: ['midlife', 'parent'],
    aiReq: 1, workMode: 'offline', resourcesIdeal: ['supply'],
    ability: '有本地配送/服务意识',
    logic: '家电设备租赁，AI 生成使用教程、故障排查，按天 / 按月收费',
    coldStart: ['选 1 类高频设备（如投影/清洁机）', '生成 AI 使用教程与排障库', '本地社群+二手平台发布租赁'],
    aiPoint: '家电设备租赁，AI 生成使用教程、故障排查，按天 / 按月收费',
    risks: '设备押金与损坏理赔规则写清，控制资产风险',
    locked: '含设备选型清单、租赁协议模板、AI 排障库，会员专享。'
  },
  {
    id: 't17', name: '上门宠物照料 + AI 健康档案', cat: '便民生活服务类',
    capital: 500, income: '3000-12000 元', incomeMin: 3000, incomeMax: 12000,
    paybackLabel: '1-2 个月', paybackMax: 2, risk: 1,
    skills: ['sales'], target: ['parent', 'student'],
    aiReq: 1, workMode: 'offline', resourcesIdeal: ['local'],
    ability: '爱宠物、靠谱、肯上门',
    logic: '上门喂养 / 遛弯，AI 生成健康档案、喂养建议，增值服务提升留存',
    coldStart: ['在宠物社群发布上门服务', '建立宠物健康档案模板', '用 AI 生成喂养建议做增值复购'],
    aiPoint: '上门喂养 / 遛弯，AI 生成健康档案、喂养建议，增值服务提升留存',
    risks: '签订上门服务安全与责任约定，防范意外纠纷',
    locked: '含健康档案模板、服务协议、增值套餐设计，会员专享。'
  },
  {
    id: 't18', name: '轻量化垂直 AI 微 SaaS 开发', cat: '轻技术工具类',
    capital: 1000, income: '5000-30000 元', incomeMin: 5000, incomeMax: 30000,
    paybackLabel: '1-3 个月', paybackMax: 3, risk: 3,
    skills: ['dev'], target: ['student', 'sidehustle'],
    aiReq: 3, workMode: 'online', resourcesIdeal: [],
    ability: '有编程基础，能独立开发',
    logic: 'AI 辅助写代码、调试 bug，低代码 + 大模型快速开发小工具，订阅制收费，上限高',
    coldStart: ['找一个垂直痛点（如某行业小工具）', '用 AI 辅助快速做出 MVP', '上线订阅并做精准引流'],
    aiPoint: 'AI 辅助写代码、调试 bug，低代码 + 大模型快速开发小工具，订阅制收费',
    risks: '控制开发范围避免过度投入；先验证付费再迭代',
    locked: '含微 SaaS 选题库、技术栈与部署指南、订阅定价与增长策略，会员专享。'
  },
  {
    id: 't19', name: '企业官网 / 小程序 AI 快速搭建', cat: '轻技术工具类',
    capital: 0, income: '5000-20000 元', incomeMin: 5000, incomeMax: 20000,
    paybackLabel: '1-2 个月', paybackMax: 2, risk: 2,
    skills: ['dev', 'design'], target: ['student', 'sidehustle'],
    aiReq: 2, workMode: 'online', resourcesIdeal: [],
    ability: '会基础前端或愿意学低代码',
    logic: 'AI 自动生成页面、文案、配图，低代码搭建，交付周期从几周压缩到几天',
    coldStart: ['整理企业建站标准交付清单', '用 AI 搭出可演示样例站', '在接单平台/社群接首家'],
    aiPoint: 'AI 自动生成页面、文案、配图，低代码搭建，交付周期从几周压缩到几天',
    risks: '明确交付边界与增项收费，避免无限改稿',
    locked: '含建站交付清单、AI 建站工作流、报价与合同模板，会员专享。'
  },
  {
    id: 't20', name: '3D 打印文创 AI 定制工作室', cat: '轻技术工具类',
    capital: 2000, income: '4000-15000 元', incomeMin: 4000, incomeMax: 15000,
    paybackLabel: '2-3 个月', paybackMax: 3, risk: 2,
    skills: ['dev', 'design'], target: ['student'],
    aiReq: 2, workMode: 'online', resourcesIdeal: ['supply'],
    ability: '有设计/手工基础，愿学 3D 建模',
    logic: 'AI 生成 3D 模型图纸，桌面 3D 打印机制作定制文创，线上接单售卖',
    coldStart: ['选 1 个文创方向（如潮玩/礼品）', '用 AI 生成模型并打样', '上架定制接单+成品售卖'],
    aiPoint: 'AI 生成 3D 模型图纸，桌面 3D 打印机制作定制文创，线上接单售卖',
    risks: '设备与耗材为固定成本，先以销定产控制库存',
    locked: '含文创方向库、建模与打印参数、定价与渠道指南，会员专享。'
  },

  /* ---- 以下 12 个为「AI增强·双模式版」新增赛道（共 32 个）---- */
  { id: 't21', name: 'AI 企业流程自动化搭建服务', cat: 'AI 原生服务类',
    capital: 300, income: '6000-25000 元', incomeMin: 6000, incomeMax: 25000,
    paybackLabel: '1-2 个月', paybackMax: 2, risk: 2,
    skills: ['dev', 'sales'], target: ['sidehustle', 'midlife', 'student'],
    aiReq: 3, workMode: 'hybrid', resourcesIdeal: ['local'],
    aiPoint: 'AI 自动梳理业务流程、配置自动化规则、日常异常排查，单人可服务 20+ 企业',
    coldStart: ['给小微企业免费做一次流程诊断，输出优化方案'] },
  { id: 't22', name: 'AI 多语种有声书 / 广播剧制作', cat: '内容生产变现类',
    capital: 300, income: '5000-20000 元', incomeMin: 5000, incomeMax: 20000,
    paybackLabel: '1-2 个月', paybackMax: 2, risk: 2,
    skills: ['video', 'copy'], target: ['student', 'sidehustle', 'parent'],
    aiReq: 2, workMode: 'online', resourcesIdeal: [],
    aiPoint: 'AI 文本预处理、多音色角色配音、自动后期音效，单集制作效率提升 10 倍',
    coldStart: ['制作 3 个风格样音，上传有声平台接单专区'] },
  { id: 't23', name: 'AI 垂直行业付费研报 / 专栏', cat: '内容生产变现类',
    capital: 100, income: '4000-18000 元', incomeMin: 4000, incomeMax: 18000,
    paybackLabel: '1-2 个月', paybackMax: 2, risk: 2,
    skills: ['copy', 'dev'], target: ['sidehustle', 'midlife'],
    aiReq: 2, workMode: 'online', resourcesIdeal: [],
    aiPoint: 'AI 全网信息抓取、结构化分析、多形态内容改写，单人可运营多赛道',
    coldStart: ['免费输出 3 期行业干货，积累种子用户后开启付费'] },
  { id: 't24', name: 'AI 招投标文件定制代写', cat: '企业服务提效类',
    capital: 200, income: '5000-20000 元', incomeMin: 5000, incomeMax: 20000,
    paybackLabel: '1-2 个月', paybackMax: 2, risk: 2,
    skills: ['copy', 'legal'], target: ['sidehustle', 'midlife'],
    aiReq: 2, workMode: 'online', resourcesIdeal: [],
    aiPoint: 'AI 解析招标文件、生成技术 / 商务标、合规校验，单份制作从 3 天压缩到 4 小时',
    coldStart: ['上架服务平台，主打「24 小时极速出稿」'] },
  { id: 't25', name: 'AI 企业数据清洗与报表包月', cat: '企业服务提效类',
    capital: 0, income: '3000-12000 元', incomeMin: 3000, incomeMax: 12000,
    paybackLabel: '1-2 个月', paybackMax: 2, risk: 1,
    skills: ['dev', 'copy'], target: ['parent', 'student', 'sidehustle'],
    aiReq: 2, workMode: 'online', resourcesIdeal: [],
    aiPoint: 'AI 多格式信息提取、批量对账、自动生成可视化报表，效率是人工 10 倍',
    coldStart: ['对接 10 家小微企业，免费做 1 次月度报表，转化包月'] },
  { id: 't26', name: 'AI 知识产权申请材料辅助', cat: '企业服务提效类',
    capital: 200, income: '4000-15000 元', incomeMin: 4000, incomeMax: 15000,
    paybackLabel: '1-2 个月', paybackMax: 2, risk: 2,
    skills: ['legal', 'design'], target: ['sidehustle', 'midlife'],
    aiReq: 2, workMode: 'online', resourcesIdeal: [],
    aiPoint: 'AI 商标检索分析、生成申请材料、流程自动跟进，单人月均可处理 50 件',
    coldStart: ['对接电商商家社群，推出商标注册代办服务'] },
  { id: 't27', name: 'AI 简历优化 + 面试模拟服务', cat: '企业服务提效类',
    capital: 100, income: '3000-12000 元', incomeMin: 3000, incomeMax: 12000,
    paybackLabel: '1-2 个月', paybackMax: 2, risk: 1,
    skills: ['copy', 'sales'], target: ['student', 'sidehustle'],
    aiReq: 2, workMode: 'online', resourcesIdeal: [],
    aiPoint: 'AI 简历智能匹配 JD、语音模拟面试、生成话术库，日均可处理 10+ 份',
    coldStart: ['在求职社群做免费简历诊断，引流转化付费服务'] },
  { id: 't28', name: 'AI 电商产品图 / 主图批量生成', cat: '视觉设计生产类',
    capital: 200, income: '4000-18000 元', incomeMin: 4000, incomeMax: 18000,
    paybackLabel: '1-2 个月', paybackMax: 2, risk: 1,
    skills: ['design', 'copy'], target: ['student', 'parent', 'sidehustle'],
    aiReq: 2, workMode: 'online', resourcesIdeal: [],
    aiPoint: 'AI 一键换背景、批量生成创意图、多平台尺寸适配，单套主图 10 分钟完成',
    coldStart: ['给 10 家新店免费做 3 张主图，转化包月服务'] },
  { id: 't29', name: 'AI 建筑 / 装修效果图快速出图', cat: '视觉设计生产类',
    capital: 300, income: '5000-20000 元', incomeMin: 5000, incomeMax: 20000,
    paybackLabel: '1-2 个月', paybackMax: 2, risk: 2,
    skills: ['design', 'dev'], target: ['student', 'midlife'],
    aiReq: 2, workMode: 'hybrid', resourcesIdeal: [],
    aiPoint: 'AI 线稿转效果图、快速改方案、生成物料清单，单张图从 1 天压缩到 1 小时',
    coldStart: ['对接本地装修游击队，报价为传统工作室 1/3'] },
  { id: 't30', name: 'AI 定制 IP 表情包 / 品牌视觉素材', cat: '视觉设计生产类',
    capital: 100, income: '3000-10000 元', incomeMin: 3000, incomeMax: 10000,
    paybackLabel: '1-2 个月', paybackMax: 2, risk: 1,
    skills: ['design', 'copy'], target: ['student', 'parent', 'sidehustle'],
    aiReq: 2, workMode: 'online', resourcesIdeal: [],
    aiPoint: 'AI 生成 IP 形象、批量制作表情包、一键生成节日海报，边际成本为零',
    coldStart: ['先做 5 套行业模板低价售卖，再接定制单'] },
  { id: 't31', name: 'AI 本地商家点评 / 团购代运营', cat: '本地商家赋能类',
    capital: 200, income: '4000-16000 元', incomeMin: 4000, incomeMax: 16000,
    paybackLabel: '1-2 个月', paybackMax: 2, risk: 2,
    skills: ['copy', 'sales'], target: ['parent', 'midlife', 'student'],
    aiReq: 2, workMode: 'hybrid', resourcesIdeal: ['local'],
    aiPoint: 'AI 智能回复评价、优化商家页文案、生成活动方案，单人可托管 20 家门店',
    coldStart: ['给 5 家门店免费做 1 个月评价回复，转化包月'] },
  { id: 't32', name: 'AI 门店智能客服与会员运营', cat: '本地商家赋能类',
    capital: 300, income: '3000-12000 元', incomeMin: 3000, incomeMax: 12000,
    paybackLabel: '1-2 个月', paybackMax: 2, risk: 2,
    skills: ['dev', 'sales'], target: ['midlife', 'sidehustle', 'parent'],
    aiReq: 3, workMode: 'hybrid', resourcesIdeal: ['local'],
    aiPoint: 'AI 训练行业知识库、自动客户分层、生成运营内容，几乎无需日常干预',
    coldStart: ['从身边开店的朋友切入，免费试用 1 个月'] },
];

/* 通用避坑红线（「千万别做」强提示），可被单赛道覆盖 */
const DEFAULT_DONTS = [
  '千万别先交加盟费 / 培训费，任何“稳赚”话术都先打问号',
  '千万别一上来辞职全职投入，先兼职试水验证需求',
  '千万别盲目囤货 / 买贵设备，轻资产起步更稳',
];

/* 赛道数据标准化补全（双模式版 4 模块结果所需的衍生字段） */
function fmtMoney(n) { return '¥' + Number(n).toLocaleString('zh-CN'); }
/* -------------------------------------------------------------------------
 * 行业工具库：每个赛道按分类匹配对应工具（用户需求 5）
 * common = 通用 AI / 内容 / 设计工具；byCat = 各垂直行业专属工具
 * ----------------------------------------------------------------------- */
const TOOLS = {
  common: [
    { name: '混元大模型', desc: '文案 / 方案 / 对话生成主力' },
    { name: 'ChatGPT / Claude', desc: '通用创作与英文内容' },
    { name: '剪映', desc: '短视频剪辑与字幕' },
    { name: 'Canva 可画', desc: '海报 / 封面 / 视觉设计' },
  ],
  byCat: {
    'AI 原生服务类': [
      { name: '扣子 Coze', desc: '零代码搭 AI 智能体 / 工作流' },
      { name: '飞书多维表格', desc: '客户 / 流程数据管理' },
      { name: '腾讯云 AI', desc: 'OCR / 大模型 API 接入' },
      { name: '集简云 / Zapier', desc: '跨系统自动化串联' },
    ],
    '本地商家赋能类': [
      { name: '抖音来客', desc: '本地生活团购经营后台' },
      { name: '企业微信 SCRM', desc: '私域客户管理与群发' },
      { name: '有赞', desc: '门店线上商城与会员' },
      { name: '高德 / 美团商户', desc: '到店流量与榜单运营' },
    ],
    '情绪陪伴经济类': [
      { name: 'CharacterAI / 小冰', desc: '角色化陪伴对话' },
      { name: '知识星球', desc: '付费社群与内容沉淀' },
      { name: '小鹅通', desc: '课程 / 专栏售卖' },
      { name: '微信社群', desc: '用户陪伴与复购' },
    ],
    '数字产品内容类': [
      { name: '小红书', desc: '种草与模板分发' },
      { name: '稿定设计', desc: '电商 / 社媒模板' },
      { name: '知乎 / 得到', desc: '深度内容分发' },
      { name: '飞书 / Notion', desc: '资料结构化整理' },
    ],
    '便民生活服务类': [
      { name: '58 同城 / 闲鱼', desc: '本地供需与二手流转' },
      { name: '微信小程序', desc: '轻量预约 / 服务入口' },
      { name: '支付宝服务窗', desc: '本地生活服务接入' },
      { name: '美团', desc: '到家服务流量' },
    ],
    '轻技术工具类': [
      { name: 'Cursor', desc: 'AI 辅助编程' },
      { name: 'Vercel / 云开发', desc: '一键部署微应用' },
      { name: 'Figma', desc: '原型与 UI 设计' },
      { name: 'Supabase', desc: '后端数据库托管' },
    ],
    '内容生产变现类': [
      { name: '喜马拉雅', desc: '有声书 / 音频分发' },
      { name: '番茄小说', desc: '网文 / 故事投稿' },
      { name: '抖音创作者中心', desc: '短视频流量与变现' },
      { name: '剪映', desc: '批量剪辑与分发' },
    ],
    '企业服务提效类': [
      { name: '腾讯文档', desc: '协作与模板库' },
      { name: '飞书', desc: '企业协同与流程' },
      { name: '法大大', desc: '电子合同与合规' },
      { name: '金数据', desc: '表单 / 问卷收集' },
    ],
    '视觉设计生产类': [
      { name: 'Midjourney', desc: 'AI 图像生成' },
      { name: '稿定设计', desc: '电商主图 / 详情图' },
      { name: 'Figma', desc: '品牌视觉与 UI' },
      { name: '站酷', desc: '设计素材与接单' },
    ],
  },
};
function trackTools(t) {
  if (t.tools && t.tools.length) return t.tools;
  const cat = TOOLS.byCat[t.cat] || [];
  const pick = cat.slice(0, 3).concat(TOOLS.common.slice(0, 2));
  return pick;
}

function normalizeTrack(t) {
  if (!t.friendly) t.friendly = t.capital <= 500 ? '新手友好' : (t.capital <= 1000 ? '较易上手' : '需一定基础');
  if (!t.paybackSpeed) t.paybackSpeed = t.paybackMax <= 1 ? '回本极快' : (t.paybackMax <= 2 ? '回本快' : '回本稳健');
  if (!t.firstOrder) t.firstOrder = t.paybackMax <= 1 ? '7-15 天开出首单' : (t.paybackMax <= 2 ? '15-30 天开出首单' : '1-3 个月开出首单');
  if (!t.config) {
    const tools = t.aiReq >= 3 ? '2-3 个 AI 工具' : '1-2 个 AI 工具';
    const hrs = t.workMode === 'offline' ? '每天约 3 小时' : '每天约 2 小时';
    t.config = `启动金 ${fmtMoney(t.capital)} · ${tools} · ${hrs}`;
  }
  if (!t.donts) t.donts = DEFAULT_DONTS.slice();
  if (!t.ability) {
    const sl = t.skills.length ? t.skills.map(s => SKILLS[s]).join('、') : '无特殊技能要求';
    t.ability = `需要：${sl}。AI 大幅降低执行门槛，新手也能快速上手。`;
  }
  if (!t.logic && t.aiPoint) t.logic = 'AI 赋能核心：' + t.aiPoint;
  if (!t.risks) t.risks = '注意合规与隐私，所有收益为参考区间、不承诺保本；先以小单验证再逐步放大。';
  if (!t.locked) t.locked = '含完整 30 天启动 SOP、投入产出测算模板与专属 AI 工具包，开通会员后一键获取。';
  if (!t.coldStart || t.coldStart.length < 3) {
    const first = t.coldStart && t.coldStart[0] ? t.coldStart[0] : '先锁定 1 个细分方向，做出首个可展示的样例';
    t.coldStart = [first,
      '沉淀首批案例 / 作品集，截图发朋友圈与社群做信任背书',
      '把服务或产品打包成标准报价，开始稳定接单 / 售卖'];
  }
  t.tools = trackTools(t);
  return t;
}
TRACKS.forEach(normalizeTrack);

/* -------------------------------------------------------------------------
 * 会员版本权益划分（文档 Table 3）
 * ----------------------------------------------------------------------- */
const PLANS = [
  {
    id: 'free', name: '免费版', price: '0 元', period: '/ 月',
    highlight: false, target: '引流获客',
    benefits: ['每日 3 次智能测评/匹配测试', '赛道基础信息预览', '每日 3 条商机赛道详情'],
    cta: '免费开始'
  },
  {
    id: 'advanced', name: '进阶测评解锁', price: '¥9.9', period: ' 一次性',
    highlight: false, target: '单次解锁 20 题精准测评，不占用每日免费次数',
    benefits: ['20 题精准测评', '1-2 个细分赛道 + 匹配度', '4 步落地 SOP + 案例 + 工具包'],
    cta: '解锁进阶测评',
    advOnly: true
  },
  {
    id: 'basic', name: '基础版', price: '9.9 元', period: '/ 月',
    highlight: false, target: '新手试水用户，走量为主',
    benefits: ['无限次匹配测试', '全部赛道详情', '基础案例库', '合规模板包'],
    cta: '开通基础版'
  },
  {
    id: 'pro', name: '专业版', price: '29.9 元', period: '/ 月',
    highlight: true, target: '核心付费层，主要收入来源',
    benefits: ['基础版全部权益', '落地测算工具箱', '一人公司经营助手', 'AI 启动方案生成', '月度赛道更新'],
    cta: '开通专业版'
  },
  {
    id: 'vip', name: '高端版', price: '99.9 元', period: '/ 月',
    highlight: false, target: '高价值用户，提升 ARPU',
    benefits: ['专业版全部权益', '1v1 赛道诊断 1 次', '资源对接社群', '专属资料包'],
    cta: '开通高端版'
  },
];

/* -------------------------------------------------------------------------
 * 四大核心功能模块（文档 2.1 - 2.4）
 * ----------------------------------------------------------------------- */
const MODULES = [
  { icon: 'message', title: '对话框式 AI 顾问', desc: '3 个问题、1 分钟出结果，聊天式轻交互，低门槛引流、共情更强。' },
  { icon: 'clipboard', title: '两段式赛道测评', desc: '初测 10 题锁定大类，进阶 20 题精准匹配细分赛道，附 SOP 与案例。' },
  { icon: 'layers', title: 'AI 赋能赛道库', desc: '多个全品类轻资产赛道，统一标准字段，AI 提效 5-10 倍，月度更新。' },
  { icon: 'toolbox', title: '落地工具 + 经营助手', desc: '投入产出计算器、AI 启动方案、月度经营复盘，从选型延伸到经营全链路。' },
];

/* -------------------------------------------------------------------------
 * 12 题标准化问卷（文档 5.1）
 * ----------------------------------------------------------------------- */
const QUESTIONS = [
  {
    id: 'persona', title: '您当前的身份是？', hint: '必选，权重最高', required: true, single: true,
    options: [
      { value: 'student',    label: '在校学生 / 应届毕业生' },
      { value: 'sidehustle', label: '职场人（想做副业）' },
      { value: 'parent',     label: '全职宝妈 / 宝爸' },
      { value: 'midlife',    label: '中年转型 / 离职创业' },
      { value: 'silver',     label: '退休 / 自由时间充足（50岁+）' },
      { value: 'other',      label: '其他' },
    ],
  },
  {
    id: 'time', title: '您每天可投入的时间是？', required: true, single: true,
    options: [
      { value: '2',   label: '2 小时以内' },
      { value: '4',   label: '2-4 小时' },
      { value: '8',   label: '4-8 小时' },
      { value: '24',  label: '全职投入' },
    ],
  },
  {
    id: 'capital', title: '您可接受的最低启动资金是？', required: true, single: true,
    options: [
      { value: '500',   label: '0-500 元' },
      { value: '3000',  label: '500-3000 元' },
      { value: '10000', label: '3000-10000 元' },
      { value: '10001', label: '1 万元以上' },
    ],
  },
  {
    id: 'risk', title: '您的风险承受能力？', required: true, single: true,
    options: [
      { value: '1', label: '极低（只做稳赚不赔，不能亏本金）' },
      { value: '2', label: '中等（可接受数千元以内试错）' },
      { value: '3', label: '较高（可接受前期投入，长期看收益）' },
    ],
  },
  {
    id: 'skills', title: '您具备的核心技能是？（可多选）', required: false, single: false,
    options: [
      { value: 'copy',  label: '文案写作 / 内容运营' },
      { value: 'design',label: '设计 / 审美' },
      { value: 'dev',   label: '编程 / 技术开发' },
      { value: 'sales', label: '沟通谈单 / 销售' },
      { value: 'video', label: '视频剪辑 / 拍摄' },
      { value: 'legal', label: '财务 / 法律专业知识' },
      { value: 'none',  label: '无特殊技能' },
    ],
  },
  {
    id: 'exp', title: '您有哪些相关行业经验？', required: false, single: false,
    options: [
      { value: 'ecom',    label: '电商相关' },
      { value: 'content', label: '内容 / 新媒体' },
      { value: 'sales',   label: '销售 / 客户服务' },
      { value: 'tech',    label: '技术 / 研发' },
      { value: 'none',    label: '无相关经验' },
    ],
  },
  {
    id: 'resources', title: '您手头有哪些可用资源？', required: false, single: false,
    options: [
      { value: 'local',  label: '本地商家 / 人脉资源' },
      { value: 'supply', label: '供应链 / 货源资源' },
      { value: 'traffic',label: '自媒体账号 / 流量资源' },
      { value: 'none',   label: '无特殊资源' },
    ],
  },
  {
    id: 'ai', title: '您对 AI 工具的熟悉程度？', required: true, single: true,
    options: [
      { value: '1', label: '完全不会，没接触过' },
      { value: '2', label: '会用基础聊天类 AI 工具' },
      { value: '3', label: '会用多种 AI 工具（剪辑、绘画等）' },
      { value: '4', label: '有技术基础，能做深度应用' },
    ],
  },
  {
    id: 'workmode', title: '您更偏好哪种经营方式？', required: true, single: true,
    options: [
      { value: 'online', label: '纯线上，居家就能做' },
      { value: 'hybrid', label: '线上为主，偶尔线下' },
      { value: 'offline',label: '线下本地为主' },
    ],
  },
  {
    id: 'income', title: '您的目标月收入是？', required: true, single: true,
    options: [
      { value: '3000',  label: '3000 元以内' },
      { value: '8000',  label: '3000-8000 元' },
      { value: '20000', label: '8000-20000 元' },
      { value: '20001', label: '2 万元以上' },
    ],
  },
  {
    id: 'payback', title: '您能接受的回本周期？', required: true, single: true,
    options: [
      { value: '1', label: '当月就要赚钱' },
      { value: '2', label: '1-2 个月回本' },
      { value: '6', label: '3 个月以上也可以接受' },
    ],
  },
  {
    id: 'focus', title: '您更看重项目的哪个特点？', required: true, single: true,
    options: [
      { value: 'easy',   label: '门槛低、上手快' },
      { value: 'income', label: '收入上限高' },
      { value: 'stable', label: '稳定、风险小' },
      { value: 'grow',   label: '能积累经验 / 资源' },
    ],
  },
];

/* 两段式测评体系（V1.0）
 * 初测：10 题（1 锚定 + 6 通用 + 3 专属）→ 大类 + 匹配度（免费）
 * 进阶：20 题（1 确认 + 9 深挖 + 10 专属）→ 精准赛道 + SOP + 案例（¥9.9）
 */
const QMAP = {};
QUESTIONS.forEach(q => { QMAP[q.id] = q; });
const STAGE1 = ['persona', 'time', 'capital', 'skills', 'workmode', 'income'].map(id => QMAP[id]);
const STAGE2 = ['risk', 'exp', 'resources', 'ai', 'payback', 'focus'].map(id => QMAP[id]);

/* 对话框式 AI 顾问（自由输入模式：用户自己编辑，无需按选项点）
 * 用户直接输入一段话描述自身情况，前端做关键词解析 → 复用匹配引擎出结果。
 */
const CHAT = {
  opening: '你好～我是你的一人创业选型顾问。不用按选项点，直接把你的想法、情况和想做的方向用一段话告诉我（比如「我是宝妈，每天2小时，零成本，会写文案」），我帮你算出最适合的赛道，也能随时补充细化 👇',
  examples: [
    '我是宝妈，每天2小时，零成本，会写文案',
    '想转型全职，有本地商家资源，会销售',
    '应届生，想做副业赚零花钱，会剪辑视频',
    '退休了时间多，想做点低风险的本地小生意',
  ],
};

/* -------------------------------------------------------------------------
 * 每日赛道商机 & 痛点雷达（小模块）
 * 每条赛道给出「今日商机」「今日痛点」，配合按日期生成的热度指数形成每日看板
 * ----------------------------------------------------------------------- */
const DAILY_BOARD = [
  { id: 't01', opportunity: '暑期本地生活商家冲量，急需自动化会员/客服流程降本', painpoint: '商家怕被割韭菜、不愿预付年费，需小模块先验证价值' },
  { id: 't02', opportunity: '抖音/视频号本地生活流量红利，门店缺稳定内容产出', painpoint: '数字人同质化严重，商家质疑转化效果与合规标注' },
  { id: 't03', opportunity: '广告法执法趋严，电商大促前集中审改需求暴涨', painpoint: '行业违禁词更新快，误判漏判易惹纠纷，需人工兜底' },
  { id: 't04', opportunity: '年中盘点季，企业急需表格清洗、归档与报表外包', painpoint: '客户数据敏感，保密与交付标准难统一，易返工' },
  { id: 't05', opportunity: '企业“想用 AI 但没人会配”，提示词/工作流咨询需求旺', painpoint: '提示词易被复制，难建立持续付费壁垒' },
  { id: 't06', opportunity: '社区团购与复购经济回温，小店要低成本做私域', painpoint: '店主不配合发内容，代运营难量化带来业绩' },
  { id: 't07', opportunity: '装修/家政旺季，本地商家愿为精准线索买单', painpoint: '线索质量参差、掉单率高，影响续费信任' },
  { id: 't08', opportunity: '食安监管数字化推进，门店台账合规刚需上升', painpoint: '餐饮老板抗拒“多一个系统”，需极简上手' },
  { id: 't09', opportunity: '独居青年与压力人群增多，夜间倾诉需求稳定', painpoint: '情感依赖与责任边界模糊，需防过度承诺' },
  { id: 't10', opportunity: '宠物经济高客单，养宠新手愿为记录/健康付费', painpoint: '问诊涉医疗边界，只能做“参考”不能下诊断' },
  { id: 't11', opportunity: '年中规划季，创业者/投资人急需快速行业洞察', painpoint: '报告同质化，需叠加独家数据或框架才卖得上价' },
  { id: 't12', opportunity: '短视频/电商旺季，卖家持续采购现成模板素材', painpoint: '平台同质模板泛滥，靠“垂直细分”才能突围' },
  { id: 't13', opportunity: '微短剧风口，机构缺批量剪辑与多平台分发人力', painpoint: '版权与内容审核收紧，搬运号易被限流封号' },
  { id: 't14', opportunity: '亲子阅读与节日礼赠需求，定制化绘本溢价空间大', painpoint: '内容安全与家长信任门槛高，需强 IP 背书' },
  { id: 't15', opportunity: '适老化政策推动，子女愿为父母“数字陪跑”付费', painpoint: '老人设备操作门槛高，需线下+远程双重陪跑' },
  { id: 't16', opportunity: '露营/清洁/健康设备租赁需求上升，轻资产可复制', painpoint: '设备损坏与押金纠纷频发，运维成本高' },
  { id: 't17', opportunity: '假期与出差高峰，宠物上门照料订单激增', painpoint: '入户安全与信任成本高，需强背调与保险' },
  { id: 't18', opportunity: '小团队“买不起大系统”，愿为单点工具月付', painpoint: '获客成本高，需找到高频刚需的细分切口' },
  { id: 't19', opportunity: '商家线上化补课，模板站+AI 文案需求稳定', painpoint: '低价竞争激烈，靠“交付速度+运维”做差异' },
  { id: 't20', opportunity: '节日文创与 IP 周边热，个性化定制溢价高', painpoint: '设备与耗材为固定成本，库存与交期难把控' },
  { id: 't21', opportunity: '企业降本增效主线，RPA+大模型项目预算充足', painpoint: '需求方说不清流程，POC 到签单周期长' },
  { id: 't22', opportunity: '出海内容与听书平台扩张，多语种音频缺口大', painpoint: '版权与配音质感要求高，纯 AI 音易“出戏”' },
  { id: 't23', opportunity: '知识付费回暖，垂直从业者愿为深度专栏买单', painpoint: '持续产出压力大，需构建作者个人信任资产' },
  { id: 't24', opportunity: '政企采购旺季，标书代写与排版刚需且高客单', painpoint: '合规红线高，不能承诺“必中”，需免责声明' },
  { id: 't25', opportunity: '年中审计与经营分析季，报表外包需求集中', painpoint: '数据口径不一，沟通成本高，易反复返工' },
  { id: 't26', opportunity: '中小企业出海与专精特新申报，IP 布局需求升', painpoint: '不能替代代理机构，定位“辅助”规避法律风险' },
  { id: 't27', opportunity: '毕业季与金九银十，求职服务需求刚性且高频', painpoint: '效果难量化，需以“陪伴式”而非“包过”定位' },
  { id: 't28', opportunity: '大促备货期，商家主图/详情图批量产出需求爆', painpoint: '平台风格多变，需贴合类目审美而非千篇一律' },
  { id: 't29', opportunity: '存量房改造与新房装修季，效果图出图提速刚需', painpoint: '精度与落地偏差争议大，需绑定设计师把关' },
  { id: 't30', opportunity: '品牌自媒体系列化运营，定制视觉素材复购稳定', painpoint: '审美主观性强，改稿成本高，需明确权益边界' },
  { id: 't31', opportunity: '到店消费复苏，商家争抢大众/美团榜单与评分', painpoint: '刷评合规红线，需以“内容运营”而非刷量切入' },
  { id: 't32', opportunity: '私域会员精细化运营成趋势，智能客服降本明显', painpoint: '老店系统割裂，对接与培训成本高、落地慢' },
];


const CASES = [
  {
    id: 1,
    cat: "AI 微 SaaS 与工具赛道",
    title: "95 后程序员单人做 AI 作文工具：AI 写了 80% 代码，上线 4 个月拿下 1.5 万用户",
    source: "新华网、杭州新闻中心",
    background: "计算机专业出身的李云帆，曾组建团队做软件开发，踩过 “人多成本高、决策效率低” 的坑，转型一人公司模式轻装上阵。",
    play: "把 80% 的代码编写、界面设计工作交给 AI，自己只负责产品方向、核心逻辑与运营，全程没有招聘一个员工，从研发到上线全链路单人闭环。",
    result: "AI 作文批改产品「作文说」上线仅 4 个月，累计用户突破 1.5 万，无需推广靠自然流量就能稳定增长。",
    insight: "不用凑团队、不用等融资，AI 能替代大部分基础开发工作，技术背景的单人创业者，也能独立撑起一款工具型产品。",
  },
  {
    id: 2,
    cat: "AI 微 SaaS 与工具赛道",
    title: "靠一个留学选校网站年入几十万：他把 99 元一次的轻工具做成了稳定生意",
    source: "新华网客户端",
    background: "留学行业信息差极大，中介收费动辄几万，普通学生找不到高性价比的选校参考，创业者李涛瞄准这个细分小需求单人启动。",
    play: "做轻量化 AI 选校工具「AI 选校鸟」，用户输入绩点、语言成绩、专业方向，花 99 元就能拿到保底、匹配、冲刺三梯度的专属院校清单，后续延伸文书指导增值服务。",
    result: "无大规模推广，靠搜索流量与口碑传播，累计积累 3000 + 付费用户，被动收入稳定。",
    insight: "不用做大而全的平台，垂直领域解决一个具体痛点，哪怕单价只有几十块，也能做成单人可持续的小生意。",
  },
  {
    id: 3,
    cat: "AI 微 SaaS 与工具赛道",
    title: "00 后创业有多猛？48 小时上线 2 个 AI 网站，验证需求只用了一周",
    source: "中国日报网",
    background: "杭州 00 后青年薛昊，不想走 “先攒团队、再做产品” 的传统创业路，想验证 AI 能不能把创业启动成本压到最低。",
    play: "借助 AI 智能体工具，从需求梳理、页面开发到功能调试全流程辅助，不用写大量原生代码，快速把想法落地成可使用的网站产品。",
    result: "48 小时内完成 2 个功能型网站的开发与上线，一周内就拿到第一批用户反馈，验证了 “极速 MVP” 的单人创业模式。",
    insight: "创业不用憋大招，AI 把开发门槛打下来后，先快速上线验证需求，跑通了再迭代，试错成本几乎可以忽略。",
  },
  {
    id: 4,
    cat: "AI 微 SaaS 与工具赛道",
    title: "3 天写完商业计划书就启动：他靠 AI 把情感陪伴项目跑通了最小闭环",
    source: "凤凰网、新华社",
    background: "年轻人情绪需求爆发，但传统情感咨询人力成本高、价格贵，创业者赵知予瞄准轻量化 AI 情感陪伴赛道单人入局。",
    play: "从市场调研、竞品分析到商业计划书撰写，全靠多款大模型辅助完成，3 天就走完了普通人 1 个月的筹备流程，快速推进产品研发。",
    result: "项目启动 2 个月即入驻中关村创业加速营，预计 7 月推出产品 Demo，全程仅 1 人核心推进。",
    insight: "前期调研、策划这类脑力工作，AI 能大幅压缩时间成本，单人创业的启动周期可以从 “数月” 缩短到 “数天”。",
  },
  {
    id: 5,
    cat: "AI 微 SaaS 与工具赛道",
    title: "00 后做 AI 人才对接平台：不用招人，一个人搞定供需两端运营",
    source: "经济日报、中国经济网",
    background: "中小企业找技术人才难、自由开发者接项目难，两端信息差极大，00 后创业者国纪龙瞄准这个撮合需求单人启动。",
    play: "用 AI 算法做智能匹配，自动把企业需求和对应技能的人才精准对接，替代传统人工筛选、沟通的繁琐工作，自己只负责平台规则与核心客户对接。",
    result: "单人搭建完整对接平台，已服务多家中小微企业的技术需求，运营成本极低。",
    insight: "信息撮合类生意，用 AI 替代人工匹配，不用养运营团队，单人就能撑起一个轻平台。",
  },
  {
    id: 6,
    cat: "内容与文创设计赛道",
    title: "传统动画要做几个月，他用 AI 一周产出 80 集：单人工作室也能接商单",
    source: "人民网广东频道",
    background: "传统动漫短剧制作周期长、成本高，小团队根本扛不住，深耕动漫行业的司庆转型「OPC + 外部协作」模式，用 AI 把产能拉满。",
    play: "自研 AI 生产平台，从剧本创作、角色绘图到视频渲染全流程自动化，自己只把控风格与核心创意，基础生产全交给 AI。",
    result: "原本需要数月制作的 80 集微短剧，纯生产环节仅需数日，成本下降 70% 以上，单人工作室就能承接品牌商单。",
    insight: "内容生产类赛道，AI 替代的是最耗时的基础制作环节，创作者只要抓核心创意，单人产能顶过去一个小团队。",
  },
  {
    id: 7,
    cat: "内容与文创设计赛道",
    title: "工程管理出身的她，单人做出动漫 AI 生产系统：踩中了内容工业化的风口",
    source: "人民网",
    background: "32 岁新疆姑娘袁欣，学工程管理出身，发现传统动漫行业流程割裂、风格难统一的痛点，跨界做 AI 动漫生产工具。",
    play: "研发「剧灵绘」多智能体协作系统，把视频绘制、音频合成、风格统一等环节全自动化，解决行业普遍存在的效率痛点。",
    result: "单人完成产品研发与落地，项目入驻成都高新区 OPC 社区，成为动漫数字化赛道的标杆单人项目。",
    insight: "不用是顶尖技术大牛，懂行业痛点 + 会用 AI 工具，反而比纯技术人更能做出贴合市场的产品。",
  },
  {
    id: 8,
    cat: "内容与文创设计赛道",
    title: "95 后海归开 “一人设计公司”：不招全职员工，靠合作拿下美术馆级订单",
    source: "上观新闻",
    background: "95 后海归蔡正琨，不想开传统设计公司养人扛成本，独创「一人注册公司 + 剧组式项目协作」的 OPC 模式。",
    play: "自己只负责商务对接、项目把控与创意输出，具体执行环节按需找外部自由创作者合作，项目结束就解散，没有固定人力成本。",
    result: "成立不到一年，斩获老凤祥「上海礼物」设计大赛奖项，拿下浦东美术馆、泗泾古镇等高端机构的文创影像订单。",
    insight: "创意服务类生意，不用养全职团队，抓牢核心客户与品控，执行靠灵活协作，轻资产反而能做高毛利。",
  },
  {
    id: 9,
    cat: "内容与文创设计赛道",
    title: "从培训行业转型做单人公司：AI 帮我干了行政、运营、推广的活",
    source: "新华网客户端",
    background: "郑海峰深耕少儿科创培训多年，想转型轻资产的数字内容创业，不想再扛房租、人力的重成本。",
    play: "把宣发文案、推广素材、财务核算、事务性工作全交给「AI 员工」处理，自己只聚焦核心内容创作与业务方向。",
    result: "单人创办数字文化创意公司，落地青岛高新区，从注册到运营全流程一人闭环。",
    insight: "有行业经验的传统从业者，用 AI 搞定杂事与后台工作，把精力全放在核心业务上，转型成本极低。",
  },
  {
    id: 10,
    cat: "跨境电商赛道",
    title: "带 5 万块南下创业，1 人公司年营收超 4000 万：AI 帮我干了 8 个人的活",
    source: "经济参考网、中新网福建",
    background: "内蒙古小伙刘世奇，2021 年带着 5 万块钱和一台电脑南下福建晋江，早期一个人干选品、上架、客服、运营所有活，每天工作 16 小时，产能到了天花板。",
    play: "用 AI 接管商品上架、营销素材、广告投流、客户接待等所有重复性工作，自己只做策略制定、方向把控这类高价值决策。",
    result: "2025 年公司营收超 4000 万元，人均产值突破 600 万元，订单转化率从 9.96% 飙升至 21.67%，投产比翻了 2.4 倍。",
    insight: "跨境电商全链路都能 AI 提效，单人创业的收入天花板，早已不是 “赚点零花钱”，甚至能做到千万级规模。",
  },
  {
    id: 11,
    cat: "跨境电商赛道",
    title: "工科女生毕业不上班，单人做跨境电商：日均 50 单，大促直接翻倍",
    source: "上观新闻",
    background: "上海理工大学工科女生李禾然，放弃考研和进厂的常规路径，瞄准东南亚、墨西哥新兴市场的跨境机会，零经验单人启动。",
    play: "主攻小众刚需品类，用 AI 辅助做产品详情页翻译、客服回复、选品分析，边做边学，慢慢打磨运营节奏。",
    result: "店铺非大促期间日均稳定 50 单，大型促销节点销量直接翻倍，毕业就实现了经济独立。",
    insight: "新兴市场竞争远小于成熟平台，应届生零经验也能切入，单人慢慢做也能跑出稳定收益。",
  },
  {
    id: 12,
    cat: "跨境电商赛道",
    title: "97 后小伙配 8 个 AI 员工做跨境：从选品到收款全自动化，一人撑起跨国公司",
    source: "商业新知、什么值得买",
    background: "杭州 97 年创业者张乾超，不想走传统跨境 “堆人堆货” 的重模式，想靠智能体实现全链路轻量化运营。",
    play: "配置 8 个 AI 智能体，分别负责选品、询盘、报价、物流、客服、收款、对账、复盘 8 个岗位，全流程自动运转，自己只处理异常情况。",
    result: "创业仅 2 个月就跑通跨境全链路，被称为「一人跨国公司」的典型样本，单人就能管理完整的跨境业务体系。",
    insight: "AI 智能体时代，每个基础岗位都能被替代，单人搭建完整业务链不再是天方夜谭。",
  },
  {
    id: 13,
    cat: "本地服务与商家赋能赛道",
    title: "他用 AI 做新中式直播间：帮潮玩品牌流量销量双翻倍，单人就能交付",
    source: "凤凰网、新华社",
    background: "连续创业者张超，发现很多国货潮牌想做直播间，但传统真人直播间成本高、风格不匹配，瞄准这个商家痛点单人启动。",
    play: "用 AI 技术打造新中式风格虚拟直播间，不用真人主播、不用搭实景，低成本就能实现品牌风格统一的直播效果。",
    result: "助力连锁潮玩品牌直播间流量、销量双双翻倍，单人就能完成从方案到落地的全流程交付。",
    insight: "本地商家的数字化需求极其旺盛，AI 方案成本只有传统方案的几分之一，好推广、易交付，单人就能接单。",
  },
  {
    id: 14,
    cat: "本地服务与商家赋能赛道",
    title: "县域创业者靠 AI 做电商：拍几张图就自动生成详情页和短视频，一人管多家店",
    source: "扬州网",
    background: "高邮电商创业者胡斌，早期做电商要自己拍图、做详情页、剪视频，忙不过来产能上不去，用 AI 后彻底解决了单人产能问题。",
    play: "给产品拍几张实拍图，AI 几分钟就能自动生成完整产品详情页、营销文案，甚至配套一条带货短视频，不用懂设计也能出专业内容。",
    result: "单人就能运营多家电商店铺，效率提升数倍，成为当地电商园 OPC 模式的示范案例。",
    insight: "下沉市场的商家大多不会用 AI 工具，你会用就是降维打击，不管是自己开店还是帮商家做服务，都有巨大空间。",
  },
  {
    id: 15,
    cat: "本地服务与商家赋能赛道",
    title: "摆糖水摊 10 年摸出轻资产模式：摆摊 + 同城短视频，不用租门面也能稳定盈利",
    source: "湖北日报",
    background: "90 后汪小山，做过私房烘焙、打过零工，踩过多次创业坑，最终摸索出零房租的轻资产糖水创业模式。",
    play: "以流动摆摊为基础，靠同城短视频做引流，线上积累粉丝带动线下销量，同时搭配橱窗带货做额外收入，线上线下相互支撑。",
    result: "跑通 “摆摊 + 内容” 的良性循环，不用承担门面房租风险，收入稳定且可逐步放大。",
    insight: "本地小餐饮不用一上来就租店开店，最低成本启动，用线上流量补线下位置的不足，风险小、灵活度高。",
  },
  {
    id: 16,
    cat: "本地服务与商家赋能赛道",
    title: "没本钱没经验也能创业：一个烤饼摊，让她日均多赚百元稳增收",
    source: "凤凰网江西",
    background: "傅大姐身体不好干不了重活，也没有启动资金，想找一份能补贴家用的小生意，零门槛切入小吃赛道。",
    play: "选择操作简单、投入极低的梅菜扣肉饼项目，入驻工业园区夜市固定摊位，不用复杂技术，学会就能出摊。",
    result: "稳定经营后日均收入超百元，不用担大风险，实实在在给家里增加了一份稳定收入。",
    insight: "创业不一定都要做高大上的项目，低门槛的小生意，只要能稳定赚钱，就是适合普通人的好赛道。",
  },
  {
    id: 17,
    cat: "专业技能与便民服务赛道",
    title: "把老手艺做成年轻人抢着买的潮牌：他靠一把木梳开出单人文创品牌",
    source: "人民网浙江频道",
    background: "东阳木梳匠人陈浩归，不想让传统手艺只停留在 “非遗” 标签里，想让老物件被年轻人喜欢，单人启动文创化转型。",
    play: "保留 18 道传统手工工序，在设计、包装、传播上做年轻化改造，通过线上内容传播，把传统木梳打造成国潮文创产品。",
    result: "手工木梳成为文创爆款，老技艺成功破圈，收获大量年轻消费者，单人品牌实现稳定盈利。",
    insight: "传统手艺赛道看似老，只要结合新审美、新玩法，就能避开红海竞争，做成小而美的单人品牌。",
  },
  {
    id: 18,
    cat: "专业技能与便民服务赛道",
    title: "00 后毕业不进城，返乡做食材配送：盘活闲置场地，扎根县城也能稳赚钱",
    source: "特克斯县人民政府官网",
    background: "00 后大学生马千，毕业后没有留在大城市，看准县域食材配送的市场空白，返乡创业。",
    play: "盘活社区闲置场地做仓储，主打县域中小商家的食材配送服务，体量不大但需求稳定，竞争远小于大城市。",
    result: "项目稳定运营，带动本地富余劳动力就业，成为返乡青年创业的典型样本。",
    insight: "县城、下沉市场有大量未被满足的便民需求，竞争小、获客成本低，单人就能撑起一门稳定生意。",
  },
  {
    id: 19,
    cat: "专业技能与便民服务赛道",
    title: "靠一门手艺开维修店：服务周边农牧民，小生意也能做成长期事业",
    source: "人民网内蒙古频道",
    background: "返乡农牧民李建国，有一手电气焊手艺，发现周边村镇农机、农用车维修需求大，但专业维修点少，顺势开店创业。",
    play: "主打周边农牧民的刚需维修服务，技术过硬、收费实在，靠口碑积累老客户，生意稳定复购高。",
    result: "申请创业担保贷款升级设备后，业务覆盖周边多个村镇，现金流稳定，做成了能长期做的踏实生意。",
    insight: "有一门手艺的创业者，围绕本地刚需做服务，轻资产、风险低，客户粘性强，是普通人最稳妥的创业方向。",
  },
  {
    id: 20,
    cat: "专业技能与便民服务赛道",
    title: "边境乡镇开综合小店：百货 + 快递一站搞定，单人运营成了村里的便民中心",
    source: "新华网",
    background: "90 后返乡青年刘之银，在云南边境乡镇发现，村民买东西、取快递都要跑很远，瞄准这个便民需求开店。",
    play: "把日用百货零售和快递驿站结合，一家店满足村民的多重需求，单人就能运营，不用雇人。",
    result: "店铺成为当地人气最高的便民节点，营收稳步提升，在乡镇形成了不可替代的粘性。",
    insight: "乡镇市场适合做复合业态，一个店覆盖多个刚需场景，竞争极小，用户粘性极高，单人就能稳定经营。",
  },
  {"id": 1, "cat": "AI 原生服务类", "title": "给小微企业搭 AI 智能客服：不用写代码，单人服务 20 家店月入过万", "source": "中国企业报", "background": "前互联网客服运营岗的阿明，发现大量本地小店买不起专业客服系统，也没人值夜班回复消息，瞄准轻量化 AI 客服需求单人启动。", "play": "用低代码 AI 工具给商家搭建专属客服，训练店铺的产品、活动、常见问题知识库，自动回复咨询、登记订单，不用写代码，半天就能搭好一家。", "result": "固定服务 20 家本地门店，300 元 / 月 / 家，月入稳定 6000+，叠加首次搭建费，单月收入最高破 1.2 万。", "insight": "对应 SaaS 赛道「AI 原生服务类 - 本地商家 AI 自动化流程搭建」，适合有运营基础的职场副业党，商家复购率极高，一次搭建长期收费。", "tier": "basic"},
  {"id": 2, "cat": "AI 原生服务类", "title": "销售出身做 AI 行业话术库：一套卖 299，靠销售刚需月入七千", "source": "《销售与市场》杂志", "background": "有 8 年 toB 销售经验的老周，发现很多新人销售不会写话术、不会应对客户异议，把自己的经验结合 AI 做成标准化产品。", "play": "针对房产、医美、企业服务等 12 个细分行业，整理专属 AI 提示词 + 话术库 + 沟通 SOP，打包售卖，搭配社群答疑做增值。", "result": "单套话术包售价 299 元，累计卖出 200 + 套，搭配月度会员，副业月入稳定 7000+。", "insight": "对应 SaaS 赛道「AI 原生服务类 - 垂直行业 AI 提示词 + 工作流定制」，适合有行业经验的职场人，边际成本为零，越积累越值钱。", "tier": "basic"},
  {"id": 3, "cat": "AI 原生服务类", "title": "财务副业做 AI 小微企业财报整理：代账公司外包订单，月入五千", "source": "中国会计报", "background": "中级会计出身的林姐，平时上班空闲时间多，对接了几家小型代账公司，承接零散的财报整理、账目分类需求。", "play": "用 AI 自动识别流水、票据，自动分类录入、生成简易财报，人工只做最终校验，效率是纯人工的 8 倍，碎片时间就能做。", "result": "固定对接 6 家代账公司，按月结算，每月稳定收入 5000 元左右，不用坐班时间灵活。", "insight": "对应 SaaS 赛道「AI 原生服务类 - AI 批量数据处理外包服务」，适合有财务基础的宝妈、职场副业党，零成本启动，需求稳定。", "tier": "basic"},
  {"id": 4, "cat": "AI 原生服务类", "title": "外语专业做 AI 跨境小语种本地化：帮卖家翻译 listing，月入八千", "source": "中国贸易报", "background": "西班牙语专业毕业的小苏，不想做传统翻译，瞄准跨境电商小语种站点的 listing 本地化需求单人创业。", "play": "用 AI 做基础翻译，人工做本地化润色、关键词优化，适配不同国家的平台算法，比纯人工翻译效率高 5 倍，价格只有专业翻译公司的一半。", "result": "固定服务 15 家跨境卖家，按字数收费，月均收入 8000+，旺季大促期间收入翻倍。", "insight": "对应 SaaS 赛道「AI 原生服务类 - AI 批量内容处理」，适合有外语能力的应届生、职场副业党，跨境需求旺盛，单人就能承接。", "tier": "basic"},
  {"id": 5, "cat": "AI 原生服务类", "title": "自媒体人做 AI 音频后期处理：播客剪辑效率提升 10 倍，月入六千", "source": "《广电时评》杂志", "background": "前电台后期阿哲，发现很多中小播客博主做不起专业后期，瞄准轻量化音频处理需求做副业。", "play": "用 AI 自动做降噪、加背景音乐、剪口水音、配字幕，人工只做最终节奏调整，一期 1 小时播客从半天压缩到 30 分钟。", "result": "固定合作 12 位博主，200 元 / 期，月入稳定 6000 元，不用坐班时间自由。", "insight": "对应 SaaS 赛道「AI 原生服务类 - AI 内容生产外包」，适合有内容基础的应届生、职场副业党，AI 解决基础产能问题，单人可服务多个客户。", "tier": "basic"},
  {"id": 6, "cat": "AI 原生服务类", "title": "运营人做 AI 竞品分析周报：给中小企业做情报，包月收费月入过万", "source": "36 氪企业服务频道", "background": "互联网运营出身的阿凯，发现很多小企业没有专人做竞品调研，又需要了解行业动态，瞄准轻量化情报服务需求。", "play": "用 AI 自动抓取全网竞品动态、行业新闻、平台数据，整理成结构化周报，人工做核心洞察分析，每周交付一次。", "result": "服务 8 家中小企业，1500 元 / 月 / 家，月入稳定 1.2 万，每周只需要花 1 天时间整理。", "insight": "对应 SaaS 赛道「AI 原生服务类 - AI 行业信息服务」，适合有运营经验的职场副业党，轻交付高毛利，客户粘性极强。", "tier": "basic"},
  {"id": 7, "cat": "本地商家赋能类", "title": "宝妈做美业门店 AI 私域运营：帮美容院管客户，10 家店月入五千", "source": "中国美妆网", "background": "全职宝妈张雯之前做过美业运营，发现很多社区美容院不会做客户维护，预约、回访全靠老板记，容易流失客户。", "play": "用 AI 工具帮门店做客户分层、自动预约提醒、节日问候、活动推送，每天花半小时就能托管 2 家店。", "result": "托管 10 家社区美容院，500 元 / 月 / 家，月入 5000 元，工作时间灵活不耽误带娃。", "insight": "对应 SaaS 赛道「本地商家赋能类 - 社区小店 AI 私域代运营」，适合有美业经验的宝妈，本地获客成本低，商家复购稳定。", "tier": "basic"},
  {"id": 8, "cat": "本地商家赋能类", "title": "前教培老师做 AI 招生话术：帮培训机构跟进客户，转化率提升 30%", "source": "中国教育新闻网", "background": "教培行业转型的李老师，有多年招生经验，发现很多小型教培机构不会做客户跟进，咨询完就流失。", "play": "给机构定制 AI 招生话术库、客户跟进 SOP，用 AI 自动回复咨询、跟进意向客户，人工只负责关单，转化率比纯人工提升 30%。", "result": "服务 6 家本地教培机构，按效果 + 服务费收费，月入稳定 8000+。", "insight": "对应 SaaS 赛道「本地商家赋能类 - 本地服务 AI 获客工作室」，适合有行业经验的中年转型人群，按效果收费商家更容易接受。", "tier": "basic"},
  {"id": 9, "cat": "本地商家赋能类", "title": "汽修师傅转型做 AI 客户管理：帮修理厂管客户提醒，20 家店月入六千", "source": "《汽车维护与修理》杂志", "background": "干了 10 年汽修的王哥，发现很多路边修理厂没有客户管理系统，保养、年审全靠客户自己记，流失率很高。", "play": "用 AI 工具给修理厂搭建客户档案，自动提醒保养、年审、保险到期，定期推送养护知识，不用复杂操作，老板一看就会。", "result": "服务 20 家本地汽修店，300 元 / 月 / 家，月入 6000 元，不用坐班，每周跑几家店维护关系就行。", "insight": "对应 SaaS 赛道「本地商家赋能类 - 本地服务 AI 获客工作室」，适合有行业经验的中年转型人群，刚需明确，竞争极小。", "tier": "basic"},
  {"id": 10, "cat": "本地商家赋能类", "title": "宝妈做生鲜店 AI 库存 + 社群运营：帮菜店管货卖货，8 家店月入四千", "source": "中国果蔬报", "background": "全职宝妈小陈，家楼下的生鲜店经常出现菜卖不完浪费、不够卖缺货的问题，老板不会做库存管理和社群运营。", "play": "用 AI 帮门店做销量预测、库存预警，自动生成社群秒杀、拼团活动文案，帮门店减少损耗提升销量。", "result": "服务 8 家社区生鲜店，500 元 / 月 / 家，月入 4000 元，只需要每天花 1 小时处理内容。", "insight": "对应 SaaS 赛道「本地商家赋能类 - 社区小店 AI 私域代运营」，适合宝妈群体，社区店需求普遍，门槛低好切入。", "tier": "basic"},
  {"id": 11, "cat": "本地商家赋能类", "title": "职场副业做城市民宿 AI 运营：自动回复 + 定价，管 12 套民宿月入九千", "source": "文旅中国", "background": "旅游行业出身的阿美，平时上班空闲多，对接了几个本地民宿房东，承接代运营需求。", "play": "用 AI 自动回复房客咨询、根据周边行情自动调整房价、生成入住指引，大部分工作自动化，人工只处理异常问题。", "result": "托管 12 套城市民宿，按流水抽成 + 固定服务费，月入稳定 9000+，不用线下打理。", "insight": "对应 SaaS 赛道「本地商家赋能类 - 本地服务 AI 获客工作室」，适合有旅游行业经验的职场副业党，轻运营高毛利。", "tier": "basic"},
  {"id": 12, "cat": "本地商家赋能类", "title": "应届生做同城商家 AI 探店脚本：一条收 50 块，月接 60 单月入三千", "source": "短视频行业日报", "background": "编导专业应届生小周，不想进 MCN 加班，瞄准本地商家的探店脚本需求单人接单。", "play": "输入商家品类、特色，AI 自动生成不同风格的探店脚本、口播文案，人工做简单调整，10 分钟就能出一套，一天能写 10 条。", "result": "单条脚本收费 50 元，月均接 60 单，月入 3000+，作为毕业过渡项目，时间完全自由。", "insight": "对应 SaaS 赛道「本地商家赋能类 - AI 数字人短视频代运营」，适合应届生、新媒体从业者，门槛低，可作为冷启动切入点。", "tier": "basic"},
  {"id": 13, "cat": "情绪陪伴经济类", "title": "研究生做 AI 考研督学陪伴：监督 + 答疑，30 个学员月入六千", "source": "中国教育在线", "background": "985 研究生小宇，考研时踩过很多坑，发现很多备考的人自制力差、没人答疑，瞄准轻量化督学需求。", "play": "用 AI 做日常打卡监督、知识点答疑、学习计划调整，人工做心理疏导和阶段性规划，包月收费，不用全天在线。", "result": "固定带 30 个考研学员，200 元 / 月 / 人，月入 6000 元，不耽误自己的学业和科研。", "insight": "对应 SaaS 赛道「情绪陪伴经济类 - AI 垂直陪伴服务」，适合应届生、在校学生，垂直学习场景需求稳定，获客精准。", "tier": "basic"},
  {"id": 14, "cat": "情绪陪伴经济类", "title": "HR 做 AI 职场吐槽倾听：下班做树洞，包月服务月入四千", "source": "中国青年报职场版", "background": "互联网 HR 林姐，平时经常听同事吐槽职场问题，发现很多年轻人需要情绪出口，但不想跟朋友同事说。", "play": "用 AI 做基础情绪倾听、共情回应，人工处理深度困惑、职场建议，按次收费或包月不限次，只在晚上和周末接单。", "result": "积累 200 + 用户，包月会员 99 元 / 人，月入稳定 4000+，当成副业做没有压力。", "insight": "对应 SaaS 赛道「情绪陪伴经济类 - AI + 垂直情感陪伴树洞服务」，适合职场副业党，需求隐秘且高频，复购率高。", "tier": "basic"},
  {"id": 15, "cat": "情绪陪伴经济类", "title": "护士副业做 AI 戒断陪伴：帮人戒烟戒熬夜，按周期收费", "source": "健康时报", "background": "三甲医院护士小吴，见过很多坏习惯导致的健康问题，瞄准戒烟、戒熬夜、戒外卖等习惯养成需求做副业。", "play": "用 AI 做日常打卡提醒、戒断反应答疑、鼓励监督，人工做专业健康建议和阶段调整，按 21 天 / 90 天周期收费。", "result": "每期带 15 个学员，299 元 / 21 天，每月开 2 期，副业月入近 9000 元，用专业知识做背书信任度极高。", "insight": "对应 SaaS 赛道「情绪陪伴经济类 - AI 垂直陪伴服务」，适合医护、健康行业从业者，专业壁垒高，付费意愿强。", "tier": "basic"},
  {"id": 16, "cat": "情绪陪伴经济类", "title": "宠物爱好者做 AI 宠物数字纪念：帮主人留纪念，单份收 199", "source": "宠物行业白皮书", "background": "养宠多年的小夏，见过很多宠物离世的主人很难过，想做有温度的宠物纪念服务。", "play": "根据主人提供的宠物照片、故事，用 AI 生成数字画像、纪念短片，搭配电子成长档案，做成专属纪念包，按份收费。", "result": "单份纪念包售价 199 元，月均接 20 单，月入 4000+，客单价高且用户认可度极强。", "insight": "对应 SaaS 赛道「情绪陪伴经济类 - 宠物 AI 成长记录 + 问诊助手」，适合宠物爱好者，情感溢价高，竞争极小。", "tier": "basic"},
  {"id": 17, "cat": "数字产品内容类", "title": "宝妈做 AI 儿童有声绘本定制：印上孩子名字，一本卖 39 元月入四千", "source": "中国出版广电报", "background": "全职宝妈阿雯，平时给孩子读绘本，发现定制化的儿童绘本很受家长欢迎，用 AI 把制作成本打了下来。", "play": "家长提供孩子的姓名、爱好、形象特点，AI 生成专属插画和故事，做成电子版有声绘本，也可以打印实体版加价。", "result": "电子版 39 元 / 本，实体版 99 元 / 本，月均卖 80 本，月入 4000+，在家就能做兼顾带娃。", "insight": "对应 SaaS 赛道「数字产品内容类 - AI 儿童定制绘本 / 故事售卖」，适合宝妈、应届生，家长付费意愿强，AI 大幅降低生产门槛。", "tier": "basic"},
  {"id": 18, "cat": "数字产品内容类", "title": "新媒体人做 AI 行业短视频脚本包：分行业打包卖，一套 99 月入五千", "source": "新榜", "background": "做了 5 年短视频的老杨，发现很多实体商家想做抖音但不会写脚本，把各行业的脚本整理成标准化产品售卖。", "play": "针对餐饮、美业、教培等 15 个行业，用 AI 生成不同风格的口播、剧情脚本，打包成模板包，一次制作永久售卖。", "result": "单套脚本包售价 99 元，累计卖出 500 + 套，搭配定制脚本服务，月入稳定 5000+。", "insight": "对应 SaaS 赛道「数字产品内容类 - 短剧 / 短视频 AI 剪辑 + 分发」，适合新媒体从业者，数字产品零边际成本，越卖越赚。", "tier": "basic"},
  {"id": 19, "cat": "数字产品内容类", "title": "设计应届生做 AI 行业海报模板：细分赛道卖模板，月入三千", "source": "站酷网", "background": "设计专业应届生小苏，不想进设计公司加班，瞄准细分行业的海报模板需求，做垂直素材店。", "play": "专门做美业、餐饮、教培等小众行业的节日海报、活动海报模板，用 AI 批量生成调整，上架素材平台售卖。", "result": "累计上传 300 + 模板，被动月入 3000+，不用对接客户，时间完全自由。", "insight": "对应 SaaS 赛道「数字产品内容类 - AI 虚拟素材 / 模板垂直店铺」，适合设计专业应届生，一次制作长期被动收益。", "tier": "basic"},
  {"id": 20, "cat": "数字产品内容类", "title": "职场人做 AI 专业书读书笔记：整理成干货包，一套 69 月入四千", "source": "豆瓣阅读", "background": "互联网运营阿凯，每年读几十本专业书，发现很多人想读书但没时间，把自己的读书笔记整理成干货包售卖。", "play": "用 AI 提炼书籍核心观点、方法论、实操步骤，整理成结构化笔记 + 思维导图，人工做校验和补充，按单本 / 年度会员售卖。", "result": "单本笔记 69 元，年度会员 199 元，累计付费用户 300+，月入稳定 4000+，自己读书顺便赚钱。", "insight": "对应 SaaS 赛道「数字产品内容类 - AI 定制行业报告 / 方案售卖」，适合职场副业党，边提升自己边变现，用户精准。", "tier": "basic"},
  {"id": 21, "cat": "数字产品内容类", "title": "小学老师做 AI 错题整理工具：帮家长省时间，会员费 99 元年入五万", "source": "中国教师报", "background": "小学数学老师李老师，发现家长给孩子整理错题特别费时间，用 AI 做了一个轻量化的错题整理工具。", "play": "家长拍一下作业，AI 自动识别错题、分类、生成错题本，还能出同类练习题，按年收费，不用人工干预。", "result": "年会员 99 元，累计 500 + 付费家长，年入 5 万左右，几乎是被动收入，不耽误本职教学。", "insight": "对应 SaaS 赛道「轻技术工具类 - 轻量化垂直 AI 微 SaaS 开发」，适合有行业经验的从业者，小工具刚需强，付费意愿高。", "tier": "basic"},
  {"id": 22, "cat": "数字产品内容类", "title": "应届生做 AI 婚礼文案定制：誓词 + 主持词一套收 199，月入三千", "source": "婚礼风尚", "background": "中文系应届生小周，不想做传统文案，瞄准婚礼市场的个性化文案需求单人接单。", "play": "根据新人的爱情故事、喜好风格，用 AI 生成婚礼誓词、主持词、感谢词，人工做润色调整，2 小时就能出一套。", "result": "全套文案 199 元，月均接 15 单，月入 3000+，作为毕业副业时间自由，旺季收入翻倍。", "insight": "对应 SaaS 赛道「数字产品内容类 - AI 定制文案服务」，适合应届生、文案从业者，垂直场景溢价高，竞争小。", "tier": "basic"},
  {"id": 23, "cat": "数字产品内容类", "title": "前记者做 AI 企业宣传稿代写：一篇收 300，月接 20 单月入六千", "source": "中国记者网", "background": "前纸媒记者老陈，转型后做企业宣传稿代写，很多中小企业需要发稿但没有专职文案。", "play": "企业提供基础信息，AI 生成初稿，人工做专业润色、媒体风格调整，一篇通稿半天就能完成。", "result": "单篇通稿收费 300-500 元，月均接 20 单，副业月入 6000+，靠老客户转介绍就有稳定订单。", "insight": "对应 SaaS 赛道「数字产品内容类 - AI 定制行业报告 / 方案售卖」，适合有文字功底的中年转型人群，专业壁垒高，客单价稳定。", "tier": "basic"},
  {"id": 24, "cat": "便民生活服务类", "title": "宝妈做上门收纳 + AI 空间规划方案：一次收 300，月入五千", "source": "家居时报", "background": "全职宝妈阿静，喜欢整理收纳，发现很多年轻人不会收拾家，瞄准上门收纳的需求创业。", "play": "上门收纳前，用 AI 根据户型、物品量生成最优收纳规划方案，按小时收费，方案作为增值服务提升客单价。", "result": "单次服务收费 300-800 元，月均接 15 单，月入 5000+，时间灵活可以兼顾带娃。", "insight": "对应 SaaS 赛道「便民生活服务类 - 上门服务 + AI 增值」，适合宝妈、中年转型人群，线下需求稳定，AI 方案提升专业度。", "tier": "basic"},
  {"id": 25, "cat": "便民生活服务类", "title": "宝妈做上门美甲 + AI 款式推荐：预约自动管理，月入六千", "source": "中国美甲协会", "background": "美甲师小莉，不想租店面开工作室，做上门美甲服务，用 AI 工具提升效率和体验。", "play": "用 AI 自动管理预约、提醒客户，根据客户手型、风格推荐美甲款式，不用自己手动排单、找图。", "result": "单客均价 150 元，月均接 40 单，月入 6000 元，不用承担房租成本，利润更高。", "insight": "对应 SaaS 赛道「便民生活服务类 - 本地服务 + AI 工具提效」，适合有手艺的宝妈、中年转型人群，轻资产启动风险低。", "tier": "basic"},
  {"id": 26, "cat": "便民生活服务类", "title": "中年转型做社区团购 AI 团长：自动选品发通知，月入四千", "source": "社区团购观察", "background": "超市离职的王姐，在家门口做社区团购团长，用 AI 工具减少日常工作量，提升复购。", "play": "AI 根据小区人群特点自动选品、生成团购文案、发通知、统计订单，人工只负责收货分发，每天只花 1 小时。", "result": "服务两个小区共 500 多户，每月佣金 + 服务费稳定 4000 元，不用坐班，兼顾家庭。", "insight": "对应 SaaS 赛道「便民生活服务类 - 社区服务 + AI 提效」，适合中年转型、宝妈群体，社区获客简单，现金流稳定。", "tier": "basic"},
  {"id": 27, "cat": "便民生活服务类", "title": "中年师傅做家电清洗 AI 派单：服务周边小区，月入八千", "source": "中国家电服务协会", "background": "家电维修师傅老李，自己单干做家电清洗，用 AI 工具做客户管理和派单，不用雇前台。", "play": "AI 自动接咨询、登记订单、安排上门时间、提醒客户，还能自动生成售后回访、老客户优惠，人工只负责上门服务。", "result": "服务周边 3 个小区，月均接 80 单，月入稳定 8000+，比给门店打工赚得多还自由。", "insight": "对应 SaaS 赛道「便民生活服务类 - 本地服务 + AI 客户管理」，适合有手艺的中年转型人群，AI 替代行政工作，单人产能翻倍。", "tier": "basic"},
  {"id": 28, "cat": "便民生活服务类", "title": "护工做老人陪诊 + AI 健康档案：一次收 200，月入七千", "source": "健康中国报道", "background": "前医院护工张姐，发现很多老人看病没人陪，子女不在身边，瞄准陪诊需求单人创业。", "play": "陪诊后用 AI 整理老人的病历、检查报告、用药提醒，生成专属健康档案，作为增值服务提升复购。", "result": "单次陪诊收费 200-300 元，加上年度健康档案服务，月入稳定 7000+，需求越来越大。", "insight": "对应 SaaS 赛道「便民生活服务类 - 银发群体服务 + AI 增值」，适合中年转型、医护背景人群，银发经济需求爆发，粘性极高。", "tier": "basic"},
  {"id": 29, "cat": "轻技术工具类", "title": "技术应届生做 AI 自定义表单工具：小商家按需搭建，年入十万", "source": "开发者社区", "background": "计算机专业应届生小吴，发现很多小商家需要登记、预约、报名表单，但不会用复杂工具，做了一个轻量化 AI 表单工具。", "play": "商家说一句话需求，AI 自动生成对应表单，不用拖拽配置，按年收费，单人开发维护。", "result": "年会员 199 元，累计 500 + 付费用户，年入近 10 万，作为毕业项目边运营边迭代。", "insight": "对应 SaaS 赛道「轻技术工具类 - 轻量化垂直 AI 微 SaaS 开发」，适合技术类应届生，小工具刚需强，维护成本极低。", "tier": "basic"},
  {"id": 30, "cat": "轻技术工具类", "title": "设计师做 AI 美业海报生成工具：美容院按月付费，月入六千", "source": "设计中国", "background": "平面设计师阿美，发现美业门店经常需要做活动海报，但不会设计，做了一个垂直的 AI 海报生成工具。", "play": "商家选模板、改文字，一键生成美业风格的海报，不用懂设计，按月收费，单人开发运营。", "result": "月会员 29.9 元，累计 200 + 付费商家，月入稳定 6000+，被动收入占比极高。", "insight": "对应 SaaS 赛道「轻技术工具类 - 轻量化垂直 AI 微 SaaS 开发」，适合设计 + 技术背景的创业者，垂直行业工具竞争小，付费意愿强。", "tier": "basic"},
  {"id": 31, "cat": "轻技术工具类", "title": "副业开发者做 AI 起名工具：公司 / 宝宝 / 宠物都能起，月入五千", "source": "创业邦", "background": "后端开发者老周，业余时间做了一个 AI 起名工具，覆盖公司起名、宝宝起名、宠物起名多个场景。", "play": "用户输入需求和偏好，AI 生成符合要求的名字，附带寓意解释，按次收费或者会员制，几乎不用运营。", "result": "靠搜索流量自然获客，月均收入 5000+，几乎是被动收入，不用花时间维护。", "insight": "对应 SaaS 赛道「轻技术工具类 - 轻量化垂直 AI 微 SaaS 开发」，适合副业开发者，工具小需求大，躺赚属性强。", "tier": "basic"},
  {"id": 32, "cat": "轻技术工具类", "title": "会计做 AI 个体户记账助手：小店老板按月付费，月入四千", "source": "中国税务报", "background": "会计出身的林姐，发现很多个体户、小店老板不会记账，也舍不得请代账，做了一个轻量化的 AI 记账工具。", "play": "老板拍一下票据，AI 自动分类记账、生成简易报表，还能提醒报税，按月收费，操作极其简单。", "result": "月会员 19.9 元，累计 200 + 付费用户，月入 4000+，用户续费率极高。", "insight": "对应 SaaS 赛道「轻技术工具类 - 轻量化垂直 AI 微 SaaS 开发」，适合财务背景的创业者，垂直细分场景无竞争，用户稳定。", "tier": "basic"},
  {"id": 33, "cat": "轻技术工具类", "title": "自媒体人做 AI 内容日程管理工具：博主按月付费，月入七千", "source": "新媒体运营杂志", "background": "做了 3 年自媒体的老杨，自己一直苦于内容排期混乱，做了一个专门给自媒体人用的 AI 日程管理工具。", "play": "AI 根据平台算法、热点自动生成内容排期、选题方向，追踪发布数据，按月收费，精准服务自媒体人群。", "result": "月会员 39 元，累计 180 + 付费博主，月入 7000+，自己用顺便变现，用户精准。",     "insight": "对应 SaaS 赛道「轻技术工具类 - 轻量化垂直 AI 微 SaaS 开发」，适合有行业经验的从业者，自己就是目标用户，做出来的产品更贴合需求。", "tier": "basic"},
];

/* -------------------------------------------------------------------------
 * 赛道行情：各分类推荐线上接单平台（用于「赛道行情」卡 / 首页行情概览展示）
 * 仅作接单渠道参考，不承诺收益
 * ----------------------------------------------------------------------- */
const PLATFORMS_BY_CAT = {
  'AI 原生服务类': ['BOSS直聘', '前程无忧', '智联招聘', '猎聘', '猪八戒', '闲鱼', '掘金', '抖音', '百度', '搜狗', '360', '电鸭社区', '码上工作', '云队友', '实现网', '远程.work', 'HKese', '小蜜蜂云工作', '甜薪工场', '云工网', 'Brix Labs', '圆领超级个体', '程序员客栈', '开源众包', '码市', '猿急送', '智城外包', '一品威客', '时间财富网', '稿定设计众包', 'Upwork', 'Fiverr', 'Freelancer', '99designs', 'Remote OK', 'PeoplePerHour', 'Turing', '全国人社政务服务平台', '中国公共招聘网', '就业在线', '兼职猫', '斗米', '兼客兼职', '青团社', '店长直聘'],
  '本地商家赋能类': ['58同城', 'BOSS直聘', '智联招聘', '抖音', '百度', '搜狗', '360', '美团众包', '蜂鸟众包', '达达快送', '顺丰同城急送', 'UU跑腿', '猪八戒', '一品威客', '时间财富网', '稿定设计众包', 'Upwork', 'Fiverr', 'Freelancer', 'Remote OK', 'PeoplePerHour', 'Turing', '全国人社政务服务平台', '中国公共招聘网', '就业在线', '兼职猫', '斗米', '兼客兼职', '青团社', '店长直聘'],
  '情绪陪伴经济类': ['BOSS直聘', '智联招聘', '闲鱼', '抖音', '百度', '搜狗', '360', '猪八戒', '一品威客', '时间财富网', '稿定设计众包', '电鸭社区', '码上工作', '云队友', '实现网', '远程.work', 'HKese', '小蜜蜂云工作', '甜薪工场', '云工网', 'Brix Labs', '圆领超级个体', 'Upwork', 'Fiverr', 'Freelancer', '99designs', 'Remote OK', 'PeoplePerHour', 'Turing', '全国人社政务服务平台', '中国公共招聘网', '就业在线', '兼职猫', '斗米', '兼客兼职', '青团社', '店长直聘'],
  '数字产品内容类': ['BOSS直聘', '猪八戒', '前程无忧', '闲鱼', '掘金', '抖音', '百度', '搜狗', '360', '电鸭社区', '码上工作', '云队友', '实现网', '远程.work', 'HKese', '小蜜蜂云工作', '甜薪工场', '云工网', 'Brix Labs', '圆领超级个体', '程序员客栈', '开源众包', '码市', '猿急送', '智城外包', '一品威客', '时间财富网', '稿定设计众包', '站酷海洛', '千图网', '包图网', '昵图网', '米画师', 'Upwork', 'Fiverr', 'Freelancer', '99designs', 'Remote OK', 'PeoplePerHour', 'Turing', '全国人社政务服务平台', '中国公共招聘网', '就业在线', '兼职猫', '斗米', '兼客兼职', '青团社', '店长直聘'],
  '便民生活服务类': ['58同城', 'BOSS直聘', '智联招聘', '闲鱼', '百度', '搜狗', '360', '美团众包', '蜂鸟众包', '达达快送', '顺丰同城急送', 'UU跑腿', '猪八戒', '一品威客', '时间财富网', '稿定设计众包', 'Upwork', 'Fiverr', 'Freelancer', 'Remote OK', 'PeoplePerHour', 'Turing', '全国人社政务服务平台', '中国公共招聘网', '就业在线', '兼职猫', '斗米', '兼客兼职', '青团社', '店长直聘'],
  '轻技术工具类': ['前程无忧', 'BOSS直聘', '智联招聘', '猎聘', '掘金', '百度', '搜狗', '360', '电鸭社区', '码上工作', '云队友', '实现网', '远程.work', 'HKese', '小蜜蜂云工作', '甜薪工场', '云工网', 'Brix Labs', '圆领超级个体', '程序员客栈', '开源众包', '码市', '猿急送', '智城外包', '猪八戒', '一品威客', '时间财富网', '稿定设计众包', 'Upwork', 'Fiverr', 'Freelancer', '99designs', 'Remote OK', 'PeoplePerHour', 'Turing', '全国人社政务服务平台', '中国公共招聘网', '就业在线', '兼职猫', '斗米', '兼客兼职', '青团社', '店长直聘'],
  '内容生产变现类': ['BOSS直聘', '猪八戒', '智联招聘', '抖音', '掘金', '百度', '搜狗', '360', '电鸭社区', '码上工作', '云队友', '实现网', '远程.work', 'HKese', '小蜜蜂云工作', '甜薪工场', '云工网', 'Brix Labs', '圆领超级个体', '程序员客栈', '码市', '智城外包', '一品威客', '时间财富网', '稿定设计众包', '站酷海洛', '千图网', '包图网', '昵图网', '米画师', 'Upwork', 'Fiverr', 'Freelancer', '99designs', 'Remote OK', 'PeoplePerHour', 'Turing', '全国人社政务服务平台', '中国公共招聘网', '就业在线', '兼职猫', '斗米', '兼客兼职', '青团社', '店长直聘'],
  '企业服务提效类': ['BOSS直聘', '前程无忧', '智联招聘', '猪八戒', '百度', '搜狗', '360', '电鸭社区', '码上工作', '云队友', '实现网', '远程.work', 'HKese', '小蜜蜂云工作', '甜薪工场', '云工网', 'Brix Labs', '圆领超级个体', '程序员客栈', '开源众包', '码市', '猿急送', '智城外包', '一品威客', '时间财富网', '稿定设计众包', 'Upwork', 'Fiverr', 'Freelancer', '99designs', 'Remote OK', 'PeoplePerHour', 'Turing', '全国人社政务服务平台', '中国公共招聘网', '就业在线', '兼职猫', '斗米', '兼客兼职', '青团社', '店长直聘'],
  '视觉设计生产类': ['猪八戒', 'BOSS直聘', '智联招聘', '闲鱼', '掘金', '百度', '搜狗', '360', '电鸭社区', '码上工作', '云队友', '实现网', '远程.work', 'HKese', '小蜜蜂云工作', '甜薪工场', '云工网', 'Brix Labs', '圆领超级个体', '程序员客栈', '码市', '智城外包', '一品威客', '时间财富网', '稿定设计众包', '站酷海洛', '千图网', '包图网', '昵图网', '米画师', 'Upwork', 'Fiverr', 'Freelancer', '99designs', 'Remote OK', 'PeoplePerHour', 'Turing', '全国人社政务服务平台', '中国公共招聘网', '就业在线', '兼职猫', '斗米', '兼客兼职', '青团社', '店长直聘'],
};

/* 各接单 / 招聘平台的「直达搜索」链接（{q} 占位符会被「精准关键词」替换）。
   为保证【每次跳转都带上精准关键词】，分两类：
   1) 原生关键词搜索：平台自身支持网页按词搜（BOSS / 前程无忧 / 智联 / 猎聘 / 58 / 猪八戒 / 闲鱼 / 抖音 / 掘金 / 国际站等），直接落岗位列表；
   2) 浏览型平台：平台无通用关键词搜索入口（远程 / 威客 / 兼职 App / 跑腿 / 官方 / 设计类），
      统一走「百度 site:域名 精准词」检索 —— 既保证跳转带精准关键词，又把结果限定在该平台站内，避免点到空页。
   58同城：网页搜索必须带城市子域名（无城市会落首页），现默认北京(bj)，需换城市改下方 bj 即可。 */
const PLATFORM_SEARCH = {
  // ═════════════════ 专职招聘平台（原生关键词搜索，直接落岗位列表）═════════════════
  'BOSS直聘':  'https://www.zhipin.com/web/geek/job?query={q}',
  '前程无忧':   'https://search.51job.com/list/000000,000000,0000,00,9,99,{q},2,1.html',
  '智联招聘':   'https://www.zhaopin.com/sou?kw={q}',
  '猎聘':      'https://www.liepin.com/zhaopin/?key={q}',
  '58同城':    'https://bj.58.com/jianzhi/?key={q}',

  // ══════════════════ 接单 / 众包平台（原生关键词搜索）══════════════════
  '猪八戒':    'https://www.zbj.com/search?kw={q}',
  '闲鱼':      'https://www.goofish.com/search?q={q}',
  // 一品威客：任务大厅带关键词搜索（实测 task.epwk.com 可达）
  '一品威客':     'https://task.epwk.com/?kw={q}',
  // 时间财富网：服务/任务页带 key 参数筛选（实测 sikuu.com/fuwu.html?key=xx 可达）
  '时间财富网':   'https://www.sikuu.com/fuwu.html?key={q}',

  // ══════════════════ 内容 / 社媒发现渠道 ═══════════════════
  '抖音':      'https://www.douyin.com/search/{q}',
  '掘金':      'https://juejin.cn/search?query={q}',

  // ══════════════════ 官方灵活就业平台（免费可靠，原生搜索）══════════════════
  '全国人社政务服务平台': 'https://www.12333.gov.cn',
  '中国公共招聘网':     'http://job.mohrss.gov.cn/JobsWeb/search?keyword={q}',
  '就业在线':         'https://www.jobonline.cn/job/search?keyword={q}',

  // ══════════════════ 综合兼职平台（有网页搜索入口的直接搜，纯App的保留百度site:）══════════════════
  '青团社':   'https://www.qtshe.com/jobs/search?keyword={q}',
  '店长直聘': 'https://www.dianzhangzhipin.com/search?keyword={q}',
  // 以下3个以 App 为主、网页版无可靠搜索入口 → 降级百度 site:
  '兼职猫':   'https://www.baidu.com/s?wd={q}%20site:jianzhimao.com',
  '斗米':     'https://www.baidu.com/s?wd={q}%20site:doumi.com',
  '兼客兼职': 'https://www.baidu.com/s?wd={q}%20site:jianke.com',

  // ══════════════════ 线下跑腿 / 众包配送（均为App注册制，网页仅落地页 → 保留百度site:或直达注册页）══════════════════
  '美团众包':     'https://zhongbao.meituan.com',
  '蜂鸟众包':     'https://fengniao.ele.me',
  '达达快送':     'https://www.dada.cn/knight/register',
  '顺丰同城急送': 'https://www.sf-cityrush.com/rider/register',
  'UU跑腿':      'https://www.uupt.com/runner/register',

  // ══════════════════ 程序员 / 技术接单（全部有项目/任务列表页或搜索入口）══════════════════
  '程序员客栈': 'https://www.proginn.com/projects',          // 项目大厅列表
  '开源众包':   'https://zb.oschina.net',                     // 开源软件众包任务列表
  '码市':       'https://codemart.com/projects',              // 项目市场
  '猿急送':     'https://www.yuanjisong.com/job',             // 兼职任务大厅
  '智城外包':   'https://www.taskcity.com/task/search?kw={q}',// 任务搜索
  '实现网':     'https://shixian.com/jobs?keyword={q}',        // 搜索任务

  // ══════════════════ 远程工作 / 自由职业平台（全部直达职位/任务列表页）══════════════════
  '电鸭社区':     'https://eleduck.com/jobs-channel',            // 精选职位频道
  'Brix Labs':    'https://zh.joinbrix.com/jobs',                // 远程岗位列表
  '小蜜蜂云工作': 'https://www.xmf.com/jobs',                   // 远程职位列表
  '云队友':       'https://duiyou360.com/jobs',                 // 自由职业机会
  '甜薪工场':     'https://tianxinshe.com/jobs',                 // 远程兼职列表
  '云工网':       'https://yungong.com/yuancheng',              // 远程工种分类页
  '远程.work':    'https://yuancheng.work',                      // 远程工作首页（聚合列表）
  'HKese':        'https://hkese.net/jobs',                      // 港外远程职位
  '码上工作':     'https://open.nancheng.fun',                   // 远程工作首页
  '圆领超级个体': 'https://superthem.com/jobs',                  // 超级个体岗位

  // ══════════════════ 设计 / 创意类平台（素材站走搜索，约稿走列表页）══════════════════
  '千图网':   'https://www.58pic.com/search?q={q}',           // 设计师素材+接单搜索
  '包图网':   'https://ibaotu.com/search?q={q}',              // 素材模板搜索
  '昵图网':   'https://nipic.com/search?q={q}',               // 素材搜索
  '米画师':   'https://mihuashi.com/commissions',             // 约稿需求列表
  // 站酷海洛是正版素材供稿平台（非传统接单）、稿定是设计工具 → 直达主页
  '站酷海洛': 'https://www.hellorf.com',
  '稿定设计众包': 'https://www.gaoding.com',

  // ══════════════════ 国际自由职业平台（原生关键词搜索，自动去掉「兼职」前缀）══════════════════
  'Upwork':        'https://www.upwork.com/nx/search/jobs/?q={q}',
  'Fiverr':        'https://www.fiverr.com/search/gigs?query={q}',
  'Freelancer':    'https://www.freelancer.com/jobs/?keyword={q}',
  '99designs':     'https://99designs.com/search?q={q}',
  'Remote OK':     'https://remoteok.com/remote-jobs?tag={q}',
  'PeoplePerHour': 'https://www.peopleperhour.com/freelance-jobs?keyword={q}',  // 原生搜索，去掉百度中转
  'Turing':        'https://turing.com/jobs',                       // 远程开发岗位列表（无中文搜索，直达列表）

  // ══════════════════ 全网搜索聚合（跨站检索全网招聘 / 兼职信息，网页可达无登录墙）══════════════════
  '百度':   'https://www.baidu.com/s?wd={q}',
  '搜狗':   'https://www.sogou.com/web?query={q}',
  '360':    'https://www.so.com/s?q={q}',
};

/* 国际平台标记：跳转时自动去掉「兼职」前缀，避免中文「兼职」混入英文检索 */
const INTL_PLATFORMS = {
  'Upwork': 1, 'Fiverr': 1, 'Freelancer': 1, '99designs': 1,
  'Remote OK': 1, 'PeoplePerHour': 1, 'Turing': 1,
};

/* 创业对接平台（来源：《创业对接平台大全》docx）
   - 整体罗列，不按赛道拆分；保留 docx 原 7 大类分组
   - 每个平台：name 平台名 / url 官网 / desc 一句话简介
   - 平台名为可点链接，直达官网（target=_blank） */
const STARTUP_PLATFORMS = [
  { cat: '一、综合投融资对接平台', items: [
    { name: '鲸准', url: 'http://www.jingdata.com.cn', desc: '一站式股权投融资平台，3万+投资人、70万+项目' },
    { name: '投融界', url: 'https://www.trjcn.com', desc: '专业创业服务平台，定期举办创投对接微路演' },
    { name: '风投之家', url: 'http://fengtouzhijia.com', desc: '项目投融资服务平台，找资金/找项目双向对接' },
    { name: '创投圈', url: 'https://www.vc.cn', desc: '创业服务平台，连接创业者与投资人' },
  ]},
  { cat: '二、早期/天使轮融资平台', items: [
    { name: '天使汇', url: 'http://angelcrunch.com', desc: '在线创业投资平台，专注天使轮' },
    { name: '逐鹿X', url: 'https://zhulux.com', desc: '华兴资本旗下早期融资平台' },
    { name: '猎桔', url: 'https://www.itjuzi.com/special/lieju', desc: 'IT桔子旗下早期项目融资平台' },
  ]},
  { cat: '三、官方/国资背景对接平台', items: [
    { name: '深交所科融通V-Next', url: 'https://www.v-next.cn', desc: '深交所创新创业投融资服务平台' },
    { name: '南方创投网', url: 'http://www.first-net.cn', desc: '中国高科技项目投融资平台' },
    { name: '创投辽宁', url: 'http://ct.lneec.com', desc: '辽宁省股权投融资服务平台' },
    { name: '前海创投孵化器', url: 'http://www.vcfuhua.com', desc: '创投资源配置平台' },
  ]},
  { cat: '四、创投媒体旗下融资平台', items: [
    { name: '36氪创投平台', url: 'https://pitchhub.36kr.com', desc: '36氪旗下融资对接平台' },
    { name: '36氪融资', url: 'https://rong.36kr.com', desc: '36氪融资服务频道' },
    { name: '创业邦', url: 'https://www.cyzone.cn', desc: '含 DEMOSPACE 孵化空间、BangCamp 加速营' },
    { name: 'IT桔子', url: 'https://www.itjuzi.com', desc: '创投数据库 + 融资对接' },
  ]},
  { cat: '五、大厂创业平台', items: [
    { name: '阿里云创新中心', url: 'http://startup.aliyun.com', desc: '全国70+基地，云资源 + 投融资对接' },
    { name: '腾讯创业', url: 'http://startup.qq.com', desc: '腾讯旗下创投综合服务平台' },
    { name: '腾讯众创空间', url: 'https://open.qq.com', desc: '腾讯线下孵化 + 创业加速' },
    { name: '海创汇', url: 'http://www.ihaier.com', desc: '海尔旗下创业加速平台' },
  ]},
  { cat: '六、知名孵化器/加速器', items: [
    { name: '中关村创业大街', url: 'https://www.z-innoway.com', desc: '国家级创新创业地标' },
    { name: '启迪之星', url: 'http://www.tusstar.com', desc: '清华系全球孵化网络' },
    { name: '联想之星', url: 'http://www.legendstar.com.cn', desc: '联想旗下早期孵化 + 投资' },
    { name: '蒲公英孵化器', url: 'http://www.pgyspace.com', desc: '投资与科创服务孵化平台' },
    { name: '创业工坊', url: 'http://www.chuangyegongfang.cn', desc: '东北科技企业孵化器' },
    { name: '天府新谷', url: 'https://www.thinkzone.com.cn', desc: '成都科技孵化园区' },
  ]},
  { cat: '七、国际融资对接平台', items: [
    { name: 'OpenVC', url: 'https://www.openvc.app', desc: '全球投资人数据库，免费投递 BP' },
    { name: 'Raizer', url: 'https://raizer.app', desc: 'AI 匹配 14万+ VC 与初创公司' },
    { name: 'WealthVP', url: 'https://www.wealthvp.com', desc: '初创企业与合格投资人对接平台' },
    { name: 'StartX', url: 'https://thestartx.com', desc: '全球创业者与投资人市场' },
    { name: 'Qubit Capital', url: 'https://qubit.capital', desc: 'AI 驱动的融资对接平台' },
  ]},
];

/* 各赛道在接单平台的「精准搜索关键词」（短、口语化，贴近真实用户检索习惯）
   - 用于生成平台跳转链接的检索词，替代过长的赛道名，显著提升命中率
   - 未列出的赛道自动回退到 t.search 或 t.name */
const TRACK_SEARCH = {
  't01': '门店自动化代搭建',
  't02': '数字人代运营',
  't03': '文案合规审核',
  't04': '数据清洗代处理',
  't05': '提示词定制',
  't06': '私域代运营',
  't07': '商家引流推广',
  't08': '餐饮台账系统',
  't09': '情感树洞陪聊',
  't10': '宠物成长记录',
  't11': '行业报告代写',
  't12': 'PPT模板代做',
  't13': '短视频剪辑接单',
  't14': '定制绘本',
  't15': '老人手机教学',
  't16': '设备租赁',
  't17': '上门喂猫',
  't18': '微SaaS开发',
  't19': '小程序开发',
  't20': '3D打印定制',
  't21': 'RPA流程自动化',
  't22': '有声书录制',
  't23': '行业研报代写',
  't24': '标书代写',
  't25': '报表代做',
  't26': '专利申请辅助',
  't27': '简历优化',
  't28': '电商主图设计',
  't29': '装修效果图',
  't30': '表情包定制',
  't31': '团购代运营',
  't32': '智能客服搭建',
};

/* 导出原始数据，供前端在后台可用时切换为服务端数据（不改写 const） */
try { window.__BUNDLE_TRACKS = TRACKS; window.__BUNDLE_CASES = CASES; } catch (e) {}