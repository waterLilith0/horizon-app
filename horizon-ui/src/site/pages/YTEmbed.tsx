function YTEmbed() {
  return (
    <>
      <title>My Music on YouTube</title>
      <div className="flex flex-col items-center w-full h-full">
        <h1>My YouTube Music Playlists</h1>
        <iframe
          title="Youtube Music waterLilith"
          src="https://widgets.sociablekit.com/youtube-playlists/iframe/25690597"
          className="w-full h-screen"
        ></iframe>
      </div>
    </>
  );
}

export default YTEmbed;
