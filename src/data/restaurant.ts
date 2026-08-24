import type { Restaurant } from "@/types";

export const RESTAURANT: Restaurant = {
  id: "aura-leaf",
  name: "The Aura Leaf",
  tagline: "Scan. Savour. Stay.",
  description:
    "A contemporary Indian kitchen rooted in seasonal produce and slow flame cooking. Every dish is an ode to the land that sustains us — fragrant, earthy, and alive.",
  address:
    "Ground Floor, The Peepal Grove, 14/2, Oakwood Road, Indiranagar, Bengaluru, Karnataka 560038",
  phone: "+91 80 4123 4567",
  email: "hello@theauraleaf.com",
  hours: {
    "Monday-Tuesday": "11:30 AM – 11:00 PM",
    "Wednesday-Thursday": "11:30 AM – 11:30 PM",
    "Friday-Sunday": "11:00 AM – 11:30 PM",
    Brunch: "8:00 AM – 2:30 PM (Sat & Sun)",
  },
  location: {
    lat: 12.9352,
    lng: 77.6245,
  },
  currency: {
    code: "INR",
    symbol: "₹",
    locale: "en-IN",
  },
  branding: {
    primaryImage: "/images/hero.jpg",
    logo: null,
  },
  taxes: [
    { id: "gst-5", name: "GST (5%)", rate: 5, type: "percentage" },
  ],
  serviceCharge: 10,
};
