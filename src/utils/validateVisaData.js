/**
 * Validates visa data structure integrity
 */
export const validateVisaData = (data) => {
    if (!Array.isArray(data) || data.length === 0) {
        console.error('Visa data must be a non-empty array');
        return false;
    }

    return data.every((visa, index) => {
        const hasBasicFields = visa.country && visa.flagUrl && visa.processingTime;
        const hasPricing = visa.price || visa.durationMode?.price;
        const hasDuration = visa.duration || visa.durationMode?.duration;
        const hasRequirements = Array.isArray(visa.requirements);

        if (!hasBasicFields || !hasPricing || !hasDuration || !hasRequirements) {
            console.error(`Invalid visa data at index ${index}:`, visa.country);
            return false;
        }

        return true;
    });
};
