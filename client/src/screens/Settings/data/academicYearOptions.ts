// Day Options

export const days = Array.from(
  { length: 31 },
  (_, i) => (i + 1).toString()
);

// Month Options

export const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Year Options

export const years = Array.from(
  { length: 20 },
  (_, i) => (2022 + i).toString()
);