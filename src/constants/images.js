// Free photos from Unsplash (unsplash.com/license). Loaded at a sensible width.
const unsplash = (id, width = 1400) =>
    `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=75`

export const images = {
    heroKarahi: unsplash('photo-1694579740719-0e601c5d2437', 1600),   // karahi on the stove
    rotiOnTawa: unsplash('photo-1763951719000-661d3d50d763', 1000),   // hands cooking roti
    biryaniClay: unsplash('photo-1752673508949-f4aeeaef75f0', 1000),  // biryani in a clay bowl
    biryaniBowl: unsplash('photo-1631515243349-e0cb75fb8d3a', 900),
    tableSpread: unsplash('photo-1682862279256-b2a9e4f3d22c', 1200),  // a table full of dishes
    steelThali: unsplash('photo-1589778655375-3e622a9fc91c', 900),    // food on a steel tray
    rollingPin: unsplash('photo-1601387448308-66ae6aa1f1f7', 900),    // rolling pin and dough
    bbq: unsplash('photo-1555939594-58d7cb561ad1', 900)               // grilled meat
}
