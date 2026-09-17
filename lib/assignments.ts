// Tonight's field calls.
//
// Five original Cala Verda cases, each with two defensible angles. This is the
// whole narrative surface of Saltline: the case a visitor picks, the two truths
// the same plate can carry, the three-move tool route each angle suggests, the
// stamp that goes on the printed sheet, and the closing frame that follows.
// Nothing here is generated at runtime and nothing is fetched; the story is
// data, so it can be read on its own.
//
// baseLuminance is the mean grayscale luminance of the untouched plate,
// measured once with ImageMagick. lib/press-read.ts compares the saved export
// against it, so the press note describes the visitor's edit rather than the
// artwork's own darkness.

export type ToolCue = {
  tool: 'Crop' | 'Filter' | 'Draw' | 'Text' | 'Shapes' | 'Frame';
  instruction: string;
};

export type Angle = {
  id: string;
  label: string;
  prompt: string;
  outcome: string;
  stamp: string;
  moves: [ToolCue, ToolCue, ToolCue];
  closingLead: string;
  closingEmphasis: string;
  closingDeck: string;
};

export type Assignment = {
  id: string;
  issue: string;
  call: string;
  time: string;
  place: string;
  title: string;
  deck: string;
  prompt: string;
  outcome: string;
  image: string;
  preview: string;
  /** Mean grayscale luminance of the untouched plate, measured with ImageMagick. */
  baseLuminance: number;
  accent: 'coral' | 'teal' | 'gold';
  angles: Angle[];
};

export const ASSIGNMENTS: Assignment[] = [
  {
    id: 'wake-tax',
    issue: 'ISSUE 04',
    call: 'CALL 01',
    time: '02:13',
    place: 'Bellwether Pier',
    title: 'Wake Tax',
    deck: 'Nacre Bay Boat Club says its pleasure launch never cut the ferry lane. The whole pier watched it sprint past the toll buoy.',
    prompt: 'Keep the ferry. Lose the alibi. Make the water look guilty.',
    outcome: 'The ferry master clipped your plate to the manifest before sunrise. Two hours later, the boat was moored under a borrowed name.',
    image: '/images/wake-tax.png',
    preview: '/images/display/wake-tax-768.webp',
    baseLuminance: 0.1598,
    accent: 'coral',
    angles: [
      {
        id: 'expose-launch',
        label: 'Expose the launch',
        prompt: 'Center the pleasure launch. Let the ferry lane tell on it.',
        outcome: 'The ferry master clipped your plate to the manifest before sunrise. Two hours later, the boat was moored under a borrowed name.',
        stamp: 'LAUNCH EXPOSED',
        moves: [
          { tool: 'Crop', instruction: 'Keep the launch, toll buoy, and broken wake together.' },
          { tool: 'Draw', instruction: 'Trace the wake back toward the launch.' },
          { tool: 'Text', instruction: 'Mark the time where the ferry lane narrows.' },
        ],
        closingLead: 'The wake reaches',
        closingEmphasis: 'the ledger first.',
        closingDeck: 'The club can rename the boat by sunrise. It cannot rename the route you printed.',
      },
      {
        id: 'protect-crew',
        label: 'Protect the ferry crew',
        prompt: 'Keep the ferry in frame. Make the boat club carry the blame.',
        outcome: 'The crew made the first crossing untouched. By breakfast, the boat club had sent three lawyers and one silent apology.',
        stamp: 'CREW PROTECTED',
        moves: [
          { tool: 'Crop', instruction: 'Hold the ferry lane and push the launch to the edge.' },
          { tool: 'Shapes', instruction: 'Box the safe line the crew kept.' },
          { tool: 'Text', instruction: 'Give the first crossing a clean label.' },
        ],
        closingLead: 'The first crossing',
        closingEmphasis: 'keeps its name.',
        closingDeck: 'The crew reaches dawn untouched. The boat club inherits every question left in frame.',
      },
    ],
  },
  {
    id: 'room-08',
    issue: 'ISSUE 04',
    call: 'CALL 02',
    time: '02:19',
    place: 'Morrow Court',
    title: 'Room 08',
    deck: 'A white coupe waited outside Paradise Slabs Motor Court. The balcony light blinked once. The pool kept the rest of the story.',
    prompt: 'Hold the witness. Cut the noise. Leave one question open.',
    outcome: 'By breakfast the manager had changed the key cards. The person behind the door left a damp matchbook on the desk with no room number.',
    image: '/images/room-08.png',
    preview: '/images/display/room-08-768.webp',
    baseLuminance: 0.1189,
    accent: 'teal',
    angles: [
      {
        id: 'show-witness',
        label: 'Show the witness',
        prompt: 'Hold the balcony. Let the witness stay visible through the noise.',
        outcome: 'By breakfast the manager had changed the key cards. The person behind the door left a damp matchbook on the desk with no room number.',
        stamp: 'WITNESS SHOWN',
        moves: [
          { tool: 'Crop', instruction: 'Keep the balcony and its pool reflection together.' },
          { tool: 'Filter', instruction: 'Lift the contrast until the light holds.' },
          { tool: 'Draw', instruction: 'Bracket the window the manager denies.' },
        ],
        closingLead: 'One balcony',
        closingEmphasis: 'stays lit.',
        closingDeck: 'The key cards change before breakfast. The witness remains exactly where you left the light.',
      },
      {
        id: 'hide-witness',
        label: 'Hide the witness',
        prompt: 'Cut the balcony loose. Put the reflection, not the person, on the record.',
        outcome: 'The coupe disappeared before dawn. The pool reflection remained, sharp enough for the night desk and nobody else.',
        stamp: 'WITNESS HELD',
        moves: [
          { tool: 'Crop', instruction: 'Cut the balcony and keep the pool in frame.' },
          { tool: 'Filter', instruction: 'Cool the scene until the reflection leads.' },
          { tool: 'Text', instruction: 'Leave one room number unanswered.' },
        ],
        closingLead: 'The reflection',
        closingEmphasis: 'keeps the secret.',
        closingDeck: 'The coupe leaves before dawn. The only witness left is water, and water never signs a statement.',
      },
    ],
  },
  {
    id: 'after-rain',
    issue: 'ISSUE 04',
    call: 'CALL 03',
    time: '02:27',
    place: 'Cormorant Carnival',
    title: 'After the Rain',
    deck: 'Floodwater returns a silver mask that the Cala Cielo Carnival claims was never missing. Every witness has a different story.',
    prompt: 'Find the object. Follow the reflection. Do not clean it up.',
    outcome: 'The mask made the morning edition, then vanished from the evidence bag. A brass ticket appeared where it had been, stamped for a ride that has not existed in twelve years.',
    image: '/images/after-rain-daybreak.png',
    preview: '/images/display/after-rain-daybreak-768.webp',
    baseLuminance: 0.3623,
    accent: 'gold',
    angles: [
      {
        id: 'publish-mask',
        label: 'Publish the mask',
        prompt: 'Find the mask. Let the morning city see what the carnival denied.',
        outcome: 'The mask made the morning edition, then vanished from the evidence bag. A brass ticket appeared where it had been, stamped for a ride that has not existed in twelve years.',
        stamp: 'MASK PUBLISHED',
        moves: [
          { tool: 'Crop', instruction: 'Pull the mask and floodwater into the same proof.' },
          { tool: 'Filter', instruction: 'Bleach the morning without cleaning the scene.' },
          { tool: 'Shapes', instruction: 'Ring the object the carnival never logged.' },
        ],
        closingLead: 'The mask makes',
        closingEmphasis: 'the morning run.',
        closingDeck: 'It disappears from evidence after print. The edition keeps the face the carnival tried to lose.',
      },
      {
        id: 'follow-courier',
        label: 'Follow the courier',
        prompt: 'Follow the courier through the reflection. Keep the mask as a warning, not the headline.',
        outcome: 'The courier crossed the service bridge at dawn. The carnival kept its mask, but the route was now on the record.',
        stamp: 'COURIER FOLLOWED',
        moves: [
          { tool: 'Crop', instruction: 'Hold the courier, service bridge, and reflection.' },
          { tool: 'Draw', instruction: 'Run a route line through the wet street.' },
          { tool: 'Text', instruction: 'Stamp the next crossing time beside the rider.' },
        ],
        closingLead: 'A wet route',
        closingEmphasis: 'outlives the rider.',
        closingDeck: 'The carnival keeps its mask. Your line gives the morning desk somewhere real to follow.',
      },
    ],
  },
  {
    id: 'undertow',
    issue: 'ISSUE 04',
    call: 'CALL 04',
    time: '02:34',
    place: 'Vesper Quay',
    title: 'Undertow',
    deck: 'A phone went into the tide behind a closed quay kiosk. Somebody stayed to watch it sink. Somebody else took the tender home.',
    prompt: 'Find the hand-off. Let the tide erase nothing.',
    outcome: 'At high tide the phone was gone, but the wet sleeve made the morning print. The tender owner stopped returning calls at 08:01.',
    image: '/images/undertow.png',
    preview: '/images/display/undertow-768.webp',
    baseLuminance: 0.1628,
    accent: 'teal',
    angles: [
      {
        id: 'print-handoff',
        label: 'Print the hand-off',
        prompt: 'Frame the phone and wet sleeve. Make the exchange impossible to deny.',
        outcome: 'At high tide the phone was gone, but the wet sleeve made the morning print. The tender owner stopped returning calls at 08:01.',
        stamp: 'HAND-OFF PRINTED',
        moves: [
          { tool: 'Crop', instruction: 'Keep the phone, wet sleeve, and tide line tight.' },
          { tool: 'Filter', instruction: 'Push contrast until the hand-off reads first.' },
          { tool: 'Shapes', instruction: 'Box the exchange the quay cameras missed.' },
        ],
        closingLead: 'The tide takes',
        closingEmphasis: 'everything but proof.',
        closingDeck: 'The phone is gone at high water. The sleeve remains in print, dry enough for every desk in town.',
      },
      {
        id: 'follow-tender',
        label: 'Follow the tender',
        prompt: 'Let the phone fall away. Hold the watcher and the tender in the same story.',
        outcome: 'The tender left before dawn. Its wake cut straight past the quay cameras, but your plate preserved the one person who watched it go.',
        stamp: 'TENDER FOLLOWED',
        moves: [
          { tool: 'Crop', instruction: 'Pair the watcher with the tender in one frame.' },
          { tool: 'Draw', instruction: 'Pull an arrow from the quay into the channel.' },
          { tool: 'Text', instruction: 'Mark the departure time the cameras lost.' },
        ],
        closingLead: 'One wake line',
        closingEmphasis: 'leaves the quay.',
        closingDeck: 'The tender clears the cameras before dawn. Your plate keeps the watcher attached to its route.',
      },
    ],
  },
  {
    id: 'off-the-meter',
    issue: 'ISSUE 04',
    call: 'CALL 05',
    time: '02:41',
    place: 'Northbelt Causeway',
    title: 'Off the Meter',
    deck: 'A shuttle meter kept ticking on an empty causeway. A coral ribbon flapped inside. Its driver was already walking toward the ferry.',
    prompt: 'Read the meter. Catch the route before it disappears.',
    outcome: 'The ferry crossed without the driver. At first light, the shuttle appeared two districts away with the same ribbon and a different fare.',
    image: '/images/off-the-meter.png',
    preview: '/images/display/off-the-meter-768.webp',
    baseLuminance: 0.1095,
    accent: 'coral',
    angles: [
      {
        id: 'tag-driver',
        label: 'Tag the driver',
        prompt: 'Hold the driver against the ferry lights. Make the exit the whole story.',
        outcome: 'The ferry crossed without the driver. At first light, the shuttle appeared two districts away with the same ribbon and a different fare.',
        stamp: 'DRIVER TAGGED',
        moves: [
          { tool: 'Crop', instruction: 'Keep the driver against the last ferry lights.' },
          { tool: 'Draw', instruction: 'Circle the person leaving the running meter.' },
          { tool: 'Text', instruction: 'Tag the final fare beside the causeway.' },
        ],
        closingLead: 'The driver walks',
        closingEmphasis: 'out of the fare.',
        closingDeck: 'The shuttle returns under new plates. The person who left it cannot step out of your frame.',
      },
      {
        id: 'map-route',
        label: 'Map the route',
        prompt: 'Keep the empty shuttle and the meter together. Let the route expose itself.',
        outcome: 'The meter kept running until noon. Its impossible fare drew a line through three districts and one sealed marina gate.',
        stamp: 'ROUTE MAPPED',
        moves: [
          { tool: 'Crop', instruction: 'Hold the empty shuttle and live meter together.' },
          { tool: 'Draw', instruction: 'Pull the fare line toward the sealed marina gate.' },
          { tool: 'Shapes', instruction: 'Box the number that makes the route impossible.' },
        ],
        closingLead: 'The meter draws',
        closingEmphasis: 'a road nobody owns.',
        closingDeck: 'The fare keeps climbing after the engine cools. Your mark turns the number into a route.',
      },
    ],
  },
];
