/**
 * ETH 15分钟 Up/Down 市场自动交易机器人
 * 
 * 功能：
 * - 自动追踪最新的 15 分钟 ETH Up/Down 市场
 * - 根据价格阈值自动执行买入/卖出订单（吃单模式，不挂单）
 * - 支持 FOK (Fill-or-Kill) 和 FAK (Fill-and-Kill) 订单类型
 * 
 * 交易策略：
 * - 当 bestAsk <= BUY_PRICE 时，买入（花费 BUY_USDC）
 * - 当 bestBid >= SELL_PRICE 且持仓 > 0 时，卖出（卖出 SELL_SHARES 或更少）
 */

import "dotenv/config";
import { PolymarketSDK } from "@catalyst-team/poly-sdk";

/**
 * 延迟函数：等待指定毫秒数
 * @param ms 等待的毫秒数
 * @returns Promise
 */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * 转换为数字的工具函数
 * @param v 要转换的值
 * @param d 默认值（如果转换失败）
 * @returns 数字或默认值
 */
const toNum = (v: any, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

/**
 * 订单类型：FOK (Fill-or-Kill) 或 FAK (Fill-and-Kill)
 */
type OrderType = "FOK" | "FAK";

/**
 * 从 Polymarket Gamma API 获取最新的 15 分钟市场 slug
 * @param prefix 市场 slug 前缀（例如 "eth-updown-15m-"）
 * @returns 最新的市场 slug，如果未找到则返回 null
 */
async function fetchLatest15mSlug(prefix: string): Promise<string | null> {
  // 查询 Polymarket 事件 API，获取最新的未关闭事件
  const url =
    "https://gamma-api.polymarket.com/events?order=id&ascending=false&closed=false&limit=100&offset=0";
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`Gamma events http ${res.status}`);
  const events = await res.json();

  let best: { slug: string; sortKey: number } | null = null;

  // 遍历所有事件，查找匹配前缀的市场
  for (const ev of events || []) {
    const markets = ev?.markets || ev?.Markets || [];
    for (const m of markets) {
      const slug = String(m?.slug || "");
      // 只处理匹配前缀的市场
      if (!slug.startsWith(prefix)) continue;

      // 计算排序键：使用事件ID和市场ID组合，确保找到最新的市场
      const evId = Number(ev?.id ?? 0);
      const mkId = Number(m?.id ?? 0);
      const sortKey = evId * 1e9 + mkId;

      // 保留排序键最大的市场（即最新的市场）
      if (!best || sortKey > best.sortKey) best = { slug, sortKey };
    }
  }

  return best?.slug || null;
}

/**
 * 主函数：初始化并运行自动交易机器人
 */
async function main() {
  // ========== 从环境变量读取配置 ==========
  // 市场 slug 前缀
  const prefix = process.env.SLUG_PREFIX || "eth-updown-15m-";

  // 价格阈值：买入价格（当 bestAsk <= 此价格时买入）
  const BUY_PRICE = toNum(process.env.BUY_PRICE, 0.8);
  // 价格阈值：卖出价格（当 bestBid >= 此价格时卖出）
  const SELL_PRICE = toNum(process.env.SELL_PRICE, 0.9);

  // 每次买入花费的 USDC 数量
  const BUY_USDC = toNum(process.env.BUY_USDC, 20);
  // 每次卖出的份额数量
  const SELL_SHARES = toNum(process.env.SELL_SHARES, 20);
  // 每个方向（Up/Down）的最大持仓限制
  const MAX_POS_EACH = toNum(process.env.MAX_POS_EACH, 200);

  // 订单类型：FOK (Fill-or-Kill) 或 FAK (Fill-and-Kill)
  const ORDER_TYPE = (process.env.ORDER_TYPE || "FOK").toUpperCase() as OrderType;
  // 轮询间隔（毫秒）：检查订单簿的频率
  const POLL_MS = toNum(process.env.POLL_MS, 500);
  // 刷新市场 slug 的间隔（毫秒）：检查是否有新市场的频率
  const REFRESH_SLUG_MS = toNum(process.env.REFRESH_SLUG_MS, 2000);

  // 检查私钥是否配置
  if (!process.env.POLYMARKET_PRIVATE_KEY) throw new Error("Missing POLYMARKET_PRIVATE_KEY");

  // ========== 初始化 Polymarket SDK ==========
  const sdk = await PolymarketSDK.create({
    privateKey: process.env.POLYMARKET_PRIVATE_KEY!,
    rpcUrl: process.env.POLYGON_RPC_URL,
  });

  // 获取当前钱包地址
  const me = (sdk as any).wallet?.address || (sdk as any).address;

  // ========== 市场状态变量 ==========
  let currentSlug: string | null = null;      // 当前交易的市场 slug
  let conditionId: string | null = null;       // 市场条件 ID
  let upTokenId: string | null = null;         // Up 方向的代币 ID
  let downTokenId: string | null = null;       // Down 方向的代币 ID

  /**
   * 刷新市场信息：检查是否有新的市场，如果有则切换到新市场
   * @param force 是否强制刷新（即使市场 slug 没有变化）
   */
  async function refreshMarketIfNeeded(force = false) {
    // 获取最新的市场 slug
    const latest = await fetchLatest15mSlug(prefix);
    if (!latest) {
      console.log(`[SLUG] not found for prefix=${prefix}`);
      return;
    }
    // 如果市场没有变化且不是强制刷新，则跳过
    if (!force && latest === currentSlug) return;

    // 切换到新市场
    console.log(`\n[SWITCH] ${currentSlug || "(none)"} -> ${latest}`);
    currentSlug = latest;

    // 获取市场详细信息
    const market = await sdk.markets.getMarket(latest);
    if (!market?.conditionId) throw new Error(`getMarket failed for slug=${latest}`);

    conditionId = String(market.conditionId);

    // 查找 Up 和 Down 方向的代币
    const tokens: any[] = market.tokens || [];
    // 支持 "Up"/"Down" 或 "Yes"/"No" 两种命名方式
    const up = tokens.find((t) => String(t.outcome) === "Up") || tokens.find((t) => String(t.outcome) === "Yes");
    const down = tokens.find((t) => String(t.outcome) === "Down") || tokens.find((t) => String(t.outcome) === "No");

    if (!up?.tokenId || !down?.tokenId) {
      throw new Error(`Cannot find Up/Down tokenId. outcomes=${tokens.map((t) => t.outcome).join(", ")}`);
    }

    // 保存代币 ID
    upTokenId = String(up.tokenId);
    downTokenId = String(down.tokenId);

    // 输出市场信息
    console.log(`[MARKET] slug=${latest}`);
    console.log({ wallet: me || "(unknown)", conditionId, upTokenId, downTokenId });
  }

  /**
   * 获取指定代币的持仓数量
   * @param tokenId 代币 ID
   * @returns 持仓数量（份额）
   */
  async function getPos(tokenId: string): Promise<number> {
    if (!me) return 0;
    // 获取当前钱包的所有持仓
    const positions = await (sdk as any).dataApi.getPositions(me);
    // 查找指定代币的持仓
    const p = (positions || []).find((x: any) => String(x.tokenId) === String(tokenId));
    // 返回持仓数量（支持不同的字段名：size, shares, position）
    return toNum(p?.size ?? p?.shares ?? p?.position ?? 0, 0);
  }

  /**
   * 执行买入订单（吃单模式）
   * @param tokenId 要买入的代币 ID
   * @param usdcAmount 花费的 USDC 数量
   */
  async function takerBuy(tokenId: string, usdcAmount: number) {
    // 创建市价买入订单（吃单）
    const res = await (sdk as any).trading.createMarketOrder({
      tokenId,
      side: "BUY",
      amount: usdcAmount,  // 花费的 USDC 数量
      orderType: ORDER_TYPE, // FOK 或 FAK
    });
    console.log(`[BUY] token=${tokenId} $=${usdcAmount} type=${ORDER_TYPE} id=${res?.id || res?.orderId || "?"}`);
  }

  /**
   * 执行卖出订单（吃单模式）
   * @param tokenId 要卖出的代币 ID
   * @param shares 卖出的份额数量
   */
  async function takerSell(tokenId: string, shares: number) {
    // 创建市价卖出订单（吃单）
    const res = await (sdk as any).trading.createMarketOrder({
      tokenId,
      side: "SELL",
      amount: shares,  // 卖出的份额数量
      orderType: ORDER_TYPE, // FOK 或 FAK
    });
    console.log(`[SELL] token=${tokenId} shares=${shares} type=${ORDER_TYPE} id=${res?.id || res?.orderId || "?"}`);
  }

  // 上次刷新市场的时间戳
  let lastRefresh = 0;

  // 初始化：强制刷新一次市场信息
  await refreshMarketIfNeeded(true);

  // 输出启动信息和配置
  console.log("\n=== AUTO 15m ETH 双边吃单启动 ===");
  console.log({
    prefix,
    BUY_PRICE,
    SELL_PRICE,
    BUY_USDC,
    SELL_SHARES,
    MAX_POS_EACH,
    ORDER_TYPE,
    POLL_MS,
    REFRESH_SLUG_MS,
  });

  // ========== 主循环：持续监控和执行交易 ==========
  while (true) {
    try {
      const now = Date.now();
      
      // 定期刷新市场 slug（检查是否有新市场）
      if (now - lastRefresh >= REFRESH_SLUG_MS) {
        lastRefresh = now;
        await refreshMarketIfNeeded(false);
      }

      // 如果市场信息不完整，等待一段时间后继续
      if (!conditionId || !upTokenId || !downTokenId || !currentSlug) {
        await sleep(POLL_MS);
        continue;
      }

      // 获取订单簿信息
      const ob = await sdk.markets.getProcessedOrderbook(conditionId);
      // 最佳买价（最高出价）：用于卖出
      const bestBid = toNum(ob?.bestBid?.price ?? ob?.bids?.[0]?.price, NaN);
      // 最佳卖价（最低要价）：用于买入
      const bestAsk = toNum(ob?.bestAsk?.price ?? ob?.asks?.[0]?.price, NaN);

      // 输出当前价格信息
      console.log(
        `[TICK] slug=${currentSlug} bestBid=${Number.isFinite(bestBid) ? bestBid.toFixed(4) : "NA"} bestAsk=${
          Number.isFinite(bestAsk) ? bestAsk.toFixed(4) : "NA"
        }`
      );

      // 遍历 Up 和 Down 两个方向的代币
      for (const tokenId of [upTokenId, downTokenId]) {
        // 获取当前持仓
        const pos = await getPos(tokenId);

        // ========== 卖出逻辑 ==========
        // 条件：有持仓 && 最佳买价有效 && 最佳买价 >= 卖出价格阈值
        if (pos > 0 && Number.isFinite(bestBid) && bestBid >= SELL_PRICE) {
          // 卖出数量：取持仓和配置的卖出份额的较小值
          const qty = Math.min(pos, SELL_SHARES);
          if (qty > 0) await takerSell(tokenId, qty);
          continue; // 卖出后不再检查买入条件
        }

        // ========== 买入逻辑 ==========
        // 条件：持仓未达到上限 && 最佳卖价有效 && 最佳卖价 <= 买入价格阈值
        if (pos < MAX_POS_EACH && Number.isFinite(bestAsk) && bestAsk <= BUY_PRICE) {
          await takerBuy(tokenId, BUY_USDC);
        }
      }
    } catch (e: any) {
      // 捕获并输出错误，但不中断主循环
      console.log(`[ERR] ${e?.message || e}`);
    }

    // 等待指定时间后继续下一轮循环
    await sleep(POLL_MS);
  }
}

// 启动主函数，捕获未处理的错误
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
