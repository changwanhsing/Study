#!/bin/bash

# Pre-Deployment Verification Script
# 檢查部署前的所有必要條件

set -e

echo "🔍 部署前檢查..."
echo ""

# 檢查 Node.js
echo "✓ 檢查 Node.js..."
if ! command -v node &> /dev/null; then
  echo "❌ Node.js 未安裝"
  exit 1
fi
NODE_VERSION=$(node -v)
echo "   Node.js 版本: $NODE_VERSION"

# 檢查 npm
echo "✓ 檢查 npm..."
if ! command -v npm &> /dev/null; then
  echo "❌ npm 未安裝"
  exit 1
fi
NPM_VERSION=$(npm -v)
echo "   npm 版本: $NPM_VERSION"

# 檢查 .env.local
echo "✓ 檢查環境變數..."
if [ ! -f .env.local ]; then
  echo "❌ .env.local 不存在"
  echo "   請複製 .env.local.example 並填入 Supabase 認證信息"
  exit 1
fi

# 檢查 Supabase 環境變數
if ! grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local; then
  echo "❌ NEXT_PUBLIC_SUPABASE_URL 未設置"
  exit 1
fi
echo "   ✓ NEXT_PUBLIC_SUPABASE_URL 已設置"

if ! grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local; then
  echo "❌ NEXT_PUBLIC_SUPABASE_ANON_KEY 未設置"
  exit 1
fi
echo "   ✓ NEXT_PUBLIC_SUPABASE_ANON_KEY 已設置"

if ! grep -q "SUPABASE_SERVICE_ROLE_KEY" .env.local; then
  echo "❌ SUPABASE_SERVICE_ROLE_KEY 未設置"
  exit 1
fi
echo "   ✓ SUPABASE_SERVICE_ROLE_KEY 已設置"

# 檢查依賴
echo "✓ 檢查依賴..."
if [ ! -d node_modules ]; then
  echo "   ⚠ node_modules 不存在，正在安裝..."
  npm install
fi
echo "   ✓ 依賴已安裝"

# 構建檢查
echo "✓ 檢查 TypeScript 編譯..."
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "   ✓ 構建成功"
else
  echo "   ❌ 構建失敗，請檢查 TypeScript 錯誤"
  exit 1
fi

# 檢查 Git
echo "✓ 檢查 Git..."
if ! command -v git &> /dev/null; then
  echo "❌ Git 未安裝"
  exit 1
fi

if [ ! -d .git ]; then
  echo "❌ 不是 Git 倉庫"
  exit 1
fi
echo "   ✓ Git 倉庫正常"

# 檢查未提交的變更
UNCOMMITTED=$(git status --porcelain)
if [ ! -z "$UNCOMMITTED" ]; then
  echo "⚠ 警告: 有未提交的變更:"
  echo "$UNCOMMITTED"
  echo ""
  read -p "是否繼續? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# 檢查數據庫遷移檔案
echo "✓ 檢查數據庫遷移..."
if [ ! -f "supabase/migrations/0001_init.sql" ]; then
  echo "❌ 數據庫遷移檔案不存在"
  exit 1
fi
echo "   ✓ 遷移檔案存在"

echo ""
echo "✅ 所有檢查通過！"
echo ""
echo "下一步："
echo "1. 確保 Supabase 數據庫遷移已執行"
echo "2. 運行 'npm run dev' 進行本地測試"
echo "3. 推送代碼到 GitHub"
echo "4. 在 Vercel 中部署"
