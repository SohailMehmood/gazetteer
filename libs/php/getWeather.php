<?php
$lat = $_GET['lat'];
$lng = $_GET['lng'];
$data = file_get_contents("https://api.openweathermap.org/data/2.5/onecall?lat=$lat&lon=$lng&exclude=hourly,minutely,alerts&units=metric&appid=8c80c229242d7672c3ca30ad53df9041");
print_r($data);
