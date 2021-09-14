<?php
$country_name = urlencode($_GET['country_name']);
$data = file_get_contents('http://newsapi.org/v2/everything?q=' . $country_name . '&sortBy=relevancy&apiKey=ce6899551efd4660aaffc621d9906781');
print_r($data);
