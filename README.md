# pg-banqi

華語圈懷舊**暗棋對弈**：4×8 翻子、吃子、簡易人機。純前端，無建置步驟。

棋種為民間常見玩法之實作小品，非任一商業軟體／商標復刻。

也可當作 [Playgrounds（遊樂場）](https://play.samkuo.me/) 的 **SAM**（`index.html` 入口）。規則或 AI 想再調？開進來玩，再叫 AI 幫你改一版。

## 一鍵開 SAM 小

**[一鍵開 SAM 小](https://play.samkuo.me/?open=sampot%2Fpg-banqi&name=%E6%9A%97%E6%A3%8B%E5%B0%8D%E5%BC%88)**

```
https://play.samkuo.me/?open=sampot/pg-banqi&name=暗棋對弈
```

同源會重用本機已匯入的沙盒；要強制新建可加 `&fresh=1`。

## 試玩（本機）

```bash
npx --yes serve .
# 或
python3 -m http.server 8080
```

點一下頁面後音效才會出聲。

## 操作

| 操作 | 說明 |
| --- | --- |
| 點暗子 | 翻開（首翻決定你的紅／黑） |
| 點己方明子 → 目標 | 移動或吃子 |
| 新局 | 重新洗子 |
| 音效開／關 | 靜音 |

## 規則摘要

- 鄰格走／吃；大吃小（同級可互吃）
- **炮**須隔恰好一子打（不可鄰格吃）
- **兵**可吃將／帥；將／帥不能吃兵
- 吃光對方或對方無棋可走即勝

## 檔案

| 檔案 | 說明 |
| --- | --- |
| `index.html` | 結構 |
| `styles.css` | 亮／暗色主題 |
| `app.js` | 輸入與 AI 節奏 |
| `game.js` | 規則與簡易 AI |
| `sprites.js` | 棋盤／棋子繪製 |
| `audio.js` | Web Audio 合成音效 |
| `functions.js` | Playgrounds 可選 stub |

## License

MIT
