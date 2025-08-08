# ETH/BTC价格数据API调用指南

## 🌐 基础URL
```
https://eth-btc-price-update.pages.dev
```

## 📊 数据文件结构

### 1. 实时价格数据
**文件URL**: `/eth-btc-price.json`
**更新频率**: 每5分钟
**用途**: 显示当前ETH和BTC的实时价格、变化率、市值等

```javascript
// 调用示例
const response = await fetch('https://eth-btc-price-update.pages.dev/eth-btc-price.json');
const data = await response.json();

console.log('ETH当前价格:', data.eth.current_price.usd);
console.log('BTC 24小时变化:', data.btc.changes['24h']);
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
  "last_updated": "2025/08/08 15:56:09"
}
```

### 2. 图表数据文件

#### ETH图表数据
| 时间段 | 文件URL | 更新频率 | 数据点数量 |
|--------|---------|----------|------------|
| 1小时 | `/eth-chart-1h.json` | 每5分钟 | 12个点 |
| 24小时 | `/eth-chart-24h.json` | 每15分钟 | 24个点 |
| 7天 | `/eth-chart-7d.json` | 每小时 | 42个点 |
| 30天 | `/eth-chart-30d.json` | 每4小时 | 30个点 |
| 1年 | `/eth-chart-1y.json` | 每日 | 52个点 |

#### BTC图表数据
| 时间段 | 文件URL | 更新频率 | 数据点数量 |
|--------|---------|----------|------------|
| 1小时 | `/btc-chart-1h.json` | 每5分钟 | 12个点 |
| 24小时 | `/btc-chart-24h.json` | 每15分钟 | 24个点 |
| 7天 | `/btc-chart-7d.json` | 每小时 | 42个点 |
| 30天 | `/btc-chart-30d.json` | 每4小时 | 30个点 |
| 1年 | `/btc-chart-1y.json` | 每日 | 52个点 |

**图表数据格式**:
```json
{
  "coin": "eth",
  "period": "24h",
  "interval": "1h",
  "data_type": "price",
  "data": [
    {
      "timestamp": 1723003200,
      "datetime": "2025-08-06 00:00:00",
      "price_usd": 3587.16,
      "price_cny": 25771
    }
  ],
  "summary": {
    "start_price": { "usd": 3587.16, "cny": 25771 },
    "end_price": { "usd": 3592.45, "cny": 25809 },
    "high_price": { "usd": 3620.80, "cny": 26013 },
    "low_price": { "usd": 3568.90, "cny": 25640 },
    "change_percent": 0.15
  },
  "last_updated": "2025/08/06 03:15:54"
}
```

### 3. 历史数据文件（保持兼容）
- **ETH历史**: `/eth-history.json` - 每日更新
- **BTC历史**: `/btc-history.json` - 每日更新

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

### 缓存建议
- **实时价格**: 缓存30秒-1分钟
- **图表数据**: 根据更新频率设置缓存时间
  - 1小时图: 缓存5分钟
  - 24小时图: 缓存15分钟
  - 7天图: 缓存1小时
  - 长期图: 缓存4小时

## ⚠️ 注意事项

1. **错误处理**: 始终包含try-catch来处理网络错误
2. **数据验证**: 检查返回的数据格式是否正确
3. **CORS**: 所有API都支持跨域访问
4. **免费服务**: 这是免费的API服务，请合理使用
5. **数据延迟**: 所有数据都有1-5分钟的延迟（非实时）

## 🔗 快速测试链接

点击以下链接直接查看数据格式：

- [实时价格数据](https://eth-btc-price-update.pages.dev/eth-btc-price.json)
- [ETH 24小时图表](https://eth-btc-price-update.pages.dev/eth-chart-24h.json)  
- [BTC 24小时图表](https://eth-btc-price-update.pages.dev/btc-chart-24h.json)
- [ETH 7天图表](https://eth-btc-price-update.pages.dev/eth-chart-7d.json)
- [BTC 1年图表](https://eth-btc-price-update.pages.dev/btc-chart-1y.json)

---
*最后更新: 2025年8月8日*
*数据来源: CoinGecko API*