import { useRouter } from 'next/router'
import { useState } from 'react';
import { useEffect } from 'react';
import Head from 'next/head'
import Image from 'next/image'
import { Inter } from 'next/font/google'
import styles from '@/styles/Home.module.css'


import { authorizeSpotify, getAccessToken, fetchProfile, fetchUsersTopArtists } from '@/utils/spotify';

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  const [profile, setProfile] = useState<SpotifyApi.CurrentUsersProfileResponse | undefined>(undefined);
  const [userTopArtists, setUserTopArtists] = useState<SpotifyApi.UsersTopArtistsResponse | undefined>(undefined);
  const [reauthorize, setReauthorize] = useState<Boolean>(false);
  const [error, setError] = useState<string>('');
  const router = useRouter();
  const { code } = router.query;

  useEffect(() => {
    getAccessToken(code)
      .then((token) => {
        if(token) {
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
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={inter.className}>
        <div>
          <button onClick={() => authorizeSpotify()}>
            Click to auth
          </button>
          { profile && profile.images && profile.images[0] &&<div>
            <Image
              src={profile.images[0].url}
              alt="Picture of the author"
              width={80}
              height={80}
            />
            User details:
            Name: { profile.display_name }
            Followers: { profile.followers && profile.followers.total }
            Status: { profile.product }
          </div> }


          { userTopArtists && <p>Top Artists for user:</p>}
          { userTopArtists && userTopArtists.items.length > 0 && userTopArtists.items.map((artist, i) => <div key={i}>
          {artist.images[0] && <Image
              src={artist.images[0].url}
              alt="Picture of the author"
              width={50}
              height={50}
            />}
            <p></p>{ artist.name }
          
          </div>) }
          { reauthorize && <div>{ reauthorize && 'You need to reauthenticate with spotify' }</div> }
          { error && <div>{ error }</div> }
        </div>
      </main>
    </>
  )
}
