export const getNextDifficulty = (scorePercent) => {
  if (scorePercent >= 80) return "Advanced";
  if (scorePercent >= 50) return "Intermediate";
  return "Beginner";
};
