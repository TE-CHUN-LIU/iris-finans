# 陳乙嘉 Iris Chen｜金融理財顧問官網

> 即使我不在您身旁，這裡的每一字，都是我陪伴您的方式。

Financial Advisor 個人官方網站 — 純 HTML/CSS/JS 單頁，儀表板式互動設計。

## 預覽

直接打開 `index.html` 即可：

```bash
open index.html
```

或啟動本地伺服器：

```bash
python3 -m http.server 8080
# 然後瀏覽 http://localhost:8080
```

## 結構

```
iris-finans/
├── index.html           # 主頁
├── assets/
│   ├── css/style.css    # 樣式
│   ├── js/main.js       # 互動腳本
│   └── img/             # 圖片資源
├── .gitignore
└── README.md
```

## 區塊一覽

1. **Overview / Hero** — 主標題、Slogan、即時數據卡片（年資、證照數、客群、回覆速度）
2. **About** — 三大核心價值（以人為本／風險把關／長遠規劃）
3. **Credentials** — 7 張專業證照進度條 + 3 大權威領域
4. **Services** — 6 項服務 + 可篩選分類（保障 / 資產配置 / 整體理財）
5. **Knowledge Hub** — 5 篇文章 + 主題篩選
6. **Client Stories** — 客戶見證
7. **Contact** — LINE / 電話 / 預約諮詢

## 互動特色

- 左側固定側邊欄（手機版可摺疊）
- 即時時鐘 + 服務狀態指示燈（依時段自動切換）
- 動畫計數器（滾動到時觸發）
- 可篩選的服務與文章分類
- 滾動同步側邊欄高亮
- 響應式設計（桌機 / 平板 / 手機）

## 技術

- 純 HTML5 / CSS3 / Vanilla JS（無框架、無建置流程）
- Google Fonts：Noto Serif TC / Noto Sans TC / Cormorant Garamond / Inter / JetBrains Mono
- IntersectionObserver、CSS Grid、Flexbox

## License

© 2026 陳乙嘉 Iris Chen. All rights reserved.
