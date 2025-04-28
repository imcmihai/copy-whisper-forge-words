import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

// Import framework definitions (assuming they are accessible or copied here)
// If constants.ts is not directly importable in Deno edge functions, 
// you might need to copy the frameworks array here or fetch it.
// For simplicity, let's copy the definitions here for now.
interface Framework {
  id: string;
  name: string;
  description: string;
  useCase: string;
  prompt: string;
}

const frameworks: Framework[] = [
  {
    id: "aida",
    name: "AIDA",
    description: "Guides readers through Attention, Interest, Desire, and Action.",
    useCase: "Landing pages, ads, email campaigns for step-by-step persuasion.",
    prompt: `
Write a [text format] about [subject] for [target audience] using the AIDA framework.

Context: [Add any relevant background information, industry specifics, or unique selling points]

- Attention: Create a compelling opening that immediately grabs the reader's attention. Consider using a surprising statistic, provocative question, bold statement, relatable problem, or emotional hook that resonates specifically with [target audience]. Make it impossible to ignore.

- Interest: Build genuine interest by explaining why this matters to the reader. Connect [subject]'s key benefits or features directly to the reader's needs, pain points, or aspirations. Focus on the "what's in it for me" factor from the audience's perspective. Use specific details that demonstrate deep understanding of their situation.

- Desire: Intensify the reader's desire by vividly illustrating the positive transformation or outcome they'll experience. Use sensory language, storytelling, social proof, or concrete examples to make the benefits feel tangible and attainable. Address potential objections preemptively and emphasize what makes [subject] unique or superior to alternatives.

- Action: Conclude with a clear, compelling call to action that feels like the natural next step. Create appropriate urgency without being pushy, and make the requested action specific and easy to take. Consider what level of commitment makes sense at this stage and ensure the reader knows exactly what to do and what to expect afterward.

Important: Adapt this framework appropriately for [text format] while maintaining the AIDA structure. The content should feel natural and cohesive, not formulaic.
    `
  },
  {
    id: "pas",
    name: "PAS",
    description: "Identifies Problem, Agitates the pain, presents Solution.",
    useCase: "Sales pages, emails, social media for emotional connection & problem-solving.",
    prompt: `
Write a [text format] about [subject] for [target audience] using the PAS framework.

Context: [Add any relevant background information, industry specifics, or unique selling points]

- Problem: Identify a specific, relatable problem that [target audience] is experiencing. Focus on a pain point that resonates emotionally and intellectually with them. The problem should be clear, concise, and immediately recognizable to create an "I have that exact issue" response. Consider both obvious and hidden problems they may not fully recognize yet.

- Agitation: Expand on the consequences and implications of this problem if left unsolved. Dig deeper into the emotional, financial, professional, or personal costs. Use vivid language to help readers feel the weight and urgency of their situation. Highlight what they're missing out on, risks they face, or how the problem might worsen over time. This section should create emotional tension that motivates action.

- Solution: Present [subject] as the logical, effective solution to their problem. Explain specifically how it addresses each aspect of the problem and agitation points mentioned earlier. Focus on transformation and outcomes rather than just features. Make the solution feel accessible, practical, and tailored to their specific situation. End with clarity about what they should do next to implement this solution.

Important: Adapt this framework appropriately for [text format] while maintaining the PAS structure. The content should flow naturally between sections and feel like a cohesive narrative, not a mechanical formula.
    `
  },
  {
    id: "bab",
    name: "BAB",
    description: "Shows the transformation: Before situation, After result, Bridge (your offer).",
    useCase: "Product descriptions, landing pages, testimonials to highlight positive change.",
    prompt: `
Write a [text format] about [subject] for [target audience] using the BAB framework.

Context: [Add any relevant background information, industry specifics, or unique selling points]

- Before: Paint a detailed picture of the current reality for [target audience]. Describe their challenges, limitations, frustrations, or unmet needs in a way that shows deep understanding of their situation. Use specific details that make them think "this is exactly how I feel." Focus on both practical and emotional aspects of their current state. This section should create recognition and establish empathy.

- After: Create a compelling vision of what life could be like after their problem is solved. Describe the ideal state in vivid, sensory terms - how they'll feel, what they'll accomplish, what will be different in their day-to-day experience. Make this vision aspirational yet believable. Focus on meaningful outcomes and transformations that matter most to [target audience]. This section should create genuine desire for change.

- Bridge: Explain precisely how [subject] creates the path from "Before" to "After." Detail the specific mechanisms, features, or approaches that make this transformation possible. Emphasize what makes this solution unique, accessible, or particularly effective for their situation. Address potential obstacles or objections they might have about making the transition. Conclude with clear guidance on how to take the first step toward the "After" state.
 
Important: Adapt this framework appropriately for [text format] while ensuring the contrast between "Before" and "After" is powerful enough to motivate action. The content should read as a compelling transformation story, not a rigid template.
`
  },
  {
    id: "fab",
    name: "FAB",
    description: "Details Feature, explains Advantage, highlights User Benefit.",
    useCase: "Product pages, brochures, presentations to clarify value proposition.",
    prompt: `
Write a [text format] about [subject] for [target audience] using the FAB framework.

Context: [Add any relevant background information, industry specifics, or unique selling points]

Introduction: Begin with a brief overview of [subject] and why it matters to [target audience]. This should set the context for the features you'll be highlighting.

For each key aspect of [subject], present:

- Feature: Clearly describe what the feature is in specific, concrete terms. Avoid technical jargon unless appropriate for the audience. Focus on what makes this feature distinctive or noteworthy. Be precise about capabilities, specifications, or characteristics.

- Advantage: Explain why this feature is superior to alternatives or the status quo. Highlight what makes it different, better, or unique compared to other options. This section should answer "So what?" about the feature by explaining its comparative value or technical superiority.

- Benefit: Translate the advantage into a meaningful, personal outcome for [target audience]. Connect directly to their goals, challenges, or aspirations. Use "you" language and focus on how this specifically improves their life, work, or experience. This is the emotional payoff that answers "What's in it for me?"

Include [number] key FAB sections, prioritizing the most important or distinctive aspects of [subject].

Conclusion: Summarize the overall value proposition and include a clear next step or call to action.

Important: While maintaining the FAB structure for each key point, ensure the overall piece flows naturally and builds a compelling case. Each benefit should connect to the next feature in a logical progression.

    `
  },
  {
    id: "4ps",
    name: "4 Ps",
    description: "Makes a Promise, paints a Picture, provides Proof, includes a Push (CTA).",
    useCase: "Short ads, landing pages, promotional emails for quick trust & action.",
    prompt: `
Write a [text format] about [subject] for [target audience] using the 4 Ps framework.

Context: [Add any relevant background information, industry specifics, or unique selling points]

- Promise: Make a clear, compelling promise that addresses a core need or desire of [target audience]. This should be specific, meaningful, and differentiated - not a generic claim. Focus on the primary transformation or outcome that [subject] delivers. The promise should be bold enough to capture attention but credible enough to be believable. Consider what truly matters most to this audience.

- Picture: Create a vivid, detailed vision of what fulfilling this promise looks like in practice. Use sensory language and concrete details to help the reader imagine experiencing the benefits. Describe how their situation will improve, what they'll be able to do, how they'll feel, or what they'll achieve. Make this picture personally relevant and emotionally resonant for [target audience].

- Proof: Provide compelling evidence that validates your promise. This could include specific results, testimonials, case studies, data points, expert endorsements, guarantees, or demonstrations. Choose proof elements that address potential skepticism and build confidence. For [target audience], consider what types of evidence would be most persuasive and relevant to their decision-making process.

- Push: Guide the reader toward a clear, specific action step that feels like the natural next move. Create appropriate urgency without being manipulative. Make the requested action simple, low-risk, and aligned with where they are in their decision journey. Explain what will happen after they take this step and minimize any perceived barriers or friction points.

Important: Adapt this framework appropriately for [text format] while ensuring each "P" flows naturally into the next. The content should read as a persuasive narrative, not a mechanical checklist.

`
  },
  {
    id: "psr",
    name: "Problem-Solution-Result",
    description: "Tells a mini-story: Presents problem, explains solution, shares results.",
    useCase: "Case studies, testimonials, reviews for demonstrating real-world impact.",
    prompt: `
Write a [text format] about [subject] for [target audience] using the Problem-Solution-Result framework.

Context: [Add any relevant background information, industry specifics, or unique selling points]

- Problem: Describe a specific, significant challenge that [target audience] faces. Provide enough context and detail to establish the scope, impact, and urgency of this problem. Include both practical and emotional dimensions of the issue. For authenticity, consider including relevant background factors, previous attempts to solve it, or why traditional approaches have fallen short. This section should create recognition and establish the need for a better solution.

- Solution: Explain clearly how [subject] addresses this problem. Detail the approach, methodology, or specific elements that make this solution effective. Focus on the unique aspects or innovations that differentiate it from alternatives. Describe the implementation process or how the solution works in practice. This section should build credibility and help readers understand exactly how the problem is tackled.

- Result: Provide concrete, specific outcomes achieved through this solution. Whenever possible, include quantifiable metrics, testimonials, or before/after comparisons. Describe both immediate and long-term impacts, covering practical benefits and emotional/qualitative improvements. For [target audience], highlight the results that would matter most to them. This section should validate the solution and create desire to achieve similar results.

Conclusion: Summarize the key takeaway and include guidance on next steps or how to learn more.


Important: While following the Problem-Solution-Result structure, ensure the narrative feels authentic and credible. This framework works best when it reads like a genuine case study or success story rather than a hypothetical scenario.
    `
  },
  {
    id: "howto",
    name: "How-To",
    description: "Provides step-by-step instructions to achieve a goal, positioning product as helpful.",
    useCase: "Blog posts, guides, tutorials for educational content and practical value.",
    prompt: `
Write a [text format] about [subject] for [target audience] using the How-To framework.

Context: [Add any relevant background information, industry specifics, or unique selling points]

Headline: How to [achieve specific outcome] [optional timeframe or qualifier]

Introduction: Begin by establishing why this outcome matters to [target audience]. Briefly address their current challenges, motivations, or goals related to [subject]. Create a compelling reason for them to continue reading by highlighting the value of achieving this outcome. You may also address common misconceptions or obstacles they might face.

For each key step in the process:

1. [Step Name]: Start with a clear, action-oriented heading for each step. Then provide detailed guidance including:
   - What to do (specific actions)
   - How to do it (methodology or approach)
   - Why it matters (purpose of this step)
   - Potential challenges and how to overcome them
   - Tips for success or optimization

2. [Step Name]: [Follow same structure]

3. [Step Name]: [Follow same structure]

[Include appropriate number of steps - typically 3-7 for most formats]

Conclusion: Summarize the key points and reinforce the benefits of following this process. Address what readers should expect after completing these steps and any additional resources that might help them.

Call to Action: Provide a clear, relevant next step for readers who want to implement or learn more. This could be trying [subject], downloading a resource, subscribing for updates, or another appropriate action based on the context.
   
Important: Make each step actionable and specific. Avoid vague instructions or overly general advice. The content should be practical enough that readers can immediately begin implementing what they've learned.

`
  }
];

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (!openAIApiKey) {
    console.error("FATAL: OPENAI_API_KEY environment variable not set.");
    return new Response(JSON.stringify({ error: 'Server configuration error.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
  }

  try {
    const { 
      niche, 
      productName, 
      productDescription, 
      tone, 
      targetPublic, 
      textFormat, 
      textLength, 
      keywords, 
      textObjective ,
      language,
      model,
      frameworkId // <-- Destructure frameworkId
    } = await req.json();

    // --- Validation ---
    if (!language) {
      return new Response(JSON.stringify({ error: 'Missing language parameter' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }
    if (!frameworkId) {
        return new Response(JSON.stringify({ error: 'Missing frameworkId parameter' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }

    // --- Find Selected Framework ---
    const selectedFramework = frameworks.find(f => f.id === frameworkId);
    if (!selectedFramework) {
        return new Response(JSON.stringify({ error: `Invalid frameworkId: ${frameworkId}` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }

    // --- Model Selection ---
    const selectedModel = model || 'gpt-4o-mini';
    console.log(`Generating copy with model: ${selectedModel} and framework: ${frameworkId}`);

    // --- Dynamic Prompt Construction --- 
    // Replace placeholders in the framework prompt template
    const frameworkPrompt = selectedFramework.prompt
      .replace('[text format]', textFormat || 'copy') 
      .replace('[product name]', productName || 'the product') 
      .replace('[target audience]', targetPublic || 'the target audience')
      .replace('[topic]', productName || 'the topic'); // For How-To template

    // Construct the final prompt
    const prompt = `You are a professional copywriter specializing in the ${selectedFramework.name} framework. Your task is to create highly engaging and persuasive marketing copy based on the following details, strictly adhering to the specified framework structure and language.

⚠️IMPORTANT: WRITE ONLY IN ${language.toUpperCase()}. DO NOT MIX LANGUAGES. DO NOT WRITE IN ROMANIAN OR ANY OTHER LANGUAGE.


--- FRAMEWORK: ${selectedFramework.name}) ---
${frameworkPrompt}
---


--- CONTEXT & DETAILS ---
📦 Product Details:
- Niche: ${niche || 'Unspecified'}
- Product Name: ${productName || 'Unspecified'}
- Product Description: ${productDescription || 'Unspecified'}

✍️ Writing Requirements:
- Format: ${textFormat || 'Unspecified'} (as requested in the framework)
- Length: ${textLength || 'Unspecified'} (approximate)
- Objective: ${textObjective || 'Unspecified'}
- Tone: ${tone || 'Unspecified'} (must match objective and target audience)
- Target Audience: ${targetPublic || 'General'}
- Keywords: ${keywords || 'Unspecified'}





--- GENERAL GUIDELINES ---
- Adhere strictly to the requested framework structure.
- Use plain text only. No markdown, special characters (#, *, ^, etc.).
- Ensure the tone is consistent and appropriate.
- Write professionally, clearly, and concisely.
- Focus on the target audience and the text objective.
- Incorporate keywords naturally.
- Ensure the final output is entirely in ${language.toUpperCase()}.

📌 CRITICAL: FOLLOW THE ${selectedFramework.name} FRAMEWORK EXACTLY AND WRITE ONLY IN ${language.toUpperCase()}.
`;

    // --- OpenAI API Call --- 
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: 'system', content: `You are a professional copywriter expert in the ${selectedFramework.name} framework, writing in ${language.toUpperCase()}.` },
          { role: 'user', content: prompt }
        ],
      }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('OpenAI API error:', responseData);
      const errorDetail = responseData.error?.message || `HTTP status ${response.status}`;
      throw new Error(`OpenAI API request failed: ${errorDetail}`);
    }
    
    const generatedText = responseData.choices?.[0]?.message?.content;

    if (!generatedText) {
      console.error('No generated text found in OpenAI response:', responseData);
      throw new Error('Generation failed: No content returned from OpenAI.');
    }

    // --- Return Response --- 
    return new Response(JSON.stringify({ generatedText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  // --- Error Handling --- 
  } catch (error) {
    console.error('Error in generate-copywriting function:', error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    let status = 500; 
    if (errorMessage.includes('OpenAI API request failed')) { status = 502; } 
    else if (errorMessage.includes('Missing')) { status = 400; } // Catch missing params
    else if (errorMessage.includes('Invalid frameworkId')) { status = 400; }
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
