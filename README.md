# ETH/BTC Price Tracker

一个自动化的以太坊(ETH)和比特币(BTC)价格追踪系统，提供实时价格和历史数据API。

## 🚀 功能特性

- **多时间段图表支持** - 支持1小时、24小时、7天、30天、1年价格走势图
- **实时价格更新** - 每5分钟自动更新ETH和BTC价格
- **增强价格数据** - 包含多时间段变化、成交量、市值等完整数据
- **历史数据追踪** - 多粒度历史价格数据，适配不同图表需求
- **多币种支持** - 支持美元(USD)和人民币(CNY)价格
- **智能更新频率** - 根据时间段智能调整数据更新频率
- **自动化部署** - 通过GitHub Actions自动更新数据
- **CDN分发** - 部署在Cloudflare Pages，全球CDN加速
- **向下兼容** - 保持现有API接口不变，新增功能完全兼容

## 📊 API 端点

### 基础URL
```
https://eth-btc-price-update.pages.dev
```

### 主要API端点

#### 1. 实时ETH/BTC价格 (推荐)
```
GET /eth-btc-price.json
```
返回ETH和BTC的实时价格，包含USD和CNY价格及多时间段变化。

**响应示例：**
```json
{
  "eth": {
    "current_price": {
      "usd": 3587.16,
      "cny": 25771
    },
    "changes": {
      "1h": -0.5,
      "24h": -2.54,
      "7d": 5.2,
      "30d": 12.8,
      "1y": 45.6
    },
    "volume_24h": {
      "usd": 18500000000,
      "cny": 132910000000
    },
    "market_cap": {
      "usd": 431400000000,
      "cny": 3100000000000
    }
  },
  "btc": {
    "current_price": {
      "usd": 113676,
      "cny": 816661
    },
    "changes": {
      "1h": -0.3,
      "24h": -1.14,
      "7d": 3.8,
      "30d": 8.2,
      "1y": 120.5
    },
    "volume_24h": {
      "usd": 24500000000,
      "cny": 176000000000
    },
    "market_cap": {
      "usd": 2250000000000,
      "cny": 16160000000000
    }
  },
  "last_updated": "2025/08/06 03:15:54"
}
```

#### 2. 图表数据API (新增 - 支持多时间区间)
```
GET /chart-data.json?coin=<币种>&period=<时间段>&points=<数据点数>
```
返回指定币种和时间段的价格走势数据，专为图表显示优化。

**支持参数：**
- `coin`: `eth` 或 `btc`
- `period`: `1h`, `24h`, `7d`, `30d`, `1y`
- `points`: 数据点数量（可选，默认自动计算）

**时间段与更新频率：**
- **1小时图**：5分钟间隔，12个数据点，每5分钟更新
- **24小时图**：1小时间隔，24个数据点，每15分钟更新
- **7天图**：4小时间隔，42个数据点，每小时更新
- **30天图**：1天间隔，30个数据点，每4小时更新
- **1年图**：7天间隔，52个数据点，每日更新

**使用示例：**
```
GET /chart-data.json?coin=eth&period=1h
GET /chart-data.json?coin=btc&period=24h
GET /chart-data.json?coin=eth&period=7d
```

**响应示例：**
```json
{
  "coin": "eth",
  "period": "24h",
  "interval": "1h",
  "data": [
    {
      "timestamp": 1723003200,
      "datetime": "2025-08-06 00:00:00",
      "price": {
        "usd": 3587.16,
        "cny": 25771
      },
      "volume": 850000000
    },
    {
      "timestamp": 1723006800,
      "datetime": "2025-08-06 01:00:00", 
      "price": {
        "usd": 3592.45,
        "cny": 25809
      },
      "volume": 920000000
    }
  ],
  "summary": {
    "start_price": {
      "usd": 3587.16,
      "cny": 25771
    },
    "end_price": {
      "usd": 3592.45,
      "cny": 25809
    },
    "high_price": {
      "usd": 3620.80,
      "cny": 26013
    },
    "low_price": {
      "usd": 3568.90,
      "cny": 25640
    },
    "change_percent": 0.15,
    "total_volume": 18500000000
  },
  "last_updated": "2025/08/06 03:15:54"
}
```

#### 3. 传统历史价格数据 (保持兼容)
```
GET /eth-history.json
GET /btc-history.json
```
返回过去365天的每日价格数据（保持现有格式不变）。

**响应示例：**
```json
[
  {
    "date": "2024-08-06",
    "usd": 2415.63,
    "cny": 17201.47
  },
  {
    "date": "2024-08-07",
    "usd": 2455.51,
    "cny": 17508.41
  }
]
```

## 🛠️ 技术栈

- **Node.js** - 运行环境
- **CoinGecko API** - 价格数据来源
- **GitHub Actions** - 自动化更新
- **Cloudflare Pages** - 静态网站托管
- **JSON** - 数据格式

## 📅 更新频率

### 图表数据更新频率
- **1小时图表** - 每5分钟更新（5分钟间隔数据点）
- **24小时图表** - 每15分钟更新（1小时间隔数据点）
- **7天图表** - 每小时更新（4小时间隔数据点）
- **30天图表** - 每4小时更新（1天间隔数据点）
- **1年图表** - 每日更新（7天间隔数据点）

### 传统数据更新频率
- **实时价格** - 每5分钟自动更新 (GitHub Actions)
- **历史数据** - 每日凌晨3点UTC自动更新
- **手动触发** - 支持通过GitHub Actions手动触发更新

## 🔧 本地开发

### 环境要求
- Node.js 20+
- npm

### 安装依赖
```bash
npm install
```

### 运行脚本
```bash
# 更新实时价格
npm run update:price

# 更新历史数据
npm run update:history

# 更新图表数据（新增）
npm run update:chart        # 生成所有图表数据
npm run update:chart-1h     # 更新1小时图表数据
npm run update:chart-24h    # 更新24小时图表数据
npm run update:chart-7d     # 更新7天图表数据
npm run update:chart-30d    # 更新30天图表数据
npm run update:chart-1y     # 更新1年图表数据
```

### 本地测试工作流
```bash
# 1. 安装依赖
npm install

# 2. 测试增强版实时价格更新
npm run update:price
# 检查生成的文件: public/eth-btc-price.json

# 3. 测试图表数据生成
npm run update:chart-24h
# 检查生成的文件: public/chart-data-cache.json

# 4. 验证数据格式
cat public/eth-btc-price.json | head -20
cat public/chart-data-cache.json | head -20

# 5. 测试所有时间段（可选）
npm run update:chart
```

### 功能验证清单
- [ ] ✅ 增强版实时价格包含多时间段变化
- [ ] ✅ 图表数据包含完整的时间序列
- [ ] ✅ USD和CNY价格计算正确
- [ ] ✅ 成交量和市值数据完整
- [ ] ✅ 时间戳格式正确
- [ ] ✅ API数据结构符合文档

### 故障排除
**网络连接问题**：
```bash
# 如果遇到API超时，脚本会自动重试3次
# 可以通过以下方式检查网络连接：
curl "https://api.coingecko.com/api/v3/ping"
```

**数据验证**：
```bash
# 验证JSON格式是否正确
node -e "console.log(JSON.parse(require('fs').readFileSync('public/eth-btc-price.json')))"
```

## 📁 项目结构

```
eth-btc-price-update/
├── .github/
│   └── workflows/
│       ├── update-price.yml        # 实时价格更新工作流
│       ├── update-history.yml      # 历史数据更新工作流
│       ├── update-chart-1h.yml     # 1小时图表数据工作流
│       ├── update-chart-24h.yml    # 24小时图表数据工作流
│       ├── update-chart-7d.yml     # 7天图表数据工作流
│       ├── update-chart-30d.yml    # 30天图表数据工作流
│       └── update-chart-1y.yml     # 1年图表数据工作流
├── scripts/
│   ├── update-price.js             # 实时价格更新脚本
│   ├── update-history.js           # 历史数据更新脚本
│   └── update-chart-data.js        # 图表数据更新脚本（新增）
├── public/
│   ├── .gitkeep                    # 保持目录存在
│   ├── eth-btc-price.json          # 增强版实时价格数据
│   ├── chart-data.json             # 动态图表数据API（新增）
│   ├── eth-history.json            # ETH历史数据（保持兼容）
│   └── btc-history.json            # BTC历史数据（保持兼容）
├── .gitignore                      # Git忽略文件
├── package.json
├── prompt.md                       # 项目开发工作流程指南
└── README.md
```

## 🌐 部署

本项目部署在Cloudflare Pages上，通过GitHub集成自动部署。

### 自动部署流程
1. 代码推送到GitHub
2. GitHub Actions自动运行更新脚本
3. 数据文件自动提交到仓库
4. Cloudflare Pages自动重新部署

## 📊 使用示例

### JavaScript/Node.js
```javascript
// 获取增强版实时价格数据
const response = await fetch('https://eth-btc-price-update.pages.dev/eth-btc-price.json');
const data = await response.json();
console.log(`ETH价格: $${data.eth.current_price.usd}`);
console.log(`BTC 24小时变化: ${data.btc.changes['24h']}%`);
console.log(`ETH市值: $${data.eth.market_cap.usd}`);

// 获取图表数据
const chartResponse = await fetch('https://eth-btc-price-update.pages.dev/chart-data.json?coin=eth&period=24h');
const chartData = await chartResponse.json();
console.log(`24小时数据点数: ${chartData.data.length}`);
console.log(`价格变化: ${chartData.summary.change_percent}%`);
```

### Python
```python
import requests

# 获取增强版实时价格数据
response = requests.get('https://eth-btc-price-update.pages.dev/eth-btc-price.json')
data = response.json()
print(f"ETH价格: ${data['eth']['current_price']['usd']}")
print(f"BTC 7天变化: {data['btc']['changes']['7d']}%")

# 获取图表数据用于绘制走势图
chart_response = requests.get('https://eth-btc-price-update.pages.dev/chart-data.json?coin=btc&period=7d')
chart_data = chart_response.json()
prices = [point['price']['usd'] for point in chart_data['data']]
timestamps = [point['timestamp'] for point in chart_data['data']]
```

### curl
```bash
# 获取增强版实时价格
curl https://eth-btc-price-update.pages.dev/eth-btc-price.json

# 获取ETH 1小时图表数据
curl "https://eth-btc-price-update.pages.dev/chart-data.json?coin=eth&period=1h"

# 获取BTC 30天图表数据
curl "https://eth-btc-price-update.pages.dev/chart-data.json?coin=btc&period=30d"

# 获取传统历史数据（保持兼容）
curl https://eth-btc-price-update.pages.dev/eth-history.json
```

### 前端图表集成示例
```javascript
// 使用Chart.js绘制价格走势图
async function drawPriceChart(coin, period) {
  const response = await fetch(`/chart-data.json?coin=${coin}&period=${period}`);
  const data = await response.json();
  
  const chartData = {
    labels: data.data.map(point => new Date(point.timestamp * 1000).toLocaleString()),
    datasets: [{
      label: `${coin.toUpperCase()} Price (USD)`,
      data: data.data.map(point => point.price.usd),
      borderColor: coin === 'eth' ? '#627EEA' : '#F7931A',
      tension: 0.1
    }]
  };
  
  // 使用Chart.js或其他图表库渲染
  new Chart(ctx, {
    type: 'line',
    data: chartData,
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: false
        }
      }
    }
  });
}

// 调用示例
drawPriceChart('eth', '24h'); // 绘制ETH 24小时走势图
drawPriceChart('btc', '7d');  // 绘制BTC 7天走势图
```

## 🔍 数据来源

所有价格数据来自 [CoinGecko API](https://www.coingecko.com/en/api)，这是一个可靠的加密货币数据提供商。

## 📝 许可证

MIT License

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个项目。

## 📞 联系方式

如有问题或建议，请通过GitHub Issues联系。

---

**⚡ 快速开始使用API：**
```bash
# 增强版实时价格（包含多时间段变化、成交量、市值）
https://eth-btc-price-update.pages.dev/eth-btc-price.json

# 图表数据API（支持多时间区间）
https://eth-btc-price-update.pages.dev/chart-data.json?coin=eth&period=24h
https://eth-btc-price-update.pages.dev/chart-data.json?coin=btc&period=7d

# 传统历史数据（保持兼容）  
https://eth-btc-price-update.pages.dev/eth-history.json
```

## 🎯 新功能亮点

### 🔥 多时间段图表支持
专为前端图表显示优化，支持以太坊网站常用的5个时间区间：
- **1小时图**：实时变化，5分钟数据点
- **24小时图**：日内走势，1小时数据点  
- **7天图**：周度趋势，4小时数据点
- **30天图**：月度分析，1天数据点
- **1年图**：长期趋势，7天数据点

### 📈 增强数据结构
新增成交量、市值、多时间段变化率等关键指标，为交易决策提供更全面的数据支持。

### ⚡ 智能更新频率
根据不同时间段的特点，采用差异化的数据更新策略，既保证数据时效性，又优化系统资源使用。

### 🔄 完全向下兼容
保持现有API接口不变，新功能采用新端点，确保现有用户无缝升级。
