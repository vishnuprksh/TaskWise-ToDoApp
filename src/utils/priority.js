export const PRIORITY_WEIGHTS = {
    easiness: 0.4,
    importance: 0.3,
    emergency: 0.2,
    interest: 0.1,
};

export const ATTRIBUTE_VALUES = {
    low: 1,
    medium: 2,
    high: 3,
};

export const calculatePriorityScore = (attrs) => {
    if (!attrs) return 0;
    try {
        const easiness = ATTRIBUTE_VALUES[attrs.easiness] || 1;
        const importance = ATTRIBUTE_VALUES[attrs.importance] || 1;
        const emergency = ATTRIBUTE_VALUES[attrs.emergency] || 1;
        const interest = ATTRIBUTE_VALUES[attrs.interest] || 1;

        const score =
            easiness * PRIORITY_WEIGHTS.easiness +
            importance * PRIORITY_WEIGHTS.importance +
            emergency * PRIORITY_WEIGHTS.emergency +
            interest * PRIORITY_WEIGHTS.interest;

        if (isNaN(score)) return 0;
        return parseFloat(score.toFixed(2));
    } catch (e) {
        console.error('Error calculating priority', e);
        return 0;
    }
};
