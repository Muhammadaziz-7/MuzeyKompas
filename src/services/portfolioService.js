export const CERTIFICATE_PASS_PERCENTAGE = 80;

export function getPortfolioData(userName, curatorExhibits = [], userData = {}) {
  const normalizedName = userName.trim().toLocaleLowerCase();
  const quizResults = Array.isArray(userData.quizResults) ? userData.quizResults : [];
  const exhibitAnalyses = userData.exhibitAnalyses ?? {};
  const createdExhibitCount = curatorExhibits.filter((exhibit) => (
    typeof exhibit.authorName === 'string'
    && exhibit.authorName.trim().toLocaleLowerCase() === normalizedName
  )).length;
  const analyzedExhibitCount = Object.values(exhibitAnalyses).filter((answers) => (
    Array.isArray(answers)
    && answers.some((answer) => typeof answer === 'string' && answer.trim().length > 0)
  )).length;
  const totalScore = quizResults.reduce((sum, result) => sum + result.score, 0);
  const totalPossibleScore = quizResults.reduce((sum, result) => sum + result.total, 0);
  const averagePercentage = totalPossibleScore === 0
    ? 0
    : Math.round((totalScore / totalPossibleScore) * 100);

  return {
    quizResults,
    analyzedExhibitCount,
    createdExhibitCount,
    totalScore,
    totalPossibleScore,
    averagePercentage,
    isCertificateEligible: quizResults.length > 0
      && averagePercentage >= CERTIFICATE_PASS_PERCENTAGE,
  };
}
