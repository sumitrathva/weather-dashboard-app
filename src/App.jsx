import React, { useState, useEffect, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

const API_KEY = '979192763a9331a9abc8b5979147d246';

function App() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [unit, setUnit] = useState('metric');
  const [theme, setTheme] = useState('light');
  const [recentSearches, setRecentSearches] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    getLocationWeather();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchWeather = async (query) => {
    try {
      setError('');
      setLoading(true);
      setWeather(null);
      setForecast([]);
      setDropdownOpen(false);

      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${query}&units=${unit}&appid=${API_KEY}`
      );

      if (!response.ok) throw new Error('City not found');

      const data = await response.json();
      setWeather(data);
      setCity(data.name);
      updateRecentSearches(data.name);
      fetchForecast(query);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchForecast = async (query) => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${query}&units=${unit}&appid=${API_KEY}`
      );

      if (!response.ok) throw new Error('Forecast not available');

      const data = await response.json();
      const dailyForecasts = [];
      const seenDates = new Set();
      const today = new Date().toISOString().split('T')[0];

      for (const entry of data.list) {
        const date = entry.dt_txt.split(' ')[0];

        if (date !== today && !seenDates.has(date)) {
          dailyForecasts.push(entry);
          seenDates.add(date);
        }

        if (dailyForecasts.length === 5) break;
      }

      setForecast(dailyForecasts);
    } catch (err) {
      setError(err.message);
    }
  };

  const getLocationWeather = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          setError('');
          setLoading(true);
  
          const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=${unit}&appid=${API_KEY}`
          );
  
          if (!response.ok) throw new Error('Location not found');
  
          const data = await response.json();
          setWeather(data);
          fetchForecast(data.name); // Fetch forecast but don't set city in input
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }, () => setError('Location access denied'));
    }
  };
  
  const updateRecentSearches = (newSearch) => {
    setRecentSearches((prev) => {
      const updated = [newSearch, ...prev.filter((item) => item !== newSearch)];
      return updated.slice(0, 5);
    });
  };

  const toggleFavorite = (cityName) => {
    setFavorites((prev) => (
      prev.includes(cityName) ? prev.filter((item) => item !== cityName) : [...prev, cityName]
    ));
  };

  return (
    <div className={`app-container ${theme}`}>
      <h1 className="title">🌤️ Weather Dashboard</h1>

      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Enter city name..."
          value={city}
          onChange={(e) => setCity(e.target.value)}
          onFocus={() => setDropdownOpen(true)}
        />
        <button className="search-btn" onClick={() => fetchWeather(city)}>
          Get Weather
        </button>

        {dropdownOpen && (
          <div ref={dropdownRef} className="dropdown-menu show">
            <div>
              <strong>Recent Searches</strong>
              <ul>
                {recentSearches.map((search, index) => (
                  <li key={index}>
                    <span onClick={() => { setCity(search); fetchWeather(search); }}>{search}</span>
                    <button onClick={() => toggleFavorite(search)}>
                      {favorites.includes(search) ? '⭐' : '☆'}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="favorites">
              <strong>Favorites</strong>
              <ul>
                {favorites.map((fav, index) => (
                  <li key={index}>
                    <span onClick={() => { setCity(fav); fetchWeather(fav); }}>{fav}</span>
                    <button onClick={() => toggleFavorite(fav)}>✖</button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className="toggle-bar">
        <label className="switch">
          <input type="checkbox" onChange={() => setUnit(unit === 'metric' ? 'imperial' : 'metric')} />
          <span className="slider round"></span>
        </label>
        <span>°C/°F</span>

        <label className="switch">
          <input type="checkbox" onChange={() => setTheme(theme === 'light' ? 'dark' : 'light')} />
          <span className="slider round"></span>
        </label>
        <span>Light/Dark</span>
      </div>

      {weather && (
        <div className="weather-card">
          <h2>{weather.name}, {weather.sys.country}</h2>
          <p>🌡️ {weather.main.temp}° {unit === 'metric' ? 'C' : 'F'}</p>
          <p>💧 Humidity: {weather.main.humidity}%</p>
          <p>💨 Wind: {weather.wind.speed} {unit === 'metric' ? 'm/s' : 'mph'}</p>
          <p>🌦️ {weather.weather[0].description}</p>
        </div>
      )}
{forecast.length > 0 && (
  <div className="forecast-container">
    <h3>5-Day Forecast</h3>
    <div className="forecast-grid">
      {forecast.map((day, index) => (
        <div key={index} className={`forecast-card ${theme}`}>
          <p>{new Date(day.dt * 1000).toLocaleDateString()}</p>
          <p>🌡️ {day.main.temp}° {unit === 'metric' ? 'C' : 'F'}</p>
          <p>💧 {day.main.humidity}% Humidity</p>
        </div>
      ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
