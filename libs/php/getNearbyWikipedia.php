<?php

$east = $_GET['east'];
$west = $_GET['west'];
$north = $_GET['north'];
$south = $_GET['south'];

$data = file_get_contents("http://api.geonames.org/wikipediaBoundingBoxJSON?north=$north&south=$south&east=$east&west=$west&username=hailcore");
print_r($data);
