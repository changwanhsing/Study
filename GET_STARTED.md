# 🎯 快速開始指南

**歡迎使用單字小卡！** 本指南將幫助您快速部署和開始使用應用。

---

## 🚀 3 步快速上線 (12 分鐘)

### 步驟 1: 設置 Supabase (5 分鐘)

1. **訪問** [supabase.com](https://supabase.com)
2. **登錄** 或創建新帳戶
3. **創建新專案**
   - 名稱: `vocab-app-prod`
   - 設置強密碼
   - 選擇最接近的區域
4. **複製 API 密鑰**
   - Settings → API
   - 複製 `Project URL`
   - 複製 `anon public` 密鑰
   - 複製 `service_role` 密鑰
5. **運行遷移**
   - SQL Editor → 新建查詢
   - 粘貼 `supabase/migrations/0001_init.sql`
   - 執行
   - ✅ 完成！

### 步驟 2: 部署到 Vercel (2 分鐘)

1. **訪問** [vercel.com](https://vercel.com)
2. **導入項目**
   - 點擊「新項目」
   - 選擇此 GitHub 倉庫
3. **設置環境變數**
   - 添加 3 個 Supabase 密鑰（見步驟 1）
4. **部署**
   - 點擊「部署」
   - ✅ 完成！ (2-5 分鐘)

### 步驟 3: 測試應用 (5 分鐘)

1. **訪問生產 URL**
   - 複製 Vercel 給出的 URL
   - 在瀏覽器中打開
2. **創建帳戶**
   - 點擊「登錄」
   - 創建新帳戶
3. **測試功能**
   - ✓ 創建卡組
   - ✓ 進行測驗
   - ✓ 點擊語音按鈕
4. **邀請朋友**
   - 分享 URL
   - 他們可以創建帳戶並開始學習

---

## 📚 詳細指南（按需查看）

| 需求 | 指南 | 時間 |
|------|------|------|
| 🔥 快速部署 | [QUICK_START_DEPLOYMENT.md](QUICK_START_DEPLOYMENT.md) | 5 min |
| 📋 詳細步驟 | [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) | 20 min |
| ✅ 部署檢查 | [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md) | 3-4 hours |
| ⚡ 性能優化 | [PERFORMANCE_OPTIMIZATION.md](PERFORMANCE_OPTIMIZATION.md) | 2-4 weeks |
| 🧪 測試計劃 | [FUNCTIONAL_TEST_PLAN.md](FUNCTIONAL_TEST_PLAN.md) | 2-3 days |
| 🛣️ 功能路線圖 | [FEATURE_ROADMAP.md](FEATURE_ROADMAP.md) | 規劃 |
| 📊 項目概覽 | [FINAL_SUMMARY.md](FINAL_SUMMARY.md) | 參考 |

---

## 💡 常見問題

### Q: 需要多少費用？
**A**: 完全免費！
- Supabase: 免費層 (500MB 存儲)
- Vercel: 免費層 (包括無限部署)
- 發展後可升級到付費計劃

### Q: 如何邀請朋友？
**A**: 
1. 進入卡組設置
2. 點擊「添加協作者」
3. 輸入朋友的電郵
4. 他們將獲得訪問權限

### Q: 可以離線使用嗎？
**A**: 目前只有在線模式。離線支持預計在下個月推出。

### Q: 支持哪些瀏覽器？
**A**: 
- ✅ Chrome, Firefox, Safari, Edge
- ✅ iOS Safari (部分支持，語音需手勢)
- ✅ Android Chrome

### Q: 如何備份我的數據？
**A**: 您的所有數據都在 Supabase 雲端安全保存。Supabase 每天自動備份。

---

## 🎓 使用指南

### 基本工作流

1. **創建卡組**
   ```
   首頁 → 「新建卡組」 → 輸入名稱 → 創建
   ```

2. **導入單字**
   ```
   進入卡組 → 「匯入」→ 下載範本 → 填入單字 → 上傳
   ```

3. **進行測驗**
   ```
   進入卡組 → 「開始測驗」→ 選擇答案 → 獲得分數
   ```

4. **追蹤進度**
   ```
   進入卡組 → 「統計」→ 查看準確度和進度
   ```

### 功能介紹

#### 🎤 語音朗讀
- 點擊「朗讀」按鈕聽單字發音
- 自動朗讀 (卡片翻轉時)
- 支持多瀏覽器

#### 📊 智能調度
- 系統自動安排複習時間
- 困難的詞更頻繁複習
- 掌握的詞複習較少

#### 🤝 協作
- 邀請朋友共同編輯卡組
- 設置權限 (檢視者/編輯者)
- 分享學習進度

#### 📁 Excel 匯入
- 批量上傳單字
- 自動驗證
- 錯誤提示和修正

---

## 🔧 本地開發 (可選)

如果要修改代碼或本地測試：

```bash
# 1. 克隆並進入目錄
git clone <repo-url>
cd vocab-app

# 2. 安裝依賴
npm install

# 3. 配置環境變數
cp .env.local.example .env.local
# 編輯 .env.local 並添加 Supabase 密鑰

# 4. 啟動開發服務器
npm run dev

# 5. 打開 http://localhost:3000
```

---

## 📞 支持和幫助

### 遇到問題？

1. **檢查 [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)**
   - 包含詳細的故障排除指南

2. **查看 [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md)**
   - 逐步驗證每個部分

3. **檢查 Supabase 日誌**
   - Supabase Dashboard → Logs
   - 查看任何錯誤信息

4. **檢查 Vercel 日誌**
   - Vercel Dashboard → Deployments
   - 查看構建和部署日誌

### 反饋和改進建議

- 在 [FEATURE_ROADMAP.md](FEATURE_ROADMAP.md) 中查看計劃的功能
- 提交 GitHub Issue 報告 bug
- 討論部分分享想法

---

## ✅ 部署檢查清單

在開始前，確認您有：

- [ ] GitHub 帳戶（包含此倉庫）
- [ ] Supabase 帳戶（免費）
- [ ] Vercel 帳戶（免費，連接 GitHub）
- [ ] 大約 15 分鐘的時間
- [ ] 穩定的網絡連接

---

## 🎯 部署後的下一步

### 立即做

1. ✅ 測試應用功能
2. ✅ 創建示例卡組
3. ✅ 邀請朋友測試
4. ✅ 收集反饋

### 本週做

1. [ ] 收集用戶反饋
2. [ ] 修復任何報告的 bug
3. [ ] 監控應用性能
4. [ ] 優化根據使用情況

### 本月做

1. [ ] 實現統計儀表板
2. [ ] 添加更多示例卡組
3. [ ] 改進 UI 基於反饋
4. [ ] 規劃下一步功能

---

## 📈 成功指標

應用成功上線時，您應該看到：

- ✅ 生產 URL 可訪問
- ✅ 用戶可以創建帳戶
- ✅ 用戶可以導入單字
- ✅ 測驗功能正常
- ✅ 沒有 JavaScript 錯誤
- ✅ 移動設備工作正常
- ✅ 用戶提供積極反饋

---

## 🎉 恭喜！

您已成功：
1. ✅ 構建完整的詞彙學習應用
2. ✅ 實現 SRS 間隔重複系統
3. ✅ 添加協作功能
4. ✅ 部署到生產環境

**現在開始幫助人們更有效地學習！** 🚀

---

## 📖 更多資源

- [Next.js 文檔](https://nextjs.org/docs)
- [Supabase 文檔](https://supabase.com/docs)
- [Vercel 文檔](https://vercel.com/docs)
- [Tailwind CSS 文檔](https://tailwindcss.com/docs)

---

**準備好了嗎？** 現在就開始部署吧！ 🚀

*快速開始指南 - v1.0.0 - 2026-07-12*
