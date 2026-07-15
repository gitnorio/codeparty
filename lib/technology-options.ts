export const maxSelectedSkills = 8;

export const technologyGroups = [
  {
    label: "Frontend",
    technologies: [
      "JavaScript",
      "TypeScript",
      "React",
      "Next.js",
      "Vue",
      "Angular",
      "HTML/CSS",
      "Tailwind CSS",
      "Frontend: Other",
    ],
  },
  {
    label: "Backend",
    technologies: [
      "Node.js",
      "Python",
      "Java",
      "PHP",
      "Ruby",
      "C#",
      "Go",
      "Backend: Other",
    ],
  },
  {
    label: "Databases",
    technologies: [
      "PostgreSQL",
      "MySQL",
      "MongoDB",
      "Supabase",
      "Firebase",
      "Databases: Other",
    ],
  },
  {
    label: "Backend Frameworks",
    technologies: [
      "Express",
      "Django",
      "Flask",
      "Spring Boot",
      "Laravel",
      ".NET",
      "Backend Frameworks: Other",
    ],
  },
  {
    label: "Mobile",
    technologies: ["React Native", "Flutter", "Swift", "Kotlin", "Mobile: Other"],
  },
  {
    label: "DevOps & Tools",
    technologies: ["Docker", "AWS", "Vercel", "GitHub Actions", "DevOps & Tools: Other"],
  },
  {
    label: "Other",
    technologies: ["SQL", "GraphQL", "REST API", "Figma", "Other: Other"],
  },
] as const;

export function formatTechnologyGroupLabel(
  label: (typeof technologyGroups)[number]["label"],
  language: "en" | "fr"
) {
  if (language === "en") {
    return label;
  }

  if (label === "Frontend") return "Frontend";
  if (label === "Backend") return "Backend";
  if (label === "Databases") return "Bases de données";
  if (label === "Backend Frameworks") return "Frameworks backend";
  if (label === "Mobile") return "Mobile";
  if (label === "DevOps & Tools") return "DevOps et outils";
  if (label === "Other") return "Autres";
  return label;
}

export function formatTechnologyLabel(technology: string, language: "en" | "fr") {
  if (technology.endsWith(": Other")) {
    return language === "fr" ? "Autre" : "Other";
  }

  return technology;
}
