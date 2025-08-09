import fs from "fs";
import fetch from "node-fetch";

const coins = [
  { id: "ethereum", symbol: "eth" },
  { id: "bitcoin", symbol: "btc" },
  { id: "dogecoin", symbol: "doge" }
];

// 时间段配置 - 使用免费market chart API
// 专业级数据密度配置
const periodConfigs = {
  '1h': { days: 1, points: 12 }, // 1小时走势：从24小时数据中取最近12个点
  '24h': { days: 1, points: 144 }, // 24小时走势：每10分钟一个点（专业级）
  '7d': { days: 7, points: 112 }, // 7天走势：每1.5小时一个点（适中密度）
  '30d': { days: 30, points: 120 }, // 30天走势：每6小时一个点（4倍密度）
  '1y': { days: 365, points: 365 } // 1年数据：使用历史数据文件，每日精度
};

async function fetchMarketChartData(coinId, period) {
  const config = periodConfigs[period];
  if (!config) {
    throw new Error(`Unsupported period: ${period}`);
  }

  console.log(`🔄 正在获取 ${coinId} ${period} 的市场图表数据...`);
  
  // 使用免费的CoinGecko Market Chart API
  const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${config.days}`;
  
  try {
    const res = await fetchWithRetry(url, 5);
    const data = await res.json();
    
    // 验证数据完整性
    if (!data.prices || !Array.isArray(data.prices) || data.prices.length === 0) {
      throw new Error(`Invalid market chart data received for ${coinId} ${period}`);
    }
    
    console.log(`✅ ${coinId} ${period} 市场图表数据获取成功，包含 ${data.prices.length} 个价格数据点`);
    return data;
  } catch (error) {
    console.error(`❌ 获取 ${coinId} ${period} 市场图表数据失败:`, error.message);
    throw error;
  }
}

async function fetchWithRetry(url, maxRetries = 5, delay = 5000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`🌐 API请求 (尝试 ${i + 1}/${maxRetries}): ${url}`);
      
      const response = await fetch(url, {
        timeout: 20000, // 20秒超时
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ETH-BTC-Chart-Tracker/1.0)',
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate'
        }
      });
      
      if (response.status === 429) {
        // API限制，等待更长时间
        const waitTime = Math.min(60000, delay * Math.pow(2, i)); // 最多等60秒
        console.log(`🛑 API限制，等待 ${waitTime/1000} 秒后重试...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      if (response.status === 401) {
        // 认证错误，尝试不同的请求方式
        console.log(`🔐 认证问题，等待后重试...`);
        await new Promise(resolve => setTimeout(resolve, delay * 2));
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      console.log(`⚠️  第 ${i + 1} 次请求失败: ${error.message}`);
      
      if (i === maxRetries - 1) {
        throw error;
      }
      
      const waitTime = Math.min(30000, delay * Math.pow(1.5, i));
      console.log(`⏳ ${waitTime/1000} 秒后重试...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

function processMarketChartData(marketData, period, coinSymbol, exchangeRate = 7.18) {
  const config = periodConfigs[period];
  const { prices } = marketData;
  
  // 使用传入的汇率数据
  const cnyRate = exchangeRate;
  
  // 处理不同时间段的数据采样
  let sampledData = [];
  
  if (period === '1h') {
    // 1小时走势：从24小时数据中取最近12个点（每5分钟间隔）
    const recentPrices = prices.slice(-12);
    sampledData = recentPrices.map(([timestamp, price]) => ({
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
      price_usd: Math.round(price * 100) / 100,
      price_cny: Math.round(price * cnyRate * 100) / 100
    }));
  } else {
    // 其他时间段：均匀采样
    const totalPoints = prices.length;
    const stepSize = Math.max(1, Math.floor(totalPoints / config.points));
    
    for (let i = 0; i < totalPoints; i += stepSize) {
      if (sampledData.length >= config.points) break;
      
      const [timestamp, price] = prices[i];
      sampledData.push({
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
        price_usd: Math.round(price * 100) / 100,
        price_cny: Math.round(price * cnyRate * 100) / 100
      });
    }
  }
  
  // 计算汇总统计
  const priceValues = sampledData.map(d => d.price_usd);
  const summary = {
    start_price: {
      usd: sampledData[0]?.price_usd || 0,
      cny: sampledData[0]?.price_cny || 0
    },
    end_price: {
      usd: sampledData[sampledData.length - 1]?.price_usd || 0,
      cny: sampledData[sampledData.length - 1]?.price_cny || 0
    },
    high_price: {
      usd: Math.max(...priceValues),
      cny: Math.round(Math.max(...priceValues) * cnyRate * 100) / 100
    },
    low_price: {
      usd: Math.min(...priceValues),
      cny: Math.round(Math.min(...priceValues) * cnyRate * 100) / 100
    },
    change_percent: 0
  };
  
  // 计算变化百分比
  if (summary.start_price.usd > 0) {
    summary.change_percent = parseFloat((
      ((summary.end_price.usd - summary.start_price.usd) / summary.start_price.usd) * 100
    ).toFixed(2));
  }
  
  return {
    coin: coinSymbol,
    period,
    interval: getIntervalLabel(period),
    data_type: "price",
    data: sampledData,
    summary,
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
}

function getIntervalLabel(period) {
  const labels = {
    '1h': '5m',
    '24h': '1h', 
    '7d': '4h',
    '30d': '1d',
    '1y': '7d'
  };
  return labels[period] || '1h';
}

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

// 生成合并的图表数据文件（新架构）
async function generateMergedChartFiles() {
  console.log(`🚀 开始生成合并架构的图表数据文件...`);
  
  const periods = ['24h', '7d', '30d', '1y'];
  const exchangeRate = await getExchangeRate();
  console.log(`💱 使用汇率: 1 USD = ${exchangeRate} CNY`);
  
  for (const period of periods) {
    try {
      console.log(`🔄 正在处理 ${period} 合并数据...`);
      
      const mergedData = {
        period: period,
        interval: getIntervalLabel(period),
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
      
      // 为每个币种获取数据
      for (const coin of coins) {
        try {
          console.log(`  📈 获取 ${coin.symbol.toUpperCase()} ${period} 数据...`);
          
          const marketData = await fetchMarketChartData(coin.id, period);
          const chartData = processMarketChartData(marketData, period, coin.symbol, exchangeRate);
          
          // 只保存币种特定的数据部分到合并结构中
          mergedData.coins[coin.symbol] = {
            data: chartData.data,
            summary: chartData.summary
          };
          
          console.log(`  ✅ ${coin.symbol.toUpperCase()} ${period} 数据处理完成 (${chartData.data.length}个数据点)`);
          
          // 添加延迟避免API限制
          await new Promise(resolve => setTimeout(resolve, 3000));
          
        } catch (error) {
          console.error(`  ❌ ${coin.symbol} ${period} 数据获取失败:`, error.message);
          // 继续处理其他币种
          continue;
        }
      }
      
      // 检查是否有成功的数据
      const successCoins = Object.keys(mergedData.coins).length;
      if (successCoins > 0) {
        // 保存合并的文件
        const filename = `public/chart-${period}.json`;
        fs.writeFileSync(filename, JSON.stringify(mergedData, null, 2));
        console.log(`✅ ${period} 合并数据已保存到 ${filename} (包含${successCoins}个币种)`);
      } else {
        console.error(`❌ ${period} 没有成功获取任何币种数据`);
      }
      
      // 添加更长延迟避免API限制
      console.log(`⏳ 等待10秒后处理下一个时间段...`);
      await new Promise(resolve => setTimeout(resolve, 10000));
      
    } catch (error) {
      console.error(`❌ 生成 ${period} 合并数据失败:`, error.message);
      continue;
    }
  }
  
  console.log(`🎉 合并图表数据文件生成完成！`);
}

// 动态图表数据API实现
async function generateChartDataAPI() {
  console.log(`🚀 开始生成图表数据，使用保守的API调用策略...`);
  
  // 分批处理，降低API压力
  const commonQueries = [
    { coin: 'eth', period: '24h' },  // 先生成最重要的数据
    { coin: 'btc', period: '24h' },
    { coin: 'eth', period: '7d' },
    { coin: 'btc', period: '7d' },
    { coin: 'eth', period: '1y' },
    { coin: 'btc', period: '1y' },
    { coin: 'eth', period: '1h' },   // 1小时数据放后面
    { coin: 'btc', period: '1h' },
    { coin: 'eth', period: '30d' },  // 30天数据最后
    { coin: 'btc', period: '30d' }
  ];
  
  const chartDataMap = {};
  
  for (const query of commonQueries) {
    try {
      console.log(`🚀 开始处理 ${query.coin.toUpperCase()} ${query.period} 图表数据...`);
      
      const marketData = await fetchMarketChartData(
        query.coin === 'eth' ? 'ethereum' : 'bitcoin', 
        query.period
      );
      
      const chartData = processMarketChartData(marketData, query.period, query.coin);
      const key = `${query.coin}_${query.period}`;
      chartDataMap[key] = chartData;
      
      console.log(`✅ 已生成 ${query.coin.toUpperCase()} ${query.period} 图表数据 (${chartData.data.length} 个数据点)`);
      
      // 添加更长延迟避免API限制
      console.log(`⏳ 等待10秒后处理下一个数据集...`);
      await new Promise(resolve => setTimeout(resolve, 10000));
    } catch (error) {
      console.error(`❌ 生成 ${query.coin} ${query.period} 数据失败:`, error.message);
      // 继续处理其他数据，不要因为一个失败就停止
      continue;
    }
  }
  
  // 检查是否有成功生成的数据
  const successCount = Object.keys(chartDataMap).length;
  console.log(`📊 成功生成 ${successCount}/10 个图表数据集`);
  
  if (successCount === 0) {
    console.error(`❌ 所有图表数据生成失败，请检查网络连接和API状态`);
    throw new Error('No chart data generated successfully');
  }
  
  // 保存预生成的图表数据
  fs.writeFileSync("public/chart-data-cache.json", JSON.stringify(chartDataMap, null, 2));
  
  // 创建简单的查询接口模拟器（实际部署时需要服务端支持）
  const apiSimulator = {
    note: "这是预生成的图表数据缓存。在实际部署时，需要服务端支持动态查询。",
    usage: "访问格式: chart-data-cache.json 然后客户端根据 coin 和 period 查找对应数据",
    available_queries: commonQueries,
    data: chartDataMap,
    generated_at: new Date().toISOString()
  };
  
  fs.writeFileSync("public/chart-data.json", JSON.stringify(apiSimulator, null, 2));
  
  console.log("📊 图表数据API缓存已生成");
  console.log(`📋 共生成 ${Object.keys(chartDataMap).length} 个图表数据集`);
}

// 单独更新特定时间段的合并数据
async function updateSpecificPeriod(period) {
  console.log(`🔄 更新 ${period} 时间段的合并图表数据...`);
  
  const exchangeRate = await getExchangeRate();
  console.log(`💱 使用汇率: 1 USD = ${exchangeRate} CNY`);
  
  const mergedData = {
    period: period,
    interval: getIntervalLabel(period),
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
      console.log(`  📈 更新 ${coin.symbol.toUpperCase()} ${period} 数据...`);
      
      const marketData = await fetchMarketChartData(coin.id, period);
      const chartData = processMarketChartData(marketData, period, coin.symbol, exchangeRate);
      
      // 保存到合并结构中
      mergedData.coins[coin.symbol] = {
        data: chartData.data,
        summary: chartData.summary
      };
      
      console.log(`  ✅ ${coin.symbol.toUpperCase()} ${period} 数据更新完成`);
      
      // 添加延迟避免API限制
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`  ❌ 更新 ${coin.symbol} ${period} 失败:`, error.message);
    }
  }
  
  // 检查是否有成功的数据
  const successCoins = Object.keys(mergedData.coins).length;
  if (successCoins > 0) {
    // 保存合并的文件
    const filename = `public/chart-${period}.json`;
    fs.writeFileSync(filename, JSON.stringify(mergedData, null, 2));
    console.log(`✅ ${period} 合并数据已更新到 ${filename} (包含${successCoins}个币种)`);
  } else {
    console.error(`❌ ${period} 没有成功更新任何币种数据`);
  }
}

// 命令行参数处理
const args = process.argv.slice(2);
const command = args[0];

if (command === 'merged' || !command) {
  generateMergedChartFiles(); // 默认使用新的合并架构
} else if (command === 'legacy') {
  generateChartDataAPI(); // 保留旧的缓存方式
} else if (command && periodConfigs[command]) {
  updateSpecificPeriod(command);
} else if (command) {
  console.error(`❌ 不支持的命令: ${command}`);
  console.log("支持的命令:");
  console.log("  merged - 生成合并架构的图表数据文件 (默认)");
  console.log("  legacy - 生成缓存的图表数据 (旧版)");
  console.log("  24h, 7d, 30d, 1y - 更新特定时间段的合并数据");
}