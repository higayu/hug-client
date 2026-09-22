## 判定条件

| 選択API   | AUTO_SWITCHING | 動作                                 |
| ------- | -------------: | ---------------------------------- |
| sqlite  |          false | MariaDBチェックしない。即 `sqliteApi`       |
| sqlite  |           true | MariaDBチェックする。接続できたら MariaDB へ自動切替 |
| mariadb |     true/false | 今まで通り MariaDBチェック                  |
