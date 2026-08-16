import type { Table } from "@/types";

export const TABLES: Table[] = [
  { id: "t1", number: "1", name: "Peepal Corner", capacity: 2, status: "free", sessionId: null },
  { id: "t2", number: "2", name: "Bamboo Nook", capacity: 4, status: "free", sessionId: null },
  { id: "t3", number: "3", name: "Lotus Nook", capacity: 4, status: "free", sessionId: null },
  { id: "t4", number: "4", name: "Courtyard", capacity: 6, status: "free", sessionId: null },
  { id: "t5", number: "5", name: "Sunset", capacity: 2, status: "free", sessionId: null },
  { id: "t6", number: "6", name: "Herb Garden", capacity: 4, status: "free", sessionId: null },
  { id: "t7", number: "7", name: "Mango Tree", capacity: 6, status: "free", sessionId: null },
  { id: "t8", number: "8", name: "Terrace", capacity: 8, status: "occupied", sessionId: "s-active-demo" },
  { id: "t9", number: "9", name: "Cedar Deck", capacity: 4, status: "reserved", sessionId: null },
  { id: "t10", number: "10", name: "Rainbow", capacity: 4, status: "free", sessionId: null },
  { id: "t11", number: "11", name: "Stone Bench", capacity: 2, status: "free", sessionId: null },
  { id: "t12", number: "12", name: "Fig Corner", capacity: 4, status: "free", sessionId: null },
  { id: "t13", number: "13", name: "Palms", capacity: 6, status: "cleaning", sessionId: null },
  { id: "t14", number: "14", name: "Jungle Hide", capacity: 4, status: "free", sessionId: null },
  { id: "t15", number: "15", name: "Canopy", capacity: 8, status: "free", sessionId: null },
];
