// tags.ts
export type TagGroup =
  | 'equip' | 'grip' | 'width' | 'stance' | 'foot'
  | 'side' | 'posture' | 'bench' | 'cable' | 'rom'
  | 'assist' | 'accom' | 'flag';

export type TagId =
  | `equip:${'barbell'|'dumbbell'|'kettlebell'|'machine'|'cable'|'bodyweight'|'trapbar'|'ezbar'}`
  | `grip:${'overhand'|'underhand'|'neutral'|'mixed'}`
  | `width:${'close'|'standard'|'wide'}`
  | `stance:${'narrow'|'shoulder'|'sumo'}`
  | `foot:${'in'|'neutral'|'out'}`
  | `side:${'bilateral'|'left'|'right'}`
  | `posture:${'standing'|'seated'|'half-kneeling'|'tall-kneeling'|'prone'|'supine'|'bent-over'}`
  | `bench:${'flat'|'incline'|'decline'}`
  | `cable:${'high2low'|'low2high'|'horizontal'}`
  | `rom:${'full'|'partial'|'quarter'|'pin'|'deficit'}`
  | `assist:${'weighted'|'assisted'}`
  | `accom:${'banded'|'chained'}`
  | `flag:${'paused'|'touch-and-go'|'hook-grip'|'straps'|'belt'}`;

type Rule = { group?: TagGroup; conflictsWith?: TagId[]; implies?: TagId[] };

export const TAG_RULES: Record<TagId, Rule> = {
  // Equipment
  'equip:barbell':   { group: 'equip' },
  'equip:dumbbell':  { group: 'equip' },
  'equip:kettlebell':{ group: 'equip' },
  'equip:machine':   { group: 'equip' },
  'equip:cable':     { group: 'equip' },
  'equip:bodyweight':{ group: 'equip' },
  'equip:trapbar':   { group: 'equip' },
  'equip:ezbar':     { group: 'equip' },

  // Grip orientation
  'grip:overhand': { group: 'grip' },
  'grip:underhand':{ group: 'grip' },
  'grip:neutral':  { group: 'grip' },
  'grip:mixed':    { group: 'grip' },

  // Width
  'width:close':    { group: 'width' },
  'width:standard': { group: 'width' },
  'width:wide':     { group: 'width' },

  // Stance
  'stance:narrow':   { group: 'stance' },
  'stance:shoulder': { group: 'stance' },
  'stance:sumo':     { group: 'stance' },

  // Foot
  'foot:in':      { group: 'foot' },
  'foot:neutral': { group: 'foot' },
  'foot:out':     { group: 'foot' },

  // Side
  'side:bilateral': { group: 'side' },
  'side:left':      { group: 'side' },
  'side:right':     { group: 'side' },

  // Posture
  'posture:standing':     { group: 'posture' },
  'posture:seated':       { group: 'posture' },
  'posture:half-kneeling':{ group: 'posture' },
  'posture:tall-kneeling':{ group: 'posture' },
  'posture:prone':        { group: 'posture' },
  'posture:supine':       { group: 'posture' },
  'posture:bent-over':    { group: 'posture' },

  // Bench angle (implies supine position)
  'bench:flat':    { group: 'bench',   implies: ['posture:supine'] },
  'bench:incline': { group: 'bench',   implies: ['posture:supine'] },
  'bench:decline': { group: 'bench',   implies: ['posture:supine'] },

  // Cable line (implies cable equipment)
  'cable:high2low': { group: 'cable',  implies: ['equip:cable'] },
  'cable:low2high': { group: 'cable',  implies: ['equip:cable'] },
  'cable:horizontal': { group: 'cable',implies: ['equip:cable'] },

  // ROM
  'rom:full':    { group: 'rom' },
  'rom:partial': { group: 'rom' },
  'rom:quarter': { group: 'rom' },
  'rom:pin':     { group: 'rom' },
  'rom:deficit': { group: 'rom' },

  // Load assist
  'assist:weighted': { group: 'assist' },
  'assist:assisted': { group: 'assist' },

  // Accommodating resistance
  'accom:banded': { group: 'accom' },
  'accom:chained':{ group: 'accom' },

  // Flags (touch-and-go conflicts with paused)
  'flag:paused':        {},
  'flag:touch-and-go':  { conflictsWith: ['flag:paused'] as TagId[] },
  'flag:hook-grip':     {},
  'flag:straps':        {},
  'flag:belt':          {},
};

export function toggleTag(tag: TagId, current: TagId[]): TagId[] {
  const exists = current.includes(tag);
  if (exists) return current.filter(t => t !== tag);

  // start with current
  let next = [...current];

  // 1) remove any existing tag in same group
  const group = TAG_RULES[tag]?.group;
  if (group) next = next.filter(t => TAG_RULES[t]?.group !== group);

  // 2) remove tags this tag conflicts with
  const conflicts = new Set(TAG_RULES[tag]?.conflictsWith ?? []);
  next = next.filter(t => !conflicts.has(t));

  // 3) remove tags that conflict with this tag (symmetry)
  next = next.filter(t => !(TAG_RULES[t]?.conflictsWith ?? []).includes(tag));

  // 4) add the tag
  next.push(tag);

  // 5) add implied tags (recursively), respecting exclusivity/conflicts
  const toVisit = [...(TAG_RULES[tag]?.implies ?? [])];
  const visited = new Set<TagId>();
  while (toVisit.length) {
    const im = toVisit.pop()!;
    if (visited.has(im)) continue;
    visited.add(im);

    // remove group mates
    const g = TAG_RULES[im]?.group;
    if (g) next = next.filter(t => TAG_RULES[t]?.group !== g);

    // remove conflicts both ways
    const c1 = new Set(TAG_RULES[im]?.conflictsWith ?? []);
    next = next.filter(t => !c1.has(t));
    next = next.filter(t => !(TAG_RULES[t]?.conflictsWith ?? []).includes(im));

    // add implied tag
    if (!next.includes(im)) next.push(im);

    // queue transitive implies
    (TAG_RULES[im]?.implies ?? []).forEach(x => toVisit.push(x));
  }

  return next;
}

// Useful when loading from storage to “heal” old arrays to the new rules
export function normalizeTags(tags: TagId[]): TagId[] {
  return tags.reduce((acc, t) => toggleTag(t, acc), [] as TagId[]);
}

// Optional: provide grouped UI data
export const TAG_GROUPS_UI: { title: string; group: TagGroup; options: TagId[] }[] = [
  { title: 'Equipment', group: 'equip', options: [
    'equip:barbell','equip:dumbbell','equip:kettlebell','equip:machine','equip:cable','equip:bodyweight','equip:trapbar','equip:ezbar'
  ]},
  { title: 'Grip', group: 'grip', options: [
    'grip:overhand','grip:underhand','grip:neutral','grip:mixed'
  ]},
  { title: 'Width', group: 'width', options: ['width:close','width:standard','width:wide']},
  { title: 'Side', group: 'side', options: ['side:bilateral','side:left','side:right']},
  { title: 'Posture', group: 'posture', options: [
    'posture:standing','posture:seated','posture:half-kneeling','posture:tall-kneeling','posture:prone','posture:supine','posture:bent-over'
  ]},
  { title: 'Bench', group: 'bench', options: ['bench:flat','bench:incline','bench:decline']},
  { title: 'Cable Path', group: 'cable', options: ['cable:high2low','cable:low2high','cable:horizontal']},
  { title: 'ROM', group: 'rom', options: ['rom:full','rom:partial','rom:quarter','rom:pin','rom:deficit']},
  { title: 'Assist', group: 'assist', options: ['assist:weighted','assist:assisted']},
  { title: 'Accom. Resistance', group: 'accom', options: ['accom:banded','accom:chained']},
  { title: 'Flags', group: 'flag', options: ['flag:paused','flag:touch-and-go','flag:hook-grip','flag:straps','flag:belt']},
];
