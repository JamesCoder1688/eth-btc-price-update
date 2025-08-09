import fs from "fs";
import fetch from "node-fetch";

const BACKUP_RATE = 7.18; // 备用汇率
const MAX_RETRIES = 3;

async function fetchExchangeRate() {
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      console.log(`🔄 正在获取USD到CNY汇率... (尝试 ${i + 1}/${MAX_RETRIES})`);
      
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
        timeout: 10000,
        headers: {
          'User-Agent': 'ETH-BTC-DOGE-Price-Tracker/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.rates || !data.rates.CNY) {
        throw new Error('Invalid response: missing CNY rate');
      }

      const usdToCny = parseFloat(data.rates.CNY.toFixed(4));
      
      console.log(`✅ 汇率获取成功: 1 USD = ${usdToCny} CNY`);
      
      return {
        usd_to_cny: usdToCny,
        updated_at: new Date().toISOString(),
        source: "exchangerate-api.com",
        status: "success"
      };

    } catch (error) {
      console.log(`⚠️  第 ${i + 1} 次尝试失败: ${error.message}`);
      
      if (i === MAX_RETRIES - 1) {
        console.log(`❌ 所有尝试失败，使用备用汇率: ${BACKUP_RATE}`);
        return {
          usd_to_cny: BACKUP_RATE,
          updated_at: new Date().toISOString(),
          source: "backup-rate",
          status: "fallback",
          error: error.message
        };
      }
      
      // 等待后重试
      const delay = Math.pow(2, i) * 1000; // 指数退避：1s, 2s, 4s
      console.log(`⏳ ${delay/1000} 秒后重试...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

async function updateExchangeRate() {
  try {
    const exchangeRateData = await fetchExchangeRate();
    
    // 保存到文件
    fs.writeFileSync("public/exchange-rate.json", JSON.stringify(exchangeRateData, null, 2));
    
    if (exchangeRateData.status === "success") {
      console.log(`✅ 汇率缓存已更新: 1 USD = ${exchangeRateData.usd_to_cny} CNY`);
    } else {
      console.log(`⚠️  使用备用汇率: 1 USD = ${exchangeRateData.usd_to_cny} CNY`);
    }
    
  } catch (error) {
    console.error('❌ 汇率更新失败:', error.message);
    process.exit(1);
  }
}

updateExchangeRate();