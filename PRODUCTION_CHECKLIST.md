# 🚀 生產環境部署檢查清單

**狀態**: 準備上線
**日期**: 2026-07-12
**版本**: v1.0.0

---

## 📋 上線前檢查清單

### 第 1 階段：代碼準備 (1 小時)

#### ✅ 代碼質量
- [x] TypeScript 編譯成功
- [x] 無 console 錯誤
- [x] 無 TypeScript 警告
- [x] ESLint 檢查通過
- [x] 所有組件都有道具類型定義

#### ✅ Git 準備
- [x] 所有更改已提交
- [x] 提交消息清晰有意義
- [x] `.env.local` 已加入 `.gitignore`
- [x] 沒有敏感信息在代碼中
- [x] 分支已推送到 GitHub

**檢查命令**:
```bash
git status                 # 應該是 clean
git log --oneline -10      # 顯示最後 10 個提交
npm run build              # 應該成功
```

#### ✅ 環境配置
- [x] `.env.local.example` 已更新
- [x] `.env.local` 已列入 `.gitignore`
- [ ] 所有必需環境變數已文檔化
- [ ] 沒有硬編碼的 API 端點

### 第 2 階段：Supabase 設置 (30 分鐘)

#### ✅ 創建 Supabase 專案
```bash
1. 訪問 supabase.com
2. 點擊「新專案」
3. 設置：
   - 組織：選擇或創建
   - 名稱：vocab-app-prod
   - 密碼：強且唯一
   - 區域：最接近用戶的區域
4. 等待初始化完成 (2-3 分鐘)
```

#### ✅ 獲取 API 密鑰
```bash
在 Supabase 儀表板：
Settings → API → 複製這三個值
  
□ NEXT_PUBLIC_SUPABASE_URL
□ NEXT_PUBLIC_SUPABASE_ANON_KEY
□ SUPABASE_SERVICE_ROLE_KEY
```

#### ✅ 運行數據庫遷移
```bash
# 方法 1: Supabase CLI (推薦)
supabase login
supabase link --project-ref your-project-id
supabase db push

# 方法 2: SQL Editor (手動)
1. Supabase Dashboard → SQL Editor
2. 新建查詢
3. 複製粘貼 supabase/migrations/0001_init.sql
4. 複製粘貼 supabase/migrations/0002_shared_decks.sql (可選)
5. 執行
```

#### ✅ 驗證數據庫
```bash
在 Supabase Table Editor 中檢查：
✓ decks 表存在
✓ words 表存在
✓ word_distractors 表存在
✓ word_examples 表存在
✓ word_forms 表存在
✓ user_word_progress 表存在
✓ deck_collaborators 表存在 (可選)
✓ import_batches 表存在
✓ import_batch_errors 表存在

所有表都應有綠色鎖標圖標 (RLS 已啟用)
```

#### ✅ 測試 Supabase 連接
```bash
1. 複製 Supabase URL 和密鑰到 .env.local
2. 運行 npm run dev
3. 打開 http://localhost:3000
4. 檢查瀏覽器開發者工具 Network 標籤
5. 應該看到對 supabase.co 的成功請求 (200 狀態)
```

### 第 3 階段：本地驗證 (30 分鐘)

#### ✅ 本地功能測試
```bash
npm run dev

# 測試核心功能
□ 首頁加載
□ 卡片翻轉動畫
□ 語音朗讀按鈕
□ 測驗會話流程
□ 進度追蹤
□ 沒有控制台錯誤
```

#### ✅ 本地性能檢查
```bash
# 打開 Chrome DevTools → Lighthouse
□ Performance: > 90
□ Accessibility: > 90
□ Best Practices: > 90
□ SEO: > 90
□ PWA: > 90 (可選)
```

#### ✅ 本地無障礙檢查
```bash
□ 鍵盤導航 (Tab, Enter, Escape)
□ 焦點指示器清晰
□ 顏色對比足夠 (4.5:1)
□ ARIA 標籤存在
```

### 第 4 階段：Vercel 部署 (30 分鐘)

#### ✅ Vercel 項目創建
```bash
1. 訪問 vercel.com
2. 點擊「新項目」
3. 連接 GitHub 倉庫
4. 選擇此倉庫
5. 點擊「導入」
```

#### ✅ 環境變數配置
```bash
在 Vercel 項目設置中添加：

NEXT_PUBLIC_SUPABASE_URL
  值: https://your-project.supabase.co
  
NEXT_PUBLIC_SUPABASE_ANON_KEY
  值: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  
SUPABASE_SERVICE_ROLE_KEY
  值: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

重要: 不要將這些值提交到 Git
```

#### ✅ 部署和驗證
```bash
1. Vercel 將自動構建和部署
2. 等待部署完成 (通常 2-5 分鐘)
3. 複製生產 URL
4. 訪問應用
5. 驗證功能正常
```

### 第 5 階段：生產驗證 (1 小時)

#### ✅ 生產功能測試
| 功能 | 狀態 | 備註 |
|------|------|------|
| 首頁加載 | □ | 應 < 2s |
| 語音播放 | □ | 點擊按鈕應聽到聲音 |
| 卡片翻轉 | □ | 應流暢且無延遲 |
| 測驗功能 | □ | 選項應隨機排列 |
| 進度保存 | □ | 刷新後應保持進度 |
| 錯誤處理 | □ | 應顯示友好的錯誤信息 |
| 移動響應 | □ | 在手機上應正常工作 |

#### ✅ 生產性能檢查
```bash
使用 Google PageSpeed Insights:
1. 訪問 pagespeed.web.dev
2. 輸入生產 URL
3. 檢查指標：
   □ LCP (Largest Contentful Paint): < 2.5s
   □ FID (First Input Delay): < 100ms
   □ CLS (Cumulative Layout Shift): < 0.1
```

#### ✅ 安全檢查
```bash
□ HTTPS 已啟用 (應該看到綠色鎖)
□ 沒有混合內容警告 (Security 標籤)
□ Supabase 連接已加密
□ 沒有公開的 API 密鑰
□ 環境變數安全配置在 Vercel
```

#### ✅ 瀏覽器相容性
| 瀏覽器 | 桌面 | 移動 | 狀態 |
|--------|------|------|------|
| Chrome | □ | □ | - |
| Firefox | □ | □ | - |
| Safari | □ | □ | iOS 需手勢 |
| Edge | □ | □ | - |

### 第 6 階段：用戶驗收測試 (2 小時)

#### ✅ 邀請測試者
```bash
1. 複製生產 URL
2. 邀請 5-10 個測試者
3. 請他們測試 30 分鐘
4. 收集反饋
5. 記錄任何 bug

測試場景:
□ 創建帳戶
□ 創建卡組
□ 導入 Excel 檔案
□ 進行測驗
□ 邀請協作者
□ 在不同設備上測試
```

#### ✅ 反饋收集
```bash
問題清單:
□ 應用是否易用?
□ 有沒有崩潰或錯誤?
□ 語音功能正常嗎?
□ 移動體驗如何?
□ 有哪些改進建議?

記錄所有反饋用於後續迭代
```

---

## 🎯 部署後監控

### 第 1 天：密切監控
```bash
每小時檢查：
□ Vercel 部署日誌 (無錯誤)
□ Supabase 日誌 (無失敗)
□ 控制台錯誤 (應為空)
□ 用戶反饋 (及時回應)
```

### 第 1 周：定期檢查
```bash
每天檢查：
□ 應用可用性
□ 數據庫連接
□ API 響應時間
□ 用戶報告的問題
□ 性能指標
```

### 持續監控
```bash
設置警報:
□ 部署失敗
□ 高錯誤率
□ 數據庫性能下降
□ API 響應時間超過 1s
```

### 使用工具
```
- Vercel Analytics (內置)
- Supabase 監控儀表板
- Google Analytics (可選)
- Sentry 錯誤追蹤 (可選)
```

---

## 🆘 故障排除

### 部署失敗

**症狀**: Vercel 部署紅色標記

**解決方案**:
1. 檢查 Vercel 構建日誌
2. 尋找編譯錯誤
3. 確認環境變數已設置
4. 運行 `npm run build` 本地驗證

### 數據庫連接失敗

**症狀**: "連接被拒絕" 或 "無法連接"

**解決方案**:
1. 驗證 Supabase URL 正確
2. 檢查 API 密鑰未過期
3. 確認 Supabase 專案在線
4. 檢查防火牆規則

### 語音不工作

**症狀**: 點擊朗讀按鈕沒反應

**解決方案**:
- 桌面: 檢查瀏覽器音量
- iOS: 使用用戶手勢 (點擊按鈕)
- 其他: 檢查瀏覽器是否支持 Web Speech API

### 性能緩慢

**症狀**: 應用加載慢或卡頓

**解決方案**:
1. 檢查網絡速度 (DevTools)
2. 檢查 Supabase 查詢時間
3. 啟用 Vercel 邊界緩存
4. 優化圖像大小

---

## 📊 上線指標

### 必須達到
- ✅ 首頁加載 < 2 秒
- ✅ Lighthouse 性能 > 90
- ✅ 沒有 JavaScript 錯誤
- ✅ 移動設備可用
- ✅ HTTPS 已啟用

### 理想達到
- ✅ Lighthouse 所有指標 > 90
- ✅ 用戶測試反饋積極
- ✅ 部署平穩無中斷
- ✅ 響應時間 < 300ms
- ✅ 無已知 bug

---

## ✅ 最終檢查清單

```
部署前一小時:
□ 最後代碼推送到 GitHub
□ 環境變數再次驗證
□ 數據庫遷移成功
□ 本地構建成功
□ 生產 URL 已準備

部署時:
□ Vercel 部署開始
□ 監視構建過程
□ 測試生產 URL
□ 驗證所有功能

部署後:
□ 監視錯誤日誌
□ 監視性能指標
□ 響應用戶問題
□ 記錄任何問題

24 小時後:
□ 檢查穩定性
□ 收集用戶反饋
□ 評估成功度
□ 計劃改進
```

---

## 🎉 成功標誌

應用已成功上線，當你看到：

- ✅ 生產 URL 在瀏覽器中打開應用
- ✅ 可以創建帳戶並登錄
- ✅ 可以創建卡組和測驗
- ✅ 可以導入 Excel 文件
- ✅ 沒有 JavaScript 錯誤
- ✅ 移動設備正常工作
- ✅ 用戶反饋積極

---

## 📈 上線後改進

**第 1 個月**:
- [ ] 收集用戶反饋
- [ ] 修復報告的 bug
- [ ] 監控性能
- [ ] 優化常見問題

**第 2-3 個月**:
- [ ] 實現統計儀表板
- [ ] 添加共享卡組功能
- [ ] 改進 UI/UX
- [ ] 實現離線支持

**3 個月後**:
- [ ] 多語言支持
- [ ] AI 輔助功能
- [ ] 社交分享
- [ ] 行動應用

---

**準備好上線了嗎？🚀**

按照上述檢查清單逐步進行。如有任何問題，參考 [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) 獲取詳細幫助。

**預計總時間**: 3-4 小時 (從現在到應用上線)
