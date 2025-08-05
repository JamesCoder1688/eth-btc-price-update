# ETH/BTC Price Tracker

一个自动化的以太坊(ETH)和比特币(BTC)价格追踪系统，提供实时价格和历史数据API。

## 🚀 功能特性

- **实时价格更新** - 每5分钟自动更新ETH和BTC价格
- **历史数据追踪** - 每日更新365天历史价格数据
- **多币种支持** - 支持美元(USD)和人民币(CNY)价格
- **24小时变化** - 提供24小时价格变化百分比
- **自动化部署** - 通过GitHub Actions自动更新数据
- **CDN分发** - 部署在Cloudflare Pages，全球CDN加速
- **轻量化设计** - 数据文件不污染代码仓库，动态生成

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
返回ETH和BTC的实时价格，包含USD和CNY价格及24小时变化。

**响应示例：**
```json
{
  "eth": {
    "usd": 3587.16,
    "usd_change_24h": -2.54,
    "cny": 25771,
    "cny_change_24h": -2.46
  },
  "btc": {
    "usd": 113676,
    "usd_change_24h": -1.14,
    "cny": 816661,
    "cny_change_24h": -1.06
  },
  "last_updated": "2025/08/06 03:15:54"
}
```

#### 2. ETH历史价格数据
```
GET /eth-history.json
```
返回ETH过去365天的每日价格数据。

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

#### 3. BTC历史价格数据
```
GET /btc-history.json
```
返回BTC过去365天的每日价格数据。

**响应格式与ETH历史数据相同。**

## 🛠️ 技术栈

- **Node.js** - 运行环境
- **CoinGecko API** - 价格数据来源
- **GitHub Actions** - 自动化更新
- **Cloudflare Pages** - 静态网站托管
- **JSON** - 数据格式

## 📅 更新频率

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
```

## 📁 项目结构

```
eth-btc-price-update/
├── .github/
│   └── workflows/
│       ├── update-price.yml     # 实时价格更新工作流
│       └── update-history.yml   # 历史数据更新工作流
├── scripts/
│   ├── update-price.js          # 实时价格更新脚本
│   └── update-history.js        # 历史数据更新脚本
├── public/
│   ├── .gitkeep                 # 保持目录存在
│   ├── eth-btc-price.json       # 实时价格数据
│   ├── eth-history.json         # ETH历史数据
│   └── btc-history.json         # BTC历史数据
├── .gitignore                   # Git忽略文件
├── package.json
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
// 获取实时价格
const response = await fetch('https://eth-btc-price-update.pages.dev/eth-btc-price.json');
const data = await response.json();
console.log(`ETH价格: $${data.eth.usd}`);
console.log(`BTC价格: $${data.btc.usd}`);
```

### Python
```python
import requests

# 获取实时价格
response = requests.get('https://eth-btc-price-update.pages.dev/eth-btc-price.json')
data = response.json()
print(f"ETH价格: ${data['eth']['usd']}")
print(f"BTC价格: ${data['btc']['usd']}")
```

### curl
```bash
# 获取实时价格
curl https://eth-btc-price-update.pages.dev/eth-btc-price.json

# 获取ETH历史数据
curl https://eth-btc-price-update.pages.dev/eth-history.json
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
```
https://eth-btc-price-update.pages.dev/eth-btc-price.json
```
