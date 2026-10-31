export const WHEEL_VOWELS = new Set(["A", "Ą", "E", "Ę", "I", "O", "Ó", "U", "Y"]);

export const normalizeWheelSegments = (values = []) => values
  .map((segment) => {
    if (segment && typeof segment === "object") {
      return {
        value: segment.value,
        weight: Math.max(0, Number(segment.weight) || 0),
      };
    }
    return { value: segment, weight: 1 };
  })
  .filter(({ value, weight }) => value !== "" && value != null && weight > 0);

export const pickWeightedWheelValue = (values = [], random = Math.random()) => {
  const index = pickWeightedWheelIndex(values, random);
  const segments = normalizeWheelSegments(values);
  return index === null ? null : segments[index].value;
};

export const pickWeightedWheelIndex = (values = [], random = Math.random()) => {
  const segments = normalizeWheelSegments(values);
  const totalWeight = segments.reduce((sum, segment) => sum + segment.weight, 0);
  if (!totalWeight) return null;
  let cursor = random * totalWeight;
  const selectedIndex = segments.findIndex((segment) => {
    cursor -= segment.weight;
    return cursor < 0;
  });
  return selectedIndex >= 0 ? selectedIndex : segments.length - 1;
};

export const normalizeWheelLetter = (letter = "") => String(letter).trim().toLocaleUpperCase("pl-PL");

export const isWheelVowel = (letter) => WHEEL_VOWELS.has(normalizeWheelLetter(letter));

export const isWheelPhraseSolved = (phrase = "", guessedLetters = []) => {
  const guessed = new Set(guessedLetters.map(normalizeWheelLetter));
  return [...String(phrase)].every((character) => {
    const normalized = normalizeWheelLetter(character);
    return !/[A-ZĄĆĘŁŃÓŚŹŻ]/i.test(character) || guessed.has(normalized);
  });
};

export const revealWheelPhrase = (phrase = "", guessedLetters = []) => {
  const guessed = new Set(guessedLetters.map(normalizeWheelLetter));
  return [...String(phrase)].map((character) => {
    const normalized = normalizeWheelLetter(character);
    return /[A-ZĄĆĘŁŃÓŚŹŻ]/i.test(character) && !guessed.has(normalized) ? "_" : character;
  });
};

export const countWheelLetter = (phrase = "", letter = "") => {
  const normalizedLetter = normalizeWheelLetter(letter);
  return [...String(phrase)].filter((character) => normalizeWheelLetter(character) === normalizedLetter).length;
};

export const canBuyWheelVowel = ({ roundPoints = 0, totalPoints = 0, cost = 0 }) => ({
  source: roundPoints >= cost ? "round" : totalPoints >= cost ? "total" : null,
  warning: roundPoints < cost && totalPoints >= cost,
});

export const applyWheelBankrupt = (totalPoints) => Math.min(0, Number(totalPoints) || 0);
