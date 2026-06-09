export const MODES = [
  { id: 'soft', name: 'Soft', tokens: 50, desc: 'A gentle reminder of your place.' },
  { id: 'mid', name: 'Mid', tokens: 150, desc: 'A painful lesson in submission.' },
  { id: 'hard', name: 'Hard', tokens: 300, desc: 'Absolute physical and mental breakdown.' },
];

export const PUNISHMENTS = [
  { id: 'spanking', name: 'Spanking' },
  { id: 'clamps', name: 'Nipple Clamps' },
  { id: 'ballbusting', name: 'Light Ballbusting' },
  { id: 'corner', name: 'Corner Time' },
  { id: 'lines', name: 'Writing Lines' }
];

// Weighted punishment selection depending on selected mode (soft, mid, hard)
export const getWeightedPunishment = (modeId) => {
  // Index mapping: 0: spanking, 1: clamps, 2: ballbusting, 3: corner, 4: lines
  let weights = [1, 1, 1, 1, 1]; // default flat weights
  
  if (modeId === 'soft') {
    // lines (4) and corner (3) high; spanking (0), clamps (1), ballbusting (2) low
    weights = [1, 1, 1, 6, 6]; 
  } else if (modeId === 'mid') {
    // clamps (1) and ballbusting (2) high; others low
    weights = [2, 7, 7, 2, 2];
  } else if (modeId === 'hard') {
    // spanking (0) is very high; others low
    weights = [8, 2, 2, 2, 2];
  }
  
  const totalWeight = weights.reduce((acc, w) => acc + w, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < PUNISHMENTS.length; i++) {
    if (random < weights[i]) {
      return PUNISHMENTS[i];
    }
    random -= weights[i];
  }
  return PUNISHMENTS[0];
};

export const INTENSITIES = {
  spanking: {
    soft: ['20 strikes with hand', '30 strikes with hand'],
    mid: ['50 strikes with hairbrush', '60 strikes with wooden spoon'],
    hard: ['100 strikes with cane', '120 strikes with belt']
  },
  clamps: {
    soft: ['5 mins, no weight', '10 mins, no weight'],
    mid: ['15 mins, light weights', '20 mins, light weights'],
    hard: ['30 mins, heavy weights', '45 mins, heavy weights']
  },
  ballbusting: {
    soft: ['10 flicks with fingers', '15 flicks with fingers'],
    mid: ['20 slaps with hand', '30 slaps with hand'],
    hard: ['50 slaps with hand', '20 strikes with light crop']
  },
  corner: {
    soft: ['10 mins standing', '15 mins standing'],
    mid: ['20 mins kneeling', '30 mins kneeling, hands behind back'],
    hard: ['45 mins kneeling on rice', '60 mins kneeling, holding object with nose against wall']
  },
  lines: {
    soft: ['50 lines: "I will be obedient"', '100 lines: "I must submit"'],
    mid: ['200 lines: "My body belongs to the Domina"', '300 lines: "I am a pathetic servant"'],
    hard: ['500 lines: "I am nothing without Her discipline"', '1000 lines: "Pain is my only purpose"']
  }
};

export const AFTERMATHS = [
  'Wear feminine lingerie all day',
  'Wear adult diaper all day',
  'Wear an anal plug all day',
  'Crawl instead of walking for 2 hours',
  'Sleep on the bare floor tonight',
  'Chastity locked for 24 hours'
];

export const getCardAsset = (cardId, title) => {
  if (!cardId) return null;
  const text = title ? title.toLowerCase() : '';

  if (cardId === 'spanking') {
    if (text.includes('hairbrush')) return '/spanking-hairbrush.png';
    if (text.includes('spoon')) return '/spanking-spoon.png';
    if (text.includes('cane')) return '/spanking-cane.png';
    if (text.includes('belt')) return '/spanking-belt.png';
    return '/hand-spanking.png';
  }
  
  if (cardId === 'clamps') {
    if (text.includes('heavy')) return '/clamps-heavy.png';
    if (text.includes('light')) return '/clamps-light.png';
    return '/x-clamps.png';
  }

  if (cardId === 'ballbusting') {
    if (text.includes('flick') || text.includes('finger')) return '/x-ballbsutingFinger.png';
    if (text.includes('crop')) return '/X-ballbusting-crop.png';
    if (text.includes('hand') || text.includes('slap')) return '/ballbusting-hand.png';
    return '/x-ballbusting.png';
  }

  if (cardId === 'corner') {
    if (text.includes('rice')) return '/corner-rice.png';
    if (text.includes('nose') || text.includes('wall')) return '/corner-wall.png';
    if (text.includes('kneel')) return '/corner-kneeling.png';
    return '/corner-standing.png';
  }

  if (cardId === 'lines') {
    return '/x-writing.png';
  }

  return null;
};

export const getRecapAsset = (cardId) => {
  if (!cardId) return null;
  return `/recap-${cardId.toLowerCase()}.png`;
};

// New data for Confession
export const CONFESSION_JUDGMENTS = {
  hard: [
    "The Oracle sees through your deception. You hide your true sins in brevity. Your silence earns you the most severe discipline.",
    "A pitiful attempt at honesty. By speaking so little, you confess to hiding much. The punishment will extract what you hold back.",
    "Such meager words for such deep corruption. Your reluctance to confess fully will be answered with overwhelming pain.",
    "Your brevity is an insult to the Sanctuary. If you will not give your words freely, the Domina will take your tears instead.",
    "You hold back the truth, thinking you can deceive the Oracle. Your insolence guarantees the harshest of judgments.",
    "A few pathetic words will not absolve a lifetime of guilt. Your punishment will be absolute and uncompromising.",
    "The Domina despises a coward who cannot even voice their own sins. Prepare yourself for true devastation."
  ],
  mid: [
    "An adequate confession, yet lacking the depth of true surrender. The Domina demands suffering to purify what you left unsaid.",
    "You speak the truth, but hold onto your pride. A painful lesson in submission will ensure you do not hold back again.",
    "Your words are heard, but the Oracle senses hesitation. This moderate penance will serve as a reminder of your place.",
    "A standard admission of guilt. The resulting discipline will be suitably uncomfortable to wash away your sins.",
    "The Oracle acknowledges your effort, though your soul remains guarded. You shall endure a calculated pain to open your heart further.",
    "You have spoken, but you have not yet bled. This punishment will bridge the gap between your words and true devotion.",
    "A mediocre confession yields a standard discipline. Submit to the pain, and perhaps next time you will be more forthcoming."
  ],
  soft: [
    "Magnanimous. You have poured your soul out to the Domina. For such profound honesty, mercy is granted.",
    "The Oracle is pleased with your complete submission. By baring all, you earn a gentler reminder of your place.",
    "True devotion is found in total vulnerability. Your extensive confession has lessened the severity of your judgment.",
    "You have offered your darkest secrets without hesitation. The Domina recognizes your bravery and tempers Her wrath.",
    "Such a pure and exhaustive confession is rare. You shall still be disciplined, but with the gentle hand of a merciful Goddess.",
    "Your words flow like water, washing away the deepest stains of your guilt. The Oracle decrees a lenient penance for your honesty."
  ]
};
