# ETH/BTC/DOGE价格数据API调用指南

## 🌐 基础URL
```
https://eth-btc-price-update.pages.dev
```

## 📊 数据文件结构

**🆕 最新架构特性：**
- 支持ETH、BTC、DOGE三种主流币种
- 合并文件结构，减少API调用
- 分层汇率策略，平衡精度与成本
- 专业级数据密度，适合交易分析

### 1. 实时价格数据
**文件URL**: `/current-prices.json`
**更新频率**: 每6分钟
**用途**: 显示当前ETH、BTC、DOGE的实时价格、变化率、市值等
**数据生成脚本**: `scripts/update-price.js`

#### 🔍 数据生成方式详解：
- **数据源**: CoinGecko API (`api.coingecko.com`)
- **支持币种**: ETH (ethereum), BTC (bitcoin), DOGE (dogecoin)
- **主要API**: `/simple/price` (实时价格) + `/market_chart` (历史变化计算)
- **汇率策略**: 实时获取USD和CNY双币种价格（高精度）
- **变化率计算**:
  - `1h/24h变化`: 直接从CoinGecko API获取
  - `7d/30d/1y变化`: 通过历史数据计算 (当前价格 vs N天前价格)
- **市值和交易量**: 直接从API获取24小时数据
- **时间戳**: 使用Asia/Shanghai时区

```javascript
// 调用示例
const response = await fetch('https://eth-btc-price-update.pages.dev/current-prices.json');
const data = await response.json();

console.log('ETH当前价格:', data.eth.current_price.usd);
console.log('BTC 24小时变化:', data.btc.changes['24h']);
console.log('DOGE当前价格:', data.doge.current_price.usd);
```

**数据格式**:
```json
{
  "eth": {
    "current_price": { "usd": 3918.4, "cny": 28143 },
    "changes": { "1h": 5.93, "24h": 5.93, "7d": 6, "30d": 49.8, "1y": 45.94 },
    "volume_24h": { "usd": 36963102768, "cny": 265478920276 },
    "market_cap": { "usd": 472916326647, "cny": 3396611928555 }
  },
  "btc": { /* 相同结构 */ },
  "doge": { /* 相同结构 */ },
  "last_updated": "2025/08/08 15:56:09"
}
```

### 2. 图表数据文件（合并架构）

**数据生成脚本**: `scripts/update-chart-data.js`

#### 🔍 图表数据生成方式详解：
- **数据源**: CoinGecko Market Chart API (`/coins/{id}/market_chart`)
- **架构特点**: 多币种合并到单文件，减少API调用量
- **支持币种**: ETH、BTC、DOGE三种币种统一管理
- **汇率策略**: USD数据 + 缓存汇率计算CNY（成本优化）
- **采样策略**（专业级密度）:
  - `24小时图`: 144个点（每10分钟1个点）⭐ 专业交易级
  - `7天图`: 112个点（每1.5小时1个点）🔥 极高密度
  - `30天图`: 120个点（每6小时1个点）🔥 超高密度
  - `1年图`: 使用历史数据文件，365个点（每日1个点）
- **数据处理**: 包含起始、结束、最高、最低价格统计和变化百分比

#### 合并图表数据文件
| 时间段 | 文件URL | 更新频率 | 数据点数量 | 实际间隔 | 包含币种 | 图表级别 |
|--------|---------|----------|------------|----------|----------|----------|
| 24小时 | `/chart-24h.json` | 每1小时 | **144个点** | 10分钟 | ETH+BTC+DOGE | ⭐ **专业交易级** |
| 7天 | `/chart-7d.json` | 每日1次 | **112个点** | 1.5小时 | ETH+BTC+DOGE | 🔥 **极高密度级** |
| 30天 | `/chart-30d.json` | 每日1次 | **120个点** | 6小时 | ETH+BTC+DOGE | 🔥 **超高密度级** |
| **1年（精密）** | `/chart-1y.json` | 每日1次 | **365个点** | 1天 | ETH+BTC+DOGE | 🏆 **最高精度** |

**合并图表数据格式**:
```json
{
  "period": "24h",
  "interval": "10m",
  "data_type": "price",
  "coins": {
    "eth": {
      "data": [
        {
          "timestamp": 1723003200,
          "datetime": "2025-08-06 00:00:00",
          "price_usd": 3587.16,
          "price_cny": 25771
        }
        // ... 144个数据点
      ],
      "summary": {
        "start_price": { "usd": 3587.16, "cny": 25771 },
        "end_price": { "usd": 3592.45, "cny": 25809 },
        "high_price": { "usd": 3620.80, "cny": 26013 },
        "low_price": { "usd": 3568.90, "cny": 25640 },
        "change_percent": 0.15
      }
    },
    "btc": { /* 相同结构 */ },
    "doge": { /* 相同结构 */ }
  },
  "last_updated": "2025/08/06 03:15:54"
}
```

### 3. 汇率缓存文件
**文件URL**: `/exchange-rate.json`
**更新频率**: 每日1次
**用途**: 缓存USD到CNY的实时汇率，供图表数据计算使用
**数据生成脚本**: `scripts/update-exchange-rate.js`

#### 🔍 汇率数据生成方式详解：
- **数据源**: Exchange Rate API (`api.exchangerate-api.com`)
- **更新策略**: 每日凌晨1点更新一次
- **备用机制**: API失败时使用固定汇率7.18
- **使用场景**: 图表数据的CNY价格计算

**汇率数据格式**:
```json
{
  "usd_to_cny": 7.23,
  "updated_at": "2025-08-08T01:00:00.000Z",
  "source": "exchangerate-api.com"
}
```

```javascript
// 调用示例
const response = await fetch('https://eth-btc-price-update.pages.dev/chart-data.json');
const data = await response.json();

// 查看所有可用的查询组合
console.log('可用查询:', data.available_queries);
```

**数据格式**:
```json
{
  "note": "这是预生成的图表数据缓存。在实际部署时，需要服务端支持动态查询。",
  "usage": "访问格式: chart-data-cache.json 然后客户端根据 coin 和 period 查找对应数据",
  "available_queries": [
    { "coin": "eth", "period": "1h" },
    { "coin": "eth", "period": "24h" },
    { "coin": "btc", "period": "1y" }
  ],
  "data": {},
  "generated_at": "2025-08-08T07:25:56.030Z"
}
```

### 4. 图表数据缓存文件
**文件URL**: `/chart-data-cache.json`
**更新频率**: 每5分钟
**用途**: 缓存所有图表数据，优化查询性能
**数据生成脚本**: `scripts/update-chart-data.js` (generateChartDataAPI函数)

#### 🔍 数据生成方式详解：
- **功能**: 性能优化缓存，将所有图表数据集中存储
- **数据结构**: `{coin}_{period}` 为key的对象集合
- **生成策略**: 
  - 按优先级顺序生成：24h → 7d → 1y → 1h → 30d
  - 包含延迟机制避免API限制（每次请求间隔10秒）
  - 支持部分失败容错（一个失败不影响其他数据生成）
- **数据来源**: 与独立图表文件使用相同的CoinGecko API数据
- **使用场景**: 客户端可一次请求获取所有图表数据，减少HTTP请求次数

### 5. 历史数据文件（保持兼容）
**数据生成脚本**: `scripts/update-history.js`

#### 🔍 历史数据生成方式详解：
- **数据源**: CoinGecko Market Chart API (`/market_chart?days=365&interval=daily`)
- **时间范围**: 完整365天历史数据
- **数据特点**:
  - **每日价格**: UTC 00:00时刻的价格快照（非平均价格）
  - **双币种**: 同时获取USD和CNY价格数据
  - **数据量**: 约1831条记录（覆盖完整一年）
- **更新机制**: 每日更新，添加最新一天数据
- **用途**: 长期趋势分析、历史价格查询

#### 文件详情：
- **ETH历史**: `/eth-history.json` - 每日更新，1831条记录
- **BTC历史**: `/btc-history.json` - 每日更新，1831条记录

#### 数据格式：
```json
[
  {
    "date": "2024-08-09",
    "usd": 61859.03,
    "cny": 443832.37
  }
]
```

## 💻 网站集成示例

### React/Next.js 示例

```javascript
// hooks/useCryptoData.js
import { useState, useEffect } from 'react';

const BASE_URL = 'https://eth-btc-price-update.pages.dev';

export const useCryptoData = () => {
  const [priceData, setPriceData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPriceData = async () => {
      try {
        const response = await fetch(`${BASE_URL}/eth-btc-price.json`);
        const data = await response.json();
        setPriceData(data);
      } catch (error) {
        console.error('获取价格数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPriceData();
    // 每30秒刷新一次
    const interval = setInterval(fetchPriceData, 30000);
    return () => clearInterval(interval);
  }, []);

  return { priceData, loading };
};

export const useChartData = (coin, period) => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const response = await fetch(`${BASE_URL}/${coin}-chart-${period}.json`);
        const data = await response.json();
        setChartData(data);
      } catch (error) {
        console.error(`获取${coin} ${period}图表数据失败:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [coin, period]);

  return { chartData, loading };
};
```

### 使用示例组件

```jsx
// components/PriceDisplay.jsx
import { useCryptoData } from '../hooks/useCryptoData';

export default function PriceDisplay() {
  const { priceData, loading } = useCryptoData();

  if (loading) return <div>加载中...</div>;

  return (
    <div className="price-container">
      {/* ETH价格卡片 */}
      <div className="price-card">
        <h3>以太坊 (ETH)</h3>
        <div className="price">${priceData.eth.current_price.usd}</div>
        <div className="change">
          24h: {priceData.eth.changes['24h'] >= 0 ? '+' : ''}
          {priceData.eth.changes['24h']}%
        </div>
      </div>

      {/* BTC价格卡片 */}
      <div className="price-card">
        <h3>比特币 (BTC)</h3>
        <div className="price">${priceData.btc.current_price.usd}</div>
        <div className="change">
          24h: {priceData.btc.changes['24h'] >= 0 ? '+' : ''}
          {priceData.btc.changes['24h']}%
        </div>
      </div>
    </div>
  );
}
```

```jsx
// components/PriceChart.jsx
import { useChartData } from '../hooks/useCryptoData';

export default function PriceChart({ coin = 'eth', period = '24h' }) {
  const { chartData, loading } = useChartData(coin, period);

  if (loading) return <div>加载图表数据...</div>;

  return (
    <div className="chart-container">
      <h3>{coin.toUpperCase()} {period} 价格走势</h3>
      <div className="chart-summary">
        <span>起始: ${chartData.summary.start_price.usd}</span>
        <span>结束: ${chartData.summary.end_price.usd}</span>
        <span className={chartData.summary.change_percent >= 0 ? 'positive' : 'negative'}>
          变化: {chartData.summary.change_percent}%
        </span>
      </div>
      
      {/* 这里集成你的图表库，如Chart.js, ECharts等 */}
      <div className="chart">
        {chartData.data.map((point, index) => (
          <div key={index} className="data-point">
            {point.datetime}: ${point.price_usd}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Vanilla JavaScript 示例

```javascript
// 获取实时价格
async function fetchCurrentPrices() {
  try {
    const response = await fetch('https://eth-btc-price-update.pages.dev/eth-btc-price.json');
    const data = await response.json();
    
    // 更新ETH价格
    document.getElementById('eth-price').textContent = `$${data.eth.current_price.usd}`;
    document.getElementById('eth-change').textContent = `${data.eth.changes['24h']}%`;
    
    // 更新BTC价格
    document.getElementById('btc-price').textContent = `$${data.btc.current_price.usd}`;
    document.getElementById('btc-change').textContent = `${data.btc.changes['24h']}%`;
    
  } catch (error) {
    console.error('获取价格失败:', error);
  }
}

// 获取图表数据
async function fetchChartData(coin, period) {
  try {
    const response = await fetch(`https://eth-btc-price-update.pages.dev/${coin}-chart-${period}.json`);
    const data = await response.json();
    
    // 处理图表数据
    const prices = data.data.map(point => point.price_usd);
    const timestamps = data.data.map(point => new Date(point.timestamp * 1000));
    
    // 这里可以用Chart.js或其他图表库渲染
    renderChart(prices, timestamps);
    
  } catch (error) {
    console.error(`获取${coin} ${period}数据失败:`, error);
  }
}

// 页面加载时执行
document.addEventListener('DOMContentLoaded', function() {
  fetchCurrentPrices();
  fetchChartData('eth', '24h');
  
  // 每30秒更新一次价格
  setInterval(fetchCurrentPrices, 30000);
});
```

## 🎯 推荐使用策略

### ETH网站推荐调用
1. **首页价格显示**: `/eth-btc-price.json` (关注ETH数据)
2. **价格走势图**: `/eth-chart-24h.json` (24小时趋势)
3. **历史分析**: `/eth-chart-7d.json` 或 `/eth-chart-30d.json`

### BTC网站推荐调用
1. **首页价格显示**: `/eth-btc-price.json` (关注BTC数据)
2. **价格走势图**: `/btc-chart-24h.json` (24小时趋势)
3. **长期趋势**: `/btc-chart-1y.json` (年度走势)

### 缓存建议（专业级配置）
- **实时价格**: 缓存30秒-1分钟
- **图表数据**: 根据更新频率和数据密度设置缓存时间
  - **24小时图**: 缓存10-15分钟（144个点，专业级密度）
  - **7天图**: 缓存30-60分钟（168个点，极高密度）
  - **30天图**: 缓存2-4小时（120个点，超高密度级）
  - **1年概览图**: 缓存12小时（52个点）
  - **1年精密图**: 缓存24小时（365个点，最高精度）

## ⚠️ 重要说明

### 数据质量与限制
1. **数据延迟**: 所有数据都有1-5分钟的延迟（非实时）
2. **历史价格特性**: 历史数据中的每日价格是UTC 00:00时刻的价格快照，不是平均价格或收盘价
3. **CNY汇率**: 
   - 实时价格数据：从CoinGecko实时获取CNY汇率
   - 图表数据：使用固定汇率7.18估算（临时方案，可能存在偏差）
4. **专业级密度优势**: 
   - 24小时图提供**每10分钟精度**，适合专业交易分析
   - 7天图密度提升**4倍**（每小时精度），30天图密度提升**4倍**，显示超详细的价格波动
   - 1年精密图提供**每日精度**，支持深度技术分析
5. **API限制**: 使用CoinGecko免费版API，月调用量约16,000次，接近免费限额

### 技术注意事项
1. **错误处理**: 始终包含try-catch来处理网络错误
2. **数据验证**: 检查返回的数据格式是否正确
3. **CORS**: 所有API都支持跨域访问
4. **免费服务**: 这是免费的API服务，请合理使用
5. **容错机制**: 所有脚本都包含重试机制和指数退避策略

## 🔗 快速测试链接

点击以下链接直接查看数据格式：

### 🔴 主要数据源
- [实时价格数据 (ETH+BTC+DOGE)](https://eth-btc-price-update.pages.dev/current-prices.json)
- [汇率缓存数据](https://eth-btc-price-update.pages.dev/exchange-rate.json)

### 📊 合并图表数据
- [24小时图表 (所有币种)](https://eth-btc-price-update.pages.dev/chart-24h.json)  
- [7天图表 (所有币种)](https://eth-btc-price-update.pages.dev/chart-7d.json)
- [30天图表 (所有币种)](https://eth-btc-price-update.pages.dev/chart-30d.json)
- [1年图表 (所有币种)](https://eth-btc-price-update.pages.dev/chart-1y.json)

---
*最后更新: 2025年8月8日*
*数据来源: CoinGecko API*