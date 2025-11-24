export default function calculateScore(quiz, answers) {
  let score = 0;

  quiz.questions.forEach(q => {
    if (answers[q._id] === q.correctAnswer) score++;
  });

  return score;
}
