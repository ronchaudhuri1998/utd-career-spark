export interface Project {
  id: string;
  title: string;
  description: string;
  skills: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedTime?: string;
  category?: string;
  careerRelevance?: string;
}

export interface ProjectRecommendationsData {
  projects: Project[];
}
