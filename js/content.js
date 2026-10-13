/*
  All site content lives here.
  Anything in [square brackets] is a placeholder: replace it with your own text.
  Images: drop files into /assets and set `image` to the path, e.g. "assets/andaaj/cover.jpg".
  An empty `image` (null) shows a labelled placeholder box.
*/
window.SITE = {
  name: "Sharvani SP",
  role: "interaction designer",
  descriptor: "A UX & Interdisciplinary Designer",
  statement: "Turning human insights into thoughtful interactions and ideas into experiences.",

  // Hero character. Its pupils are separate layers (assets/character/iris-*.png) so they can follow the cursor;
  // swapping in a new picture means preparing those layers again.
  character: { alt: "Illustrated portrait of Sharvani with wavy hair and glasses" },

  // Shown small in the nav and footer. Replace with your city's coordinates.
  coordinates: "[00.0000°N 00.0000°E]",
  location: "[Your city]",
  // Your time zone for the clock in the nav, e.g. "Asia/Kolkata". null uses the visitor's own time.
  timezone: null,

  // Contact. Leave as placeholders until you add the real ones.
  email: "[your-email@example.com]",
  links: [
    { label: "[LinkedIn]", href: "#" },
    { label: "[Behance]", href: "#" },
    { label: "[Instagram]", href: "#" },
    { label: "[Resume]", href: "#" }
  ],

  // Featured projects, in order. `size` controls the editorial grid: "large" spans wider.
  projects: [
    {
      slug: "andaaj",
      title: "Andaaj",
      summary: "Redesign of MyRoots, a regional food experience.",
      size: "large",
      image: null,
      meta: { type: "[Project type]", discipline: "[Discipline]", year: "[Year]", team: "[Individual / Team]" }
    },
    {
      slug: "sense-lo",
      title: "Sense.lo",
      summary: "A project exploring sensory overload and making an internal experience more understandable.",
      size: "small",
      image: null,
      meta: { type: "[Project type]", discipline: "[Discipline]", year: "[Year]", team: "[Individual / Team]" }
    },
    {
      slug: "multimodal-interaction",
      title: "Multimodal Interaction",
      summary: "Designing experiences through multiple modes of interaction.",
      size: "small",
      image: null,
      meta: { type: "[Project type]", discipline: "[Discipline]", year: "[Year]", team: "[Individual / Team]" }
    },
    {
      slug: "janapada-bhoomi",
      title: "Janapada Bhoomi",
      summary: "A phygital product and experience connecting physical and digital interaction.",
      size: "large",
      image: null,
      meta: { type: "[Project type]", discipline: "[Discipline]", year: "[Year]", team: "[Individual / Team]" }
    }
  ],

  about: {
    intro:
      "[Placeholder] A few lines about you beyond your role: how you got into interaction design, and what keeps you curious.",
    // Polaroid collage. `note` is the small handwritten annotation revealed on hover or tap.
    collage: [
      { caption: "Making handmade clay charms and figurines", note: "[note]", image: null },
      { caption: "Creative coding and vibe coding with p5.js", note: "[note]", image: null },
      { caption: "Commissioned art", note: "[note]", image: null },
      { caption: "Reading and making comics", note: "[note]", image: null },
      { caption: "Teaching at government schools", note: "[note]", image: null },
      { caption: "Theatre and drama", note: "[note]", image: null },
      { caption: "Other experiments along the way", note: "[note]", image: null }
    ]
  },

  // Playground: looser work. `ratio` is width / height of the image box.
  playground: [
    { title: "[Playground item]", kind: "p5.js sketch", ratio: 1, image: null, href: null },
    { title: "[Playground item]", kind: "Illustration", ratio: 0.8, image: null, href: null },
    { title: "[Playground item]", kind: "Interaction experiment", ratio: 1.33, image: null, href: null },
    { title: "[Playground item]", kind: "Commissioned art", ratio: 0.75, image: null, href: null },
    { title: "[Playground item]", kind: "Visual experiment", ratio: 1.2, image: null, href: null },
    { title: "[Playground item]", kind: "Creative coding", ratio: 1, image: null, href: null },
    { title: "[Playground item]", kind: "Unfinished exploration", ratio: 0.9, image: null, href: null }
  ]
};
