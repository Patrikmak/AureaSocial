// @ts-ignore: Deno specific import
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { query } = await req.json()
    
    if (!query) {
      return new Response(JSON.stringify({ error: 'Query is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // @ts-ignore: Deno global
    const clientId = Deno.env.get('SPOTIFY_CLIENT_ID')
    // @ts-ignore: Deno global
    const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET')

    if (!clientId || !clientSecret) {
      console.error("[spotify-search] Spotify credentials not configured");
      return new Response(JSON.stringify({ error: 'Spotify credentials not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 1. Obter Token de Acesso
    const authResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret)
      },
      body: 'grant_type=client_credentials'
    })

    const { access_token } = await authResponse.json()

    // 2. Buscar Músicas
    const searchResponse = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=5`, {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    })

    const data = await searchResponse.json()
    const tracks = data.tracks.items.map((track: any) => ({
      id: track.id,
      name: track.name,
      artist: track.artists[0].name,
      albumArt: track.album.images[2]?.url || track.album.images[0]?.url,
      previewUrl: track.preview_url
    }))

    console.log(`[spotify-search] Found ${tracks.length} tracks for query: ${query}`);

    return new Response(JSON.stringify({ tracks }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error("[spotify-search] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})