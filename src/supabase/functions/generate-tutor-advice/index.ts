// supabase/functions/generate-tutor-advice/index.ts
// FEAT-008: AI Tutor Advice Generation using Claude

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

interface InsightsData {
  summary: {
    sessions: { completed: number; planned: number; completion_rate: number };
    confidence: { avg_change_percent: number };
    focus_mode: { usage_rate: number; sessions_with_focus: number };
    streak: { current: number; longest: number };
  };
  focus_comparison: {
    focus_on: { avg_confidence_change_percent: number; completion_rate: number };
    focus_off: { avg_confidence_change_percent: number; completion_rate: number };
  };
  top_topics: {
    improving_topics: Array<{ topic_name: string; confidence_change: number }>;
    struggling_topics: Array<{ topic_name: string; avg_post_confidence: number }>;
  };
}

interface TutorAdvice {
  weekly_story: string;
  focus_points: string[];
  watch_out_for: string[];
  try_saying: {
    instead_of: string;
    try_this: string;
  };
  step_in_signals: string[];
  step_back_signals: string[];
  next_best_action: {
    title: string;
    description: string;
  };
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const { childName, insights } = await req.json();

    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    if (!childName || !insights) {
      throw new Error('Missing required fields: childName and insights');
    }

    // Build the prompt
    const prompt = buildPrompt(childName, insights);

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', errorText);
      throw new Error(`Claude API error: ${response.status}`);
    }

    const result = await response.json();
    const content = result.content[0]?.text;

    if (!content) {
      throw new Error('No content in Claude response');
    }

    // Parse the JSON from Claude's response
    const advice = parseAdviceFromResponse(content);

    return new Response(JSON.stringify(advice), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    console.error('Error generating tutor advice:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});

function buildPrompt(childName: string, insights: InsightsData): string {
  const { summary, focus_comparison, top_topics } = insights;
  
  return `You are an experienced, warm educational tutor helping a parent understand their child's GCSE revision progress. Your tone should be supportive, practical, and encouraging - never judgmental.

Based on the following data for ${childName}, generate personalized advice in JSON format.

## Data Summary

**Sessions this period:**
- Completed: ${summary?.sessions?.completed || 0} out of ${summary?.sessions?.planned || 0} planned
- Completion rate: ${summary?.sessions?.completion_rate || 0}%
- Current streak: ${summary?.streak?.current || 0} days
- Longest streak: ${summary?.streak?.longest || 0} days

**Confidence:**
- Average confidence change: ${summary?.confidence?.avg_change_percent || 0}%

**Focus Mode:**
- Usage rate: ${summary?.focus_mode?.usage_rate || 0}%
- With Focus Mode: +${focus_comparison?.focus_on?.avg_confidence_change_percent || 0}% confidence, ${focus_comparison?.focus_on?.completion_rate || 0}% completion
- Without Focus Mode: +${focus_comparison?.focus_off?.avg_confidence_change_percent || 0}% confidence, ${focus_comparison?.focus_off?.completion_rate || 0}% completion

**Improving Topics:**
${top_topics?.improving_topics?.map(t => `- ${t.topic_name} (+${t.confidence_change})`).join('\n') || '- None yet'}

**Topics Needing Attention:**
${top_topics?.struggling_topics?.map(t => `- ${t.topic_name} (${Math.round((t.avg_post_confidence / 4) * 100)}% confidence)`).join('\n') || '- None flagged'}

## Required Output

Return ONLY valid JSON (no markdown, no explanation) with this exact structure:

{
  "weekly_story": "A 2-3 sentence narrative summary of the week's progress, mentioning ${childName} by name. Be warm and specific.",
  "focus_points": ["3 positive things to focus on this week - specific and actionable"],
  "watch_out_for": ["2-3 things to watch out for - specific patterns or behaviors"],
  "try_saying": {
    "instead_of": "An unhelpful thing a parent might say",
    "try_this": "A better, more supportive alternative"
  },
  "step_in_signals": ["3 specific signs the parent should step in to help"],
  "step_back_signals": ["3 specific signs ${childName} is doing well independently"],
  "next_best_action": {
    "title": "Short action title",
    "description": "1-2 sentence description of the recommended action"
  }
}`;
}

function parseAdviceFromResponse(content: string): TutorAdvice {
  // Try to extract JSON from the response
  let jsonStr = content;
  
  // Handle case where Claude wraps in markdown code blocks
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }
  
  // Clean up any leading/trailing whitespace
  jsonStr = jsonStr.trim();
  
  try {
    const parsed = JSON.parse(jsonStr);
    
    // Validate required fields
    return {
      weekly_story: parsed.weekly_story || 'Progress is being made.',
      focus_points: Array.isArray(parsed.focus_points) ? parsed.focus_points : [],
      watch_out_for: Array.isArray(parsed.watch_out_for) ? parsed.watch_out_for : [],
      try_saying: parsed.try_saying || {
        instead_of: "You need to try harder",
        try_this: "Let's break this down into smaller steps"
      },
      step_in_signals: Array.isArray(parsed.step_in_signals) ? parsed.step_in_signals : [],
      step_back_signals: Array.isArray(parsed.step_back_signals) ? parsed.step_back_signals : [],
      next_best_action: parsed.next_best_action || {
        title: "Keep Going",
        description: "Maintain the current routine"
      }
    };
  } catch (e) {
    console.error('Failed to parse advice JSON:', e);
    throw new Error('Failed to parse AI response');
  }
}