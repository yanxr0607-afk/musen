# OPC SaaS 一键部署指南（Railway / Render）

本项目是一个**零依赖 Node.js 服务** + 纯静态前端，已内置后台管理（`/admin`）与支付页配置（微信/支付宝收款码）。
以下任挑一个平台，**几分钟即可公网可访问**，后台、支付、会员开通全部可用。

> ⚠️ 此前通过 CloudStudio / 对象存储的「分享链接」**只能静态托管前端**，跑不了 `server.js`，所以后台与支付在那里用不了。
> 按本指南部署到 Railway / Render 后，服务端与前端一起上线，所有能力才完整生效。

---

## 一、准备（本地一次性）

1. 安装 Node.js ≥ 18（Railway/Render 会自动安装，无需你操心）。
2. 本地试运行确认无误：
   ```bash
   node server.js
   # 打开 http://127.0.0.1:8787/   主站
   # 打开 http://127.0.0.1:8787/admin 后台（默认密码 opc-admin-dev）
   ```
3. 把整个项目目录初始化为 Git 仓库并推到 GitHub（Railway/Render 都从 Git 拉取）：
   ```bash
   git init
   git add .
   git commit -m "OPC SaaS 初版"
   git remote add origin <你的 GitHub 仓库地址>
   git push -u origin main
   ```

---

## 二、部署到 Railway

1. 打开 https://railway.app → 用 GitHub 登录 → **New Project** → **Deploy from GitHub repo** → 选中本项目仓库。
2. Railway 会自动识别 `package.json`，用 `npm start`（即 `node server.js`）启动。无需额外构建。
3. 配置环境变量（Project → Variables）：
   | 变量 | 说明 | 建议值 |
   |---|---|---|
   | `PORT` | 端口（Railway 自动注入，一般不用手填） | 留空即可 |
   | `ADMIN_PASS` | 后台管理员密码（**务必修改！**） | 自定义强密码 |
   | `HUNYUAN_API_KEY` | 腾讯混元大模型 Key（不填则 AI 顾问走降级） | 选填 |
   | `DATA_DIR` | 数据持久化目录（配合挂载卷，见下） | 例如 `/data` |
4. **持久化数据（重要）**：Railway 默认文件系统是临时的，每次部署会清空 `data/store.json`（用户/订单/支付配置会丢失）。
   - 在 Railway 项目里添加 **Volume**，挂载路径设为 `/data`，并设置环境变量 `DATA_DIR=/data`。
   - 服务端已支持：`DATA_DIR` 指向的目录会用来存放 `store.json` 与浏览量统计，重启/部署不丢数据。
5. 部署完成后，Railway 会给出一个 `*.up.railway.app` 域名，即是你的公网地址。

---

## 三、部署到 Render

1. 打开 https://render.com → 用 GitHub 登录 → **New** → **Web Service** → 选中本项目仓库。
2. 配置：
   - **Runtime**：Node
   - **Build Command**：留空（零依赖，无需构建）
   - **Start Command**：`node server.js`
   - **Instance Type**：Free 即可起步
3. 配置环境变量（Environment → Add Environment Variable），同上表（`ADMIN_PASS` / `HUNYUAN_API_KEY` / `DATA_DIR`）。
4. **持久化数据**：Render Free 实例文件系统也是临时的。
   - 在 Render 里添加 **Disk**（挂载到例如 `/data`），并设置 `DATA_DIR=/data`。
   - 这样用户/订单/支付配置在重启后依然保留。
5. 部署完成后，Render 给出 `*.onrender.com` 域名，即为公网地址。

---

## 四、上线后必做：配置支付页（收款码）

部署完、用管理员密码登入 `/admin` 后：

1. 进入「**支付配置**」标签页。
2. 上传你的**个人微信收款码**与**个人支付宝收款码**（图片会自动转存储）。
3. 填写「支付页提示语」（默认：`付款后添加客服微信，手动开通会员权限`）与「客服微信号」。
4. 点「保存支付配置」。

此后用户在前端点「开通会员」→ 选套餐 → **支付页会展示你的收款码 + 提示语 + 客服微信**。

---

## 五、收款后的手动开通流程（你的日常运营）

当前为「个人收款码 + 人工核实」模式，最稳妥、零手续费、无需商户资质：

1. 用户在支付页扫码付款后，点「我已付款 · 提交开通申请」→ 前端向后端提交一条 **pending 订单**（记录昵称 + 套餐 + 金额）。
2. 你在微信/支付宝收到款项后，打开 `/admin`：
   - 「**订单管理**」看到该订单 → 核对后点「标记已处理」。
   - 「**用户管理**」找到该用户 → 在「手动开通会员」下拉选对应等级 → 点「设为」。
3. 用户端：你通过微信把对应**资料包**发给用户即可。

> 用户本地浏览器里显示的会员状态，是注册时写入的 `localStorage`，需要用户**重新登录/刷新**或你告知其重新进入站点后才会显示新等级（前端读取后台套餐名展示）。如需更即时的同步，可在用户管理开通后，引导用户刷新页面。

---

## 六、安全与上线清单

- [ ] **修改 `ADMIN_PASS`**（默认 `opc-admin-dev` 极不安全，必须改）。
- [ ] 配置 `DATA_DIR` + 挂载卷，避免数据随部署丢失。
- [ ] 如启用 AI 顾问，把 `HUNYUAN_API_KEY` 设为服务端环境变量（**不要**写进前端代码）。
- [ ] 收款码仅用你**个人**收款码；若后续流水变大，再申请微信/支付宝**商户号**，把 `/api/pay` 换成真实下单 + 异步通知即可（现有 `handlePay` 逻辑可直接复用）。

---

## 七、让「公网后台」真正可用的两种架构

你现在是 **CloudStudio 静态前端 + Railway/Render 后端** 的分离架构。两种接法都能让后台登录可用：

### 方案 A（最推荐，零配置）：整站单域名部署
把**整个项目**（server.js 同时托管前端 + 后台 + API）部署到 Railway 或 Render 的同一个服务上。
- 一个公网域名，例如 `https://opc.up.railway.app`
- 前台：`https://opc.up.railway.app/`
- **后台：`https://opc.up.railway.app/admin.html`** ← 同源，登录直接可用，无需任何额外配置
- 优点：不用配 api-base，后台天然可用；CloudStudio 静态链接可只作备用。

### 方案 B（你当前的选择）：CloudStudio 前端 + Railway/Render 后端
前端仍在 CloudStudio（`https://...app.codebuddy.work`），后端在 Railway/Render。
两者**不同源**，所以 CloudStudio 上的后台要能连上后端，必须告诉前端「后端在哪」：
1. 按下面「八」把后端部署到 Railway/Render，拿到后端域名，例如 `https://opc-backend.up.railway.app`。
2. 把该域名告诉我，我会在 `index.html` 和 `admin.html` 的 `<meta name="api-base">` 填入它，并重新部署 CloudStudio。
3. 此后 CloudStudio 上的 `/admin.html` 登录请求会打到 Railway 后端 → 输入密码即可进入。
   （注意：后端自己也有一份 `/admin.html`，用后端域名直接访问也行，且无需 api-base。）

> 无论 A 还是 B，**后台登录密码都是你在环境变量 `ADMIN_PASS` 里设的值**（默认 `opc-admin-dev`，上线务必改）。

---

## 八、后端一键部署（Railway / Render）操作步骤

> 本机需先安装 Node ≥ 18 与 Git。把项目推到你自己的 GitHub 仓库后，平台从 Git 拉取部署。

**1）Push 到你的 GitHub（在项目目录执行）：**
```bash
git init
git add .
git commit -m "OPC SaaS backend"
git remote add origin <你的GitHub仓库地址>
git push -u origin main
```

**2A）Railway（推荐，最简单）：**
- 打开 https://railway.app → 用 GitHub 登录 → **New Project → Deploy from GitHub repo** → 选本仓库。
- Railway 读 `railway.json`，自动用 `node server.js` 启动，自动注入 `PORT`。
- 在 Variables 设 `ADMIN_PASS`（必改）、`HUNYUAN_API_KEY`（选填）。
- 部署完得到 `*.up.railway.app` 域名。

**2B）Render（图形化 Blueprint）：**
- 打开 https://render.com → 用 GitHub 登录 → **New → Blueprint** → 选本仓库。
- Render 读 `render.yaml`，自动建好 Web Service + 1GB 持久盘（挂载 `/data`，`DATA_DIR=/data`）。
- 在 Environment 里把 `ADMIN_PASS` 改成你的强密码（其余环境变量已自动配好）。
- 部署完得到 `*.onrender.com` 域名。

**3）验证：**
- 浏览器打开 `https://<你的后端域名>/admin.html` → 用 `ADMIN_PASS` 登录 → 能进后台即成功。
- 若部署后想让 CloudStudio 前端也连上（方案 B），把后端域名发给我即可。

---

## 九、本地与服务器文件对照

| 文件 | 作用 |
|---|---|
| `server.js` | 零依赖 Node 服务：静态托管 + 所有 `/api/*` 接口 + 后台鉴权 |
| `assets/data.js` | 赛道/案例/套餐/模块等前端数据（后台可覆盖） |
| `assets/app.js` | 前端主逻辑（含支付页、运营配置展示） |
| `assets/admin.js` | 后台管理逻辑（运营/支付/用户/订单） |
| `admin.html` | 后台管理页面 |
| `index.html` | 主站页面 |
| `data/store.json` | 服务端运行时数据（用户/订单/配置），由 `DATA_DIR` 控制位置 |
