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

// --- Spotify PKCE Flow ---
const clientId = '9200468bcb7c400395388aec925fad9e';
const redirectUri = 'https://therealorbwarsdev.github.io/new-tab/';
const scopes = 'user-read-currently-playing user-read-playback-state';

function generateRandomString(length) {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

async function generateCodeChallenge(codeVerifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

const codeVerifier = generateRandomString(128);

(async () => {
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  localStorage.setItem('spotify_code_verifier', codeVerifier);

  document.getElementById('connect-spotify').addEventListener('click', () => {
    const authUrl = `https://accounts.spotify.com/authorize?` +
      `client_id=${clientId}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&code_challenge_method=S256` +
      `&code_challenge=${codeChallenge}` +
      `&scope=${encodeURIComponent(scopes)}`;

    window.location = authUrl;
  });
})();

window.addEventListener('load', () => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  if (!code) return;

  const storedVerifier = localStorage.getItem('spotify_code_verifier');
  if (!storedVerifier) return;

fetch('https://broad-chlorinated-parmesan.glitch.me', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    code,
    codeVerifier,
    redirectUri,
    clientId
  })
})

    body: new URLSearchParams({
      client_id: clientId,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      code_verifier: storedVerifier
    })
  })
    .then(res => res.json())
    .then(data => {
      const accessToken = data.access_token;
      if (accessToken) fetchCurrentTrack(accessToken);
    })
    .catch(err => {
      console.error('Token exchange failed', err);
    });
});

function fetchCurrentTrack(token) {
  fetch('https://api.spotify.com/v1/me/player/currently-playing', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
    .then(res => {
      if (res.status === 204) return null;
      if (!res.ok) throw new Error('Spotify API error');
      return res.json();
    })
    .then(data => {
      if (!data || !data.item) {
        document.getElementById('spotify-info').textContent = 'Nothing is playing.';
        return;
      }

      const track = data.item;
      const artists = track.artists.map(a => a.name).join(', ');
      const albumArt = track.album.images[0].url;

      document.getElementById('spotify-info').innerHTML = `
        <img src="${albumArt}" width="100" height="100" style="border-radius:8px;"><br>
        <strong>${track.name}</strong><br>
        <em>${artists}</em>
      `;
    })
    .catch(() => {
      document.getElementById('spotify-info').textContent = 'Failed to fetch Spotify data.';
    });
}
