// A built-in list of practical, evergreen topics. The topic stage uses it when
// the AI suggests nothing new (or cannot run), so a daily run is not wasted.
// Topics that the site has already published are skipped automatically, and the
// starting point rotates by day. Add more lines to make the list longer.

export interface BankTopic {
  topic: string;
  angle: string;
  whyNow: string;
}

export const EVERGREEN_BANK: BankTopic[] = [
  { topic: 'Preventing coccidiosis in young chicks', angle: 'How litter, water and stocking density affect coccidiosis risk in chicks.', whyNow: 'Helps poultry keepers protect their flock during the most vulnerable weeks.' },
  { topic: 'Setting up a brooder for day-old chicks', angle: 'How to keep a brooder warm, dry and safe for the first weeks.', whyNow: 'Good brooding decides how many chicks survive and grow well.' },
  { topic: 'Heat stress in dairy cows', angle: 'How to recognise heat stress in dairy cows and cool them down.', whyNow: 'Heat cuts milk yield and harms fertility, so early action pays off.' },
  { topic: 'Mastitis prevention through milking hygiene', angle: 'A simple milking routine that lowers the risk of mastitis.', whyNow: 'Mastitis is one of the costliest problems on dairy farms of every size.' },
  { topic: 'Colostrum feeding for newborn calves', angle: 'Why the first feed matters and how to give colostrum correctly.', whyNow: 'The first hours of life shape a calf\'s health for months.' },
  { topic: 'Controlling worms in goats with pasture management', angle: 'How grazing management reduces the worm burden in goats.', whyNow: 'Worms are a leading cause of weight loss and deaths in goats.' },
  { topic: 'Housing goats to prevent pneumonia', angle: 'How draughts, damp and crowding lead to pneumonia, and how to avoid them.', whyNow: 'Good housing prevents illness that is hard and costly to treat.' },
  { topic: 'Biosecurity on a small pig farm', angle: 'Practical, low-cost steps to keep disease out of a pig unit.', whyNow: 'Disease outbreaks in pigs spread fast, and prevention is cheaper than control.' },
  { topic: 'Weaning piglets with less stress', angle: 'How feed, housing and timing affect piglets around weaning.', whyNow: 'Weaning is a high-risk period for scours and slow growth.' },
  { topic: 'Tick control on cattle', angle: 'How to check for ticks and reduce them with good management.', whyNow: 'Ticks spread serious cattle diseases and cause production losses.' },
  { topic: 'Record keeping on a small livestock farm', angle: 'Which simple records help a farmer spot health and production problems early.', whyNow: 'Good records turn guesses into decisions.' },
  { topic: 'Daily health checks for livestock', angle: 'What a farmer should look at every day to spot a sick animal early.', whyNow: 'Early detection saves animals and limits spread.' },
  { topic: 'Safe disposal of dead livestock', angle: 'How to dispose of carcasses without spreading disease.', whyNow: 'Poor disposal can spread infection to other animals and to people.' },
  { topic: 'Clean drinking water for livestock', angle: 'How water quality and supply affect health, growth and milk or egg output.', whyNow: 'Water is the most important feed and the most often neglected.' },
  { topic: 'Feeding dry cows before calving', angle: 'How to feed and manage cows in the dry period and the weeks before calving.', whyNow: 'The transition period decides how the next lactation goes.' },
  { topic: 'Mineral deficiency in grazing cattle', angle: 'Warning signs of mineral shortages and how to prevent them.', whyNow: 'Deficiencies quietly reduce growth, fertility and immunity.' },
  { topic: 'Foot rot in sheep and goats', angle: 'How foot rot starts, how to prevent it and when to call a vet.', whyNow: 'Lameness lowers growth and welfare and spreads through a flock.' },
  { topic: 'Planning a vaccination programme with your vet', angle: 'How a farmer can organise vaccination timing for the herd or flock.', whyNow: 'Well-timed vaccination is one of the cheapest ways to prevent loss.' },
  { topic: 'Quarantine for newly bought animals', angle: 'How to isolate new stock so it does not bring disease onto the farm.', whyNow: 'Bought-in animals are a common route for infection.' },
  { topic: 'Newcastle disease prevention in village chickens', angle: 'How vaccination and flock management protect village poultry.', whyNow: 'Newcastle disease can wipe out backyard flocks within days.' },
  { topic: 'Why laying hens stop laying', angle: 'Common causes of an egg production drop and what to check first.', whyNow: 'A sudden drop is often a sign of a problem that can be fixed.' },
  { topic: 'Ventilation in poultry houses', angle: 'How air flow, ammonia and dampness affect bird health.', whyNow: 'Poor ventilation causes respiratory disease and poor growth.' },
  { topic: 'Spotting lameness in dairy cows early', angle: 'How to notice lameness and what management reduces it.', whyNow: 'Lameness cuts milk yield and is easier to fix when caught early.' },
  { topic: 'Bloat in cattle', angle: 'What causes bloat, how to prevent it and why it needs urgent help.', whyNow: 'Bloat can kill an animal within hours.' },
  { topic: 'Storing hay and silage to avoid mould', angle: 'How to store feed so it stays safe and nutritious.', whyNow: 'Mouldy feed can make animals sick and wastes money.' },
  { topic: 'Pasture rotation to reduce parasites', angle: 'How moving animals between paddocks lowers parasite pressure.', whyNow: 'Pasture management reduces the need for treatment.' },
  { topic: 'Kidding season care for goats', angle: 'How to prepare for kidding and look after does and newborn kids.', whyNow: 'Preparation reduces kid losses and problems at birth.' },
  { topic: 'Preparing a farrowing pen for sows', angle: 'How to prepare housing and routines for farrowing.', whyNow: 'Good preparation improves piglet survival.' },
  { topic: 'Fly control around livestock housing', angle: 'How to reduce flies through manure and moisture management.', whyNow: 'Flies spread disease and stress animals.' },
  { topic: 'Rodent control in feed stores', angle: 'How to keep rats and mice out of feed and away from animals.', whyNow: 'Rodents spoil feed and carry disease.' },
  { topic: 'Farm gate biosecurity for visitors and vehicles', angle: 'Simple rules for people and vehicles entering a livestock farm.', whyNow: 'People and vehicles can carry disease between farms.' },
  { topic: 'Feeding cattle through a drought', angle: 'How to prioritise animals and feed when pasture and water run short.', whyNow: 'Drought planning protects both animals and farm income.' },
  { topic: 'Mycotoxins in stored feed', angle: 'How damp storage leads to toxins and how to lower the risk.', whyNow: 'Contaminated feed can reduce growth, milk and fertility.' },
  { topic: 'Body condition scoring in cattle', angle: 'How to judge body condition and use it to adjust feeding.', whyNow: 'It is a free tool that shows whether feeding is right.' },
  { topic: 'Handling milk safely on small dairy farms', angle: 'How cleaning and cooling keep milk safe and saleable.', whyNow: 'Clean milk protects consumers and keeps buyers.' },
  { topic: 'Calf scours: early signs and care', angle: 'How to recognise scours in calves and give supportive care while calling a vet.', whyNow: 'Scours is a major cause of calf deaths.' },
  { topic: 'Lambing season hygiene and care', angle: 'How clean conditions and good routines protect ewes and lambs.', whyNow: 'Most lamb losses happen in the first days of life.' },
  { topic: 'Cold stress in newborn lambs and kids', angle: 'How to keep newborns warm and what signs show they are chilled.', whyNow: 'Chilling is a common and preventable cause of young animal deaths.' },
  { topic: 'Why antibiotics should only be used on vet advice', angle: 'How misuse builds resistance and what farmers can do instead.', whyNow: 'Resistance threatens animal and human health.' },
  { topic: 'Preventing brucellosis infection on the farm', angle: 'How brucellosis spreads and how farmers and workers can protect themselves.', whyNow: 'It affects herd fertility and can infect people.' },
  { topic: 'Changing livestock feed gradually', angle: 'Why sudden diet changes upset animals and how to switch feeds safely.', whyNow: 'Feed changes often happen with seasons and supplies.' },
];
