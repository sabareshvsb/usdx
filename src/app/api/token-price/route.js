const TOKEN_ADDRESS = "0xf38671eA6290b43F30f2b685e86CDD125B86e13a";
const DEXSCREENER_URL = `https://api.dexscreener.com/latest/dex/tokens/${TOKEN_ADDRESS}`;

export async function GET() {
  try {
    const response = await fetch(DEXSCREENER_URL, { next: { revalidate: 60 } });
    if (!response.ok) {
      return Response.json({ error: "Price feed unavailable." }, { status: 502 });
    }

    const data = await response.json();
    const pairs = Array.isArray(data.pairs) ? data.pairs : [];
    const pair = pairs.find((p) => p.baseToken && p.baseToken.address.toLowerCase() === TOKEN_ADDRESS.toLowerCase()) || pairs[0];

    if (!pair) {
      return Response.json({ error: "No trading pair found." }, { status: 404 });
    }

    const priceUsd = Number(pair.priceUsd);
    const priceChange = (pair.priceChange && pair.priceChange.h24) || 0;
    const liquidityUsd = pair.liquidity && pair.liquidity.usd ? Number(pair.liquidity.usd) : 0;
    const volume24h = pair.volume && pair.volume.h24 ? Number(pair.volume.h24) : 0;

    return Response.json(
      {
        symbol: pair.baseToken.symbol,
        name: pair.baseToken.name,
        priceUsd: Number.isFinite(priceUsd) ? priceUsd : 0,
        priceChange24h: Number.isFinite(priceChange) ? priceChange : 0,
        liquidityUsd,
        volume24h,
        chain: pair.chainId,
        pairAddress: pair.pairAddress,
        pairUrl: pair.url || null,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (err) {
    return Response.json({ error: `Price feed failed: ${err.message}` }, { status: 502 });
  }
}
