export interface Framework {
  id: string;
  name: string;
  description: string;
  useCase: string;
  prompt: string; // Prompt is now mandatory
}

export const frameworks: Framework[] = [
  {
    id: "aida",
    name: "AIDA",
    description: "Guides readers through Attention, Interest, Desire, and Action.",
    useCase: "Landing pages, ads, email campaigns for step-by-step persuasion.",
    prompt: `
Write a [text format] for [product name] targeting [target audience] using the AIDA framework.

- Attention: [Write a compelling opening line to grab the reader's attention. Be creative and specific to the product and audience.]
- Interest: [Highlight the key benefits of the product and why it's relevant to the target audience. Focus on solving their problems.]
- Desire: [Create a sense of desire by painting a picture of how the product will improve their lives or business. Use persuasive language.]
- Action: [Include a clear and direct call to action, telling the reader what you want them to do next. Be specific and create a sense of urgency.]
    `
  },
  {
    id: "pas",
    name: "PAS",
    description: "Identifies Problem, Agitates the pain, presents Solution.",
    useCase: "Sales pages, emails, social media for emotional connection & problem-solving.",
    prompt: `
Write a [text format] for [product name] targeting [target audience] using the PAS framework.

- Problem: [Clearly state the problem that the target audience is facing. Be specific and relatable.]
- Agitation: [Emphasize the pain points and negative consequences of the problem. Make the reader feel the urgency to solve it.]
- Solution: [Present your product as the ideal solution to the problem. Highlight its key features and benefits, and explain how it alleviates the pain points.]
    `
  },
  {
    id: "bab",
    name: "BAB",
    description: "Shows the transformation: Before situation, After result, Bridge (your offer).",
    useCase: "Product descriptions, landing pages, testimonials to highlight positive change.",
    prompt: `
Write a [text format] for [product name] targeting [target audience] using the BAB framework.

- Before: [Describe the current situation or problem that the target audience is facing. Paint a picture of their pain points and frustrations.]
- After: [Describe the ideal situation or outcome that the target audience desires. Paint a picture of how their lives or business will be better after solving the problem.]
- Bridge: [Explain how your product bridges the gap between the \"before\" and \"after.\" Highlight its key features and benefits, and explain how it helps the target audience achieve their desired outcome.]
    `
  },
  {
    id: "fab",
    name: "FAB",
    description: "Details Feature, explains Advantage, highlights User Benefit.",
    useCase: "Product pages, brochures, presentations to clarify value proposition.",
    prompt: `
Write a [text format] for [product name] targeting [target audience] using the FAB framework.

For each feature of the product, describe its advantage and the benefit it provides to the target audience.

Feature: [Describe the feature]
Advantage: [Explain why this feature is better than alternatives]
Benefit: [Explain how this feature helps the user achieve their goals or solve their problems]

Repeat the Feature-Advantage-Benefit structure for each key feature of the product.
    `
  },
  {
    id: "4ps",
    name: "4 Ps",
    description: "Makes a Promise, paints a Picture, provides Proof, includes a Push (CTA).",
    useCase: "Short ads, landing pages, promotional emails for quick trust & action.",
    prompt: `
Write a [text format] for [product name] targeting [target audience] using the 4 Ps framework.

- Promise: [Make a bold and compelling promise to the target audience. What key benefit will they receive?]
- Picture: [Paint a vivid picture of the positive outcome or transformation that the product will deliver. Use descriptive language and appeal to the reader's emotions.]
- Proof: [Provide evidence to support your promise. This could include testimonials, statistics, case studies, or guarantees.]
- Push: [Include a strong and direct call to action, urging the reader to take the next step. Create a sense of urgency and make it easy for them to act.]
    `
  },
  {
    id: "psr",
    name: "Problem-Solution-Result",
    description: "Tells a mini-story: Presents problem, explains solution, shares results.",
    useCase: "Case studies, testimonials, reviews for demonstrating real-world impact.",
    prompt: `
Write a [text format] for [product name] targeting [target audience] using the Problem-Solution-Result framework.

- Problem: [Describe the problem that the target audience was facing before using the product.]
- Solution: [Explain how the product was used to solve the problem.]
- Result: [Describe the positive results that were achieved after using the product. Use specific data and metrics whenever possible.]
    `
  },
  {
    id: "howto",
    name: "How-To",
    description: "Provides step-by-step instructions to achieve a goal, positioning product as helpful.",
    useCase: "Blog posts, guides, tutorials for educational content and practical value.",
    prompt: `
Write a [text format] for [topic] targeting [target audience] using the \"How-To\" template.

Headline: How to [achieve a specific result or solve a specific problem]

Steps:
1. [Step 1: Describe the first step in detail]
2. [Step 2: Describe the second step in detail]
3. [Step 3: Describe the third step in detail]
... (Add as many steps as necessary)

Call to Action: [Encourage the reader to take further action, such as trying your product or service, subscribing to your newsletter, or sharing the article]
    `
  }
]; 