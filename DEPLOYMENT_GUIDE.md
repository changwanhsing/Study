# 部署指南

## 步驟 1: 設置 Supabase 專案

### 1.1 創建 Supabase 帳戶和專案
1. 訪問 [supabase.com](https://supabase.com)
2. 使用 GitHub 或郵箱登錄
3. 點擊「新專案」
4. 設置：
   - **組織**: 選擇或創建新組織
   - **專案名稱**: `vocab-app` (或自定義)
   - **資料庫密碼**: 設置強密碼（保管好）
   - **地區**: 選擇最接近用戶的區域 (亞洲用戶推薦 Singapore)
5. 等待專案初始化完成（約 2-3 分鐘）

### 1.2 獲取 API 金鑰
1. 在 Supabase 專案首頁，點擊「Settings」(左下角齒輪圖標)
2. 進入「API」標籤
3. 複製以下三個值到 `.env.local`:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` (在 "Project API keys" 下) → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` (在 "Project API keys" 下) → `SUPABASE_SERVICE_ROLE_KEY`

## 步驟 2: 配置環境變數

### 2.1 本地開發 (.env.local)
```bash
# 在專案根目錄創建 .env.local 文件
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2.2 生產環境 (Vercel)
1. 訪問 [vercel.com](https://vercel.com)
2. 創建帳戶（如果還沒有）
3. 導入此 GitHub 倉庫
4. 在「環境變數」設置中添加上述三個變數
5. **重要**: 不要把這些値提交到 Git，Vercel 會從環境變數中讀取

## 步驟 3: 運行數據庫遷移

### 3.1 使用 Supabase CLI 方法（推薦）
```bash
# 1. 安裝 Supabase CLI
npm install -g supabase

# 2. 登錄 Supabase
supabase login

# 3. 進入專案目錄
cd vocab-app

# 4. 創建連接到遠程資料庫
supabase link --project-ref your-project-id

# 5. 執行遷移
supabase db push
```

### 3.2 手動方法（備選）
1. 在 Supabase 儀表板，進入「SQL Editor」
2. 點擊「新 Query」
3. 複製 `supabase/migrations/0001_init.sql` 中的全部內容
4. 粘貼到 SQL 編輯器
5. 點擊「執行」

### 3.3 驗證遷移成功
在 Supabase 儀表板的「Table Editor」中：
- [ ] 看到 8 個表: decks, words, word_distractors, word_examples, word_forms, user_word_progress, import_batches, import_batch_errors
- [ ] 每個表都有 RLS 啟用 (綠色鎖標圖標)
- [ ] 索引已創建

## 步驟 4: 本地測試

### 4.1 安裝依賴和啟動
```bash
# 安裝依賴
npm install

# 啟動開發服務器
npm run dev

# 訪問 http://localhost:3000
```

### 4.2 測試功能
1. **首頁**: 應該看到示例單字卡片
2. **語音**: 點擊「朗讀」按鈕，應該聽到單字發音
3. **RLS 隔離**: 使用 Supabase 儀表板驗證 (見下文)

### 4.3 驗證 RLS 隔離（可選但推薦）
```bash
# 在 Supabase SQL Editor 中執行以下查詢

-- 假設你的 auth.uid() 是 user-a-uuid
-- 1. 創建測試卡組
INSERT INTO decks (owner_id, name, description)
VALUES (auth.uid(), 'Test Deck', 'Testing isolation');

-- 2. 查詢卡組（應該看到）
SELECT * FROM decks;

-- 3. 切換到其他用戶上下文（在 Supabase 儀表板中 impersonate），然後查詢
-- 應該看到空結果（RLS 隔離工作）
```

## 步驟 5: 部署到 Vercel

### 5.1 連接 GitHub 倉庫
1. 推送代碼到 GitHub
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. 訪問 [vercel.com/import](https://vercel.com/import)
3. 選擇「GitHub」
4. 授權並選擇此倉庫
5. 點擊「Import」

### 5.2 配置部署設置
1. **框架預設**: 選擇「Next.js」
2. **環境變數**: 添加 3 個 Supabase 變數（見步驟 2.2）
3. **構建命令**: 保持預設 (`npm run build`)
4. **輸出目錄**: 保持預設 (`.next`)
5. 點擊「Deploy」

### 5.3 等待部署完成
- Vercel 會自動構建和部署
- 部署完成後會顯示「Visit」鏈接
- 點擊訪問生產環境版本

## 步驟 6: 部署後驗證

### 6.1 檢查應用功能
- [ ] 首頁正常加載
- [ ] 可以查看示例卡組
- [ ] 語音功能工作
- [ ] 沒有 404 或 500 錯誤

### 6.2 檢查 Supabase 連接
- 打開瀏覽器開發者工具
- 進入「Network」標籤
- 查找 Supabase API 請求 (supabase.co)
- 應該看到成功的請求 (200 狀態碼)

### 6.3 檢查構建日誌
在 Vercel 儀表板中：
1. 點擊最新部署
2. 進入「Build & Deployment」日誌
3. 驗證沒有錯誤

## 常見問題

### 問題: "Not authenticated" 或 401 錯誤
**解決**: 檢查 Supabase API 金鑰是否正確複製到 `.env.local` 或 Vercel 環境變數中

### 問題: RLS 拒絕訪問
**解決**: 確保已執行數據庫遷移，RLS 策略已創建

### 問題: 語音不工作
**解決**: 
- 檢查瀏覽器是否支持 Web Speech API
- 在 iOS Safari 中，可能需要用戶手勢觸發

### 問題: "Table not found" 錯誤
**解決**: 確保運行了數據庫遷移 (步驟 3)

### 問題: 部署後自動重定向到登錄
**解決**: 這是正常的。創建 Supabase 帳戶並登錄即可使用應用

## 域名設置（可選）

### 使用自定義域名
1. 在 Vercel 儀表板，進入「Settings」→「Domains」
2. 添加自定義域名
3. 按照說明配置 DNS 記錄
4. 等待 DNS 傳播（通常 24 小時內）

## 後續步驟

部署完成後：
1. ✅ 創建測試帳戶並登錄
2. ✅ 測試所有功能（卡片翻轉、語音、匯入等）
3. ✅ 邀請朋友測試
4. ✅ 收集反饋並改進

## 部署檢查清單

- [ ] Supabase 專案已創建
- [ ] API 金鑰已複製到 `.env.local`
- [ ] 數據庫遷移已執行
- [ ] 本地開發伺服器正常運行
- [ ] GitHub 倉庫已推送最新代碼
- [ ] Vercel 專案已創建
- [ ] 環境變數已在 Vercel 中設置
- [ ] 部署完成且無錯誤
- [ ] 應用功能已驗證
- [ ] RLS 隔離已驗證

---

**需要幫助？** 查看 Supabase 文檔：https://supabase.com/docs
