# 15fenzhong

ETH 15 分钟 Up/Down 市场：自动追踪最新场 + 双边吃单（不挂单）

- 自动找最新 slug：eth-updown-15m-
- 条件触发：
  - bestAsk <= BUY_PRICE -> BUY（花 BUY_USDC）
  - bestBid >= SELL_PRICE 且持仓>0 -> SELL（卖 SELL_SHARES 或更少）
- 支持 FOK / FAK

## 安装
npm i

## 配置
cp .env.example .env
然后编辑 .env 填你的私钥

## 运行
npm run dev
