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
