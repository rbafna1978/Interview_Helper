export type Question = { slug: string; text: string };

export const QUESTIONS: Question[] = [
  { slug: 'challenge-star', text: 'Tell me about a challenge you faced and how you handled it.' },
  { slug: 'conflict',       text: 'Describe a time you had a conflict on a team. What did you do?' },
  { slug: 'impact',         text: 'What is a project you’re proud of? What was the impact?' },
  { slug: 'failure',        text: 'Tell me about a failure and what you learned.' },
];

export function getQuestion(slug: string) {
  return QUESTIONS.find(q => q.slug === slug) || null;
}