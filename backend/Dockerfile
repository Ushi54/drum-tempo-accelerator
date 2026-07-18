# 第一ステージ: Mavenを使ったビルド
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
# pom.xmlとソースコードをコピー
COPY pom.xml .
COPY src ./src
# テストをスキップしてパッケージ（jar）を作成
RUN mvn clean package -DskipTests

# 第二ステージ: 実行用軽量イメージ
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
# ビルドステージから生成されたjarファイルをコピー
COPY --from=build /app/target/drum-0.0.1-SNAPSHOT.jar app.jar

# Render.com等では環境変数PORTが割り当てられるため、それをSpringに渡す
ENV PORT=8080
EXPOSE 8080

# アプリケーションの起動
ENTRYPOINT sh -c 'java -Dserver.port=${PORT} -jar app.jar'
