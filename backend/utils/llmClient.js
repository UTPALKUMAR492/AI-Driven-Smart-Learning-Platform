const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const LLM_FALLBACK_ONLY = process.env.LLM_FALLBACK_ONLY === 'true';

let openaiCooldownUntil = 0;
const OPENAI_COOLDOWN_DURATION_MS = Number(process.env.OPENAI_COOLDOWN_MS || 10 * 60 * 1000); // default 10min

const fetchClient = globalThis.fetch || (await import('node-fetch')).default;

// Minimal startup log to confirm key presence (does not print the key)
console.log('LLM client initialized. OPENAI_API_KEY present:', !!OPENAI_API_KEY, 'LLM_FALLBACK_ONLY:', LLM_FALLBACK_ONLY, 'OPENAI_COOLDOWN_DURATION_MS:', OPENAI_COOLDOWN_DURATION_MS);

// Generate questions from OpenAI LLM given a topic and number, with optional course context
export async function generateQuestionsWithLLM({ topic, numQuestions = 10, course = null }) {
  if (LLM_FALLBACK_ONLY) {
    const err = new Error('LLM fallback mode enabled');
    err.code = 'llm_fallback_only';
    throw err;
  }

  if (Date.now() < openaiCooldownUntil) {
    const err = new Error('LLM currently in cooldown due to previous quota/auth error');
    err.code = 'insufficient_quota';
    throw err;
  }

  if (!OPENAI_API_KEY) {
    const err = new Error('Missing OpenAI API key');
    err.code = 'missing_api_key';
    throw err;
  }

  const courseContext = course ? `Course title: ${course.title || ''}\nCourse description: ${course.description || ''}\n` : '';
  const prompt = `You are an expert educator. ${courseContext}Create ${numQuestions} clear, realistic, course-aligned multiple-choice questions for the topic below. Each question should be a real-world or applied scenario directly relevant to the course material. Provide exactly 4 plausible options (A-D). Return only a JSON array (no commentary) where each item has: \n- text: question text\n- options: array of 4 strings\n- answer: the exact option text that is correct\n- difficulty: easy|medium|hard\n\nTopic: ${topic}`;

  const response = await fetchClient(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an AI question generator who writes course-aligned, applied multiple-choice questions.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 2048,
      temperature: 0.25
    })
  });

  if (!response.ok) {
    const txt = await response.text();
    let err = new Error(`OpenAI API error ${response.status}: ${txt}`);
    if (response.status === 429) {
      err.code = 'insufficient_quota';
      err.message = 'OpenAI quota exceeded';
      openaiCooldownUntil = Date.now() + OPENAI_COOLDOWN_DURATION_MS;
    } else if (response.status === 401 || response.status === 403) {
      err.code = 'invalid_api_key';
      err.message = 'Invalid or unauthorized OpenAI API key';
      openaiCooldownUntil = Date.now() + OPENAI_COOLDOWN_DURATION_MS;
    }
    throw err;
  }
  const data = await response.json();
  if (!data.choices || !data.choices[0]?.message?.content) {
    console.warn('LLM response missing choices:', JSON.stringify(data).slice(0, 1000));
    throw new Error('No response from LLM');
  }
  try {
    const raw = data.choices[0].message.content;
    // Extract JSON array from response (tolerate surrounding text or fences)
    const first = raw.indexOf('[');
    const last = raw.lastIndexOf(']');
    const jsonText = first >= 0 && last > first ? raw.slice(first, last + 1) : raw;
    const questions = JSON.parse(jsonText);
    return questions;
  } catch (e) {
    throw new Error('Failed to parse LLM response: ' + (data.choices[0].message?.content || ''));
  }
}

export async function generateQuizWithLLM({ questionBank, userPerformance, numQuestions = 5 }) {
  if (LLM_FALLBACK_ONLY) {
    const err = new Error('LLM fallback mode enabled');
    err.code = 'llm_fallback_only';
    throw err;
  }

  if (Date.now() < openaiCooldownUntil) {
    const err = new Error('LLM currently in cooldown due to previous quota/auth error');
    err.code = 'insufficient_quota';
    throw err;
  }

  if (!OPENAI_API_KEY) {
    const err = new Error('Missing OpenAI API key');
    err.code = 'missing_api_key';
    throw err;
  }

  const prompt = `You are an AI quiz generator. Given the following question bank and user performance, select ${numQuestions} questions at the right difficulty for the user.\n\nUser Performance: ${JSON.stringify(userPerformance)}\n\nQuestion Bank: ${JSON.stringify(questionBank)}\n\nReturn a JSON array of selected questions, each with text, options, and difficulty.`;

  const response = await fetchClient(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an AI quiz generator.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 2048,
      temperature: 0.2
    })
  });
  if (!response.ok) {
    const txt = await response.text();
    let err = new Error(`OpenAI API error ${response.status}: ${txt}`);
    if (response.status === 429) {
      err.code = 'insufficient_quota';
      err.message = 'OpenAI quota exceeded';
      openaiCooldownUntil = Date.now() + OPENAI_COOLDOWN_DURATION_MS;
    } else if (response.status === 401 || response.status === 403) {
      err.code = 'invalid_api_key';
      err.message = 'Invalid or unauthorized OpenAI API key';
      openaiCooldownUntil = Date.now() + OPENAI_COOLDOWN_DURATION_MS;
    }
    throw err;
  }
  const data = await response.json();
  if (!data.choices || !data.choices[0]?.message?.content) {
    console.warn('LLM response missing choices for quiz generator:', JSON.stringify(data).slice(0, 1000));
    throw new Error('No response from LLM');
  }
  try {
    const quiz = JSON.parse(data.choices[0].message.content);
    return quiz;
  } catch (e) {
    throw new Error('Failed to parse LLM response: ' + data.choices[0].message.content);
  }
}
