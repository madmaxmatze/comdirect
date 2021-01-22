<?php

/*
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
*/

if (isset($_GET["portfolio_key"]) && !isset($_GET["date"])) {
  header("Location: https://peerfol.io/" . $_GET["portfolio_key"]);
  // die("Please use this link:<br><a href='https://peerfol.io/" . $_GET["portfolio_key"] . "'>https://peerfol.io/" . $_GET["portfolio_key"] . "</a>");
} else {
  $seconds_to_cache = 13600;
  $ts = gmdate("D, d M Y H:i:s", time() + $seconds_to_cache) . " GMT";
  header("Expires: $ts");
  header("Pragma: cache");
  header("Cache-Control: max-age=$seconds_to_cache"); 

  $html = file_get_contents("app.html");

  $cacheInvalidator = "?cache=" . substr(md5(filectime(__DIR__ . "/app.css") * filectime(__DIR__ . "/app.js")), 0, 10);

  $html = preg_replace("/app\.(js|css)/", "app.$1" . $cacheInvalidator, $html);

  echo $html;
}