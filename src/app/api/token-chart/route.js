const TOKEN_ADDRESS = "0xf38671eA6290b43F30f2b685e86CDD125B86e13a";
const PAIR_ADDRESS = "0x6f15abBe3e968FeF47A26Ad8A244F843c717Ff84";
const PAIR_URL = "https://dexscreener.com/base/0x6f15abbe3e968fef47a26ad8a244f843c717ff84";

const TIMEFRAMES = {
  hour: { ohlcv: "hour", limit: 48, label: "Hourly" },
  day: { ohlcv: "day", limit: 30, label: "Daily" },
};

export const dynamic = "force-dynamic";

export async function GET(request) {
  const params = request.nextUrl.searchParams;
  const timeframe = TIMEFRAMES[params.get("timeframe")] ? params.get("timeframe") : "day";
  const { ohlcv, limit } = TIMEFRAMES[timeframe];

  const url = `https://api.geckoterminal.com/api/v2/networks/base/pools/${PAIR_ADDRESS}/ohlcv/${ohlcv}?limit=${limit}`;

  let response;
  try {
    response = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });
  } catch {
    return Response.json({ error: "Could not reach the price feed." }, { status: 502 });
  }

  if (!response.ok) {
    return Response.json({ error: "Price feed unavailable." }, { status: 502 });
  }

  let data;
  try {
    data = await response.json();
  } catch {
    return Response.json({ error: "Malformed price feed." }, { status: 502 });
  }

  const raw = data?.data?.attributes?.ohlcv_list;
  if (!Array.isArray(raw) || raw.length === 0) {
    return Response.json({ error: "No chart data available." }, { status: 404 });
  }

  const candles = raw.map(([timestamp, open, high, low, close, volume]) => ({
    timestamp,
    open: Number(open),
    high: Number(high),
    low: Number(low),
    close: Number(close),
    volume: Number(volume),
  }));

  return Response.json(
    {
      symbol: "USDXSMART",
      address: TOKEN_ADDRESS,
      timeframe,
      pairUrl: PAIR_URL,
      candles,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    }
  );
}
