import { faBluesky, faGithub } from "@fortawesome/free-brands-svg-icons";
import { atom } from "jotai";

export const links = atom([
  { link: "/home", name: "Home" },
  { link: "/about", name: "About" },
  { link: "/gallery", name: "Gallery" },
  { link: "/yt-embed", name: "YouTube Embed" },
  { link: "/testing", name: "Testing Environment" },
]);

export const socials = atom([
  { link: "https://github.com/waterlilith0", name: "GitHub", icon: faGithub },
  {
    link: "https://bsky.app/profile/waterlilith.space",
    name: "Bluesky",
    icon: faBluesky,
  },
]);
