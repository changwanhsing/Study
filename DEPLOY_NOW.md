# 🚀 部署助手 - 逐步指南

**状态**: ✅ 应用已准备部署
**预计时间**: 12 分钟

---

## 第 1 步：创建 Supabase 项目（5 分钟）

### A. 访问 Supabase
1. 打开 https://supabase.com
2. 点击 **「New Project」** 或登录后创建新项目
3. 选择或创建组织

### B. 配置项目
```
项目设置:
  名称: vocab-app-prod
  数据库密码: [输入强密码] ⭐ 重要：保存密码！
  地域: Asia (Singapore) 或最接近你的地域
  
等待初始化... (2-3 分钟)
```

### C. 获取 API 密钥
部署完成后：
1. 打开项目
2. 进入 **Settings** → **API**
3. 复制这三个值（保存到文本文件）：

```
NEXT_PUBLIC_SUPABASE_URL = [Project URL]
示例: https://xyzabc.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY = [anon public]
示例: eyJhbGciOiJIUzI1NiIsInR5c...

SUPABASE_SERVICE_ROLE_KEY = [service_role]
示例: eyJhbGciOiJIUzI1NiIsInR5c...
```

### D. 运行数据库迁移
1. 在 Supabase 项目中，进入 **SQL Editor**
2. 点击 **「New Query」**
3. 复制此文件内容：`supabase/migrations/0001_init.sql`
4. 粘贴到编辑器并执行
5. ✅ 应该看到成功消息

---

## 第 2 步：部署到 Vercel（2 分钟）

### A. 访问 Vercel
1. 打开 https://vercel.com
2. 点击 **「New Project」**
3. 选择 **Import Git Repository**
4. 选择此仓库 (vocab-app)

### B. 项目设置
```
Framework Preset: Next.js
Build Command: npm run build (默认)
Install Command: npm install (默认)
Output Directory: .next (默认)
```

### C. 设置环境变量
1. 在 **Environment Variables** 部分
2. 添加这三个变量（从步骤 1C 复制）：

```
✓ NEXT_PUBLIC_SUPABASE_URL
✓ NEXT_PUBLIC_SUPABASE_ANON_KEY
✓ SUPABASE_SERVICE_ROLE_KEY
```

### D. 部署
1. 点击 **「Deploy」**
2. 等待部署完成 (2-5 分钟)
3. ✅ 看到 **「Congratulations」** 时完成！

---

## 第 3 步：测试应用（5 分钟）

### A. 访问应用
1. 点击 Vercel 提供的 URL
   示例: `https://vocab-app-abc123.vercel.app`
2. 应该看到首页和示例卡片

### B. 基本功能测试
```
✓ 首页加载正常
✓ 可以看到示例卡片
✓ 卡片可以翻转
✓ 点击「朗读」按钮有声音
✓ 没有红色错误
```

### C. 创建帐户
1. 点击「Sign In」
2. 输入电邮和密码
3. 创建帐户
4. ✅ 登录成功！

### D. 创建第一个卡组
```
1. 点击「+ 新建卡组」
2. 输入名称: 「Test Deck」
3. 点击「创建」
4. 进行小测驗
5. ✅ 功能正常！
```

---

## 🎉 完成！

你的应用现在已上线！🚀

### 下一步
1. **邀请朋友**
   - 复制生产 URL
   - 分享给朋友测试

2. **导入单字**
   - 在卡组中点击「匯入」
   - 下载範本
   - 填入单字并上传

3. **收集反馈**
   - 请朋友使用应用
   - 记录反馈和问题
   - 计划改进

---

## ❓ 常见问题

### Q: 部署后看到 404 错误？
**A**: 
- 检查 Vercel 部署日志
- 确认环境变量已设置
- 刷新页面

### Q: 无法创建帐户？
**A**:
- 检查 Supabase 是否正常运行
- 查看浏览器控制台错误 (F12)
- 检查 Vercel 部署日志

### Q: 语音功能不工作？
**A**:
- 检查浏览器音量
- 在 Chrome/Firefox 中测试
- iOS Safari 需要点击按钮触发

### Q: 应用加载缓慢？
**A**:
- 这是首次启动，Vercel 正在预热
- 之后会变快
- 检查网络连接

---

## 📞 需要帮助？

如果遇到问题，查看这些文档：
- 🔧 [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - 详细故障排除
- 📋 [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md) - 部署检查清单
- 📖 [GET_STARTED.md](GET_STARTED.md) - 快速开始指南

---

**准备好了吗？** 现在就开始第 1 步吧！ 🚀

*预计总时间: 12 分钟*
