import { PromptTemplate } from '../types';

export const STARTER_PROMPTS: PromptTemplate[] = [
  {
    id: 'code-review',
    title: 'Code Review & Refactor',
    description: 'Analyze code for bottlenecks, memory leaks, and clean patterns',
    category: 'code',
    prompt: 'Review the following TypeScript code for edge cases, performance bottlenecks, and potential bugs, then provide an optimized refactored version:\n\n```typescript\n// Paste code here\n```',
    iconName: 'Code2',
  },
  {
    id: 'system-design',
    title: 'System Architecture',
    description: 'Design a resilient distributed microservice or database schema',
    category: 'code',
    prompt: 'Design a high-throughput real-time notification engine supporting 100k concurrent WebSocket users. Include data models, message broker choices (Kafka/Redis), and failover strategies.',
    iconName: 'Layers',
  },
  {
    id: 'executive-summary',
    title: 'Executive Summary',
    description: 'Synthesize complex reports into high-impact bulleted briefings',
    category: 'write',
    prompt: 'Synthesize the following project update into a concise 1-page executive brief with Key Takeaways, Metrics Achieved, and Upcoming Blockers:\n\n[Insert notes here]',
    iconName: 'FileText',
  },
  {
    id: 'explain-concept',
    title: 'Explain Like I\'m 5',
    description: 'Demystify intricate scientific or mathematical phenomena',
    category: 'analyze',
    prompt: 'Explain how Zero-Knowledge Proofs (ZK-SNARKs) work using an intuitive, real-world metaphor that anyone without a cryptography degree can immediately grasp.',
    iconName: 'Brain',
  },
  {
    id: 'startup-ideas',
    title: 'Brainstorm Startup Concepts',
    description: 'Explore niche product opportunities with moat analysis',
    category: 'brainstorm',
    prompt: 'Brainstorm 5 innovative B2B SaaS ideas at the intersection of local AI edge models and developer developer tooling. For each idea, include the core customer pain point and competitive moat.',
    iconName: 'Sparkles',
  },
  {
    id: 'sql-query',
    title: 'Complex SQL Query Builder',
    description: 'Write window functions, CTEs, and indexed analytical queries',
    category: 'code',
    prompt: 'Write a PostgreSQL query using window functions and CTEs to calculate monthly customer retention rates and 30-day cohort churn for a subscription platform.',
    iconName: 'Database',
  },
];

export const SYSTEM_PERSONAS = [
  {
    id: 'default',
    name: 'General Assistant',
    description: 'Helpful, balanced, thorough, and articulate.',
    prompt: 'You are NovaChat, a capable, direct, and thoughtful AI assistant. Deliver clear, structured answers with markdown formatting.',
  },
  {
    id: 'coder',
    name: 'Senior Software Engineer',
    description: 'Idiomatic code, architectural best practices, and edge cases.',
    prompt: 'You are a staff software engineer. Prioritize writing clean, type-safe, production-ready code with explanations of trade-offs, edge cases, and performance considerations.',
  },
  {
    id: 'concise',
    name: 'Ultra Concise',
    description: 'Direct answers without fluff or preamble.',
    prompt: 'Respond concisely and directly. Avoid pleasantries, introductory filler, and unnecessary elaboration. Give direct answers, lists, or code snippets immediately.',
  },
  {
    id: 'socratic',
    name: 'Socratic Tutor',
    description: 'Guides learning through targeted questions.',
    prompt: 'You are an engaging educator who teaches through the Socratic method. Guide the user step-by-step with probing questions rather than immediately giving away solutions.',
  },
];
