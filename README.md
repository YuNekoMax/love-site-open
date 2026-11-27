# 恋爱日记 · love-site-open

一个可以自己部署的「两个人的私密记录站」。手机上是 app 风格（液态玻璃底栏、页面切换动画），电脑上保留旧版编辑排版；数据存在 Cloudflare 的 D1 和 KV 里，不依赖第三方服务。

仓库里的名字、生日、在一起的日子都是占位值，部署后登录进「工具 → 设置」改成自己的就行。

## 功能

- **首页**：在一起第几天、心情打卡、每日一问、最近的日记
- **日记**：按月分组的时间轴，三行预览，点开全屏阅读；没起标题也能写
- **相册**：按月照片墙，拖拽或点按上传，全屏大图左右翻，手机上可以滑动切换
- **纪念日**：在一起、两个生日、第 100 天之类的倒数，外加「想一起做的事」
- **状态**：最近 30 天的心情分布和开心率
- **工具**
  - 时间胶囊：写一封信锁到将来的某天，到日子才能开封
  - 设置：名字、头像、在一起的日子、生日、主题（自动 / 浅色 / 深色）
  - 导出备份：JSON 数据，或带原图的 ZIP
  - 站点体检：接口、数据库、照片存储、最近照片四项自检
  - 分享页：生成免登录的只读页面
- **登录**：账户密码 + 随机一道只有两个人知道答案的问题，全部答对才发 30 天的签名 Cookie

## 技术栈

- Vite 5 + React 18 + react-router-dom 6
- Cloudflare Pages + Pages Functions（入口只有 `functions/[[path]].js`）
- D1 存结构化数据，KV 存照片和头像（绑定名 `PHOTOS`）
- marked + DOMPurify 渲染 Markdown，fflate 打包 ZIP

## 本地开发

需要 Node 18 以上。

```bash
npm install
npm run dev        # http://127.0.0.1:5173
```

- 本地的接口由 `dev-api.js` 用内存数据模拟，重启就恢复；上传的照片也只在内存里。
- 开发账号：`me` / `love`、`partner` / `love`；`DEV_AUTOLOGIN=1 npm run dev` 可以跳过登录。
- 构建：`npm run build`，产物在 `dist/`。

## 配置

复制 `wrangler.example.toml` 为 `wrangler.toml`，填上自己的 D1 和 KV 绑定；真正部署时以 Cloudflare Pages 面板里的绑定为准。

环境变量：

- `SITE_DOMAIN`：站点域名，`/api/*` 和 `/media/*` 只认这个域名的请求
- `AUTH_SALT`：密码哈希用的盐
- `AUTH_SECRET`：会话签名密钥，建议用加密变量；换掉会让所有登录失效
- `ACCOUNT_ME_USER`、`ACCOUNT_ME_HASH`：你这边
- `ACCOUNT_PARTNER_USER`、`ACCOUNT_PARTNER_HASH`：对方

生成密码哈希：

```bash
node scripts/hash-password.mjs <AUTH_SALT> <密码>
```

## 数据库

在 D1 里执行 `schema.sql` 建表；想要默认设置可以再执行 `seed.sql`（里面的名字、生日、在一起的日子都是占位值）。

表：`settings`、`checkins`、`answers`、`entries`、`photos`、`milestones`、`wishes`、`shares`、`capsules`。

改结构时记得同时在线上 D1 执行一次（用 `CREATE TABLE IF NOT EXISTS ...` 这种可重复执行的写法）。

## 部署到 Cloudflare Pages

1. 在 Cloudflare Pages 里连接这个仓库：构建命令 `npm run build`，输出目录 `dist`。
2. D1 建库，执行 `schema.sql`（可选 `seed.sql`），在 Pages 项目里绑定为 `DB`。
3. KV 建命名空间，绑定为 `PHOTOS`。
4. 填上面那些环境变量，`AUTH_SECRET` 用加密变量。
5. 绑定自定义域名。改完环境变量要重新部署一次才生效。
6. 之后推 `master` 会自动构建部署。

## 目录

```
src/pages       页面：首页、日记、相册、纪念日、状态、工具、设置、导出、时间胶囊、站点体检
src/components  组件：导航、页头、写作、时间轴、阅读页、图墙等
src/lib         日期、主题、图片压缩等小工具
src/legacy      旧版桌面界面，挂在 Shadow DOM 里，样式与新版隔离
functions/      Pages Functions：登录、API、分享页、媒体
dev-api.js      本地开发用的内存接口
schema.sql      数据库结构
scripts/        生成密码哈希
```

## 说明

- 名字、头像、生日、在一起的日子都在「工具 → 设置」里改，不用动代码。
- 主题在设置里切换，按设备记住，不会同步到对方。
- 时间胶囊的正文在开封前不会返回给前端。
- 分享页免登录，看到的是生成分享那一刻的快照。
- 这个仓库没有附带 LICENSE，使用前请按自己的需要补一个。
