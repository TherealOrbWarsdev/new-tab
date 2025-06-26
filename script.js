// --- Orbit Carousel ---
const icons = document.querySelectorAll('.orbit-icon');
const total = icons.length;
let selectedIndex = 0;

function updateCarousel() {
  const centerX = window.innerWidth / 2;
  const spacing = 110;

  icons.forEach((icon, i) => {
    let pos = (i - selectedIndex + total) % total;
    if (pos > total / 2) pos -= total;

    const x = centerX + pos * spacing;
    const scale = pos === 0 ? 1.5 : 0.7;
    const opacity = pos === 0 ? 1 : 0.5;

    icon.style.position = 'fixed';
    icon.style.left = `${x}px`;
    icon.style.top = '50%';
    icon.style.transform = `translate(-50%, -50%) scale(${scale})`;
    icon.style.zIndex = pos === 0 ? 10 : 1;
    icon.style.filter = pos === 0
      ? 'brightness(1.3) drop-shadow(0 0 10px #3b82f6)'
      : 'brightness(0.6)';
    icon.style.opacity = opacity;
    icon.style.transition = 'all 0.4s ease';
  });
}

window.addEventListener('load', () => {
  updateCarousel();

  window.addEventListener('resize', updateCarousel);

  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') {
      selectedIndex = (selectedIndex + 1) % total;
      updateCarousel();
    } else if (e.key === 'ArrowLeft') {
      selectedIndex = (selectedIndex - 1 + total) % total;
      updateCarousel();
    } else if (e.key === 'Enter') {
      const link = icons[selectedIndex].getAttribute('data-link');
      window.open(link, '_blank');
    }
  });

  icons.forEach(icon => {
    icon.addEventListener('click', () => {
      const link = icon.getAttribute('data-link');
      window.open(link, '_blank');
    });
  });

  // Auto scroll every 1.5 seconds
  setInterval(() => {
    selectedIndex = (selectedIndex + 1) % total;
    updateCarousel();
  }, 1500);
});

// --- Time Display ---
function updateTime() {
  const timeEl = document.getElementById('time-display');
  const now = new Date();
  const options = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  };
  timeEl.textContent = now.toLocaleString('en-US', options);
}
setInterval(updateTime, 1000);
updateTime();

// --- Weather Widget for Virginia ---
const apiKey = '71e521476e0a8531ebb37455ed369598';
const weatherLocationEl = document.getElementById('weather-location');
const weatherTempEl = document.getElementById('weather-temp');
const weatherDescEl = document.getElementById('weather-desc');
const weatherIconEl = document.getElementById('weather-icon');

function fetchWeather(city = 'Virginia') {
  fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=imperial&appid=${apiKey}`)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    })
    .then(data => {
      weatherLocationEl.textContent = data.name;
      weatherTempEl.textContent = `${Math.round(data.main.temp)}°F`;
      weatherDescEl.textContent = data.weather[0].description;
      weatherIconEl.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    })
    .catch(e => {
      weatherLocationEl.textContent = 'Error loading weather';
      weatherTempEl.textContent = '';
      weatherDescEl.textContent = '';
      weatherIconEl.src = '';
      console.error('Weather fetch error:', e);
    });
}
fetchWeather();

// --- Spotify Integration ---
const clientId = '9200468bcb7c400395388aec925fad9e'; // Spotify Client ID
const redirectUri = 'https://therealorbwarsdev.github.io/new-tab/'; // Your GitHub Pages URL
const scopes = 'user-read-currently-playing user-read-playback-state';

let accessToken = null;

// Parse access token from URL hash after redirect
function getTokenFromUrl() {
  return window.location.hash
    .substring(1)
    .split('&')
    .reduce((initial, item) => {
      let parts = item.split('=');
      initial[parts[0]] = decodeURIComponent(parts[1]);
      return initial;
    }, {});
}

// On load: parse token & fetch current track if logged in
window.addEventListener('load', () => {
  const hash = getTokenFromUrl();
  if (hash.access_token) {
    accessToken = hash.access_token;
    // Clean the URL so token isn't visible
    window.history.pushState("", document.title, window.location.pathname + window.location.search);
    fetchCurrentTrack();
    // Update every 5 seconds
    setInterval(fetchCurrentTrack, 5000);
  }
});

document.getElementById('connect-spotify').addEventListener('click', () => {
  const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}`;
  window.location = authUrl;
});

function fetchCurrentTrack() {
  if (!accessToken) return;

  fetch('https://api.spotify.com/v1/me/player/currently-playing', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    }
  })
  .then(response => {
    if (response.status === 204 || response.status > 400) {
      document.getElementById('spotify-info').innerText = "Nothing is playing.";
      return null;
    }
    return response.json();
  })
  .then(data => {
    if (!data) return;
    const track = data.item;
    const artists = track.artists.map(artist => artist.name).join(', ');
    const albumArt = track.album.images[0].url;

    document.getElementById('spotify-info').innerHTML = `
      <img src="${albumArt}" width="100" height="100" style="border-radius:8px;"><br>
      <strong>${track.name}</strong><br>
      <em>${artists}</em>
    `;
  })
  .catch(() => {
    document.getElementById('spotify-info').innerText = "Failed to fetch Spotify data.";
  });
}
