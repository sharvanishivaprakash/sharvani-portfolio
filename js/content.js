/*
  Site content that's shared between pages.
  Anything in [square brackets] is a placeholder: replace it with your own text.
  Images: drop files into /assets and set `image` to the path, e.g. "assets/andaaj/cover.jpg".
  An empty `image` (null) shows a plain placeholder panel.
  The homepage copy (hero, statement, about, design approach) is written straight into index.html.
*/
window.SITE = {
  name: "Sharvani SP",

  // Contact. Leave as placeholders until you add the real ones.
  // The Gmail, LinkedIn and Instagram links in "What next ?" use `email` and the LinkedIn / Instagram links below.
  email: "sharvanishivaprakash@gmail.com",
  links: [
    { label: "[LinkedIn]", href: "#" },
    { label: "[Behance]", href: "#" },
    { label: "[Instagram]", href: "#" },
    { label: "[Resume]", href: "#" }
  ],

  // Selected works, in order (two per row). `tags` show under the summary.
  projects: [
    {
      slug: "andaaj",
      title: "Andaaj",
      summary: "Translating nutrition into the language of the kitchen.",
      tags: ["UI/UX", "Product Design", "Food Systems"],
      image: "assets/final/andaaj-cover.webp",
      meta: { type: "Mobile App", discipline: "UI-UX Design", year: "2026", team: "[Individual / Team]" }
    },
    {
      slug: "sense-lo",
      title: "Sense.lo",
      summary: "Making the invisible weight of an environment visible.",
      tags: ["UI/UX", "Data Visualization", "Dashboard Design"],
      image: null,
      meta: { type: "[Project type]", discipline: "[Discipline]", year: "[Year]", team: "[Individual / Team]" }
    },
    {
      slug: "time-wanderers",
      title: "Time Wanderers",
      summary: "What if you could uncover history instead of just reading it?",
      tags: ["Multimodal Interaction", "Coding", "Experiential Design"],
      image: null,
      meta: { type: "[Project type]", discipline: "[Discipline]", year: "[Year]", team: "[Individual / Team]" }
    },
    {
      slug: "janapada-bhoomi",
      title: "Janapada Bhoomi",
      summary: "Bringing folk music culture to life through interaction.",
      tags: ["Physical Computing", "Arduino Prototyping", "Sound Interaction"],
      image: null,
      meta: { type: "[Project type]", discipline: "[Discipline]", year: "[Year]", team: "[Individual / Team]" }
    }
  ]
};
