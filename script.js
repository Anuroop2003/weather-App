const apiKey = "33e4dda3911100316c673a9a9741eade";

window.onload = () => {
  const lastCity = localStorage.getItem("lastCity");
  if (lastCity) {
    document.getElementById("cityInput").value = lastCity;
    getWeather(lastCity);
  }
};

function toggleTheme(theme) {
  document.body.setAttribute('data-theme', theme);
}

function startVoice() {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = 'en-US';
  recognition.start();
  recognition.onresult = event => {
    const city = event.results[0][0].transcript;
    document.getElementById("cityInput").value = city;
    getWeather(city);
  };
  recognition.onerror = () => alert("Voice recognition failed. Try again.");
}

function getWeather(city = null) {
  const cityInput = city || document.getElementById("cityInput").value.trim();
  const unit = document.getElementById("unitToggle").value;
  const unitSymbol = unit === "imperial" ? "°F" : "°C";

  if (!cityInput) return alert("Enter a city name!");
  localStorage.setItem("lastCity", cityInput);

  showLoader(true);

  fetch(`https://api.openweathermap.org/data/2.5/weather?q=${cityInput}&appid=${apiKey}&units=${unit}`)
    .then(res => res.json())
    .then(data => {
      if (data.cod !== 200) throw new Error(data.message);
      displayCurrentWeather(data, unit, unitSymbol);
      getForecast(cityInput, unit, unitSymbol);
      updateTime();
    })
    .catch(err => {
      document.getElementById("weatherResult").innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
    })
    .finally(() => showLoader(false));
}

function getWeatherByLocation() {
  const unit = document.getElementById("unitToggle").value;
  const unitSymbol = unit === "imperial" ? "°F" : "°C";

  if (!navigator.geolocation) return alert("Geolocation not supported.");

  showLoader(true);

  navigator.geolocation.getCurrentPosition(position => {
    const { latitude, longitude } = position.coords;
    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=${unit}`)
      .then(res => res.json())
      .then(data => {
        document.getElementById("cityInput").value = data.name;
        displayCurrentWeather(data, unit, unitSymbol);
        getForecast(data.name, unit, unitSymbol);
        updateTime();
      })
      .catch(err => {
        document.getElementById("weatherResult").innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
      })
      .finally(() => showLoader(false));
  });
}

function displayCurrentWeather(data, unit, unitSymbol) {
  const icon = data.weather[0].icon;
  const sunrise = new Date(data.sys.sunrise * 1000).toLocaleTimeString();
  const sunset = new Date(data.sys.sunset * 1000).toLocaleTimeString();
  const rain = data.rain ? (data.rain["1h"] || data.rain["3h"]) + " mm" : "0 mm";

  const html = `
    <div class="card">
      <div class="card-body text-start">
        <h4>${data.name}, ${data.sys.country} <img src="http://openweathermap.org/img/wn/${icon}@2x.png" class="weather-icon"></h4>
        <p>
          🌡 Temp: ${data.main.temp} ${unitSymbol}<br>
          🤗 Feels Like: ${data.main.feels_like} ${unitSymbol}<br>
          ☁️ Weather: ${data.weather[0].main}, ${data.weather[0].description}<br>
          💧 Humidity: ${data.main.humidity}%<br>
          🌬 Wind: ${data.wind.speed} ${unit === "imperial" ? "mph" : "m/s"}<br>
          🌦 Rain: ${rain}<br>
          🌄 Sunrise: ${sunrise}<br>
          🌇 Sunset: ${sunset}
        </p>
      </div>
    </div>
  `;
  document.getElementById("weatherResult").innerHTML = html;
}

function getForecast(city, unit, unitSymbol) {
  fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=${unit}`)
    .then(res => res.json())
    .then(data => {
      const forecasts = data.list.filter(item => item.dt_txt.includes("12:00:00")).slice(0, 5);
      let html = `<h5 class="mt-4">📅 5-Day Forecast</h5><div class="forecast-container">`;
      forecasts.forEach(item => {
        const date = new Date(item.dt_txt).toDateString().slice(0, 10);
        html += `
          <div class="forecast-card">
            <div><strong>${date}</strong></div>
            <img src="http://openweathermap.org/img/wn/${item.weather[0].icon}.png">
            <div>${item.main.temp} ${unitSymbol}</div>
            <small>${item.weather[0].main}</small>
          </div>
        `;
      });
      html += `</div>`;
      document.getElementById("forecastResult").innerHTML = html;
    });
}

function updateTime() {
  const now = new Date();
  document.getElementById("updatedTime").textContent = `Last updated: ${now.toLocaleString()}`;
}

function showLoader(show) {
  document.getElementById("loader").style.display = show ? 'block' : 'none';
}
