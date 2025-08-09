import fs from "fs";
import fetch from "node-fetch";

const VS_CURRENCY = "usd,cny"; // 获取美元和人民币价格
const DAYS = 365;
const INTERVAL = "daily";

const coins = [
  { id: "ethereum", symbol: "eth" },
  { id: "bitcoin", symbol: "btc" },
  { id: "dogecoin", symbol: "doge" }
];

// 读取汇率缓存
async function getExchangeRate() {
  try {
    const exchangeRateData = JSON.parse(fs.readFileSync("public/exchange-rate.json", "utf8"));
    return exchangeRateData.usd_to_cny || 7.18;
  } catch (error) {
    console.log(`⚠️  读取汇率缓存失败，使用默认汇率7.18: ${error.message}`);
    return 7.18;
  }
}

async function fetchHistory(coinId, coinSymbol, exchangeRate) {
  console.log(`🔄 正在获取 ${coinSymbol.toUpperCase()} 1年历史数据...`);
  
  const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${DAYS}&interval=${INTERVAL}`;
  const res = await fetch(url, {
    timeout: 20000,
    headers: {
      'User-Agent': 'ETH-BTC-DOGE-Price-Tracker/1.0'
    }
  });
  
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  
  const usdData = await res.json();
  
  // 验证数据完整性
  if (!usdData.prices || !Array.isArray(usdData.prices) || usdData.prices.length === 0) {
    throw new Error(`Invalid market chart data received for ${coinId}`);
  }
  
  // 处理数据，使用缓存汇率计算CNY价格
  const processedData = usdData.prices.map(([timestamp, usdPrice]) => {
    const cnyPrice = usdPrice * exchangeRate;
    return {
      timestamp: Math.floor(timestamp / 1000),
      datetime: new Date(timestamp).toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      price_usd: Math.round(usdPrice * 100) / 100,
      price_cny: Math.round(cnyPrice * 100) / 100
    };
  });
  
  // 计算汇总统计
  const priceValues = processedData.map(d => d.price_usd);
  const summary = {
    start_price: {
      usd: processedData[0]?.price_usd || 0,
      cny: processedData[0]?.price_cny || 0
    },
    end_price: {
      usd: processedData[processedData.length - 1]?.price_usd || 0,
      cny: processedData[processedData.length - 1]?.price_cny || 0
    },
    high_price: {
      usd: Math.max(...priceValues),
      cny: Math.round(Math.max(...priceValues) * exchangeRate * 100) / 100
    },
    low_price: {
      usd: Math.min(...priceValues),
      cny: Math.round(Math.min(...priceValues) * exchangeRate * 100) / 100
    },
    change_percent: 0
  };
  
  // 计算变化百分比
  if (summary.start_price.usd > 0) {
    summary.change_percent = parseFloat((
      ((summary.end_price.usd - summary.start_price.usd) / summary.start_price.usd) * 100
    ).toFixed(2));
  }
  
  console.log(`✅ ${coinSymbol.toUpperCase()} 1年历史数据获取成功，包含 ${processedData.length} 个数据点`);
  
  return {
    data: processedData,
    summary
  };
}

async function update() {
  console.log('🚀 开始生成合并的1年图表数据...');
  
  const exchangeRate = await getExchangeRate();
  console.log(`💱 使用汇率: 1 USD = ${exchangeRate} CNY`);
  
  const mergedData = {
    period: "1y",
    interval: "1d",
    data_type: "price",
    coins: {},
    last_updated: new Date().toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  };
  
  for (const coin of coins) {
    try {
      const historyData = await fetchHistory(coin.id, coin.symbol, exchangeRate);
      
      // 保存到合并结构中
      mergedData.coins[coin.symbol] = {
        data: historyData.data,
        summary: historyData.summary
      };
      
      console.log(`✅ ${coin.symbol.toUpperCase()} 1年数据处理完成`);
      
      // 添加延迟避免API限制
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`❌ 获取 ${coin.symbol} 1年数据失败:`, error.message);
      // 继续处理其他币种
      continue;
    }
  }
  
  // 检查是否有成功的数据
  const successCoins = Object.keys(mergedData.coins).length;
  if (successCoins > 0) {
    // 保存合并的文件
    const filename = "public/chart-1y.json";
    fs.writeFileSync(filename, JSON.stringify(mergedData, null, 2));
    console.log(`✅ 1年合并数据已保存到 ${filename} (包含${successCoins}个币种)`);
  } else {
    console.error('❌ 没有成功获取任何币种的1年数据');
  }
}

update();
