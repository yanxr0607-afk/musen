#!/usr/bin/env bash
# OPC SaaS 国内轻量服务器一键部署脚本
# 用法（在干净的 Ubuntu/Debian 服务器上）：  sudo bash setup.sh
# 脚本会：装 Node 20 + pm2 → 拉代码到 /opt/opc → 生成 .opc.env 让你填 → pm2 启动
set -e

REPO=https://github.com/yanxr0607-afk/musen.git
MIRROR=https://ghproxy.com/https://github.com/yanxr0607-afk/musen.git
DIR=/opt/opc
ENVFILE="$DIR/.opc.env"

echo "==> [1/4] 安装 Node.js 20 ..."
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | tr -d 'v' | cut -d. -f1)" -lt 18 ]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
echo "    Node: $(node -v)  npm: $(npm -v)"

echo "==> [2/4] 安装 pm2 进程守护 ..."
npm install -g pm2

echo "==> [3/4] 拉取代码 ..."
if [ -d "$DIR/.git" ]; then
  git -C "$DIR" pull --ff-only
else
  git clone "$MIRROR" "$DIR" 2>/dev/null || git clone "$REPO" "$DIR"
fi
cd "$DIR"

# 首次运行：生成环境配置模板，等用户填写后重跑
if [ ! -f "$ENVFILE" ]; then
  cat > "$ENVFILE" <<'EOF'
# ↓↓↓ 把下面的占位值改成真实值，保存后重新运行：  sudo bash /opt/opc/setup.sh
ADMIN_PASS=改成你自己的强密码
ADMIN_ALLOW_IPS=改成你VPN连上后的出口IP（如 1.2.3.4；支持CIDR，如 1.2.3.0/24）
HUNYUAN_API_KEY=sk-你的TokenHub密钥
# 下面两项可不动（server.js 默认值已是 TokenHub hy3）
# HUNYUAN_MODEL=hy3
# HUNYUAN_URL=https://tokenhub-intl.tencentmaas.com/v1/chat/completions
EOF
  chmod 600 "$ENVFILE"
  echo "    已生成 $ENVFILE"
  echo "    ✎ 请先编辑填入 ADMIN_PASS / ADMIN_ALLOW_IPS / HUNYUAN_API_KEY"
  echo "    填好后重新运行：  sudo bash /opt/opc/setup.sh"
  exit 0
fi

# 校验必填项，避免带着占位值把后台裸奔在公网
source "$ENVFILE"
if [ "$ADMIN_PASS" = "改成你自己的强密码" ] \
   || [ "$ADMIN_ALLOW_IPS" = "改成你VPN连上后的出口IP（如 1.2.3.4；支持CIDR，如 1.2.3.0/24）" ] \
   || [ "$HUNYUAN_API_KEY" = "sk-你的TokenHub密钥" ]; then
  echo "✗ 请先编辑 $ENVFILE 填入真实值后再运行"
  exit 1
fi

echo "==> [4/4] 启动服务 (pm2) ..."
pm2 delete opc 2>/dev/null || true
ADMIN_PASS="$ADMIN_PASS" ADMIN_ALLOW_IPS="$ADMIN_ALLOW_IPS" HUNYUAN_API_KEY="$HUNYUAN_API_KEY" \
  pm2 start server.js --name opc
pm2 save

echo ""
echo "✓ 部署完成！"
echo "   前台（用户免 VPN）:  http://<本机公网IP>:8787/"
echo "   后台（仅 VPN 可达）: http://<本机公网IP>:8787/admin.html"
echo "   查看状态:  pm2 status | pm2 logs opc"
echo "   改配置后重启:  pm2 restart opc"
