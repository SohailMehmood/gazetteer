<?php
$country_code = $_GET['country_code'];
$data = file_get_contents("https://restcountries.com/v2/alpha/$country_code");
print_r($data);
