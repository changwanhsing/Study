# 用户体验改进計劃

## 概述
本計劃目標是改進應用在行動設備、無障礙訪問、性能和錯誤處理方面的用户體驗。

---

## 1. 行動設備優化

### 1.1 響應式設計增強
**狀態**: ✅ 已基本實現
**改進項**:

#### 問題
- [ ] 卡片在很小的屏幕上可能太寬
- [ ] 按鈕文字在很小屏幕上可能被截斷
- [ ] 選項文本在小屏幕上可能換行不當

#### 解決方案
```css
/* 超小屏幕 (< 360px) */
@media (max-width: 360px) {
  .card { padding: 12px; }
  .option-text { font-size: 12px; }
  .button { padding: 10px 16px; }
}

/* 小屏幕 (360px - 480px) */
@media (max-width: 480px) {
  .progress-bar { height: 4px; }
  .button-group { flex-direction: column; }
}

/* 標準手機 (480px - 768px) */
@media (max-width: 768px) {
  /* 現有設置 */
}
```

### 1.2 觸摸交互改進

#### 問題
- 按鈕太小難以點擊（< 44px）
- 滑動手勢沒有實現
- 長按沒有反饋

#### 解決方案
```typescript
// 確保所有可交互元素都是 44x44px 或更大
const TOUCH_TARGET_SIZE = 44; // pixels

// components/TouchFriendlyButton.tsx
export function TouchFriendlyButton({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="min-h-[44px] min-w-[44px] flex items-center justify-center"
    >
      {children}
    </button>
  );
}

// 實現卡片滑動手勢
// lib/touch-gestures.ts
export function useSwipeGesture() {
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    setTouchEnd(e.changedTouches[0].clientX);
    const distance = touchStart - touchEnd;
    
    if (Math.abs(distance) > 50) {
      return distance > 0 ? 'left' : 'right';
    }
    return null;
  };

  return { onTouchStart, onTouchEnd };
}
```

### 1.3 移動端菜單

#### 實現
```typescript
// components/MobileMenu.tsx
export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {isOpen && (
        <nav className="fixed inset-0 bg-paper z-40 overflow-y-auto">
          <div className="p-4 space-y-4">
            <a href="/decks">我的卡組</a>
            <a href="/dashboard">統計</a>
            <a href="/settings">設置</a>
            <button onClick={() => setIsOpen(false)}>關閉</button>
          </div>
        </nav>
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 w-12 h-12 bg-ink text-white rounded-full"
      >
        ☰
      </button>
    </>
  );
}
```

---

## 2. 主題支持（淺色/深色）

### 2.1 實現方案

#### Step 1: 更新 globals.css
```css
:root {
  --paper: #faf8f3;
  --ink: #1a1a1a;
  /* ... 其他變量 */
}

@media (prefers-color-scheme: dark) {
  :root {
    --paper: #1a1a1a;
    --ink: #faf8f3;
    --bg-gradient: linear-gradient(135deg, #2a2a2a, #3a3a3a);
    /* ... 其他深色變量 */
  }
}

/* 支持手動主題切換 */
[data-theme="light"] {
  --paper: #faf8f3;
  --ink: #1a1a1a;
}

[data-theme="dark"] {
  --paper: #1a1a1a;
  --ink: #faf8f3;
}
```

#### Step 2: 主題提供器
```typescript
// lib/theme.ts
export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('auto');

  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'auto';
    setTheme(saved as any);

    if (saved === 'auto') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    } else {
      document.documentElement.setAttribute('data-theme', saved);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return { theme, toggleTheme };
}
```

#### Step 3: 主題切換 UI
```typescript
// components/ThemeToggle.tsx
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-mint hover:bg-mint-dark"
      aria-label="切換主題"
    >
      {theme === 'dark' ? '☀️ 淺色' : '🌙 深色'}
    </button>
  );
}
```

### 2.2 色彩方案

#### 淺色模式（預設）
```
背景: #faf8f3 (紙張)
文本: #1a1a1a (墨水)
強調: #4cc9f0 (薄荷)
警告: #f94144 (珊瑚)
成功: #2ecc71 (綠色)
```

#### 深色模式
```
背景: #1a1a1a (深灰)
文本: #faf8f3 (淺色)
強調: #4cc9f0 (薄荷) - 略調整
警告: #ff6b6b (亮珊瑚)
成功: #51cf66 (亮綠色)
```

---

## 3. 無障礙訪問改進

### 3.1 鍵盤導航

#### 檢查清單
- [x] Tab 鍵可以訪問所有可交互元素
- [ ] 焦點順序邏輯且直觀
- [ ] 焦點指示器清晰可見
- [ ] Escape 鍵關閉對話框
- [ ] Enter/Space 觸發按鈕

#### 實現
```typescript
// 確保焦點可見
*:focus {
  outline: 3px solid var(--mint);
  outline-offset: 2px;
}

// 鍵盤快捷鍵
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isDialogOpen) {
      closeDialog();
    }
    if (e.key === 'Enter' && isFormFocused) {
      submitForm();
    }
  };
  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, [isDialogOpen, isFormFocused]);
```

### 3.2 屏幕閱讀器支持

#### ARIA 標籤和描述
```typescript
// 卡片組件
<div
  role="region"
  aria-label="學習卡片"
  aria-live="polite"
>
  <h2 id="card-title">這個字是什麼意思？</h2>
  <div aria-describedby="card-title">
    {/* 卡片內容 */}
  </div>
</div>

// 按鈕
<button aria-label="朗讀 apple" aria-pressed={isPressed}>
  🔊
</button>

// 表單
<label htmlFor="email">電郵</label>
<input id="email" type="email" aria-required="true" />

// 提示
<div role="alert" aria-live="assertive">
  ❌ 必填字段空白
</div>
```

### 3.3 顏色對比

#### WCAG AA 標準（最少 4.5:1）
```css
/* 檢查所有文本對比度 */
.text-ink { /* #1a1a1a on #faf8f3 = 19.2:1 ✓ */
  color: #1a1a1a;
  background: #faf8f3;
}

.text-ink-soft { /* #666 on #faf8f3 = 9.1:1 ✓ */
  color: #666;
  background: #faf8f3;
}

/* 在深色模式中也要檢查 */
@media (prefers-color-scheme: dark) {
  .text-ink { /* #faf8f3 on #1a1a1a = 19.2:1 ✓ */
    color: #faf8f3;
    background: #1a1a1a;
  }
}
```

---

## 4. 性能優化

### 4.1 圖像優化
```typescript
// components/OptimizedImage.tsx
import Image from 'next/image';

export function OptimizedImage({ src, alt, width, height }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={false}
      quality={75}
      loading="lazy"
    />
  );
}
```

### 4.2 代碼分割
```typescript
// 動態導入頁面組件
const Dashboard = dynamic(() => import('@/components/Dashboard'), {
  loading: () => <div>加載中...</div>,
  ssr: false,
});
```

### 4.3 緩存策略
```typescript
// lib/cache.ts
export const CACHE_DURATION = {
  USER_STATS: 5 * 60 * 1000, // 5 分鐘
  DECK_LIST: 10 * 60 * 1000, // 10 分鐘
  WORD_DETAILS: 1 * 60 * 60 * 1000, // 1 小時
};

// 使用 SWR 進行數據緩存
import useSWR from 'swr';

export function useUserStats() {
  const { data, error, isLoading } = useSWR(
    '/api/user/statistics',
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: CACHE_DURATION.USER_STATS }
  );

  return { data, error, isLoading };
}
```

### 4.4 WebP 圖像
```html
<picture>
  <source srcset="image.webp" type="image/webp">
  <img src="image.png" alt="描述">
</picture>
```

---

## 5. 錯誤處理和用戶提示

### 5.1 全局錯誤邊界
```typescript
// app/error.tsx
'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">出錯了 😕</h1>
        <p className="text-ink-soft mb-6">{error.message}</p>
        <button
          onClick={() => reset()}
          className="px-6 py-3 bg-mint text-white font-bold rounded-full"
        >
          重試
        </button>
      </div>
    </div>
  );
}
```

### 5.2 載入狀態
```typescript
// components/LoadingSpinner.tsx
export function LoadingSpinner({ size = 'md' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  
  return (
    <div className={`${sizes[size]} border-4 border-mint-bg border-t-mint rounded-full animate-spin`}
         role="status"
         aria-label="加載中">
      <span className="sr-only">加載中...</span>
    </div>
  );
}
```

### 5.3 提示和通知
```typescript
// lib/notifications.ts
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

// components/NotificationContainer.tsx
export function NotificationContainer({ notifications, onClose }) {
  return (
    <div className="fixed top-4 right-4 space-y-2 z-50">
      {notifications.map(notif => (
        <div
          key={notif.id}
          className={`p-4 rounded-lg shadow-lg ${
            notif.type === 'success' ? 'bg-mint' :
            notif.type === 'error' ? 'bg-coral' :
            'bg-ink'
          } text-white font-bold`}
          role="alert"
        >
          {notif.message}
        </div>
      ))}
    </div>
  );
}
```

### 5.4 表單驗證反饋
```typescript
// components/FormField.tsx
export function FormField({ label, error, required, children }) {
  return (
    <div className="space-y-1">
      <label className="font-bold">
        {label}
        {required && <span className="text-coral"> *</span>}
      </label>
      {children}
      {error && (
        <div className="text-sm text-coral font-bold" role="alert">
          ❌ {error}
        </div>
      )}
    </div>
  );
}
```

---

## 6. 實施計劃

### 第 1 週
- [x] 響應式設計基礎 (已實現)
- [ ] 主題支持（淺色/深色）
- [ ] ARIA 標籤

### 第 2 週
- [ ] 鍵盤導航完善
- [ ] 顏色對比驗證
- [ ] 錯誤處理改進

### 第 3 週
- [ ] 性能優化
- [ ] 觸摸交互增強
- [ ] 全面測試

---

## 測試檢查清單

### 手動測試
- [ ] 在 iPhone 上測試（iOS Safari）
- [ ] 在 Android 上測試（Chrome）
- [ ] 在桌面瀏覽器上測試
- [ ] 測試屏幕閱讀器 (NVDA/JAWS/VoiceOver)
- [ ] 測試鍵盤導航 (Tab, Enter, Escape)
- [ ] 測試深色模式
- [ ] 測試低視力模式（高對比度）

### 自動化測試
```bash
# 無障礙測試
npm run test:a11y

# 性能測試
npm run test:performance

# 視覺回歸測試
npm run test:visual
```

---

## 性能指標目標

| 指標 | 目標 | 工具 |
|------|------|------|
| Lighthouse Performance | > 90 | Chrome DevTools |
| First Contentful Paint (FCP) | < 1.8s | PageSpeed Insights |
| Largest Contentful Paint (LCP) | < 2.5s | PageSpeed Insights |
| Cumulative Layout Shift (CLS) | < 0.1 | PageSpeed Insights |
| Time to Interactive (TTI) | < 3.8s | Lighthouse |

---

## 無障礙測試工具

```bash
# 安裝測試工具
npm install --save-dev axe-core @axe-core/react jest-axe

# 可訪問性審計
npm run audit:a11y
```

---

## 參考資源

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Web Accessibility: ARIA](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA)
- [Mobile Accessibility Guidelines](https://www.w3.org/WAI/mobile/)
- [Inclusive Component Patterns](https://www.a11y-101.com/)

---

**最後更新**: 2026-07-12
**下一次審查**: 2026-07-26

## 改進進度

- [x] 響應式設計基礎
- [ ] 主題支持
- [ ] 無障礙增強
- [ ] 性能優化
- [ ] 錯誤處理
