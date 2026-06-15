export function normalizeSolvedMocks(records = []) {
  if (!Array.isArray(records)) return records || {};

  return records.reduce((acc, record) => {
    const id = record.mockId || record.id;
    if (id) acc[id] = record;
    return acc;
  }, {});
}

export function getScoreBand(solvedInfo) {
  if (!solvedInfo) return null;

  const percentage = Number(solvedInfo.percentage) || 0;

  if (percentage < 40) {
    return {
      key: 'red',
      label: 'Review',
      className: 'mock-score-red',
    };
  }

  if (percentage < 60) {
    return {
      key: 'orange',
      label: 'Rebuild',
      className: 'mock-score-orange',
    };
  }

  if (percentage < 70) {
    return {
      key: 'yellow',
      label: 'Steady',
      className: 'mock-score-yellow',
    };
  }

  if (percentage < 80) {
    return {
      key: 'blue',
      label: 'Strong',
      className: 'mock-score-blue',
    };
  }

  return {
    key: 'green',
    label: 'Mastered',
    className: 'mock-score-green',
  };
}

export function isExamMockLockedForFreeUser(mock, userTier) {
  if (userTier === 'Pro') return false;
  if (!mock || mock.isEmpty) return false;

  // Elite: first 10 free (30 total)
  if (mock.type === 'elite') return mock.index > 10;
  // Quick Mocks: first 50 free → 100/150 locked (~67%)
  if (mock.type === 'quick') return mock.index > 50;
  // Sectional: first 30 free → 40/70 locked (57.1%)
  if (mock.type === 'sectional') return mock.index > 30;

  return false;
}
