const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
const redirectUri = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URL;

export function generateRandomString(length: number) {
  let text = '';
  let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

export async function generateCodeChallenge(codeVerifier: string) {
  function base64encode(string: any) {
    // @ts-ignore:next-line
    return btoa(String.fromCharCode.apply(null, new Uint8Array(string)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return base64encode(digest);
}


export function authorizeSpotify() {
  let codeVerifier = generateRandomString(128);

  generateCodeChallenge(codeVerifier).then(codeChallenge => {
    let state = generateRandomString(16);
    let scope = 'user-read-private user-read-email user-top-read';
  
    localStorage.setItem('code-verifier', codeVerifier);
    let args = new window.URLSearchParams({
      response_type: 'code',
      client_id: clientId || '',
      scope: scope,
      redirect_uri: redirectUri || '',
      state: state,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge
    });
  
    (window as Window).location = 'https://accounts.spotify.com/authorize?' + args;
  });
}

export async function getAccessToken(code: string | undefined): Promise<string | undefined> {
  return new Promise((res, rej) => {
    if(localStorage.getItem('spotify-token')) {
      res(localStorage.getItem('spotify-token') || '');
      return;
    }
    if(!code) {
      res(undefined);
      return;
    }

    const verifier = localStorage.getItem("code-verifier");

    const params = new URLSearchParams();
    params.append("client_id", clientId || '');
    params.append("grant_type", "authorization_code");
    params.append("code", code || '');
    params.append("redirect_uri", redirectUri || '');
    params.append("code_verifier", verifier!);
  
    fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
    })
      .then((result) => result.json())
      .then((response) => {
        if(response.error) {
          rej(response)
        } else {
          localStorage.setItem('spotify-token', response.access_token);
          res(response.access_token);
        }
      })
      .catch((error) => rej(error))
  
  })
}

export async function fetchProfile(token: string): Promise<SpotifyApi.CurrentUsersProfileResponse> {
  return new Promise((res, rej) => {
    fetch("https://api.spotify.com/v1/me", {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
    })
      .then((response) => {
        if (!response.ok) {
          rej(response.json())
        } else {
          return response.json();
        }
      })
      .then((result) => res(result))
  })
}

export async function fetchUsersTopArtists(token: string, type: 'artists' | 'tracks'): Promise<SpotifyApi.UsersTopArtistsResponse> {
  var url = new URL(`https://api.spotify.com/v1/me/top/${type}`)
  url.search = new URLSearchParams({ }).toString();
  return new Promise((res, rej) => {
    fetch(url, {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
    })
      .then((response) => {
        if (!response.ok) {
          rej(response)
        } else {
          return response.json();
        }
      })
      .then((result) => res(result))
  })
}

export async function fetchSeveralArtists(token: string, ids: string): Promise<SpotifyApi.MultipleArtistsResponse> {
  var url = new URL('https://api.spotify.com/v1/artists')
  url.searchParams.append('ids', ids)
  return new Promise((res, rej) => {
    fetch(url, {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
    })
      .then((response) => {
        if (!response.ok) {
          rej(response)
        } else {
          return response.json();
        }
      })
      .then((result) => res(result))
  })
}