import { useRouter } from 'next/router'
import { useState } from 'react';
import { useEffect } from 'react';
import Head from 'next/head'
import Image from 'next/image'
import { authorizeSpotify, getAccessToken, fetchProfile, fetchUsersTopArtists, fetchSeveralArtists } from '@/utils/spotify';
import { Inter } from 'next/font/google'
 
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})
export default function Home() {
  const [profile, setProfile] = useState<SpotifyApi.CurrentUsersProfileResponse>();
  const [userTopArtists, setUserTopArtists] = useState<SpotifyApi.UsersTopArtistsResponse>();
  const [userRecommendations, setUserRecommendations] = useState<{spotify_link: string, artist: string }[]>();
  const [spotifyRecommendations, setSpotifyRecommendations] = useState<SpotifyApi.MultipleArtistsResponse>();
  const [reauthorize, setReauthorize] = useState<Boolean>(false);
  const [spotifyToken, setSpotifyToken] = useState<string>();
  const [error, setError] = useState<string>('');
  const router = useRouter();
  const { code } = router.query;

  function getRecommendations() {
    const artistsArray = userTopArtists?.items.map((artist, i) => artist.name);
    fetch('/api/recommend', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ artists: artistsArray }),
    })
      .then((res) => res.json())
      .then((data) => {
        setUserRecommendations(data.suggestions)
      })
  }

  function getArtistIdFromURL(url: string) {
    const splitUrl = url.split('/');

    return splitUrl[splitUrl.length - 1];
  }

  useEffect(() => {
    if(!userRecommendations || !userRecommendations.length || !spotifyToken) return;
    fetchSeveralArtists(spotifyToken, userRecommendations.map((rec) => getArtistIdFromURL(rec.spotify_link)).join(','))
      .then((response) => setSpotifyRecommendations((response)))
  
  }, [userRecommendations, spotifyToken])

  useEffect(() => {
    getAccessToken(`${code}`)
      .then((token) => {
        if(token) {
          setSpotifyToken(token);
          router.replace('/', undefined, { shallow: true });
          window.localStorage.setItem('spotify-token', token);
          fetchProfile(token).then((profile) => {
            setProfile(profile);
          })
          .catch((error) => {
            setError(error.error_description)
            setReauthorize(true);
          })
          fetchUsersTopArtists(token, 'artists').then((response) => {
            setUserTopArtists(response)
          })
        }
      })
      .catch((error) => {
        setReauthorize(true);
        setError(error.error_description)
      })
  }, [code]);

  useEffect(() => {
    if(reauthorize) {
      window.localStorage.removeItem('spotify-token');
    }
  }, [reauthorize])
  return (
    <>
      <Head>
        <title>Spotify Recommendations from ChatGPT</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={inter.className}>
        <div className='w-[500px] m-auto flex flex-col mt-5'>
          {!profile && <button className='bg-blue-500 p-5 rounded-lg text-white mt-5 mb-5' onClick={() => authorizeSpotify()}>
            Click to auth
          </button>}
          { profile && profile.images && profile.images[0] &&<div className='flex mb-5'>
            <Image
              src={profile.images[1].url}
              className='mr-5'
              alt="Picture of the author"
              width={80}
              height={80}
            />
            <div>
              User details:
              <p>Name: { profile.display_name }</p>
              <p>Followers: { profile.followers && profile.followers.total }</p>
              <p>Status: { profile.product }</p>
            </div>
          </div> }

          {userTopArtists && userTopArtists.items.length > 0 && <div className='flex flex-col'>
            <p className='text-center mb-5'>Top Artists for user:</p>
            <div className='grid grid-flow-rows grid-cols-3 gap-4 mb-5'>
            { !userRecommendations && userTopArtists.items.map((artist, i) => <div key={i} className='flex'>
              {artist.images[0] && <Image
                  src={artist.images[0].url}
                  alt="Picture of the author"
                  width={50}
                  height={50}
                />}
                <p></p>{ artist.name }
              
              </div>)
            }
            </div>

            <button className='bg-blue-400 text-white p-5 rounded-2xl m-auto' onClick={getRecommendations}>
              Create Recommendations
            </button>
          </div>}
          {spotifyRecommendations && spotifyRecommendations.artists.length > 0 && spotifyRecommendations.artists.map((artist, i) => artist && <div key={i+'artist'}><img src={artist.images[0].url}></img>{ artist.name }</div>)}
          {/* { userRecommendations && <div> {userRecommendations.map((rec, i) => <div>{i + 1} {rec.artist} <a className='underline text-blue-500' href={rec.spotify_link}>{rec.spotify_link}</a></div>)} </div>} */}
          { reauthorize && <div>{ reauthorize && 'You need to reauthenticate with spotify' }</div> }
          { error && <div>{ error }</div> }
        </div>
      </main>
    </>
  )
}
