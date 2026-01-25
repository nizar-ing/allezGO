function getStartingPrice(destination) {
    if (destination.pricing.triple) {
        return Math.min(destination.pricing.triple, destination.pricing.double);
    }
    if (destination.pricing.hotel3Star) {
        return destination.pricing.hotel3Star.double;
    }
    if (destination.pricing.hotel4Star && destination.id === 2) {
        return destination.pricing.hotel4Star.double;
    }
    if (destination.pricing.hotel4Star && destination.id === 4) {
        return destination.pricing.hotel4Star.double;
    }
    return null;
}


export {getStartingPrice};
