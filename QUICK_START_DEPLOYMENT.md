# 快速部署指南（5 分鐘）

## 前置條件
- [ ] 有 GitHub 帳戶
- [ ] 有 Vercel 帳戶（連接 GitHub）
- [ ] 有 Supabase 帳戶

## ⚡ 快速部署步驟

### 第 1 步：在 Supabase 中創建專案（2 分鐘）
```
1. 進入 supabase.com → 點擊「新專案」
2. 設置項目名稱、資料庫密碼、地區（推薦亞洲）
3. 等待初始化完成
4. 進入 Settings → API 並複製這三個值：
   - Project URL       → VITE_SUPABASE_URL
   - anon public key   → VITE_SUPABASE_ANON_KEY
   - service_role key  → SUPABASE_SERVICE_ROLE_KEY
```

### 第 2 步：運行資料庫遷移（1 分鐘）
```
在 Supabase 儀表板：
1. 進入 SQL Editor
2. 新建查詢
3. 複製粘貼 supabase/migrations/0001_init.sql 的全部內容
4. 點擊執行
```

### 第 3 步：推送代碼到 GitHub（1 分鐘）
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 第 4 步：部署到 Vercel（1 分鐘）
```
1. 進入 vercel.com → 點擊「New Project」
2. 選擇此 GitHub 倉庫
3. 設置三個環境變數（從第 1 步複製）
4. 點擊「Deploy」
5. 等待完成（約 1-2 分鐘）
```

### 第 5 步：驗證部署
```
1. 打開 Vercel 給出的 URL
2. 應該看到首頁和示例卡片
3. 點擊「朗讀」按鈕測試語音
✅ 完成！
```

---

## 常見錯誤排查

| 錯誤 | 解決方案 |
|------|--------|
| 「Table not found」 | 確保運行了數據庫遷移 (第 2 步) |
| 「Not authenticated」 | 檢查 API 密鑰是否正確複製 |
| 「Build failed」 | 檢查 Vercel 構建日誌，通常是環境變數遺漏 |
| 語音不工作 | 檢查瀏覽器是否支持 Web Speech API，iOS Safari 需要用戶手勢 |

---

## 部署檢查清單
- [ ] Supabase 專案已創建
- [ ] 數據庫遷移已執行
- [ ] 代碼已推送到 GitHub
- [ ] Vercel 環境變數已設置
- [ ] 應用已成功部署
- [ ] 首頁可正常訪問
- [ ] 語音功能可正常使用

---

## 下一步
部署完成後，進行以下驗證：
1. ✅ **測試應用功能** (見 #9 任務)
2. ✅ **添加新功能** (見 #10 任務)
3. ✅ **改進用户體驗** (見 #11 任務)

詳細部署說明見 `DEPLOYMENT_GUIDE.md`
