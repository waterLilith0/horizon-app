import {
  faBluesky,
  faGithub,
  faLinkedin,
} from "@fortawesome/free-brands-svg-icons";
import { atom } from "jotai";

export const links = atom([
  { link: "/home", name: "Home" },
  { link: "/about-contact", name: "About" },
  { link: "/gallery", name: "Gallery" },
  { link: "/yt-embed", name: "YouTube Embed" },
  { link: "/dashboard", name: "API Dashboard" },
]);

export const footerRows = atom([
  {
    row: 1,
    links: [
      {
        type: "intern",
        url: "/",
        text: "Home",
      },
      {
        type: "intern",
        url: "/about-contact",
        text: "About Me & Contact",
      },
    ],
  },
  {
    row: 2,
    links: [
      {
        type: "intern",
        url: "/impressum",
        text: "Impressum",
      },
      {
        type: "intern",
        url: "/sitemap",
        text: "Sitemap",
      },
    ],
  },
  {
    row: 3,
    links: [
      {
        type: "intern",
        url: "/privacy",
        text: "Privacy Policy",
      },
      {
        type: "intern",
        url: "/api",
        text: "API Dashboard",
      },
    ],
  },
]);

export const socials = atom([
  { link: "https://github.com/waterlilith0", name: "GitHub", icon: faGithub },
  {
    link: "https://bsky.app/profile/waterlilith.space",
    name: "Bluesky",
    icon: faBluesky,
  },
  {
    link: "https://www.linkedin.com/in/miriam-fix-0b96b12aa/",
    name: "LinkedIn",
    icon: faLinkedin,
  },
]);

export const cardsAtom = atom([
  {
    image: "",
    title: "Steampunk",
    content:
      "One of my favorite topics to talk about is Steampunk." +
      " It's a genre, scene, style and a lifestyle. Steampunk usually plays in a victorian fantasy scenario.",
  },
  {
    image: "",
    title: "Cyberpunk",
    content:
      "Yet another of my favorite topics, following the same vein as" +
      " Steampunk. The difference here is that Cyberpunk plays in a" +
      " dark dystopian future (as thought of from an 80s perspective)." +
      " Big works that influenced me here were most of William" +
      " Gibson's books, as well as the pen-and-paper roleplaying game Shadowrun.",
  },
  {
    image: "",
    title: "Programming",
    content:
      "Kinda plays into the Cyberpunk that I like so much, I like" +
      " programming while listening to some chill beats.",
    footer: "Currently Programming in: C#, React, TS, JS, Java",
  },
  {
    image: "",
    title: "Music",
    content:
      "Metal, Cabaret, some Pop, some Soundtracks (Made in Abyss by" +
      " Kevin Penkin) as well as most things electronic I'm constantly" +
      " listening to. There's only a few things that you will never" +
      " hear me listen to, german Schlager, gangster Rap, etc.",
    footer: "Find my obsessions on Last.fm: ",
    link: "https://www.last.fm/user/waterLilith0",
  },
  {
    image: "",
    title: "Made in Abyss",
    content:
      "I'm a bit of a weeb so I like and have watched plenty of Manga" +
      " and Anime. My absolute favorite out of the literal over 100 is" +
      " by far Made in Abyss. It is a tragic and beautiful journey" +
      " filled with blessings and curses.",
  },
  {
    image: "",
    title: "Lord of the Rings",
    content:
      "Having first read the books as a child and then later watched" +
      " all of the movies, I can say that Tolkien's worldbuilding is" +
      " inspiring and fascinating. I've also read a lot of his lesser" +
      " known works, such as the Silmarillion (that was a big pain to" +
      " sit through!).",
  },
]);
