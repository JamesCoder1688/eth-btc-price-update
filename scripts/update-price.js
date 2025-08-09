import fs from "fs";
import fetch from "node-fetch";

const coins = [
  { id: "ethereum", symbol: "eth" },
  { id: "bitcoin", symbol: "btc" },
  { id: "dogecoin", symbol: "doge" }
];

async function fetchPriceData(coinId) {
  try {
    console.log(`🔄 正在获取 ${coinId} 的价格数据...`);
    
    // 获取基础价格和24小时变化数据
    const priceUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd,cny&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`;
    const priceRes = await fetchWithRetry(priceUrl, 3);
    const priceData = await priceRes.json();
    
    console.log(`✅ ${coinId} 基础价格数据获取成功`);
    
    // 获取历史数据以计算多时间段变化
    console.log(`🔄 正在获取 ${coinId} 的历史数据...`);
    const historyUrl = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=365&interval=daily`;
    const historyRes = await fetchWithRetry(historyUrl, 3);
    const historyData = await historyRes.json();
    
    console.log(`✅ ${coinId} 历史数据获取成功`);
    
    const currentPrice = priceData[coinId].usd;
    const prices = historyData.prices || [];
    const now = Date.now();
    
    // 计算不同时间段的价格变化
    const changes = {
      '1h': priceData[coinId].usd_24h_change || 0, // 临时使用24h数据，实际需要1h数据
      '24h': priceData[coinId].usd_24h_change || 0,
      '7d': prices.length > 0 ? calculatePriceChange(prices, currentPrice, now, 7) : 0,
      '30d': prices.length > 0 ? calculatePriceChange(prices, currentPrice, now, 30) : 0,
      '1y': prices.length > 0 ? calculatePriceChange(prices, currentPrice, now, 365) : 0
    };
    
    return {
      ...priceData[coinId],
      price_changes: changes
    };
  } catch (error) {
    console.error(`❌ 获取 ${coinId} 数据失败:`, error.message);
    throw error;
  }
}

async function fetchWithRetry(url, maxRetries = 3, delay = 2000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, {
        timeout: 10000, // 10秒超时
        headers: {
          'User-Agent': 'ETH-BTC-Price-Tracker/1.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      console.log(`⚠️  第 ${i + 1} 次请求失败: ${error.message}`);
      
      if (i === maxRetries - 1) {
        throw error;
      }
      
      console.log(`⏳ ${delay/1000} 秒后重试...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 1.5; // 指数退避
    }
  }
}

function calculatePriceChange(prices, currentPrice, currentTime, daysAgo) {
  const targetTime = currentTime - (daysAgo * 24 * 60 * 60 * 1000);
  
  // 找到最接近目标时间的价格数据
  let closestPrice = null;
  let minDiff = Infinity;
  
  for (const [timestamp, price] of prices) {
    const diff = Math.abs(timestamp - targetTime);
    if (diff < minDiff) {
      minDiff = diff;
      closestPrice = price;
    }
  }
  
  if (closestPrice && closestPrice > 0) {
    return ((currentPrice - closestPrice) / closestPrice) * 100;
  }
  return 0;
}

async function update() {
  const result = {};
  let successCount = 0;

  for (const coin of coins) {
    try {
      const price = await fetchPriceData(coin.id);
      
      // 构建增强版价格数据结构
      result[coin.symbol] = {
        current_price: {
          usd: price.usd,
          cny: price.cny
        },
        changes: {
          '1h': parseFloat((price.price_changes['1h'] || 0).toFixed(2)),
          '24h': parseFloat((price.price_changes['24h'] || 0).toFixed(2)),
          '7d': parseFloat((price.price_changes['7d'] || 0).toFixed(2)),
          '30d': parseFloat((price.price_changes['30d'] || 0).toFixed(2)),
          '1y': parseFloat((price.price_changes['1y'] || 0).toFixed(2))
        },
        volume_24h: {
          usd: price.usd_24h_vol || 0,
          cny: Math.round((price.usd_24h_vol || 0) * (price.cny / price.usd))
        },
        market_cap: {
          usd: price.usd_market_cap || 0,
          cny: Math.round((price.usd_market_cap || 0) * (price.cny / price.usd))
        }
      };
      successCount++;
      console.log(`✅ ${coin.symbol.toUpperCase()} 数据处理成功`);
    } catch (error) {
      console.error(`❌ ${coin.symbol.toUpperCase()} 数据获取失败，跳过: ${error.message}`);
      // 继续处理下一个币种
      continue;
    }
  }
  
  // 检查是否有成功的数据
  if (successCount === 0) {
    console.error('❌ 所有币种数据获取失败，不生成文件');
    return;
  }

  result.last_updated = new Date().toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  fs.writeFileSync("public/current-prices.json", JSON.stringify(result, null, 2));
  console.log(`✅ 实时价格数据已更新 (${successCount}个币种)`);
  
  // 显示成功获取的币种数据
  if (result.eth) console.log(`📊 ETH: $${result.eth.current_price.usd} (24h: ${result.eth.changes['24h']}%)`);
  if (result.btc) console.log(`📊 BTC: $${result.btc.current_price.usd} (24h: ${result.btc.changes['24h']}%)`);
  if (result.doge) console.log(`📊 DOGE: $${result.doge.current_price.usd} (24h: ${result.doge.changes['24h']}%)`);
  
  console.log(`📋 数据文件已保存到: public/current-prices.json`);
}

update();
