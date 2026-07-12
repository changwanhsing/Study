# 功能路線圖

## 概述
本文檔概述了應用的未來功能開發計劃，從簡單到複雜排序。

---

## 第 1 層：高優先級功能（1-2 周）

### 1.1 共享卡組功能
**時間估計**: 4 小時
**複雜度**: 中等

#### 需求
- 允許卡組擁有者邀請其他用戶
- 被邀請用戶可以查看和使用卡組
- 邀請可以撤銷

#### 技術方案

**1. 新增表結構**
```sql
-- 卡組合作者表
CREATE TABLE deck_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id uuid REFERENCES decks(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role varchar(20) -- 'viewer' 或 'editor'
  invited_at timestamptz DEFAULT now(),
  UNIQUE(deck_id, user_id)
);

-- 邀請表
CREATE TABLE deck_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id uuid REFERENCES decks(id) ON DELETE CASCADE,
  invited_email text NOT NULL,
  invited_by uuid REFERENCES auth.users(id),
  status varchar(20) DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT now() + interval '7 days'
);
```

**2. RLS 策略更新**
```sql
-- Collaborators: 可以通過卡組所有權或合作者身份訪問
CREATE POLICY "deck_collaborators_access" ON deck_collaborators
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM decks d WHERE d.id = deck_id AND d.owner_id = auth.uid())
    OR user_id = auth.uid()
  );

-- Words: 更新策略允許合作者訪問
CREATE POLICY "words_collaborator_access" ON words
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM decks d WHERE d.id = deck_id AND d.owner_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM decks d 
      JOIN deck_collaborators dc ON d.id = dc.deck_id
      WHERE d.id = words.deck_id AND dc.user_id = auth.uid()
    )
  );
```

**3. UI 組件**
- `components/DeckSettings.tsx` - 卡組設置面板
- `components/CollaboratorsList.tsx` - 合作者列表
- `components/InviteDialog.tsx` - 邀請對話框

**4. API 路由**
- `POST /api/decks/[deckId]/collaborators` - 添加合作者
- `DELETE /api/decks/[deckId]/collaborators/[userId]` - 移除合作者
- `POST /api/invitations/send` - 發送邀請
- `POST /api/invitations/[id]/accept` - 接受邀請

#### 開發檢查清單
- [ ] 數據庫遷移（新表和 RLS 策略）
- [ ] 後端 API 路由
- [ ] 前端 UI 組件
- [ ] 測試合作者隔離
- [ ] 測試邀請流程

---

### 1.2 學習統計儀表板
**時間估計**: 3 小時
**複雜度**: 中等

#### 需求
- 顯示學習進度（今天/周/月）
- 顯示準確度統計
- 顯示複習日程
- 顯示最需要複習的單字

#### 技術方案

**1. 新 API 路由**
```typescript
// /api/user/statistics
interface UserStats {
  totalWordsLearned: number
  todayReviewed: number
  thisWeekReviewed: number
  accuracy: number // 0-100%
  nextReviewAt: string
  topDifficultWords: Word[]
  studyStreak: number
}
```

**2. 頁面結構**
```
/dashboard
├── 概覽卡片（總詞數、今日複習、準確度）
├── 圖表
│  ├── 每日複習數量（Bar Chart）
│  ├── 準確度趨勢（Line Chart）
│  └── 單字難度分佈（Pie Chart）
└── 最需要複習的單字列表
```

**3. UI 組件**
- `components/StatsOverview.tsx` - 統計概覽
- `components/ReviewChart.tsx` - 複習圖表
- `components/AccuracyChart.tsx` - 準確度圖表
- `components/DifficultWordsList.tsx` - 困難單字列表

**4. 圖表庫**
使用 Recharts 或 Chart.js
```bash
npm install recharts
```

#### 開發檢查清單
- [ ] API 路由實現
- [ ] 統計計算邏輯
- [ ] UI 組件構建
- [ ] 圖表集成
- [ ] 測試統計準確性

---

### 1.3 改進的單字詳細頁面
**時間估計**: 2 小時
**複雜度**: 低

#### 需求
- 顯示單字的完整詳細信息
- 顯示學習歷史
- 允許編輯單字（擁有者）
- 允許添加自己的筆記

#### 技術方案

**1. 新表**
```sql
CREATE TABLE word_notes (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  word_id uuid REFERENCES words(id),
  content text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, word_id)
);
```

**2. 頁面結構**
```
/words/[wordId]
├── 單字卡片（可編輯）
├── 學習統計
│  ├── 複習次數
│  ├── 準確度
│  └── 下一次複習時間
├── 我的筆記（可編輯）
└── 學習歷史時間軸
```

#### 開發檢查清單
- [ ] 頁面佈局
- [ ] 編輯功能
- [ ] 筆記功能
- [ ] 歷史時間軸

---

## 第 2 層：中優先級功能（2-3 周）

### 2.1 離線支持 (Service Worker)
**時間估計**: 8 小時
**複雜度**: 高

#### 需求
- 離線時仍可訪問已加載的卡組
- 離線時可以做測驗，連接後同步
- 離線時可以朗讀已緩存的單字

#### 技術方案

**1. Service Worker 實現**
```typescript
// public/service-worker.js
- 緩存所有 .js, .css, .woff2 文件
- 緩存首頁 HTML
- 緩存 API 響應（quiz, words）
- 實現 background sync（測驗答案上傳）

self.addEventListener('install', () => {
  // 緩存應用 shell
})

self.addEventListener('fetch', () => {
  // 先返回緩存，失敗時嘗試網絡
})
```

**2. 離線指示器**
```typescript
// components/OfflineIndicator.tsx
- 顯示離線狀態
- 顯示待同步的更改數
```

**3. 同步隊列**
```typescript
// lib/offline-sync.ts
- 離線時存儲答案到 IndexedDB
- 連接恢復時同步答案
- 處理衝突（同一單字多個答案）
```

**4. Manifest 文件**
```json
{
  "name": "單字小卡",
  "short_name": "單字卡",
  "icons": [...],
  "display": "standalone",
  "scope": "/",
  "start_url": "/",
  "orientation": "portrait-primary",
  "categories": ["education"]
}
```

#### 開發檢查清單
- [ ] Service Worker 實現
- [ ] 緩存策略
- [ ] IndexedDB 存儲
- [ ] 同步邏輯
- [ ] Manifest 文件
- [ ] 測試離線場景

---

### 2.2 高級搜索和篩選
**時間估計**: 4 小時
**複雜度**: 中等

#### 需求
- 按詞性篩選（名詞、動詞等）
- 按難度篩選（新、複習中、精通）
- 全文搜索
- 保存的搜索條件

#### 技術方案

**1. 搜索頁面**
```
/search
├── 搜索框
├── 篩選器面板
│  ├── 詞性
│  ├── 難度級別
│  ├── 準確度範圍
│  └── 日期範圍
└── 結果列表
```

**2. API 路由**
```typescript
// /api/words/search
interface SearchQuery {
  q: string
  pos?: string
  difficulty?: 'new' | 'reviewing' | 'mastered'
  accuracyMin?: number
  accuracyMax?: number
}
```

**3. UI 組件**
- `components/SearchBar.tsx` - 搜索框
- `components/FilterPanel.tsx` - 篩選器
- `components/SearchResults.tsx` - 結果列表

#### 開發檢查清單
- [ ] API 實現
- [ ] 搜索索引優化
- [ ] UI 組件
- [ ] 篩選邏輯

---

## 第 3 層：低優先級功能（未來擴展）

### 3.1 語言支持多語言卡組
**時間估計**: 10 小時
**複雜度**: 高

#### 需求
- 支持多語言卡組（例如中文→日語）
- 自動語音選擇（根據語言）
- 語言特定的過濾器

#### 實現計劃
- [ ] 修改單字表以支持目標語言
- [ ] 語音 API 語言選擇
- [ ] UI 語言選擇器

---

### 3.2 社交分享功能
**時間估計**: 6 小時
**複雜度**: 中等

#### 需求
- 分享卡組到社交媒體
- 分享學習成就
- 排行榜（可選）

---

### 3.3 AI 輔助功能
**時間估計**: 15 小時+
**複雜度**: 很高

#### 需求
- AI 生成例句
- AI 生成同義詞
- 智能困難詞推薦

#### 技術
- OpenAI API 或類似服務
- 成本考慮（按使用量計費）

---

## 實施優先級

### 第一階段（推薦立即開始）
```
Week 1:
[x] 部署應用（已完成）
[x] 基本測試（已完成）
[ ] 共享卡組功能          <- 開始這裡
[ ] 學習統計儀表板

Week 2:
[ ] 完成共享卡組 + 儀表板
[ ] 改進單字詳細頁面
[ ] 離線支持（Service Worker）
```

### 第二階段（2-4 周後）
```
Week 3-4:
[ ] 高級搜索和篩選
[ ] 性能優化
[ ] 移動應用（PWA 增強）
```

### 第三階段（1-3 個月後）
```
Later:
[ ] 多語言支持
[ ] 社交分享
[ ] AI 輔助
[ ] 高級統計和分析
```

---

## 開發資源估計

| 功能 | 時間 | 難度 | 優先級 |
|------|------|------|--------|
| 共享卡組 | 4h | 中 | ⭐⭐⭐ |
| 統計儀表板 | 3h | 中 | ⭐⭐⭐ |
| 單字詳細頁面 | 2h | 低 | ⭐⭐ |
| 離線支持 | 8h | 高 | ⭐⭐⭐ |
| 高級搜索 | 4h | 中 | ⭐⭐ |
| 多語言 | 10h | 高 | ⭐ |
| 社交分享 | 6h | 中 | ⭐ |
| AI 功能 | 15h+ | 很高 | ⭐ |

---

## 依賴關係

```
共享卡組
  ↓ (需要)
改進單字詳細頁面
  ↓ (需要)
統計儀表板

離線支持 (獨立)
  ↓ (增強)
高級搜索

多語言 (與所有功能相關)
  ↓ (構建於)
AI 功能
```

---

## 技術考慮

### 數據庫變更
- 添加新表時需要編寫遷移
- 確保向後兼容
- 更新 RLS 策略

### 性能影響
- 共享卡組會增加 RLS 查詢複雜度
- 統計儀表板需要聚合查詢（考慮物化視圖）
- 離線支持增加客戶端存儲需求

### 成本考慮
- AI 功能需要第三方 API（按使用量計費）
- Supabase 存儲/頻寬用量可能增加

---

## 建議下一步

1. **立即**（本周）
   - 部署應用到 Vercel ✓
   - 基本測試 ✓
   - 開始開發共享卡組

2. **短期**（2 周）
   - 完成共享卡組
   - 添加統計儀表板
   - 改進單字詳細頁面

3. **中期**（1 個月）
   - 離線支持
   - 高級搜索
   - 性能優化

4. **長期**（3 個月+）
   - 多語言支持
   - 社交功能
   - AI 輔助

---

**最後更新**: 2026-07-12
**下一次審查**: 2026-08-12
