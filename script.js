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

  // Auto scroll
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

const clientId = '9200468bcb7c400395388aec925fad9e'; // Your Spotify Client ID
const redirectUri = 'https://therealorbwarsdev.github.io/new-tab/'; // Your GitHub Pages URL
const scopes = 'user-read-currently-playing user-read-playback-state';

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

let accessToken = null;

// If redirected from Spotify auth, get token and remove hash from URL
window.onload = () => {
  const hash = getTokenFromUrl();
  if (hash.access_token) {
    accessToken = hash.access_token;
    window.history.pushState("", document.title, window.location.pathname + window.location.search);
    fetchCurrentTrack();
  }
};

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
      document.getElementById('spotify-info').innerText = "No song currently playing.";
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

// --- Spotify Now Playing (Read-only) ---
const spotifyTrack = document.getElementById('spotify-track');
const spotifyArtist = document.getElementById('spotify-artist');
const spotifyArt = document.getElementById('spotify-album-art');

const clientId = '9200468bcb7c400395388aec925fad9e';
const redirectUri = 'https://localhost:5500'; // or your real domain
const scopes = 'user-read-currently-playing user-read-playback-state';

function getAccessTokenFromUrl() {
  const hash = window.location.hash;
  if (!hash) return null;
  const params = new URLSearchParams(hash.substring(1));
  return params.get('access_token');
}

function redirectToSpotifyAuth() {
  const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}`;
  window.location.href = authUrl;
}

function fetchNowPlaying(accessToken) {
  fetch('https://api.spotify.com/v1/me/player/currently-playing', {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
    .then(res => {
      if (res.status === 204) return null; // no content
      if (!res.ok) throw new Error('Spotify API error');
      return res.json();
    })
    .then(data => {
      if (!data || !data.item) {
        spotifyTrack.textContent = 'Not playing';
        spotifyArtist.textContent = '';
        spotifyArt.src = 'https://i.scdn.co/image/ab67616d00004851c8c1a1ec83e8cd3e4c4d5a52';
        return;
      }

      spotifyTrack.textContent = data.item.name;
      spotifyArtist.textContent = data.item.artists.map(a => a.name).join(', ');
      spotifyArt.src = data.item.album.images[0].url;
    })
    .catch(err => {
      console.error('Error fetching Spotify now playing:', err);
      spotifyTrack.textContent = 'Login to Spotify';
    });
}

// On load, check for access token
window.addEventListener('load', () => {
  const token = getAccessTokenFromUrl();
  if (token) {
    window.history.replaceState({}, document.title, '/'); // Clean URL
    setInterval(() => fetchNowPlaying(token), 5000); // update every 5s
  } else {
    document.getElementById('spotify-track').textContent = 'Click to connect';
    document.getElementById('spotify-player').addEventListener('click', redirectToSpotifyAuth);
  }
});
