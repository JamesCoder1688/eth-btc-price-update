import fs from "fs";
import fetch from "node-fetch";

const VS_CURRENCY = "usd,cny"; // 获取美元和人民币价格
const DAYS = 365;
const INTERVAL = "daily";

const coins = [
  { id: "ethereum", file: "eth-history.json" },
  { id: "bitcoin", file: "btc-history.json" }
];

async function fetchHistory(coinId) {
  const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${DAYS}&interval=${INTERVAL}`;
  const res = await fetch(url);
  const usdData = await res.json();

  const urlCNY = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=cny&days=${DAYS}&interval=${INTERVAL}`;
  const resCNY = await fetch(urlCNY);
  const cnyData = await resCNY.json();

  return usdData.prices.map(([timestamp, usdPrice], index) => {
    const cnyPrice = cnyData.prices[index]?.[1] || null;
    return {
      date: new Date(timestamp).toISOString().split("T")[0],
      usd: parseFloat(usdPrice.toFixed(2)),
      cny: parseFloat(cnyPrice?.toFixed(2))
    };
  });
}

async function update() {
  for (const coin of coins) {
    const history = await fetchHistory(coin.id);
    fs.writeFileSync(`public/${coin.file}`, JSON.stringify(history, null, 2));
    console.log(`✅ ${coin.file} 已更新`);
  }
}

update();
