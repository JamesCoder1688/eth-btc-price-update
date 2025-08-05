import fs from "fs";
import fetch from "node-fetch";

const coins = [
  { id: "ethereum", symbol: "eth" },
  { id: "bitcoin", symbol: "btc" }
];

async function fetchPriceData(coinId) {
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd,cny&include_24hr_change=true`;
  const res = await fetch(url);
  const data = await res.json();
  return data[coinId];
}

async function update() {
  const result = {};

  for (const coin of coins) {
    const price = await fetchPriceData(coin.id);
    result[coin.symbol] = {
      usd: price.usd,
      usd_change_24h: price.usd_24h_change,
      cny: price.cny,
      cny_change_24h: price.cny_24h_change
    };
  }

  result.last_updated = new Date().toISOString();

  fs.writeFileSync("public/eth-btc-price.json", JSON.stringify(result, null, 2));
  console.log("✅ 实时价格已更新");
}

update();
