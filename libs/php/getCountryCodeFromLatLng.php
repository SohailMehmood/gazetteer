<?php

$lat = $_GET['lat'];
$lng = $_GET['lng'];

$data = file_get_contents("http://api.geonames.org/countryCodeJSON?lat=$lat&lng=$lng&username=hailcore");

$json = json_decode($data, true);
echo json_encode($json);
