const tailwindColors = [
  "gray",
  "stone",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
];
const extraColors = ["black", "white", "transparent", "current"];

const normalColors = tailwindColors.map((color) => ({
  label: color,
  children: Array.from(
    { length: 10 },
    (_, i) => `${color}-${i === 9 ? 950 : (i + 1) * 100}`,
  ),
}));

const colorList = [
  ...normalColors,
  { label: "Extra Color", children: [...extraColors] },
];

export { colorList, extraColors, normalColors };
