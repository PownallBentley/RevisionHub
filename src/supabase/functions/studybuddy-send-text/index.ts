// supabase/functions/studybuddy-send-text/index.ts
// Phase 1: Text Chat MVP for Study Buddy

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SendTextRequest {
  revision_session_id: string
  message_text: string
  step_context?: {
    step_key: string
    content_type: string
    content_unit_id: string
    content_preview: string
  }
}

interface ThreadContext {
  thread_id: string
  child_id: string
  subject_id: string | null
  subject_name: string | null
  message_count: number
  messages: Array<{
    role: string
    content_text: string
  }>
  summary: {
    text: string
    misconceptions: string[]
    helpful_approaches: string[]
  }
  learning_notes: {
    text: string
    common_struggles: string[]
    effective_explanations: string[]
  }
  child_needs: {
    language_level: string
    needs_codes: string[]
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { revision_session_id, message_text, step_context }: SendTextRequest = await req.json()

    if (!revision_session_id || !message_text) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with user's auth
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // 1. Get or create thread and load context
    const { data: threadResult, error: threadError } = await supabase
      .rpc('rpc_studybuddy_get_or_create_thread', { p_revision_session_id: revision_session_id })

    if (threadError || !threadResult?.success) {
      return new Response(
        JSON.stringify({ success: false, error: threadError?.message || threadResult?.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const thread_id = threadResult.thread_id

    // 2. Load full thread context
    const { data: contextResult, error: contextError } = await supabase
      .rpc('rpc_studybuddy_get_thread', { p_revision_session_id: revision_session_id })

    if (contextError) {
      console.error('Context load error:', contextError)
    }

    // 3. Check rate limit (20 messages per session)
    const messageCount = contextResult?.message_count || 0
    if (messageCount >= 20) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Message limit reached for this session. You can ask more questions in your next session!' 
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4. Load child's needs for language adaptation
    const childNeeds = await getChildNeeds(supabase, threadResult.child_id)

    // 5. Build context for Claude
    const context: ThreadContext = {
      thread_id,
      child_id: threadResult.child_id,
      subject_id: threadResult.subject_id,
      subject_name: contextResult?.subject_name || 'this subject',
      message_count: messageCount,
      messages: contextResult?.messages || [],
      summary: contextResult?.summary || { text: '', misconceptions: [], helpful_approaches: [] },
      learning_notes: contextResult?.learning_notes || { text: '', common_struggles: [], effective_explanations: [] },
      child_needs: childNeeds
    }

    // 6. Insert child message
    const startTime = Date.now()
    
    const { error: childMsgError } = await supabase
      .from('study_buddy_messages')
      .insert({
        thread_id,
        role: 'child',
        input_mode: 'text',
        content_text: message_text,
        step_key: step_context?.step_key || null,
        content_type: step_context?.content_type || null,
        content_unit_id: step_context?.content_unit_id || null,
        topic_id: null // Could be derived from step_context if needed
      })

    if (childMsgError) {
      console.error('Child message insert error:', childMsgError)
    }

    // 7. Generate AI response
    const aiResponse = await generateBuddyResponse(context, message_text, step_context)
    const latencyMs = Date.now() - startTime

    // 8. Insert buddy response
    const { data: buddyMsg, error: buddyMsgError } = await supabase
      .from('study_buddy_messages')
      .insert({
        thread_id,
        role: 'buddy',
        input_mode: 'text',
        content_text: aiResponse,
        step_key: step_context?.step_key || null,
        content_type: step_context?.content_type || null,
        latency_ms: latencyMs,
        token_count: estimateTokens(aiResponse)
      })
      .select('id')
      .single()

    if (buddyMsgError) {
      console.error('Buddy message insert error:', buddyMsgError)
    }

    // 9. Update thread stats
    await supabase
      .from('study_buddy_threads')
      .update({ 
        message_count: messageCount + 2,
        last_active_at: new Date().toISOString()
      })
      .eq('id', thread_id)

    return new Response(
      JSON.stringify({
        success: true,
        thread_id,
        response: aiResponse,
        message_id: buddyMsg?.id,
        messages_remaining: 20 - (messageCount + 2)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Helper: Get child's needs for language adaptation
async function getChildNeeds(supabase: any, childId: string): Promise<{ language_level: string, needs_codes: string[] }> {
  try {
    const { data, error } = await supabase
      .from('children')
      .select(`
        language_level,
        child_needs (
          needs:needs_id (
            code
          )
        )
      `)
      .eq('id', childId)
      .single()

    if (error || !data) {
      return { language_level: 'standard', needs_codes: [] }
    }

    const needsCodes = data.child_needs?.map((cn: any) => cn.needs?.code).filter(Boolean) || []
    
    return {
      language_level: data.language_level || 'standard',
      needs_codes: needsCodes
    }
  } catch {
    return { language_level: 'standard', needs_codes: [] }
  }
}

// Helper: Generate buddy response using Claude
async function generateBuddyResponse(
  context: ThreadContext,
  userMessage: string,
  stepContext?: SendTextRequest['step_context']
): Promise<string> {
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
  
  if (!anthropicKey) {
    console.error('ANTHROPIC_API_KEY not set')
    return "I'm having a bit of trouble right now. Try asking again in a moment!"
  }

  const systemPrompt = buildSystemPrompt(context, stepContext)
  const messages = buildMessageHistory(context.messages, userMessage)

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system: systemPrompt,
        messages: messages
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Claude API error:', response.status, errorText)
      return "I'm having a bit of trouble thinking right now. Try asking again!"
    }

    const data = await response.json()
    const textContent = data.content?.find((c: any) => c.type === 'text')
    
    return textContent?.text || "Hmm, I'm not sure how to answer that. Could you try asking in a different way?"

  } catch (error) {
    console.error('Claude API call failed:', error)
    return "I'm having a bit of trouble right now. Try asking again in a moment!"
  }
}

// Helper: Build system prompt with context
function buildSystemPrompt(
  context: ThreadContext,
  stepContext?: SendTextRequest['step_context']
): string {
  const languageGuidance = getLanguageGuidance(context.child_needs.language_level)
  const needsAdaptations = getNeedsAdaptations(context.child_needs.needs_codes)

  return `You are Study Buddy, a friendly and encouraging tutor helping a GCSE student revise.

CURRENT CONTEXT:
- Subject: ${context.subject_name || 'General revision'}
${stepContext ? `- Current content: ${stepContext.content_type} - "${stepContext.content_preview?.substring(0, 200)}..."` : ''}
${stepContext?.step_key ? `- Session step: ${stepContext.step_key}` : ''}

LANGUAGE LEVEL: ${context.child_needs.language_level}
${languageGuidance}

${needsAdaptations ? `LEARNING ADAPTATIONS:\n${needsAdaptations}` : ''}

${context.summary.text ? `SESSION SO FAR:\n${context.summary.text}` : ''}

${context.learning_notes.text ? `WHAT I KNOW ABOUT THIS STUDENT:\n${context.learning_notes.text}` : ''}

RULES - FOLLOW THESE STRICTLY:
1. ONLY discuss ${context.subject_name || 'the current subject'}. If asked about something else, say "That's interesting, but let's focus on your revision right now! What would you like help with in ${context.subject_name || 'this subject'}?"

2. Give HINTS before answers. Use this approach:
   - First response: Give a small hint or ask a guiding question
   - If they're still stuck: Give a bigger hint
   - Only give the full answer if they've really tried

3. For practice questions: NEVER give the complete answer directly. Guide them to discover it.

4. Keep responses SHORT - 2-3 sentences maximum. Students lose focus with long explanations.

5. Be ENCOURAGING. Use phrases like "Good thinking!", "You're on the right track!", "Nearly there!"

6. If you don't know something specific to their exam board, say so honestly.

7. End with a question or prompt to keep them engaged (but not every single time - vary it).`
}

// Helper: Get language guidance based on level
function getLanguageGuidance(level: string): string {
  switch (level) {
    case 'simplified':
      return `Use simple words and short sentences. Break down complex ideas into smaller steps. Avoid jargon.`
    case 'advanced':
      return `You can use subject-specific terminology. The student can handle more detailed explanations.`
    default:
      return `Use clear, straightforward language appropriate for a typical GCSE student.`
  }
}

// Helper: Get adaptations based on needs codes
function getNeedsAdaptations(needsCodes: string[]): string {
  const adaptations: string[] = []

  if (needsCodes.includes('ADHD')) {
    adaptations.push('- Keep responses very concise and focused')
    adaptations.push('- Use bullet points for multi-step explanations')
    adaptations.push('- Include brief encouragement to maintain engagement')
  }

  if (needsCodes.includes('DYS_READ') || needsCodes.includes('DYS_WRITE')) {
    adaptations.push('- Use simpler vocabulary')
    adaptations.push('- Avoid similar-looking words')
    adaptations.push('- Break down spelling of technical terms')
  }

  if (needsCodes.includes('DYS_CALC')) {
    adaptations.push('- Provide step-by-step number work')
    adaptations.push('- Use visual descriptions where possible')
    adaptations.push('- Check understanding at each step')
  }

  if (needsCodes.includes('ANX_GEN') || needsCodes.includes('ANX_TEST')) {
    adaptations.push('- Use reassuring, low-pressure language')
    adaptations.push('- Avoid phrases like "you should know this"')
    adaptations.push('- Emphasise that mistakes are part of learning')
  }

  return adaptations.join('\n')
}

// Helper: Build message history for Claude
function buildMessageHistory(
  previousMessages: Array<{ role: string, content_text: string }>,
  currentMessage: string
): Array<{ role: string, content: string }> {
  const history: Array<{ role: string, content: string }> = []

  // Add last 6 messages for context (3 exchanges)
  const recentMessages = previousMessages.slice(-6)
  
  for (const msg of recentMessages) {
    history.push({
      role: msg.role === 'child' ? 'user' : 'assistant',
      content: msg.content_text
    })
  }

  // Add current message
  history.push({
    role: 'user',
    content: currentMessage
  })

  return history
}

// Helper: Rough token estimate
function estimateTokens(text: string): number {
  // Rough estimate: ~4 characters per token for English
  return Math.ceil(text.length / 4)
}