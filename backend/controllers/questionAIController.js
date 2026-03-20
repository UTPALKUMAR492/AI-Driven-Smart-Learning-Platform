
import { generateQuestionsWithLLM } from '../utils/llmClient.js';
import Question from '../models/Question.js';
import Course from '../models/Course.js';

// POST /api/ai/generate-questions
// Body: { courseId, topic, numQuestions }
export const generateQuestions = async (req, res) => {
  try {
    const { courseId, topic, numQuestions = 10 } = req.body;
    if (!courseId || !topic) return res.status(400).json({ message: 'Missing courseId or topic' });
    let questions = [];
    // try to fetch course details to provide context to LLM
    let courseInfo = null
    try {
      courseInfo = await Course.findById(courseId).lean()
    } catch (e) { /* ignore */ }

    try {
      questions = await generateQuestionsWithLLM({ topic, numQuestions, course: courseInfo });
    } catch (llmErr) {
      // If LLM fails, produce higher-quality, topic-specific fallback questions
      console.warn('LLM generation failed or unavailable, falling back:', llmErr.message);
      const t = (topic || 'the topic').trim();
      const tl = t.toLowerCase();

      const shuffle = (arr) => {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
      };

      const makeQuestion = (text, correct, distractors, difficulty='medium') => {
        // ensure we have 3 distractors
        const baseDistractors = (distractors || []).slice(0,3);
        // helper to detect numeric strings
        const isNumeric = (s) => !Number.isNaN(Number(String(s).replace(/[^0-9.-]/g, '')));

        // ensure distractors are unique and not equal to correct
        const cleanDistractors = baseDistractors.map((d, idx) => {
          let val = String(d);
          // if duplicate of correct or earlier distractor, nudge numeric values slightly
          if (val === String(correct)) {
            if (isNumeric(val)) {
              val = String((Number(val) + (idx + 1) * (isFinite(Number(val)) ? 1 : 1)).toFixed(2));
            } else {
              val = val + ' (common wrong)';
            }
          }
          return val;
        });

        // assemble options and enforce uniqueness
        let opts = shuffle([String(correct), ...cleanDistractors]);
        // if duplicates remain, attempt small adjustments for numeric values
        const seen = new Set();
        opts = opts.map((o, i) => {
          let v = String(o);
          if (seen.has(v)) {
            if (isNumeric(v)) {
              // add a small offset based on index
              v = String((Number(v) + (i + 1)).toFixed(2));
            } else {
              v = v + ` (${i})`;
            }
          }
          seen.add(v);
          return v;
        });

        return { text, options: opts, answer: String(correct), difficulty };
      };

      const reactGenerators = () => {
        const gens = [];
        gens.push(() => makeQuestion(
          'Which React hook is appropriate for running side-effects after render?',
          'useEffect',
          ['useState', 'useMemo', 'useContext'], 'easy'
        ));

        gens.push(() => makeQuestion(
          'What is the primary purpose of the `key` prop when rendering lists in React?',
          'To help React identify which items have changed, been added, or removed',
          ['To style list items', 'To provide unique ids to the DOM', 'To lazy-load list elements'], 'medium'
        ));

        gens.push(() => makeQuestion(
          'When should you use `useMemo` in a React component?',
          'To memoize an expensive computation between renders',
          ['To replace useEffect for side-effects', 'To persist state across renders', 'To directly modify the DOM for performance'], 'medium'
        ));

        gens.push(() => makeQuestion(
          'Which method helps avoid unnecessary re-renders of a functional child component?',
          'Wrap the child with React.memo',
          ['Always pass new object props', 'Use setState inside render', 'Directly mutate props for speed'], 'medium'
        ));

        gens.push(() => makeQuestion(
          'Which hook is suitable for reading context values provided by a Provider?',
          'useContext',
          ['useReducer', 'useRef', 'useLayoutEffect'], 'easy'
        ));

        gens.push(() => makeQuestion(
          'How should you manage form inputs for many fields in a React form?',
          'Use controlled components and a single state object or a form library',
          ['Always use uncontrolled components without state', 'Store form data in localStorage only', 'Use global variables for inputs'], 'medium'
        ));

        gens.push(() => makeQuestion(
          'What is a common cause of stale closures in hooks?',
          'Not declaring hook dependencies correctly (missing deps in useEffect/useCallback)',
          ['Using class components', 'Returning JSX from non-render functions', 'Using inline event handlers only'], 'hard'
        ));

        gens.push(() => makeQuestion(
          'Which approach improves performance for long lists in React?',
          'Windowing/virtualization (e.g., react-window)',
          ['Rendering all items at once', 'Using large images for thumbnails', 'Avoiding keys on list items'], 'medium'
        ));

        return gens;
      };

      // interest-specific generator for SI/CI topics (numeric, varied distractors)
      const interestGenerator = (i) => {
        // choose simple or compound based on index to mix variety
        const chooseCI = tl.includes('compound') || (!tl.includes('simple') && (i % 2 === 1));
        const P = Math.floor(Math.random() * 9000) + 100; // principal 100..9099
        const R = Math.floor(Math.random() * 15) + 1; // rate 1..15%
        const T = Math.floor(Math.random() * 9) + 1; // time 1..9 years
        if (!chooseCI) {
          // simple interest: SI = P*R*T/100
          const si = +(P * R * T / 100).toFixed(2);
          const correct = `${si}`;
          // distractors: common mistakes
          const d1 = +(P * R * T / 10).toFixed(2); // forgot division by 100 -> *10
          const d2 = +(P * R / 100).toFixed(2); // used only one year
          const d3 = +(si + Math.max(1, Math.round(si * 0.07))).toFixed(2); // small error
          const text = `Calculate the simple interest on a principal of ${P} at ${R}% per annum for ${T} years.`;
          return makeQuestion(text, correct, [`${d1}`, `${d2}`, `${d3}`], 'easy');
        } else {
          // compound interest: A = P*(1+R/100)^T, CI = A - P
          const A = +(P * Math.pow(1 + R / 100, T)).toFixed(2);
          const ci = +(A - P).toFixed(2);
          const correct = `${ci}`;
          // distractors: common mistakes
          const d1 = +((P * Math.pow(1 + (R / 100) * T))).toFixed(2); // linearized multiplier
          const d2 = +(P * R * T / 100).toFixed(2); // simple interest value
          const d3 = +(ci + Math.max(1, Math.round(ci * 0.08))).toFixed(2); // small error
          const text = `What is the compound interest earned on ${P} at ${R}% annually compounded yearly for ${T} years? (Round to 2 decimals)`;
          return makeQuestion(text, correct, [`${d1}`, `${d2}`, `${d3}`], 'medium');
        }
      };

      const genericGenerator = (i) => {
        const difficulty = i < Math.round(numQuestions * 0.4) ? 'easy' : (i < Math.round(numQuestions * 0.8) ? 'medium' : 'hard');
        const baseWords = t.split(/\W+/).filter(Boolean);
        const base = baseWords.slice(0,3).join(' ');

        // detect math/percentage-like topics for calculation-style questions
        const mathKeywords = ['percent', 'percentage', 'percentages', 'probability', 'mean', 'median', 'average', 'variance', 'ratio', 'proportion', 'interest', 'simple interest', 'compound interest', 'si', 'ci', 'rate', 'interest rate', 'loan'];
        const isMath = mathKeywords.some(k => tl.includes(k));

        

        if (isMath) {
          // numeric percentage-style question generator
          const a = Math.floor(Math.random() * 90) + 5; // base number between 5 and 94
          const b = Math.floor(Math.random() * 90) + 5;
          const pct = Math.floor(Math.random() * 50) + 5; // 5% - 54%
          // template choices depending on type
          const qType = i % 4;
          if (qType === 0) {
            // simple percent of a number
            const correctVal = (a * pct / 100);
            const correct = `${correctVal}%`;
            const distractors = [
              `${Math.round(correctVal * 0.9)}%`,
              `${Math.round(correctVal * 1.1)}%`,
              `${Math.round((a + pct) )}%`
            ];
            const text = `What is ${pct}% of ${a}?`;
            return makeQuestion(text, correct, distractors, difficulty);
          } else if (tl.includes('interest') || tl.includes('simple interest') || tl.includes('compound interest') || tl.includes('si') || tl.includes('ci')) {
            // if topic explicitly mentions interest, use specialized SI/CI generator
            return interestGenerator(i);
          } else if (qType === 1) {
            // percentage increase/decrease
            const original = a;
            const increased = Math.round(original * (1 + pct / 100));
            const correct = `${increased}`;
            const distractors = [
              `${Math.round(original * (1 + (pct-5)/100))}`,
              `${Math.round(original * (1 + (pct+5)/100))}`,
              `${Math.round(original - (original * pct / 100))}`
            ];
            const text = `A price of ${original} increases by ${pct}%. What is the new price?`;
            return makeQuestion(text, correct, distractors, difficulty);
          } else if (qType === 2) {
            // convert fraction to percent
            const num = Math.floor(Math.random() * 9) + 1; // 1..9
            const den = Math.floor(Math.random() * 90) + 10; // 10..99
            const correctVal = ((num / den) * 100).toFixed(1);
            const correct = `${correctVal}%`;
            const distractors = [
              `${(num / den * 100 * 0.9).toFixed(1)}%`,
              `${(num / den * 100 * 1.1).toFixed(1)}%`,
              `${Math.round(num / den * 100)}%`
            ];
            const text = `Convert the fraction ${num}/${den} to a percentage (rounded to 1 decimal).`;
            return makeQuestion(text, correct, distractors, difficulty);
          } else {
            // percentage change from old to new
            const oldV = Math.floor(Math.random() * 90) + 10;
            const newV = oldV + Math.floor(Math.random() * 40) - 10; // +/- change
            const changePct = (((newV - oldV) / oldV) * 100).toFixed(1);
            const correct = `${changePct}%`;
            const distractors = [
              `${(changePct * 0.9).toFixed(1)}%`,
              `${(changePct * 1.1).toFixed(1)}%`,
              `${Math.round(changePct)}%`
            ];
            const text = `A value changes from ${oldV} to ${newV}. What is the percentage change (1 decimal)?`;
            return makeQuestion(text, correct, distractors, difficulty);
          }
        }

        // Non-math generic templates for variety
        const templates = [
          {
            text: `Which of the following best describes the core idea behind ${base}?`,
            correct: `The main concept of ${base} as applied in common scenarios`,
            distractors: [`A superficial unrelated approach to ${base}`, `A deprecated technique sometimes confused with ${base}`, `An extreme variant of ${base} that breaks correctness`]
          },
          {
            text: `A common pitfall when applying ${base} is:`,
            correct: `Failing to consider edge-cases and validation when using ${base}`,
            distractors: [`Always over-optimizing ${base}`, `Using ${base} only for UI styling`, `Assuming ${base} replaces fundamental algorithms`]
          },
          {
            text: `In practical use-cases, when is ${base} preferred?`,
            correct: `When it directly maps to the problem domain and reduces complexity`,
            distractors: [`When performance is irrelevant`, `When a totally different paradigm is already in use`, `When minimal correctness is acceptable`]
          },
          {
            text: `Which statement about ${base} is TRUE?`,
            correct: `${base} provides predictable behavior when used according to best practices`,
            distractors: [`${base} is always the fastest option`, `${base} never requires validation`, `${base} should be avoided in all cases`] 
          }
        ];

        const tpl = templates[i % templates.length];
        return makeQuestion(tpl.text, tpl.correct, tpl.distractors, difficulty);
      };

        // if the topic is clearly about interest calculations, prefer interestGenerator
        if (tl.includes('react')) {
        const gens = reactGenerators();
        for (let i = 0; i < numQuestions; i++) {
          const fn = gens[i % gens.length];
          questions.push(fn());
        }
      } else {
        for (let i = 0; i < numQuestions; i++) {
          // if topic hints interest, produce interest-style questions for math branch
          if (tl.includes('interest') || tl.includes('simple interest') || tl.includes('compound interest') || tl.includes('si') || tl.includes('ci')) {
            questions.push(interestGenerator(i));
          } else {
            questions.push(genericGenerator(i));
          }
        }
      }
    }

    // Normalize questions to match schema and save to DB
    try {
      const normalized = questions.map((q, idx) => ({
        text: q.text || q.prompt || `Question ${idx + 1}`,
        options: Array.isArray(q.options) ? q.options.map(o => String(o)) : (Array.isArray(q.choices) ? q.choices.map(o => String(o)) : (Array.isArray(q.opts) ? q.opts.map(o => String(o)) : [])),
        correctAnswer: q.correctAnswer || q.answer || q.correct || (Array.isArray(q.options) ? String(q.options[0]) : undefined),
        difficulty: q.difficulty || 'medium',
        course: courseId
      }));

      // Sanity checks
      if (!Array.isArray(normalized) || normalized.length === 0) {
        console.error('No questions produced by generator', { topic, numQuestions, courseId });
        // Return success with empty list so frontend can handle gracefully
        return res.status(200).json({ questions: [], message: 'No questions produced by generator (LLM may be unavailable).' });
      }

      // Log a short preview for debugging
      console.log(`Saving ${normalized.length} generated questions (preview):`, normalized.slice(0,3).map(q => ({ text: q.text, options: q.options, correctAnswer: q.correctAnswer })));

      // Clean and validate normalized questions
      const cleaned = normalized.map((q) => {
        const text = String(q.text || '').trim();
        const options = Array.isArray(q.options) ? q.options.map(o => String(o).trim()).filter(Boolean) : [];
        // ensure unique options
        const uniqueOpts = [...new Set(options)];
        let correct = q.correctAnswer ? String(q.correctAnswer).trim() : '';
        if (!correct && uniqueOpts.length > 0) correct = uniqueOpts[0];
        // if correct not in options, push it into options
        if (correct && !uniqueOpts.includes(correct)) uniqueOpts.push(correct);
        // pad options to at least 2 entries (prefer 4) by adding plausible distractors
        while (uniqueOpts.length < 2) uniqueOpts.push('None of the above');
        // trim to max 4
        const finalOpts = uniqueOpts.slice(0, 4);
        return {
          text,
          options: finalOpts,
          correctAnswer: correct,
          difficulty: q.difficulty || 'medium',
          course: q.course
        };
      }).filter(q => q.text && q.correctAnswer && Array.isArray(q.options) && q.options.length >= 2);

      if (cleaned.length === 0) {
        console.error('No valid questions after cleaning', { topic, numQuestions });
        // Provide a graceful response instead of a hard 500 so frontend can show a friendly message
        return res.status(200).json({ questions: [], message: 'No valid questions generated after cleaning. Check server logs for details.' });
      }

      // ensure no duplicates by question text
      const uniqueByText = [];
      const seenTexts = new Set();
      for (const q of cleaned) {
        if (seenTexts.has(q.text)) continue;
        seenTexts.add(q.text);
        uniqueByText.push(q);
      }

      console.log(`Saving ${uniqueByText.length} generated questions (after cleaning, preview):`, uniqueByText.slice(0,3).map(q => ({ text: q.text, options: q.options, correctAnswer: q.correctAnswer })));

      const saved = await Question.insertMany(uniqueByText);
      return res.json({ questions: saved });
    } catch (dbErr) {
      console.error('Failed to save generated questions:', dbErr);
      // Return a safe success response so frontend can handle gracefully without a 500
      return res.status(200).json({ questions: [], message: 'Failed to save generated questions. See server logs for details.', error: dbErr?.message || String(dbErr) });
    }
  } catch (err) {
    console.error('Unexpected error in generateQuestions:', err);
    // Return safe response instead of 500 to avoid breaking frontend flows
    return res.status(200).json({ questions: [], message: 'Failed to generate questions due to server error.', error: err?.message || String(err) });
  }
};
