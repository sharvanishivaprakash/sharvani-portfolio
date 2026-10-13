/*
  All site content lives here.
  Anything marked `placeholder: true` (or text in [square brackets]) is a stand-in.
  Replace the text and drop real images into /assets, then point `cover` / `images` at them.
*/
window.SITE = {
  name: "Sharvani",
  // Shown in the header, like a pin on a map. Replace with your city's coordinates.
  coordinates: "[00.0000°N 00.0000°E]",
  location: "[Your city, India]",
  email: "[your-email@example.com]",
  links: [
    { label: "Instagram", href: "#" },
    { label: "LinkedIn", href: "#" },
    { label: "Read.cv / Resume", href: "#" }
  ],
  intro:
    "[Placeholder intro] Multidisciplinary designer exploring how ideas move between screens, paper, objects and people.",

  // Primary design projects, in the order they should appear.
  projects: [
    {
      slug: "project-one",
      placeholder: true,
      title: "[Project one]",
      discipline: "[Discipline, e.g. Interaction design]",
      year: "[Year]",
      summary: "[One or two lines on what this project is and why it matters.]",
      tone: "indigo",
      tags: ["[Tag]", "[Tag]", "[Tag]"],
      link: null, // e.g. a Behance or live URL; shows a "Visit project" button when set
      cover: null,
      role: "[Your role]",
      duration: "[Duration]",
      team: "[Collaborators, or Solo]",
      sections: [
        { heading: "The brief", body: "[What was the problem or starting question?]" },
        { heading: "Process", body: "[How you explored it: research, sketches, prototypes.]" },
        { heading: "Outcome", body: "[What you made and what changed because of it.]" }
      ],
      images: [null, null]
    },
    {
      slug: "project-two",
      placeholder: true,
      title: "[Project two]",
      discipline: "[Discipline, e.g. Communication design]",
      year: "[Year]",
      summary: "[One or two lines on what this project is and why it matters.]",
      tone: "rose",
      tags: ["[Tag]", "[Tag]"],
      link: null,
      cover: null,
      role: "[Your role]",
      duration: "[Duration]",
      team: "[Collaborators, or Solo]",
      sections: [
        { heading: "The brief", body: "[What was the problem or starting question?]" },
        { heading: "Process", body: "[How you explored it.]" },
        { heading: "Outcome", body: "[What you made.]" }
      ],
      images: [null, null]
    },
    {
      slug: "project-three",
      placeholder: true,
      title: "[Project three]",
      discipline: "[Discipline, e.g. Product design]",
      year: "[Year]",
      summary: "[One or two lines on what this project is and why it matters.]",
      tone: "marigold",
      tags: ["[Tag]", "[Tag]"],
      link: null,
      cover: null,
      role: "[Your role]",
      duration: "[Duration]",
      team: "[Collaborators, or Solo]",
      sections: [
        { heading: "The brief", body: "[What was the problem or starting question?]" },
        { heading: "Process", body: "[How you explored it.]" },
        { heading: "Outcome", body: "[What you made.]" }
      ],
      images: [null, null]
    },
    {
      slug: "project-four",
      placeholder: true,
      title: "[Project four]",
      discipline: "[Discipline, e.g. Spatial / exhibition]",
      year: "[Year]",
      summary: "[One or two lines on what this project is and why it matters.]",
      tone: "leaf",
      tags: ["[Tag]", "[Tag]"],
      link: null,
      cover: null,
      role: "[Your role]",
      duration: "[Duration]",
      team: "[Collaborators, or Solo]",
      sections: [
        { heading: "The brief", body: "[What was the problem or starting question?]" },
        { heading: "Process", body: "[How you explored it.]" },
        { heading: "Outcome", body: "[What you made.]" }
      ],
      images: [null, null]
    }
  ],

  // Experiments and curiosities. `href` can point to a live piece or a detail page.
  sideProjects: [
    {
      title: "Table For One",
      kind: "Data visualisation",
      year: "[Year]",
      note: "[Placeholder description]",
      href: "https://github.com/sharvanishivaprakash/Nid3_sharu",
      tone: "rose"
    },
    {
      title: "When the World Takes to the Streets",
      kind: "Data visualisation",
      year: "[Year]",
      note: "[Placeholder description]",
      href: "https://github.com/sharvanishivaprakash/Nid3_sharu/tree/main/Protest",
      tone: "indigo"
    },
    { title: "[Side project]", kind: "[Type, e.g. Zine]", year: "[Year]", note: "[A line about it]", href: "#", tone: "marigold", placeholder: true },
    { title: "[Side project]", kind: "[Type, e.g. Type experiment]", year: "[Year]", note: "[A line about it]", href: "#", tone: "leaf", placeholder: true },
    { title: "[Side project]", kind: "[Type, e.g. Illustration]", year: "[Year]", note: "[A line about it]", href: "#", tone: "indigo", placeholder: true },
    { title: "[Side project]", kind: "[Type, e.g. Creative code]", year: "[Year]", note: "[A line about it]", href: "#", tone: "rose", placeholder: true }
  ],

  about: {
    portrait: null,
    paragraphs: [
      "[Placeholder] A few lines on who you are as a designer: what you studied, where you are now, and the kind of problems you like.",
      "[Placeholder] What you're curious about outside of work, and how those interests find their way into your projects."
    ],
    interests: ["[Interest]", "[Interest]", "[Interest]", "[Interest]", "[Interest]"],
    experience: [
      { what: "[Role or programme]", where: "[Place]", when: "[Years]" },
      { what: "[Role or programme]", where: "[Place]", when: "[Years]" },
      { what: "[Role or programme]", where: "[Place]", when: "[Years]" }
    ]
  }
};
