export const STATUS_OPTIONS = [
  { value: "TO_READ",   label: "📚 Da leggere" },
  { value: "READING",   label: "📖 In lettura"  },
  { value: "READ",      label: "✅ Letto"        },
  { value: "WISHLIST",  label: "🔖 Wishlist"     },
  { value: "ABANDONED", label: "🚫 Abbandonato"  },
];

export const STATUS_LABELS: Record<string, string> = {
  TO_READ:   "Da leggere",
  READING:   "In lettura",
  READ:      "Letto",
  WISHLIST:  "Wishlist",
  ABANDONED: "Abbandonato",
};

export const FORMAT_OPTIONS = [
  { value: "cartaceo", label: "📖 Cartaceo" },
  { value: "kindle",   label: "📱 E-book / Kindle" },
  { value: "audible",  label: "🎧 Audiolibro / Audible" },
];
