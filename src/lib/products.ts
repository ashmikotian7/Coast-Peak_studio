import earrings from "@/assets/product-earrings.jpg";
import necklace from "@/assets/product-necklace.jpg";
import rings from "@/assets/product-rings.jpg";
import bracelet from "@/assets/product-bracelet.jpg";

export type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  category: "earrings" | "necklaces" | "rings" | "bracelets";
  tag?: "new" | "bestseller" | "limited";
  description: string;
  stock: number;
};

export const products: Product[] = [
  {
    id: "amethyst-drops",
    name: "Amethyst Whisper Drops",
    price: 248,
    image: earrings,
    category: "earrings",
    tag: "bestseller",
    description:
      "Hand-set teardrop amethysts cradled in 18k gold vermeil. Each pair is finished and signed by our artisan.",
    stock: 7,
  },
  {
    id: "violet-teardrop",
    name: "Violet Teardrop Pendant",
    price: 186,
    image: necklace,
    category: "necklaces",
    tag: "new",
    description:
      "A single faceted amethyst suspended on a delicate gold chain — the everyday heirloom.",
    stock: 12,
  },
  {
    id: "lavender-stack",
    name: "Lavender Stack Trio",
    price: 312,
    image: rings,
    category: "rings",
    tag: "limited",
    description:
      "Three stackable bands, each crowned with a hand-cut lavender sapphire. Limited to 50 sets.",
    stock: 3,
  },
  {
    id: "heritage-cuff",
    name: "Heritage Floral Cuff",
    price: 524,
    image: bracelet,
    category: "bracelets",
    tag: "bestseller",
    description:
      "An engraved gold cuff inspired by old-world florals, accented with cabochon amethyst.",
    stock: 5,
  },
  {
    id: "amethyst-drops-2",
    name: "Midnight Pear Earrings",
    price: 268,
    image: earrings,
    category: "earrings",
    description: "Deep violet pear-cut stones on hand-forged hooks.",
    stock: 9,
  },
  {
    id: "violet-teardrop-2",
    name: "Solitaire Lavender Chain",
    price: 164,
    image: necklace,
    category: "necklaces",
    description: "Minimal, weightless, made to be layered.",
    stock: 18,
  },
  {
    id: "lavender-stack-2",
    name: "Petal Promise Band",
    price: 198,
    image: rings,
    tag: "new",
    category: "rings",
    description: "A single petal-set stone on a brushed gold band.",
    stock: 11,
  },
  {
    id: "heritage-cuff-2",
    name: "Velvet Hour Bangle",
    price: 388,
    image: bracelet,
    category: "bracelets",
    description: "Smooth gold cuff with a single inset amethyst.",
    stock: 6,
  },
];

export const collections = [
  { slug: "earrings", name: "Earrings", tagline: "Whispers for the ear" },
  { slug: "necklaces", name: "Necklaces", tagline: "Worn close to the heart" },
  { slug: "rings", name: "Rings", tagline: "Promises in gold" },
  { slug: "bracelets", name: "Bracelets", tagline: "Heirlooms in motion" },
];
