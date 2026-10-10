// ─────────────────────────────────────────────────────────────
//  Edit this file to change the text and the entrances on the site.
// ─────────────────────────────────────────────────────────────

export const event = {
  title: "Halloween Costume Donation & Swap",
  organizer: "MVP",
  dates: "October 1 – 23",
  intro:
    "Many cartoon characters have been popular Halloween costumes for years. Give your child's old costume a second life, or pick up a used one this year. The more costumes we reuse, the better!",
  rules: [
    "Donate: drop clean, used costumes at the Fir, Cedar or Cypress entrance, starting Thursday, October 1.",
    "We sort the costumes by size and make them available for pickup after October 5.",
    "Pick up: find a costume above and go to the place shown on it.",
    "No costume to donate? You're still welcome to pick one up!",
  ],
};

type Entrance = {
  id: string;
  name: string;
  label?: string; // shown instead of "<name> entrance"
  where?: string; // e.g. "by the gym doors"
  sizes?: string; // e.g. "Sizes 2–4"
  color: string;
  donationBins?: boolean; // accepts donations
};

// Photos go in  public/costumes/<entrance id>/  — e.g. public/costumes/fir/batman.jpg
// Ordered from smallest to largest sizes. TODO: confirm sizes with the coordinator.
export const entrances: Entrance[] = [
  { id: "early-years", name: "Early Years", label: "Early Years", sizes: "Toddler & Pre-K (2–4)", color: "bg-rose-500" },
  { id: "fir", name: "Fir", sizes: "Sizes 5–6", color: "bg-purple-600", donationBins: true },
  { id: "cedar", name: "Cedar", sizes: "Around size 10", color: "bg-emerald-600", donationBins: true },
  { id: "cypress", name: "Cypress", sizes: "Largest sizes", color: "bg-orange-500", donationBins: true },
];

export const donationEntrances = entrances.filter((e) => e.donationBins);
export const entranceLabel = (e: Entrance) => e.label ?? `${e.name} entrance`;
