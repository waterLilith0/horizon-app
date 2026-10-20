function YTEmbed() {
  return (
    <>
      <title>My Music on YouTube</title>
      <div className="flex flex-col items-center">
        <h1>My YouTube Music Playlists</h1>
        <iframe
          src="https://widgets.sociablekit.com/youtube-playlists/iframe/25690597"
          className="w-250 h-165"
        ></iframe>
      </div>
    </>
  );
}

export default YTEmbed;
