// The story of Solmar Heat and its five missions. Leo Marin, a wheelman fresh out
// of the county lockup, owes Mama Rosa one last favour — and Rosa collects. Each
// mission is a list of stages; the world checks them off in order.
//
// Stage types:
//   stealCar  — get into any car (E next to one)
//   goto      — reach a named place (on foot or by car)
//   wait      — stand in the marker for `seconds`
//   collect   — touch the glowing pickup at a named place
//   defeat    — take down `count` thugs or guards who spawn at a named place
//   deliver   — reach a named place while carrying the goods

import { LOCATIONS } from './city.js';

export const STORY = {
  hero: 'Leo Marin',
  giver: 'Mama Rosa',
  city: 'Solmar Bay',
  intro: 'Leo Marin is out of the county lockup and already in debt. Mama Rosa, who runs the garage on 6th and keeps every wheelman in Solmar Bay fed, calls in the favour. Five jobs. Do them clean, get paid, and walk away free.',
};

export const MISSIONS = [
  {
    id: 'wheels-up',
    title: '1 — Wheels Up',
    briefing: "Rosa: 'You need wheels before anything, Leo. Borrow a car — any car — and bring it to my garage. Try not to make it yours permanently. The owner will understand. Probably.'",
    stages: [
      { type: 'stealCar', text: 'Steal a car — walk up to one and press E' },
      { type: 'goto', place: 'garage', text: "Drive to Rosa's Garage" },
    ],
  },
  {
    id: 'the-package',
    title: '2 — The Package',
    briefing: "Rosa: 'A crate came in at the Docks and the harbour police are sniffing around. Pick it up, bring it to the Marina Cafe, and if the blue lights show up — drive like you mean it.'",
    stages: [
      { type: 'collect', place: 'docks', text: 'Pick up the crate at the Solmar Docks' },
      { type: 'deliver', place: 'marina', text: 'Deliver the crate to the Marina Cafe — the cops are watching' },
    ],
  },
  {
    id: 'alley-justice',
    title: '3 — Alley Justice',
    briefing: "Rosa: 'The Vultures jumped my nephew in the Back Alley and took his keys. Three of them, last I heard. Go and have a word. Fists work. So does the pistol in my glove box — check the garage pickup first.'",
    stages: [
      { type: 'goto', place: 'alley', text: 'Head to the Back Alley' },
      { type: 'defeat', place: 'alley', count: 3, text: 'Deal with the 3 Vultures (F to punch, click to shoot)' },
    ],
  },
  {
    id: 'bank-job',
    title: '4 — The Bank Job',
    briefing: "Rosa: 'This one is loud, Leo. The Solmar Bank keeps its cash room open at lunch. Grab the bag, and when the alarm goes up, get to the Safehouse and lay low until the heat dies down.'",
    stages: [
      { type: 'goto', place: 'bank', text: 'Get to the Solmar Bank' },
      { type: 'wait', place: 'bank', seconds: 2.5, text: 'Grab the cash — hold your nerve' },
      { type: 'goto', place: 'safehouse', text: 'Escape to the Safehouse — 3 stars on you!' },
    ],
  },
  {
    id: 'the-big-score',
    title: '5 — The Big Score',
    briefing: "Rosa: 'Last job, Leo. A yacht at the Yacht Club is carrying a buyer with a case full of cash and four guards who think they are tough. Take the case, bring it to me, and your debt is done. Solmar Bay is yours after this.'",
    stages: [
      { type: 'goto', place: 'yacht', text: 'Reach the Yacht Club' },
      { type: 'defeat', place: 'yacht', count: 4, text: 'Take down the 4 guards' },
      { type: 'collect', place: 'yacht', text: 'Grab the cash case' },
      { type: 'deliver', place: 'garage', text: "Bring the case to Rosa's Garage — finish the story" },
    ],
  },
];

export function missionPlace(stage) {
  return stage.place ? LOCATIONS[stage.place] : null;
}

export function currentStageText(mission, stageIndex) {
  const stage = mission.stages[stageIndex];
  return stage ? stage.text : '';
}
