# DRUM TEMPO ACCELERATOR

自動でテンポが上がる、変拍子・ポリリズム対応のドラマー向けメトロノーム。
ログインもサーバーもない静的サイトで、プリセットはブラウザ（localStorage）に保存する。

要件定義：Obsidian 保管庫 `08_Projects/【Project】メトロノーム再開発_要件定義.md`
前の版（Next.js + Spring Boot）：`~/Developer/drum_prototype`

## 機能
- 拍子 1〜16 / 4・8、8分の拍子の区切り（7/8 なら 2+2+3 / 2+3+2 / 3+2+2）
- ポリリズム（拍子の拍に 2〜9 個の等間隔の音を重ねる）
- アクセント ON/OFF
- 自動テンポアップ（小節ごと / 秒ごと）と、次に上がるまでの残り表示
- プリセットの保存・呼び出し・削除

## 構成
```
src/
├── logic/      計算だけ（拍子 → 1小節の音の並び、テンポアップの判定）。テストあり
├── audio/      Web Audio API の先読みスケジューラーとクリック音
├── storage/    localStorage への読み書き
├── hooks/      音のエンジンと画面をつなぐ useMetronome
└── components/ 画面の部品
```
テンポは小節の頭でしか変えない。秒ごとのモードは「設定した秒数が経ったあとの最初の小節の頭」で上がり、残り表示はその瞬間までの秒数を出す。

## 開発
```bash
npm install
npm run dev
npm test
npm run build
```
