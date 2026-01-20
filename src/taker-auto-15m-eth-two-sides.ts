import "dotenv/config";
import { PolymarketSDK } from "@catalyst-team/poly-sdk";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const toNum = (v: any, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

type OrderType = "FOK" | "FAK";

async function fetchLatest15mSlug(prefix: string): Promise<string | null> {
  const url =
    "https://gamma-api.polymarket.com/events?order=id&ascending=false&closed=false&limit=100&offset=0";
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`Gamma events http ${res.status}`);
  const events = await res.json();

  let best: { slug: string; sortKey: number } | null = null;

  for (const ev of events || []) {
    const markets = ev?.markets || ev?.Markets || [];
    for (const m of markets) {
      const slug = String(m?.slug || "");
      if (!slug.startsWith(prefix)) continue;

      const evId = Number(ev?.id ?? 0);
      const mkId = Number(m?.id ?? 0);
      const sortKey = evId * 1e9 + mkId;

      if (!best || sortKey > best.sortKey) best = { slug, sortKey };
    }
  }

  return best?.slug || null;
}

async function main() {
  const prefix = process.env.SLUG_PREFIX || "eth-updown-15m-";

  const BUY_PRICE = toNum(process.env.BUY_PRICE, 0.8);
  const SELL_PRICE = toNum(process.env.SELL_PRICE, 0.9);

  const BUY_USDC = toNum(process.env.BUY_USDC, 20);
  const SELL_SHARES = toNum(process.env.SELL_SHARES, 20);
  const MAX_POS_EACH = toNum(process.env.MAX_POS_EACH, 200);

  const ORDER_TYPE = (process.env.ORDER_TYPE || "FOK").toUpperCase() as OrderType;
  const POLL_MS = toNum(process.env.POLL_MS, 500);
  const REFRESH_SLUG_MS = toNum(process.env.REFRESH_SLUG_MS, 2000);

  if (!process.env.POLYMARKET_PRIVATE_KEY) throw new Error("Missing POLYMARKET_PRIVATE_KEY");

  const sdk = await PolymarketSDK.create({
    privateKey: process.env.POLYMARKET_PRIVATE_KEY!,
    rpcUrl: process.env.POLYGON_RPC_URL,
  });

  const me = (sdk as any).wallet?.address || (sdk as any).address;

  let currentSlug: string | null = null;
  let conditionId: string | null = null;
  let upTokenId: string | null = null;
  let downTokenId: string | null = null;

  async function refreshMarketIfNeeded(force = false) {
    const latest = await fetchLatest15mSlug(prefix);
    if (!latest) {
      console.log(`[SLUG] not found for prefix=${prefix}`);
      return;
    }
    if (!force && latest === currentSlug) return;

    console.log(`\n[SWITCH] ${currentSlug || "(none)"} -> ${latest}`);
    currentSlug = latest;

    const market = await sdk.markets.getMarket(latest);
    if (!market?.conditionId) throw new Error(`getMarket failed for slug=${latest}`);

    conditionId = String(market.conditionId);

    const tokens: any[] = market.tokens || [];
    const up = tokens.find((t) => String(t.outcome) === "Up") || tokens.find((t) => String(t.outcome) === "Yes");
    const down = tokens.find((t) => String(t.outcome) === "Down") || tokens.find((t) => String(t.outcome) === "No");

    if (!up?.tokenId || !down?.tokenId) {
      throw new Error(`Cannot find Up/Down tokenId. outcomes=${tokens.map((t) => t.outcome).join(", ")}`);
    }

    upTokenId = String(up.tokenId);
    downTokenId = String(down.tokenId);

    console.log(`[MARKET] slug=${latest}`);
    console.log({ wallet: me || "(unknown)", conditionId, upTokenId, downTokenId });
  }

  async function getPos(tokenId: string): Promise<number> {
    if (!me) return 0;
    const positions = await (sdk as any).dataApi.getPositions(me);
    const p = (positions || []).find((x: any) => String(x.tokenId) === String(tokenId));
    return toNum(p?.size ?? p?.shares ?? p?.position ?? 0, 0);
  }

  async function takerBuy(tokenId: string, usdcAmount: number) {
    const res = await (sdk as any).trading.createMarketOrder({
      tokenId,
      side: "BUY",
      amount: usdcAmount,
      orderType: ORDER_TYPE,
    });
    console.log(`[BUY] token=${tokenId} $=${usdcAmount} type=${ORDER_TYPE} id=${res?.id || res?.orderId || "?"}`);
  }

  async function takerSell(tokenId: string, shares: number) {
    const res = await (sdk as any).trading.createMarketOrder({
      tokenId,
      side: "SELL",
      amount: shares,
      orderType: ORDER_TYPE,
    });
    console.log(`[SELL] token=${tokenId} shares=${shares} type=${ORDER_TYPE} id=${res?.id || res?.orderId || "?"}`);
  }

  let lastRefresh = 0;

  await refreshMarketIfNeeded(true);

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

  while (true) {
    try {
      const now = Date.now();
      if (now - lastRefresh >= REFRESH_SLUG_MS) {
        lastRefresh = now;
        await refreshMarketIfNeeded(false);
      }

      if (!conditionId || !upTokenId || !downTokenId || !currentSlug) {
        await sleep(POLL_MS);
        continue;
      }

      const ob = await sdk.markets.getProcessedOrderbook(conditionId);
      const bestBid = toNum(ob?.bestBid?.price ?? ob?.bids?.[0]?.price, NaN);
      const bestAsk = toNum(ob?.bestAsk?.price ?? ob?.asks?.[0]?.price, NaN);

      console.log(
        `[TICK] slug=${currentSlug} bestBid=${Number.isFinite(bestBid) ? bestBid.toFixed(4) : "NA"} bestAsk=${
          Number.isFinite(bestAsk) ? bestAsk.toFixed(4) : "NA"
        }`
      );

      for (const tokenId of [upTokenId, downTokenId]) {
        const pos = await getPos(tokenId);

        if (pos > 0 && Number.isFinite(bestBid) && bestBid >= SELL_PRICE) {
          const qty = Math.min(pos, SELL_SHARES);
          if (qty > 0) await takerSell(tokenId, qty);
          continue;
        }

        if (pos < MAX_POS_EACH && Number.isFinite(bestAsk) && bestAsk <= BUY_PRICE) {
          await takerBuy(tokenId, BUY_USDC);
        }
      }
    } catch (e: any) {
      console.log(`[ERR] ${e?.message || e}`);
    }

    await sleep(POLL_MS);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
