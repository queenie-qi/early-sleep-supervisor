# Vercel 部署指南

## 1. 安装 Vercel CLI

```bash
npm i -g vercel
```

## 2. 连接 Vercel

```bash
vercel login
```

## 3. 创建 Postgres 数据库

在 Vercel Dashboard 中:
1. 进入你的项目
2. 点击 "Storage" 标签
3. 创建新的 Postgres 数据库
4. 连接到你的项目

或者使用 CLI:
```bash
vercel storage add
```

## 4. 部署项目

```bash
vercel --prod
```

## 5. 初始化数据库

部署完成后，访问以下 URL 初始化数据库:

```
https://你的域名/api/init
```

使用 POST 方法请求:
```bash
curl -X POST https://你的域名/api/init
```

## 6. 验证部署

访问:
```
https://你的域名/api/health
```

## 目录结构

```
├── api/                    # Vercel Serverless Functions
│   ├── db.js              # 数据库连接和初始化
│   ├── health.js          # 健康检查
│   ├── init.js            # 数据库初始化
│   ├── auth/
│   │   ├── login.js
│   │   ├── target-time.js
│   │   └── user/[id].js
│   ├── records/
│   │   ├── upload.js
│   │   ├── today/[userId].js
│   │   └── monthly/[userId]/[year]/[month].js
│   └── groups/
│       ├── create.js
│       ├── join.js
│       ├── my/[userId].js
│       └── [groupId]/
│           ├── index.js
│           ├── members.js
│           └── target-time.js
├── client/                # React 前端
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── lib/api.ts
│   │   └── pages/
│   └── dist/             # 构建输出
├── vercel.json           # Vercel 配置
└── package.json
```

## 环境变量

Vercel 会自动配置 `POSTGRES_URL` 环境变量。

## 本地开发

```bash
# 安装依赖
npm install
cd client && npm install
cd ../api && npm install

# 创建本地 .env 文件
echo "POSTGRES_URL=你的数据库URL" > api/.env

# 启动开发服务器
npm run dev
```

## 注意事项

1. **数据库迁移**: SQLite 迁移到 PostgreSQL，主要语法差异:
   - `INTEGER PRIMARY KEY AUTOINCREMENT` → `SERIAL PRIMARY KEY`
   - `DATETIME` → `TIMESTAMP`
   - `CURRENT_TIMESTAMP` 相同

2. **文件上传**: 原项目的文件上传功能需要改为使用 Vercel Blob 或其他云存储服务

3. **图片资源**: 如有需要，将图片上传到 Vercel Blob 或其他 CDN
