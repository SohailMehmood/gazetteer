$(window).on("load", function () {
  $(".loader-container").delay(1000).fadeOut(1000);
});

var images = [];
function preload() {
  for (var i = 0; i < arguments.length; i++) {
    images[i] = new Image();
    images[i].src = preload.arguments[i];
  }
  console.log("Number of loaded images: " + i);
}

let country_boundary;
let map;
let cities_fg;
let wikipedia_fg;
let country_code_global = "";
let country_name;
let lat;
let lng;
let currency_code;
let currency_symbol;
let country_code;

map = L.map("mapid", {
  attributionControl: true,
}).setView([0, 0], 1.5);

L.control.scale().addTo(map);
map.zoomControl.setPosition("topright");

var Esri_WorldImagery = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  {
    attribution:
      "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
  }
);

var Esri_WorldGrayCanvas = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
  attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
  maxZoom: 16
});

var Stamen_TonerHybrid = L.tileLayer(
  "https://stamen-tiles-{s}.a.ssl.fastly.net/toner-hybrid/{z}/{x}/{y}{r}.{ext}",
  {
    attribution:
      'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: "abcd",
    minZoom: 0,
    maxZoom: 20,
    ext: "png",
  }
);

var baseMaps = {
  Imagery: Esri_WorldImagery,
  Grayscale: Esri_WorldGrayCanvas,
};

var overlayMaps = {
  Labels: Stamen_TonerHybrid,
};

L.control.layers(baseMaps, overlayMaps).addTo(map);

map.addLayer(Esri_WorldImagery);
map.addLayer(Stamen_TonerHybrid);

map.locate({ setView: true, maxZoom: 16 });

country_boundary = new L.geoJson().addTo(map);

cities_fg = new L.FeatureGroup();
map.addLayer(cities_fg);

wikipedia_fg = new L.FeatureGroup();
map.addLayer(wikipedia_fg);

get_country_codes();
get_user_location();

function get_user_location() {
  navigator.geolocation.getCurrentPosition(
    function (data) {
      const { latitude } = data.coords;
      const { longitude } = data.coords;
      const coords = [latitude, longitude];
      map.spin(true);
      $.ajax({
        url: "libs/php/getCountryCodeFromLatLng.php?",
        type: "GET",
        data: {
          lat: latitude,
          lng: longitude,
        },
        success: function (data) {
          map.spin(false);
          json = JSON.parse(data); // Parse the string data to JavaScript object
          country_code = json.countryCode;
          $("#country_list").val(country_code).change();
          zoomToCountry(country_code);
        },
      });
    },
    function () {
      alert("Could not get your position!");
    }
  );
}

function get_country_codes() {
  $.ajax({
    url: "libs/php/getCountryCode.php?",
    type: "GET",
    success: function (json) {
      let countries = JSON.parse(json);
      let option = "";
      for (country of countries) {
        option +=
          '<option value="' + country[1] + '">' + country[0] + "</option>";
      }
      $("#country_list").append(option);
    },
  });
}

function get_country_border(country_code) {
  $.ajax({
    url: "libs/php/getCountryBorder.php",
    type: "GET",
    data: {
      country_code: country_code,
    },
    success: function (json) {
      json = JSON.parse(json);
      country_boundary.clearLayers();
      country_boundary.addData(json).setStyle(polystyle());
      const bounds = country_boundary.getBounds();
      map.fitBounds(bounds);

      const east = bounds.getEast();
      const west = bounds.getWest();
      const north = bounds.getNorth();
      const south = bounds.getSouth();
      get_nearby_cities(east, west, north, south);
      get_nearby_wikipedia(east, west, north, south);
    },
  });
}

function polystyle() {
  return {
    fillColor: "green",
    weight: 4,
    opacity: 2.0,
    color: "black", //Outline color
    fillOpacity: 0.4,
  };
}

window.onload = function () {
  document.getElementById("country_list").onchange = function () {
    zoomToCountry(this.value);
  };
};

function zoomToCountry(country_code) {
  if (country_code == "") return;
  country_name = $("#country_list option:selected").text();
  country_code_global = country_code;
  get_country_border(country_code);
  get_country_info(country_code);
}

function get_nearby_cities(east, west, north, south) {
  cities_fg.clearLayers();
  $.ajax({
    url: "libs/php/getNearbyCities.php",
    type: "GET",
    data: {
      east: east,
      west: west,
      north: north,
      south: south,
    },
    success: function (json) {
      json = JSON.parse(json);
      const data = json.geonames;
      const city_icon = L.ExtraMarkers.icon({
        icon: "fa-building",
        shape: "square",
        prefix: "fas",
      });
      for (let i = 0; i < data.length; i++) {
        const marker = L.marker([data[i].lat, data[i].lng], {
          icon: city_icon,
        }).bindPopup(
          "<b>" +
          data[i].name +
          "</b><br>Population: " +
          parseInt(data[i].population).toLocaleString("en")
        );
        cities_fg.addLayer(marker);
      }
    },
  });
}

function get_nearby_wikipedia(east, west, north, south) {
  wikipedia_fg.clearLayers();
  $.ajax({
    url: "libs/php/getNearbyWikipedia.php",
    type: "GET",
    data: {
      east: east,
      west: west,
      north: north,
      south: south,
    },
    success: function (json) {
      json = JSON.parse(json);
      const data = json.geonames;
      const wiki_icon = L.ExtraMarkers.icon({
        icon: "fa-wikipedia-w",
        markerColor: "blue",
        shape: "square",
        prefix: "fab",
      });
      for (let i = 0; i < data.length; i++)
        if (data[i].thumbnailImg !== null && data[i].thumbnailImg !== undefined) {
          preload(data[i].thumbnailImg);
          const marker = L.marker([data[i].lat, data[i].lng], {
            icon: wiki_icon,
          }).bindPopup(
            "<img src='" +
            data[i].thumbnailImg +
            "' width='100px' height='100px' alt='" +
            data[i].title +
            "'><br><b>" +
            data[i].title +
            "</b><br><a href='https://" +
            data[i].wikipediaUrl +
            "' target='_blank'>Wikipedia Link</a>"
          );
          wikipedia_fg.addLayer(marker);
        }
    },
  });
}

function get_country_info(country_code) {
  if ($("#country_info").css("left") !== "5px") {
    $("#country_info").animate(
      {
        left: "5px",
      },
      1000
    );
    $(".pull_country_info_popup").animate(
      {
        left: "-40px",
      },
      1000
    );
  }

  map.spin(true, {
    top: 180,
    left: 150,
  });

  $.ajax({
    url: "libs/php/getCountryInfo.php",
    type: "GET",
    data: {
      country_code: country_code,
    },

    success: function (response) {
      map.spin(false);
      let details = $.parseJSON(response);
      lat = details.latlng[0];
      lng = details.latlng[1];
      population = numeral(details.population).format("0a", "0.0a");
      $("#country_name").html(country_name);
      $("#country_capital").html(details.capital);
      $("#country_population").html(population);
      $("#country_flag").attr("src", details.flag);
      $("#country_currency").html(details.currencies[0]["name"]);
      $("#country_currency_symbol").html(details.currencies[0]["symbol"]);
      $("#country_wikipedia").attr(
        "href",
        "https://en.wikipedia.org/wiki/" + details.name
      );
      currency_symbol = details.currencies[0]["symbol"];
      currency_code = details.currencies[0]["code"];
    },
  });
}

$("#hide").click(function hide_popup() {
  $("#country_info").animate(
    {
      left: "-600px",
    },
    1000
  );
  $(".pull_country_info_popup").animate(
    {
      left: "0",
    },
    1000
  );
});

$("#show").click(function show_popup() {
  $("#country_info").animate(
    {
      left: "5px",
    },
    1000
  );
  $(".pull_country_info_popup").animate(
    {
      left: "-400px",
    },
    1000
  );
});

function get_weather_data() {
  map.spin(true);
  $.ajax({
    url: "libs/php/getWeather.php",
    type: "GET",
    data: {
      lat: lat,
      lng: lng,
    },
    success: function (response) {
      let details = $.parseJSON(response);

      $("#first_row").html("");
      $("#second_row").html("");
      $("#third_row").html("");
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      for (let i = 0; i < 5; i++) {
        const d = details["daily"][i];
        const day = days[new Date(d["dt"] * 1000).getDay()];
        $("#first_row").append("<td>" + day + "</td>");
        $("#second_row").append("<td>" + parseInt(d["temp"]["max"]) + "°</td>");
        $("#third_row").append("<td>" + parseInt(d["temp"]["min"]) + "°</td>");
      }
      $("#weather_city_name").html(details.timezone);
      let daily = details["daily"][0]["weather"][0];
      $("#weather_description").html(
        daily["main"] +
        "<span class='dot'>•</span><span>Wind " +
        parseInt(details["daily"][0]["wind_speed"]) +
        "km/h <span class='dot'>•</span> Precip " +
        details["daily"][0]["clouds"] +
        "%</span></h3>"
      );
      $("#weather_data img").attr(
        "src",
        "https://s3-us-west-2.amazonaws.com/s.cdpn.io/162656/" +
        daily["icon"] +
        ".svg"
      );
      $("#weather_data .image_parent h1").html(
        parseInt(details["daily"][0]["temp"]["day"]) + "°"
      );
      map.spin(false);
      $("#weatherModal").modal("show");
    },
  });
}

L.easyButton(
  "fa-cloud-sun",
  function (btn) {
    get_weather_data();
  },
  "Weather Forecast"
).addTo(map);

$(".closeWeather").click(function close_weather() {
  $("#weatherModal").modal("hide");
});

function get_exchange_rate() {
  map.spin(true);
  $.ajax({
    url: "libs/php/euroExchange.php",
    type: "GET",

    success: function (response) {
      let details = $.parseJSON(response);
      exchange = numeral(details.rates[currency_code]).format("0.00");

      $("#euro").html([currency_symbol]).append(exchange);
    },
  }),
    $.ajax({
      url: "libs/php/dollarExchange.php",
      type: "GET",

      success: function (response) {
        let details = $.parseJSON(response);
        exchange = numeral(details.rates[currency_code]).format("0.00");

        $("#dollar").html([currency_symbol]).append(exchange);
      },
    }),
    $.ajax({
      url: "libs/php/poundExchange.php",
      type: "GET",

      success: function (response) {
        let details = $.parseJSON(response);
        exchange = numeral(details.rates[currency_code]).format("0.00");

        $("#pound").html([currency_symbol]).append(exchange);

        map.spin(false);
        $("#exchangeModal").modal("show");
      },
    });
}

L.easyButton(
  "fa-euro-sign",
  function (btn) {
    get_exchange_rate();
  },
  "Exchange Rates"
).addTo(map);

$(".closeExchange").click(function close_exchange() {
  $("#exchangeModal").modal("hide");
});

function get_news_data() {
  $("#news_data").html("");
  map.spin(true);
  $.ajax({
    url: "libs/php/newsData.php",
    data: {
      country_name: country_name,
    },
    method: "GET",
    success: function (response) {
      response = JSON.parse(response);
      const data = response["articles"];
      for (let i = 0; i < data.length; i++)
        if (data[i].urlToImage !== null && data[i].urlToImage !== undefined) {
          $("#news_data").append(get_news_card(data[i]));
        }
      map.spin(false);
      $("#newsModal").modal("show");
    },
  });
}

function get_news_card(data) {
  const card =
    '<div class="card" style="width: 20rem;"> <img class="card-img-top" src="' +
    data["urlToImage"] +
    '" alt="News Image"> <div class="card-body"> <h5 class="card-title">' +
    data["author"] +
    '</h5> <p class="card-text">' +
    data["title"] +
    '</p> <a href="' +
    data["url"] +
    '" target="_blank" class="btn btn-primary">Details</a> </div> </div>';
  return card;
}

L.easyButton(
  "fa-newspaper",
  function (btn) {
    get_news_data();
  },
  "News"
).addTo(map);

$(".closeNews").click(function close_news() {
  $("#newsModal").modal("hide");
});