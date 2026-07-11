/* =========================================================================
 * OPC 创业选型 SaaS —— 新测评体系数据资产（初测 10 题 / 进阶 20 题）
 * 数据来源：《OPC创业选型SaaS 完整测评体系V1.0》
 * 分支逻辑：第 1 题锚定 7 大赛道大类 → 自动弹出对应大类专属题
 * 说明：细分赛道权重提示(subtrackHints)、每类评分画像(profile)、避坑/行动清单
 *       为「基于题目推导的样本数据」，结构已留好接口，后续可替换为真实 32 赛道库。
 * ========================================================================= */
(function () {
  'use strict';

  /* 7 大赛道大类（文档定义），dbCats 映射到现有 TRACKS 的分类（可能 1:N） */
  const cats = [
    { id: 'ai',      name: 'AI 原生服务类',       dbCats: ['AI 原生服务类'] },
    { id: 'content', name: '内容生产变现类',       dbCats: ['内容生产变现类'] },
    { id: 'biz',     name: '企业服务提效类',       dbCats: ['企业服务提效类'] },
    { id: 'visual',  name: '视觉设计生产类',       dbCats: ['视觉设计生产类'] },
    { id: 'local',   name: '本地商家赋能类',       dbCats: ['本地商家赋能类'] },
    { id: 'emo',     name: '情绪经济与数字产品类', dbCats: ['情绪陪伴经济类', '数字产品内容类'] },
    { id: 'life',    name: '便民生活与轻技术类',   dbCats: ['便民生活服务类', '轻技术工具类'] },
  ];

  /* 第 1 题：大类锚定题（决定后续分支），value = 大类 id */
  const anchor = {
    id: 'anchor', title: '以下哪个创业方向你更感兴趣 / 有相关经验？', required: true, single: true,
    options: [
      { value: 'ai',      label: '用 AI 做技术 / 流程服务' },
      { value: 'content', label: '做内容创作 / 知识变现' },
      { value: 'biz',     label: '给企业做专业服务 / 提效' },
      { value: 'visual',  label: '做设计 / 视觉相关生意' },
      { value: 'local',   label: '给本地商家做服务 / 赋能' },
      { value: 'emo',     label: '情绪陪伴 / 虚拟数字产品' },
      { value: 'life',    label: '便民服务 / 轻技术小工具' },
    ],
  };

  /* 初测 · 通用维度题（6 题，所有大类共用） */
  const common = [
    { id: 'q_time', title: '你每天可投入的创业时间有多少？', required: true, single: true,
      options: [
        { value: 'A', label: '1 小时以内（纯副业）' },
        { value: 'B', label: '1-3 小时（轻副业）' },
        { value: 'C', label: '3-6 小时（半全职）' },
        { value: 'D', label: '6 小时以上（全职做）' },
      ] },
    { id: 'q_capital', title: '你能接受的启动资金预算是多少？', required: true, single: true,
      options: [
        { value: 'A', label: '500 元以内（零成本优先）' },
        { value: 'B', label: '500-2000 元（轻投入）' },
        { value: 'C', label: '2000-5000 元（可接受小额投入）' },
        { value: 'D', label: '5000 元以上（有预算投入）' },
      ] },
    { id: 'q_ai', title: '你对 AI 工具的使用熟练度如何？', required: true, single: true,
      options: [
        { value: 'A', label: '完全没用过，只会基础手机操作' },
        { value: 'B', label: '用过豆包 / ChatGPT 这类通用大模型' },
        { value: 'C', label: '会用 AI 做文案、画图等基础产出' },
        { value: 'D', label: '能熟练用多款 AI 工具搭建工作流' },
      ] },
    { id: 'q_client', title: '你更倾向服务哪类客户？', required: true, single: true,
      options: [
        { value: 'A', label: 'B 端商家 / 企业（客单价高、复购稳）' },
        { value: 'B', label: 'C 端个人用户（流量大、决策快）' },
        { value: 'C', label: '都可以，能赚钱就行' },
      ] },
    { id: 'q_acq', title: '你更擅长哪种获客方式？', required: true, single: true,
      options: [
        { value: 'A', label: '线上做内容 / 引流（不用线下跑）' },
        { value: 'B', label: '线下谈合作 / 地推（擅长沟通）' },
        { value: 'C', label: '靠熟人 / 社群转介绍（有资源）' },
      ] },
    { id: 'q_income', title: '你预期单月稳定收益目标是多少？', required: true, single: true,
      options: [
        { value: 'A', label: '2000-3000 元（赚零花钱）' },
        { value: 'B', label: '3000-8000 元（抵半个月工资）' },
        { value: 'C', label: '8000-15000 元（超过普通上班收入）' },
        { value: 'D', label: '15000 元以上（做成长期事业）' },
      ] },
  ];

  /* 初测 · 大类专属题（每类 3 题） */
  const specific = {
    ai: [
      { id: 'ai_s1', title: '你有没有基础的逻辑 / 流程搭建能力？', required: true, single: true,
        options: [
          { value: 'A', label: '完全没有，连 Excel 函数都不会' },
          { value: 'B', label: '会用 Excel 函数 / 简单自动化工具' },
          { value: 'C', label: '会用低代码平台搭简单流程' },
          { value: 'D', label: '有基础的 Python / 前端开发能力' },
        ] },
      { id: 'ai_s2', title: '你更擅长做哪类 AI 相关服务？', required: true, single: true,
        options: [
          { value: 'A', label: '内容 / 数据批量处理类' },
          { value: 'B', label: '商家流程自动化搭建类' },
          { value: 'C', label: '提示词 / 工作流定制类' },
          { value: 'D', label: '客服 / 话术优化类' },
        ] },
      { id: 'ai_s3', title: '你能不能独立给客户交付完整方案？', required: true, single: true,
        options: [
          { value: 'A', label: '不行，需要参考现成模板' },
          { value: 'B', label: '简单需求可以，复杂的要边学边做' },
          { value: 'C', label: '可以独立交付常规标准化需求' },
          { value: 'D', label: '能做定制化的复杂行业方案' },
        ] },
    ],
    content: [
      { id: 'ct_s1', title: '你有没有内容创作相关基础？', required: true, single: true,
        options: [
          { value: 'A', label: '完全零基础，没写过东西' },
          { value: 'B', label: '会写日常文案 / 朋友圈内容' },
          { value: 'C', label: '有公众号 / 小红书等账号运营经验' },
          { value: 'D', label: '有专业写作 / 剪辑 / 配音技能' },
        ] },
      { id: 'ct_s2', title: '你更感兴趣哪类内容变现？', required: true, single: true,
        options: [
          { value: 'A', label: '有声书 / 音频内容类' },
          { value: 'B', label: '付费专栏 / 研报类' },
          { value: 'C', label: '短剧 / 短视频剪辑类' },
          { value: 'D', label: '儿童绘本 / 故事定制类' },
        ] },
      { id: 'ct_s3', title: '你能不能保持稳定的内容产出？', required: true, single: true,
        options: [
          { value: 'A', label: '不行，容易没灵感断更' },
          { value: 'B', label: '一周能产出 1-2 份内容' },
          { value: 'C', label: '可以稳定周更 3-5 份内容' },
          { value: 'D', label: '能批量产出标准化内容' },
        ] },
    ],
    biz: [
      { id: 'bz_s1', title: '你有没有企业相关行业经验？', required: true, single: true,
        options: [
          { value: 'A', label: '完全没有，没接触过企业业务' },
          { value: 'B', label: '做过基础行政 / 人事类工作' },
          { value: 'C', label: '有招投标 / 财务 / HR 相关工作经验' },
          { value: 'D', label: '有 3 年以上企业服务行业经验' },
        ] },
      { id: 'bz_s2', title: '你更擅长做哪类企业服务？', required: true, single: true,
        options: [
          { value: 'A', label: '标书 / 文案代写类' },
          { value: 'B', label: '数据 / 报表整理类' },
          { value: 'C', label: '知识产权 / 资质办理类' },
          { value: 'D', label: '简历 / 面试辅导类' },
        ] },
      { id: 'bz_s3', title: '你能不能接受对接企业决策人？', required: true, single: true,
        options: [
          { value: 'A', label: '不行，怕和企业负责人沟通' },
          { value: 'B', label: '简单对接可以，复杂谈判不行' },
          { value: 'C', label: '可以独立对接企业普通员工' },
          { value: 'D', label: '能独立对接企业负责人谈合作' },
        ] },
    ],
    visual: [
      { id: 'vs_s1', title: '你有哪种设计相关基础？', required: true, single: true,
        options: [
          { value: 'A', label: '完全零基础，只会用手机修图' },
          { value: 'B', label: '会用可画 / 美图秀秀做简单图' },
          { value: 'C', label: '会 PS / AI 等专业设计软件' },
          { value: 'D', label: '有平面 / 电商 / 建筑设计行业经验' },
        ] },
      { id: 'vs_s2', title: '你更感兴趣哪类设计业务？', required: true, single: true,
        options: [
          { value: 'A', label: '电商产品图 / 主图批量生成类' },
          { value: 'B', label: '表情包 / IP / 品牌素材类' },
          { value: 'C', label: '建筑 / 装修效果图类' },
          { value: 'D', label: '模板 / 素材虚拟店铺类' },
        ] },
      { id: 'vs_s3', title: '你能接受反复修改设计稿吗？', required: true, single: true,
        options: [
          { value: 'A', label: '完全不想改，最好一次成型' },
          { value: 'B', label: '接受少量修改，不超过 2 次' },
          { value: 'C', label: '可以接受常规修改，按要求来' },
          { value: 'D', label: '无所谓，改到客户满意为止' },
        ] },
    ],
    local: [
      { id: 'lc_s1', title: '你所在的城市 / 区域规模是？', required: true, single: true,
        options: [
          { value: 'A', label: '县城 / 乡镇（本地商家竞争小）' },
          { value: 'B', label: '三四线城市' },
          { value: 'C', label: '新一线 / 二线城市' },
          { value: 'D', label: '一线城市' },
        ] },
      { id: 'lc_s2', title: '你有没有本地商家相关资源？', required: true, single: true,
        options: [
          { value: 'A', label: '完全没有，从零开始' },
          { value: 'B', label: '认识几个开店的朋友' },
          { value: 'C', label: '有本地商家社群 / 商圈资源' },
          { value: 'D', label: '之前做过商家相关业务' },
        ] },
      { id: 'lc_s3', title: '你愿意线下跑店谈合作吗？', required: true, single: true,
        options: [
          { value: 'A', label: '完全不想线下，只想线上做' },
          { value: 'B', label: '可以接受偶尔跑店' },
          { value: 'C', label: '愿意经常跑，擅长线下沟通' },
          { value: 'D', label: '只想做线下业务，不做线上' },
        ] },
    ],
    emo: [
      { id: 'em_s1', title: '你有没有情绪 / 陪伴相关经验？', required: true, single: true,
        options: [
          { value: 'A', label: '完全没有，不擅长和人聊情绪' },
          { value: 'B', label: '平时朋友愿意找我吐槽倾诉' },
          { value: 'C', label: '有心理咨询 / 情感相关基础' },
          { value: 'D', label: '做过社群 / 陪伴类相关服务' },
        ] },
      { id: 'em_s2', title: '你更感兴趣哪类情绪经济赛道？', required: true, single: true,
        options: [
          { value: 'A', label: '情感陪伴树洞类' },
          { value: 'B', label: '宠物成长 / 问诊服务类' },
          { value: 'C', label: '定制行业报告 / 方案售卖类' },
          { value: 'D', label: '垂直学习督学陪伴类' },
        ] },
      { id: 'em_s3', title: '你能不能长期承接情绪类咨询？', required: true, single: true,
        options: [
          { value: 'A', label: '不行，容易被负面情绪影响' },
          { value: 'B', label: '偶尔可以，不能太频繁' },
          { value: 'C', label: '可以稳定承接常规需求' },
          { value: 'D', label: '能做深度陪伴类服务' },
        ] },
    ],
    life: [
      { id: 'lf_s1', title: '你有没有手艺 / 线下服务经验？', required: true, single: true,
        options: [
          { value: 'A', label: '完全没有，没做过线下服务' },
          { value: 'B', label: '会简单的手工 / 维修 / 收纳技能' },
          { value: 'C', label: '有美甲 / 收纳 / 维修等专业手艺' },
          { value: 'D', label: '做过上门服务 / 社区服务相关工作' },
        ] },
      { id: 'lf_s2', title: '你更感兴趣哪类便民赛道？', required: true, single: true,
        options: [
          { value: 'A', label: '银发数字助手 / 陪诊类' },
          { value: 'B', label: '智能设备租赁 / 指导类' },
          { value: 'C', label: '上门宠物照料 / 收纳类' },
          { value: 'D', label: '轻量小工具 / 微 SaaS 开发类' },
        ] },
      { id: 'lf_s3', title: '你能不能接受上门 / 线下服务？', required: true, single: true,
        options: [
          { value: 'A', label: '不行，只想在家做线上项目' },
          { value: 'B', label: '偶尔可以，不能太频繁' },
          { value: 'C', label: '可以稳定做本地上门服务' },
          { value: 'D', label: '只想做线下实体类服务' },
        ] },
    ],
  };

  /* 进阶 · 通用确认题（第 1 题，可修改重选方向） */
  const confirm = {
    id: 'adv_confirm', title: '确认你初测匹配的方向是否正确？', hint: '可修改重选，修改后自动切换对应分支题', required: true, single: true,
    options: [
      { value: 'ok', label: '正确，继续测精准赛道' },
      { value: 'change', label: '不对，我要换方向' },
    ],
  };

  /* 进阶 · 通用深挖题（9 题，所有大类共用） */
  const commonDeep = [
    { id: 'd_exp', title: '你有没有相关行业的从业 / 兼职经验？', required: true, single: true,
      options: [
        { value: '1', label: '完全没有，纯新手' },
        { value: '2', label: '了解过相关内容，没实操过' },
        { value: '3', label: '做过相关兼职，有基础经验' },
        { value: '4', label: '有 1 年以上相关行业全职经验' },
      ] },
    { id: 'd_resources', title: '你手里有哪些可直接用的资源？', required: true, single: true,
      options: [
        { value: '1', label: '什么资源都没有，从零开始' },
        { value: '2', label: '有几百人的微信 / 社群资源' },
        { value: '3', label: '有对应行业的客户 / 商家资源' },
        { value: '4', label: '有自己的自媒体账号 / 流量' },
      ] },
    { id: 'd_paybackTol', title: '你能接受最长多久不盈利？', required: true, single: true,
      options: [
        { value: '1', label: '1 个月以内，最好马上赚钱' },
        { value: '2', label: '1-3 个月，能接受短期无收入' },
        { value: '3', label: '3-6 个月，可以慢慢跑通' },
        { value: '4', label: '半年以上，当做长期事业' },
      ] },
    { id: 'd_charge', title: '你更偏向哪种收费模式？', required: true, single: true,
      options: [
        { value: '1', label: '一次性收费，做完就结' },
        { value: '2', label: '包月 / 包年，长期稳定收入' },
        { value: '3', label: '按效果提成，多劳多得' },
        { value: '4', label: '都可以，能赚钱就行' },
      ] },
    { id: 'd_traffic', title: '你有没有自己的私域 / 账号流量基础？', required: true, single: true,
      options: [
        { value: '1', label: '完全没有，微信好友不到 200' },
        { value: '2', label: '有几百好友，没做过运营' },
        { value: '3', label: '有 1-2 个满号微信 / 小社群' },
        { value: '4', label: '有几千粉丝的自媒体账号' },
      ] },
    { id: 'd_learn', title: '你是否愿意学习新的 AI 工具 / 技能？', required: true, single: true,
      options: [
        { value: '1', label: '不想学，最好不用复杂工具' },
        { value: '2', label: '可以学简单的，太复杂不行' },
        { value: '3', label: '愿意花时间学，能提升效率就行' },
        { value: '4', label: '非常愿意，擅长研究新工具' },
      ] },
    { id: 'd_aftersale', title: '你有没有能力独立处理客户售后 / 纠纷？', required: true, single: true,
      options: [
        { value: '1', label: '不行，怕和客户吵架' },
        { value: '2', label: '简单问题可以，复杂的不会' },
        { value: '3', label: '可以独立处理常规售后问题' },
        { value: '4', label: '擅长沟通，能处理复杂纠纷' },
      ] },
    { id: 'd_launch', title: '你打算多久启动这个项目？', required: true, single: true,
      options: [
        { value: '1', label: '一周内，马上就能做' },
        { value: '2', label: '一个月内，准备好就启动' },
        { value: '3', label: '3 个月内，慢慢筹备' },
        { value: '4', label: '还没想好，先了解看看' },
      ] },
    { id: 'd_scale', title: '你有没有打算后期招人放大规模？', required: true, single: true,
      options: [
        { value: '1', label: '不想招人，就自己一个人做' },
        { value: '2', label: '赚钱了可能招 1-2 个帮手' },
        { value: '3', label: '打算做成小团队，5 人以内' },
        { value: '4', label: '想做成公司，规模化发展' },
      ] },
  ];

  /* 进阶 · 大类专属题（每类 10 题） */
  const specificDeep = {
    ai: [
      { id: 'ai_q11', title: '你有没有搭建过智能客服 / 自动化流程？', required: true, single: true,
        options: [
          { value: 'A', label: '完全没搭过，不会' },
          { value: 'B', label: '跟着教程搭过简单的' },
          { value: 'C', label: '能独立搭标准化的商家流程' },
          { value: 'D', label: '能做定制化的行业自动化方案' },
        ] },
      { id: 'ai_q12', title: '你会不会写行业专属 AI 提示词？', required: true, single: true,
        options: [
          { value: 'A', label: '不会，只会用通用提示词' },
          { value: 'B', label: '会改别人的提示词' },
          { value: 'C', label: '能写常规行业的提示词包' },
          { value: 'D', label: '能做整套工作流 + 提示词体系' },
        ] },
      { id: 'ai_q13', title: '你有没有接触过商家合规相关内容？', required: true, single: true,
        options: [
          { value: 'A', label: '完全不懂合规' },
          { value: 'B', label: '知道基础广告法规则' },
          { value: 'C', label: '了解行业合规审核标准' },
          { value: 'D', label: '有合规审核相关工作经验' },
        ] },
      { id: 'ai_q14', title: '你会不会批量处理表格 / 数据？', required: true, single: true,
        options: [
          { value: 'A', label: '不会，只会基础录入' },
          { value: 'B', label: '会用函数做简单整理' },
          { value: 'C', label: '能用 AI 批量处理数据 / 报表' },
          { value: 'D', label: '能做复杂的数据清洗和分析' },
        ] },
      { id: 'ai_q15', title: '你有没有接触过数字人 / 短视频相关工具？', required: true, single: true,
        options: [
          { value: 'A', label: '完全没用过' },
          { value: 'B', label: '刷到过，没实操过' },
          { value: 'C', label: '会用数字人工具做简单视频' },
          { value: 'D', label: '能做完整的数字人短视频代运营' },
        ] },
      { id: 'ai_q16', title: '你更擅长对接什么规模的客户？', required: true, single: true,
        options: [
          { value: 'A', label: '个体户 / 小店，单客几百块' },
          { value: 'B', label: '中小商家，单客几千块' },
          { value: 'C', label: '中型企业，单客上万块' },
          { value: 'D', label: '都可以，看需求定价' },
        ] },
      { id: 'ai_q17', title: '你一天最多能交付多少份标准化服务？', required: true, single: true,
        options: [
          { value: 'A', label: '1-2 份' },
          { value: 'B', label: '3-5 份' },
          { value: 'C', label: '6-10 份' },
          { value: 'D', label: '10 份以上' },
        ] },
      { id: 'ai_q18', title: '你能不能给客户做培训 / 使用指导？', required: true, single: true,
        options: [
          { value: 'A', label: '不行，不会讲' },
          { value: 'B', label: '简单操作可以教' },
          { value: 'C', label: '能做完整的使用培训' },
          { value: 'D', label: '能做定制化的行业方案培训' },
        ] },
      { id: 'ai_q19', title: '你有没有现成的案例 / 作品可以展示？', required: true, single: true,
        options: [
          { value: 'A', label: '没有，还没做过' },
          { value: 'B', label: '有自己练手的样例' },
          { value: 'C', label: '有给朋友做的免费案例' },
          { value: 'D', label: '有付费客户的真实案例' },
        ] },
      { id: 'ai_q20', title: '你能接受的最低客单价是多少？', required: true, single: true,
        options: [
          { value: 'A', label: '几十块，走量也行' },
          { value: 'B', label: '一百块以上' },
          { value: 'C', label: '三百块以上' },
          { value: 'D', label: '一千块以上' },
        ] },
    ],
    content: [
      { id: 'ct_q11', title: '你有没有做过自媒体账号？', required: true, single: true,
        options: [
          { value: 'A', label: '从来没做过' },
          { value: 'B', label: '注册过，没怎么更' },
          { value: 'C', label: '做过千粉以内的小账号' },
          { value: 'D', label: '做过万粉以上的账号' },
        ] },
      { id: 'ct_q12', title: '你会不会做短视频 / 短剧剪辑？', required: true, single: true,
        options: [
          { value: 'A', label: '完全不会剪辑' },
          { value: 'B', label: '会用剪映剪简单视频' },
          { value: 'C', label: '能做完整的剧情 / 口播短视频' },
          { value: 'D', label: '能做短剧批量剪辑和分发' },
        ] },
      { id: 'ct_q13', title: '你有没有配音 / 有声书相关经验？', required: true, single: true,
        options: [
          { value: 'A', label: '完全没接触过' },
          { value: 'B', label: '普通话标准，没录过内容' },
          { value: 'C', label: '录过简单的音频内容' },
          { value: 'D', label: '有专业配音 / 有声书制作经验' },
        ] },
      { id: 'ct_q14', title: '你对哪个垂直行业最熟悉？', required: true, single: true,
        options: [
          { value: 'A', label: '育儿 / 儿童类' },
          { value: 'B', label: '职场 / 商业类' },
          { value: 'C', label: '情感 / 生活类' },
          { value: 'D', label: '专业知识类（金融 / 法律等）' },
        ] },
      { id: 'ct_q15', title: '你能不能写付费专栏 / 研报类深度内容？', required: true, single: true,
        options: [
          { value: 'A', label: '不行，写不了深度内容' },
          { value: 'B', label: '能写简单的科普内容' },
          { value: 'C', label: '能写垂直行业的干货内容' },
          { value: 'D', label: '能写专业级的行业研报' },
        ] },
      { id: 'ct_q16', title: '你有没有做过内容变现？', required: true, single: true,
        options: [
          { value: 'A', label: '从来没变现过' },
          { value: 'B', label: '赚过几百块小钱' },
          { value: 'C', label: '稳定月入一千以上' },
          { value: 'D', label: '内容是主要收入来源' },
        ] },
      { id: 'ct_q17', title: '你更倾向哪种内容变现方式？', required: true, single: true,
        options: [
          { value: 'A', label: '定制单，按份收费' },
          { value: 'B', label: '卖模板 / 素材，被动收入' },
          { value: 'C', label: '付费专栏 / 会员，长期收入' },
          { value: 'D', label: '接商单，按条收费' },
        ] },
      { id: 'ct_q18', title: '你一天能产出多少份标准化内容？', required: true, single: true,
        options: [
          { value: 'A', label: '1 份以内' },
          { value: 'B', label: '2-3 份' },
          { value: 'C', label: '4-6 份' },
          { value: 'D', label: '10 份以上' },
        ] },
      { id: 'ct_q19', title: '你会不会做内容的多平台分发？', required: true, single: true,
        options: [
          { value: 'A', label: '不会，只会发一个平台' },
          { value: 'B', label: '会手动发几个平台' },
          { value: 'C', label: '能用工具批量分发多平台' },
          { value: 'D', label: '有完整的多平台运营经验' },
        ] },
      { id: 'ct_q20', title: '你有没有自己的内容素材库？', required: true, single: true,
        options: [
          { value: 'A', label: '没有，每次现找' },
          { value: 'B', label: '有零散的素材' },
          { value: 'C', label: '有整理好的分行业素材库' },
          { value: 'D', label: '有完整的可商用素材体系' },
        ] },
    ],
    biz: [
      { id: 'bz_q11', title: '你有没有接触过招投标相关工作？', required: true, single: true,
        options: [
          { value: 'A', label: '完全不懂招投标' },
          { value: 'B', label: '见过标书，没写过' },
          { value: 'C', label: '写过简单的投标文件' },
          { value: 'D', label: '有招投标相关全职经验' },
        ] },
      { id: 'bz_q12', title: '你有没有财务 / 数据相关经验？', required: true, single: true,
        options: [
          { value: 'A', label: '完全不懂财务' },
          { value: 'B', label: '会做简单的表格记账' },
          { value: 'C', label: '能做企业基础报表整理' },
          { value: 'D', label: '有会计 / 财务相关资质' },
        ] },
      { id: 'bz_q13', title: '你有没有 HR / 招聘相关经验？', required: true, single: true,
        options: [
          { value: 'A', label: '完全没接触过' },
          { value: 'B', label: '招过人，没做过全流程' },
          { value: 'C', label: '能独立做简历筛选和面试' },
          { value: 'D', label: '有 3 年以上 HR 相关经验' },
        ] },
      { id: 'bz_q14', title: '你有没有知识产权 / 资质办理相关经验？', required: true, single: true,
        options: [
          { value: 'A', label: '完全不懂' },
          { value: 'B', label: '听过，不知道怎么办' },
          { value: 'C', label: '自己办过商标 / 专利' },
          { value: 'D', label: '有知识产权代理相关经验' },
        ] },
      { id: 'bz_q15', title: '你写专业文案的能力如何？', required: true, single: true,
        options: [
          { value: 'A', label: '不行，写不了正式文案' },
          { value: 'B', label: '能写简单的通知类文案' },
          { value: 'C', label: '能写企业宣传 / 申请文案' },
          { value: 'D', label: '能写专业级的企业申报材料' },
        ] },
      { id: 'bz_q16', title: '你有没有企业客户资源？', required: true, single: true,
        options: [
          { value: 'A', label: '完全没有' },
          { value: 'B', label: '认识几个企业员工' },
          { value: 'C', label: '有中小企业老板资源' },
          { value: 'D', label: '有大量企业决策人资源' },
        ] },
      { id: 'bz_q17', title: '你更擅长做哪类企业服务？', required: true, single: true,
        options: [
          { value: 'A', label: '标准化代写类，按份收费' },
          { value: 'B', label: '包月服务类，长期稳定' },
          { value: 'C', label: '咨询类，按小时收费' },
          { value: 'D', label: '全流程代办类，按项目收费' },
        ] },
      { id: 'bz_q18', title: '你能不能接受项目制的加班赶工？', required: true, single: true,
        options: [
          { value: 'A', label: '不行，到点就停' },
          { value: 'B', label: '偶尔赶工可以，不能经常' },
          { value: 'C', label: '可以接受项目期加班' },
          { value: 'D', label: '无所谓，按客户需求来' },
        ] },
      { id: 'bz_q19', title: '你有没有相关的资质 / 证书？', required: true, single: true,
        options: [
          { value: 'A', label: '没有任何相关证书' },
          { value: 'B', label: '有基础的办公软件证书' },
          { value: 'C', label: '有行业相关的职业证书' },
          { value: 'D', label: '有国家级的专业资质证书' },
        ] },
      { id: 'bz_q20', title: '你能接受的最低单客价格是？', required: true, single: true,
        options: [
          { value: 'A', label: '几十块，小单也接' },
          { value: 'B', label: '一百块以上' },
          { value: 'C', label: '五百块以上' },
          { value: 'D', label: '两千块以上' },
        ] },
    ],
    visual: [
      { id: 'vs_q11', title: '你有没有用过 Midjourney / Stable Diffusion 等 AI 画图工具？', required: true, single: true,
        options: [
          { value: 'A', label: '完全没用过' },
          { value: 'B', label: '跟着教程生成过简单图' },
          { value: 'C', label: '能熟练调参数做指定风格图' },
          { value: 'D', label: '能训练专属 Lora 做定制化内容' },
        ] },
      { id: 'vs_q12', title: '你有没有电商设计相关经验？', required: true, single: true,
        options: [
          { value: 'A', label: '完全没接触过' },
          { value: 'B', label: '自己开店做过简单主图' },
          { value: 'C', label: '能做完整的电商详情页' },
          { value: 'D', label: '有电商设计全职经验' },
        ] },
      { id: 'vs_q13', title: '你会不会做动图 / 动态表情包？', required: true, single: true,
        options: [
          { value: 'A', label: '完全不会' },
          { value: 'B', label: '会做简单的静态表情包' },
          { value: 'C', label: '能做动态表情包和简单动画' },
          { value: 'D', label: '能做完整的 IP 动态素材包' },
        ] },
      { id: 'vs_q14', title: '你有没有建筑 / 装修设计相关经验？', required: true, single: true,
        options: [
          { value: 'A', label: '完全不懂' },
          { value: 'B', label: '自己装过房子，了解一点' },
          { value: 'C', label: '会做简单的效果图' },
          { value: 'D', label: '有室内 / 建筑设计相关经验' },
        ] },
      { id: 'vs_q15', title: '你有没有开过虚拟素材店铺？', required: true, single: true,
        options: [
          { value: 'A', label: '从来没开过' },
          { value: 'B', label: '注册过，没上传多少' },
          { value: 'C', label: '有稳定出单的小店铺' },
          { value: 'D', label: '有成熟的多平台素材店' },
        ] },
      { id: 'vs_q16', title: '你一天最多能产出多少份设计图？', required: true, single: true,
        options: [
          { value: 'A', label: '1-2 张' },
          { value: 'B', label: '3-5 张' },
          { value: 'C', label: '6-10 张' },
          { value: 'D', label: '10 张以上批量产出' },
        ] },
      { id: 'vs_q17', title: '你更倾向哪种收费模式？', required: true, single: true,
        options: [
          { value: 'A', label: '按张收费，做一张结一张' },
          { value: 'B', label: '包月服务，不限量' },
          { value: 'C', label: '卖模板，被动收入' },
          { value: 'D', label: '定制项目，按套收费' },
        ] },
      { id: 'vs_q18', title: '你有没有作品集 / 案例可以展示？', required: true, single: true,
        options: [
          { value: 'A', label: '没有，还没做过' },
          { value: 'B', label: '有自己练手的作品' },
          { value: 'C', label: '有给朋友做的免费案例' },
          { value: 'D', label: '有付费客户的商业作品' },
        ] },
      { id: 'vs_q19', title: '你能不能对接甲方做需求沟通？', required: true, single: true,
        options: [
          { value: 'A', label: '不行，怕理解错需求' },
          { value: 'B', label: '简单需求可以沟通' },
          { value: 'C', label: '能独立对接常规设计需求' },
          { value: 'D', label: '能对接复杂的品牌全案需求' },
        ] },
      { id: 'vs_q20', title: '你能接受的最低单张设计价格是？', required: true, single: true,
        options: [
          { value: 'A', label: '几块钱，走量也行' },
          { value: 'B', label: '几十块' },
          { value: 'C', label: '一百块以上' },
          { value: 'D', label: '五百块以上' },
        ] },
    ],
    local: [
      { id: 'lc_q11', title: '你有没有做过本地商家私域运营？', required: true, single: true,
        options: [
          { value: 'A', label: '完全没做过' },
          { value: 'B', label: '自己开店管过朋友圈' },
          { value: 'C', label: '帮商家做过简单的社群运营' },
          { value: 'D', label: '有完整的商家私域运营经验' },
        ] },
      { id: 'lc_q12', title: '你有没有做过短视频 / 探店相关内容？', required: true, single: true,
        options: [
          { value: 'A', label: '完全没接触过' },
          { value: 'B', label: '刷过探店视频，没拍过' },
          { value: 'C', label: '拍过简单的本地探店视频' },
          { value: 'D', label: '有本地商家短视频代运营经验' },
        ] },
      { id: 'lc_q13', title: '你有没有接触过餐饮食安相关内容？', required: true, single: true,
        options: [
          { value: 'A', label: '完全不懂' },
          { value: 'B', label: '吃饭店，知道大概要求' },
          { value: 'C', label: '了解食安台账和监管要求' },
          { value: 'D', label: '有餐饮行业管理经验' },
        ] },
      { id: 'lc_q14', title: '你对本地哪个行业最熟悉？', required: true, single: true,
        options: [
          { value: 'A', label: '餐饮 / 生鲜类' },
          { value: 'B', label: '美业 / 教培类' },
          { value: 'C', label: '汽修 / 生活服务类' },
          { value: 'D', label: '民宿 / 酒店类' },
        ] },
      { id: 'lc_q15', title: '你有没有本地社群 / 商圈资源？', required: true, single: true,
        options: [
          { value: 'A', label: '完全没有' },
          { value: 'B', label: '有几个本地业主群' },
          { value: 'C', label: '有本地商家社群资源' },
          { value: 'D', label: '有本地商圈 / 协会资源' },
        ] },
      { id: 'lc_q16', title: '你更擅长哪种本地获客方式？', required: true, single: true,
        options: [
          { value: 'A', label: '扫街陌拜，线下谈' },
          { value: 'B', label: '熟人转介绍' },
          { value: 'C', label: '本地抖音 / 小红书引流' },
          { value: 'D', label: '异业合作换资源' },
        ] },
      { id: 'lc_q17', title: '你更倾向哪种和商家的合作模式？', required: true, single: true,
        options: [
          { value: 'A', label: '按月收服务费，稳定' },
          { value: 'B', label: '按效果分成，多劳多得' },
          { value: 'C', label: '单次服务，按次收费' },
          { value: 'D', label: '年框服务，一次性收费' },
        ] },
      { id: 'lc_q18', title: '你一周能跑多少家店？', required: true, single: true,
        options: [
          { value: 'A', label: '3 家以内' },
          { value: 'B', label: '5-8 家' },
          { value: 'C', label: '10-15 家' },
          { value: 'D', label: '20 家以上' },
        ] },
      { id: 'lc_q19', title: '你能不能独立和老板谈合作签单？', required: true, single: true,
        options: [
          { value: 'A', label: '不行，不敢谈' },
          { value: 'B', label: '简单介绍可以，逼单不行' },
          { value: 'C', label: '能独立谈成常规合作' },
          { value: 'D', label: '擅长谈单，签单率很高' },
        ] },
      { id: 'lc_q20', title: '你能接受的单店月服务费最低是？', required: true, single: true,
        options: [
          { value: 'A', label: '一百多块，多接几家就行' },
          { value: 'B', label: '三百块以上' },
          { value: 'C', label: '五百块以上' },
          { value: 'D', label: '一千块以上' },
        ] },
    ],
    emo: [
      { id: 'em_q11', title: '你有没有做过社群 / 陪伴类服务？', required: true, single: true,
        options: [
          { value: 'A', label: '完全没做过' },
          { value: 'B', label: '当过群管理员' },
          { value: 'C', label: '做过小型付费社群' },
          { value: 'D', label: '有深度陪伴服务经验' },
        ] },
      { id: 'em_q12', title: '你有没有养宠物 / 宠物行业相关经验？', required: true, single: true,
        options: [
          { value: 'A', label: '没养过，完全不懂' },
          { value: 'B', label: '养过宠物，有基础经验' },
          { value: 'C', label: '做过宠物相关兼职' },
          { value: 'D', label: '有宠物行业全职经验' },
        ] },
      { id: 'em_q13', title: '你对哪个垂直领域的知识最熟悉？', required: true, single: true,
        options: [
          { value: 'A', label: '考研 / 考公学习类' },
          { value: 'B', label: '职场 / 成长类' },
          { value: 'C', label: '情感 / 心理类' },
          { value: 'D', label: '商业 / 行业研究类' },
        ] },
      { id: 'em_q14', title: '你能不能承接负面情绪的倾诉？', required: true, single: true,
        options: [
          { value: 'A', label: '不行，容易被影响心情' },
          { value: 'B', label: '偶尔可以，不能太长时间' },
          { value: 'C', label: '可以稳定承接日常情绪倾诉' },
          { value: 'D', label: '能做深度的情绪疏导陪伴' },
        ] },
      { id: 'em_q15', title: '你会不会做行业报告 / 方案类内容？', required: true, single: true,
        options: [
          { value: 'A', label: '完全不会写' },
          { value: 'B', label: '能整理简单的资料' },
          { value: 'C', label: '能写常规的行业方案' },
          { value: 'D', label: '能写专业级的定制报告' },
        ] },
      { id: 'em_q16', title: '你更倾向哪种收费模式？', required: true, single: true,
        options: [
          { value: 'A', label: '按次收费，单次服务' },
          { value: 'B', label: '包月陪伴，长期服务' },
          { value: 'C', label: '卖数字产品，被动收入' },
          { value: 'D', label: '会员制，解锁全部内容' },
        ] },
      { id: 'em_q17', title: '你有没有做过相关内容的引流？', required: true, single: true,
        options: [
          { value: 'A', label: '完全没引流过' },
          { value: 'B', label: '发过帖子，没什么流量' },
          { value: 'C', label: '能稳定获取精准用户' },
          { value: 'D', label: '有成熟的引流转化路径' },
        ] },
      { id: 'em_q18', title: '你每天能承接多少个客户的咨询？', required: true, single: true,
        options: [
          { value: 'A', label: '3 个以内' },
          { value: 'B', label: '5-8 个' },
          { value: 'C', label: '10-15 个' },
          { value: 'D', label: '20 个以上' },
        ] },
      { id: 'em_q19', title: '你有没有相关的专业资质？', required: true, single: true,
        options: [
          { value: 'A', label: '没有任何相关证书' },
          { value: 'B', label: '有相关的培训证书' },
          { value: 'C', label: '有行业认可的职业证书' },
          { value: 'D', label: '有国家级专业资质' },
        ] },
      { id: 'em_q20', title: '你能接受的最低客单价是？', required: true, single: true,
        options: [
          { value: 'A', label: '几块钱，走量也行' },
          { value: 'B', label: '几十块' },
          { value: 'C', label: '一百块以上' },
          { value: 'D', label: '三百块以上' },
        ] },
    ],
    life: [
      { id: 'lf_q11', title: '你有没有低代码 / 微 SaaS 开发相关经验？', required: true, single: true,
        options: [
          { value: 'A', label: '完全不懂开发' },
          { value: 'B', label: '用过简单的低代码工具' },
          { value: 'C', label: '能用低代码搭简单的小工具' },
          { value: 'D', label: '有基础的前后端开发能力' },
        ] },
      { id: 'lf_q12', title: '你有没有上门服务相关经验？', required: true, single: true,
        options: [
          { value: 'A', label: '从来没做过上门服务' },
          { value: 'B', label: '偶尔帮朋友做过' },
          { value: 'C', label: '做过半年以上上门服务' },
          { value: 'D', label: '有成熟的上门服务团队经验' },
        ] },
      { id: 'lf_q13', title: '你有没有和老年人打交道的经验？', required: true, single: true,
        options: [
          { value: 'A', label: '很少和老人接触' },
          { value: 'B', label: '照顾家里老人，有经验' },
          { value: 'C', label: '做过社区老年相关服务' },
          { value: 'D', label: '有银发行业相关工作经验' },
        ] },
      { id: 'lf_q14', title: '你会不会简单的家电 / 智能设备调试？', required: true, single: true,
        options: [
          { value: 'A', label: '完全不会，自己都搞不懂' },
          { value: 'B', label: '会简单的手机 / 电视调试' },
          { value: 'C', label: '能搞定大部分家用智能设备' },
          { value: 'D', label: '有家电维修 / 智能设备安装经验' },
        ] },
      { id: 'lf_q15', title: '你有没有宠物照料相关经验？', required: true, single: true,
        options: [
          { value: 'A', label: '没养过宠物，完全不懂' },
          { value: 'B', label: '养过宠物，能基础照料' },
          { value: 'C', label: '做过上门喂养兼职' },
          { value: 'D', label: '有宠物行业相关经验' },
        ] },
      { id: 'lf_q16', title: '你更倾向哪种便民服务模式？', required: true, single: true,
        options: [
          { value: 'A', label: '纯线上工具，被动收入' },
          { value: 'B', label: '上门服务，按次收费' },
          { value: 'C', label: '社区包月服务，稳定收入' },
          { value: 'D', label: '技能培训，收学费' },
        ] },
      { id: 'lf_q17', title: '你所在的社区 / 小区规模有多大？', required: true, single: true,
        options: [
          { value: 'A', label: '小小区，几百户' },
          { value: 'B', label: '中等小区，一千多户' },
          { value: 'C', label: '大型社区，几千户' },
          { value: 'D', label: '县城 / 乡镇核心区' },
        ] },
      { id: 'lf_q18', title: '你能不能接受上门服务的安全风险？', required: true, single: true,
        options: [
          { value: 'A', label: '不行，怕不安全' },
          { value: 'B', label: '白天可以，晚上不行' },
          { value: 'C', label: '本小区 / 周边可以' },
          { value: 'D', label: '整个市区都可以跑' },
        ] },
      { id: 'lf_q19', title: '你有没有做过社区引流？', required: true, single: true,
        options: [
          { value: 'A', label: '完全没做过' },
          { value: 'B', label: '在业主群发过广告' },
          { value: 'C', label: '有社区团长 / 群主资源' },
          { value: 'D', label: '有成熟的社区获客路径' },
        ] },
      { id: 'lf_q20', title: '你能接受的最低单次服务价格是？', required: true, single: true,
        options: [
          { value: 'A', label: '几十块，小单也接' },
          { value: 'B', label: '一百块以上' },
          { value: 'C', label: '两百块以上' },
          { value: 'D', label: '五百块以上' },
        ] },
    ],
  };

  /* 初测评分画像：每类 6 道通用题的「理想选项」，命中 +4、否则 +1（基础 60 → 上限 99） */
  const profile = {
    ai:      { pref: { q_time: 'C', q_capital: 'B', q_ai: 'D', q_client: 'A', q_acq: 'A', q_income: 'C' } },
    content: { pref: { q_time: 'C', q_capital: 'A', q_ai: 'C', q_client: 'C', q_acq: 'A', q_income: 'B' } },
    biz:     { pref: { q_time: 'C', q_capital: 'B', q_ai: 'B', q_client: 'A', q_acq: 'B', q_income: 'C' } },
    visual:  { pref: { q_time: 'C', q_capital: 'A', q_ai: 'C', q_client: 'A', q_acq: 'A', q_income: 'B' } },
    local:   { pref: { q_time: 'C', q_capital: 'A', q_ai: 'B', q_client: 'A', q_acq: 'B', q_income: 'B' } },
    emo:     { pref: { q_time: 'B', q_capital: 'A', q_ai: 'C', q_client: 'C', q_acq: 'A', q_income: 'B' } },
    life:    { pref: { q_time: 'B', q_capital: 'A', q_ai: 'B', q_client: 'C', q_acq: 'B', q_income: 'B' } },
  };

  /* 进阶细分赛道提示：每类部分专属题的选项 → 对应细分赛道 id（基于现有 TRACKS 推导的样本数据）
     命中该选项的赛道在精准匹配中加权；其余专属题贡献「准备度」基础分。 */
  const subtrackHints = {
    ai: {
      ai_q11: { A: null, B: null, C: 't01', D: 't21' },
      ai_q12: { A: null, B: null, C: 't05', D: 't05' },
      ai_q13: { A: null, B: null, C: 't03', D: 't03' },
      ai_q14: { A: null, B: null, C: 't04', D: 't04' },
      ai_q15: { A: null, B: null, C: 't02', D: 't02' },
      ai_q16: { A: 't01', B: 't02', C: 't03', D: 't21' },
      ai_q20: { A: 't04', B: 't05', C: 't03', D: 't21' },
    },
    content: {
      ct_q11: { A: null, B: null, C: 't22', D: 't22' },
      ct_q12: { A: null, B: null, C: 't22', D: 't22' },
      ct_q13: { A: null, B: null, C: null, D: 't22' },
      ct_q15: { A: null, B: null, C: 't23', D: 't23' },
      ct_q17: { A: 't23', B: 't23', C: 't23', D: 't22' },
    },
    biz: {
      bz_q11: { A: null, B: null, C: 't24', D: 't24' },
      bz_q12: { A: null, B: null, C: 't25', D: 't25' },
      bz_q14: { A: null, B: null, C: 't26', D: 't26' },
      bz_q15: { A: null, B: null, C: 't24', D: 't24' },
      bz_q17: { A: 't24', B: 't25', C: 't27', D: 't24' },
      bz_q20: { A: null, B: 't27', C: 't26', D: 't24' },
    },
    visual: {
      vs_q11: { A: null, B: null, C: 't28', D: 't30' },
      vs_q12: { A: null, B: null, C: 't28', D: 't28' },
      vs_q13: { A: null, B: 't30', C: 't30', D: 't30' },
      vs_q14: { A: null, B: null, C: 't29', D: 't29' },
      vs_q15: { A: null, B: null, C: 't12', D: 't12' },
      vs_q17: { A: 't28', B: 't31', C: 't12', D: 't30' },
      vs_q20: { A: null, B: 't28', C: 't30', D: 't29' },
    },
    local: {
      lc_q11: { A: null, B: null, C: 't06', D: 't06' },
      lc_q12: { A: null, B: null, C: 't02', D: 't31' },
      lc_q13: { A: null, B: null, C: 't08', D: 't08' },
      lc_q15: { A: null, B: null, C: 't31', D: 't32' },
      lc_q17: { A: 't31', B: 't07', C: 't06', D: 't31' },
      lc_q20: { A: 't06', B: 't31', C: 't32', D: 't32' },
    },
    emo: {
      em_q11: { A: null, B: null, C: 't09', D: 't09' },
      em_q12: { A: null, B: null, C: null, D: 't10' },
      em_q13: { A: null, B: null, C: 't09', D: 't11' },
      em_q15: { A: null, B: null, C: 't11', D: 't11' },
      em_q16: { A: 't09', B: 't09', C: 't12', D: 't11' },
      em_q20: { A: 't10', B: 't10', C: 't09', D: 't11' },
    },
    life: {
      lf_q11: { A: null, B: null, C: 't18', D: 't18' },
      lf_q12: { A: null, B: null, C: 't17', D: 't17' },
      lf_q13: { A: null, B: null, C: 't15', D: 't15' },
      lf_q14: { A: null, B: null, C: 't15', D: 't16' },
      lf_q15: { A: null, B: null, C: 't17', D: 't17' },
      lf_q16: { A: 't18', B: 't17', C: 't15', D: 't18' },
      lf_q20: { A: 't15', B: 't16', C: 't17', D: 't18' },
    },
  };

  /* 初测 · 大类通用落地 SOP（3 步简化版，示例数据，可替换为真实内容） */
  const catSop = {
    ai:      ['1 周熟练 2-3 款核心 AI 工具（如 Coze / 腾讯云 AI）', '做 3-5 份样例作为谈单素材', '免费服务 3 个客户攒案例后定价收费'],
    content: ['选定 1 个垂直内容方向，周更 3 份练手', '做 3 个能展示的样本（短剧 / 专栏 / 绘本）', '上架模板或接首单，跑通变现闭环'],
    biz:     ['选 1 类企业服务（代写 / 报表 / 资质）做样板', '整理标准交付清单与报价单', '对接 3 家企业免费试做换案例'],
    visual:  ['1 周熟练 Midjourney + 可画等出图工具', '做 5 套不同风格样例作品集', '发小红书 / 接单平台引流，定价接单'],
    local:   ['锁定 1 个本地业态（餐饮 / 美业 / 教培）', '搭内容日历与自动回复模板', '谈下首家门店做月度代运营'],
    emo:     ['明确服务边界（不替代专业咨询）', '用 AI 搭倾听话术与转介机制', '在社群 / 内容平台引流首批用户'],
    life:    ['整理最高频的 1 个便民需求清单', '准备标准服务包与定价', '在社区 / 业主群做首单地推'],
  };

  /* 进阶 · 赛道避坑指南（每类 3 个常见踩坑点，示例数据） */
  const catPitfalls = {
    ai:      ['别一上来收高额年费，先小模块验证价值再续费', '数字人 / 自动化需标注「AI 生成」，避免虚假宣传', '客户数据隐私要签保密约定，不碰敏感个人信息'],
    content: ['版权与平台规则收紧，搬运号易被限流封号', '同质模板泛滥，靠「垂直细分」才能突围', '持续产出压力大，需先积累素材库再放大'],
    biz:     ['标书 / 合规不能承诺「必中」「保证过审」，需免责声明', '数据口径不一易反复返工，沟通成本要高估', '需求方说不清流程，POC 到签单周期长，控预期'],
    visual:  ['审美主观性强，改稿成本高，需明确权益边界', '平台风格多变，需贴合类目审美而非千篇一律', '设备 / 耗材为固定成本，先以销定产控库存'],
    local:   ['刷评合规红线，以「内容运营」而非刷量切入', '商家不配合发内容，代运营难量化带来业绩', '线索质量参差、掉单率高，影响续费信任'],
    emo:     ['严守心理危机转介红线，不越界做诊疗', '情感依赖与责任边界模糊，需防过度承诺', '宠物问诊涉医疗边界，只能做「参考」不能下诊断'],
    life:    ['上门服务安全与责任要签约定，防范意外纠纷', '设备押金与损坏理赔规则写清，控资产风险', '防骗提醒到位，绝不代办转账 / 理财'],
  };

  /* 进阶 · 启动行动清单（本周可直接做的 3 件事，示例数据） */
  const catAction = {
    ai:      ['今天用 Coze 搭一个行业客服机器人样板', '联系 2 家本地小店聊自动化需求', '把交付清单和报价单草稿写出来'],
    content: ['定下你的垂直内容方向并注册账号', '本周产出 3 份样本内容', '研究 1 个对标账号的变现路径'],
    biz:     ['选 1 类企业服务做能力自检', '写一份标准交付 SOP 模板', '在社群 / 接单平台发一条服务介绍'],
    visual:  ['熟练 1 款 AI 出图工具并出 5 张样图', '搭建个人作品集页面', '在小红书发 3 篇作品笔记引流'],
    local:   ['锁定 1 个本地业态并建立资源清单', '做好内容日历与自动回复模板', '本周拜访 3 家门店谈合作'],
    emo:     ['写好服务边界说明与转介流程', '用 AI 生成首套倾听话术', '在 1 个社群做免费体验引流'],
    life:    ['列出你最擅长的 1 个便民服务', '定好服务包与价格', '在业主群 / 社区发首条服务帖'],
  };

  window.ASSESS = {
    cats, anchor, common, specific,
    confirm, commonDeep, specificDeep,
    profile, subtrackHints, catSop, catPitfalls, catAction,
  };
})();
