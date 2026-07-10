#!/usr/bin/env bash
# OPC SaaS 国内轻量服务器一键部署脚本
# 两种用法：
#   A) 非交互（推荐远程/自动化）：   ADMIN_PASS=xxx ADMIN_ALLOW_IPS=1.2.3.4 HUNYUAN_API_KEY=sk-xxx bash setup.sh
#   B) 交互占位：                   直接 bash setup.sh  → 生成 .opc.env 让你填 → 重跑
# 代码可通过 tar 流式上传到 $DIR（见部署说明），脚本检测到 server.js 存在则跳过 git clone。
set -e

DIR=/opt/opc
ENVFILE="$DIR/.opc.env"

echo "==> [0] 系统依赖 ..."
if command -v apt-get >/dev/null 2>&1; then
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -y >/dev/null 2>&1 || true
  apt-get install -y -q curl ca-certificates >/dev/null 2>&1 || true
elif command -v yum >/dev/null 2>&1; then
  yum install -y -q curl ca-certificates >/dev/null 2>&1 || true
fi

echo "==> [1] 安装 Node.js 20 ..."
if ! command -v node >/dev/null 2>&1 || [ "$(node -v 2>/dev/null | tr -d 'v' | cut -d. -f1)" -lt 18 ]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  if command -v apt-get >/dev/null 2>&1; then apt-get install -y -q nodejs; else yum install -y -q nodejs; fi
fi
echo "    Node: $(node -v 2>/dev/null)  npm: $(npm -v 2>/dev/null)"

echo "==> [2] 安装 pm2 ..."
command -v pm2 >/dev/null 2>&1 || npm install -g pm2 >/dev/null 2>&1
echo "    pm2: $(pm2 -v 2>/dev/null || echo '(待安装完成)')"

echo "==> [3] 代码就位 ..."
if [ ! -f "$DIR/server.js" ]; then
  REPO=https://github.com/yanxr0607-afk/musen.git
  MIRROR=https://ghproxy.com/https://github.com/yanxr0607-afk/musen.git
  if [ -d "$DIR/.git" ]; then git -C "$DIR" pull --ff-only 2>/dev/null || true; else git clone "$MIRROR" "$DIR" 2>/dev/null || git clone "$REPO" "$DIR"; fi
fi
cd "$DIR"

# ---- 环境配置 ----
if [ -z "$ADMIN_PASS" ] || [ -z "$ADMIN_ALLOW_IPS" ]; then
  # 交互占位模式
  if [ ! -f "$ENVFILE" ]; then
    cat > "$ENVFILE" <<'EOF'
# 把下面的占位值改成真实值，保存后重新运行：  bash /opt/opc/setup.sh
ADMIN_PASS=改成你自己的强密码
ADMIN_ALLOW_IPS=改成你VPN连上后的出口IP（如 1.2.3.4；支持CIDR 1.2.3.0/24）
HUNYUAN_API_KEY=sk-你的TokenHub密钥
EOF
    chmod 600 "$ENVFILE"
    echo "    已生成 $ENVFILE —— 请填入真实值后重跑脚本"
    exit 0
  fi
  # 已有文件但环境变量未提供 → 用文件里的
  source "$ENVFILE"
else
  # 非交互：直接用环境变量写入（覆盖）
  cat > "$ENVFILE" <<EOF
ADMIN_PASS=$ADMIN_PASS
ADMIN_ALLOW_IPS=$ADMIN_ALLOW_IPS
HUNYUAN_API_KEY=${HUNYUAN_API_KEY:-}
EOF
  chmod 600 "$ENVFILE"
  source "$ENVFILE"
fi

# 必填校验（避免带着占位值把后台裸奔公网）
if [ -z "$ADMIN_PASS" ] || [ -z "$ADMIN_ALLOW_IPS" ]; then
  echo "✗ ADMIN_PASS / ADMIN_ALLOW_IPS 不能为空，请检查配置后重跑"
  exit 1
fi

echo "==> [4] 启动服务 (pm2) ..."
pm2 delete opc 2>/dev/null || true
ADMIN_PASS="$ADMIN_PASS" ADMIN_ALLOW_IPS="$ADMIN_ALLOW_IPS" HUNYUAN_API_KEY="$HUNYUAN_API_KEY" \
  pm2 start server.js --name opc
pm2 save >/dev/null 2>&1 || true

echo ""
echo "✓ 部署完成！"
echo "   前台（用户免 VPN）:  http://<本机公网IP>:8787/"
echo "   后台（仅授权 IP）:    http://<本机公网IP>:8787/admin.html"
echo "   查看状态:  pm2 status | pm2 logs opc"
echo "   改配置后:  pm2 restart opc"
