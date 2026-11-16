// Free photos from Unsplash (unsplash.com/license), loaded at a sensible width.
// Every id here was checked to load from images.unsplash.com.
const unsplash = (id, width = 1200) =>
    `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=75`

export const images = {
    heroKarahi: unsplash('photo-1694579740719-0e601c5d2437', 1400),   // karahi with a wooden spoon
    rotiOnTawa: unsplash('photo-1763951719000-661d3d50d763', 1000),   // hands making roti on a tawa
    biryaniClay: unsplash('photo-1752673508949-f4aeeaef75f0', 1000),  // biryani in a clay pot
    biryaniBowl: unsplash('photo-1631515243349-e0cb75fb8d3a', 900),   // chicken biryani bowl
    tableSpread: unsplash('photo-1682862279256-b2a9e4f3d22c', 1400),  // a table full of dishes
    steelThali: unsplash('photo-1589778655375-3e622a9fc91c', 900),    // thali on a steel plate
    rollingPin: unsplash('photo-1601387448308-66ae6aa1f1f7', 900),    // rolling pin and dough
    bbq: unsplash('photo-1555939594-58d7cb561ad1', 900),              // grilled kebabs and tikka
    rotiThali: unsplash('photo-1567337710282-00832b415979', 1200),    // roti, daal and salan on a steel plate
    steelTray: unsplash('photo-1546833999-b9f581a1996d', 900),        // daal, roti and sabzi on a steel tray
    biryaniPlate: unsplash('photo-1589302168068-964664d93dc0', 900),  // biryani plate
    pulao: unsplash('photo-1642821373181-696a54913e93', 900),         // pulao in a clay pot
    karahiPan: unsplash('photo-1596797038530-2c107229654b', 900),     // salan in a pan with coriander
    curryBowls: unsplash('photo-1585937421612-70a008356fbe', 1200),   // curries in bowls with rice
    tikkaSkewers: unsplash('photo-1599487488170-d11ec9c172f0', 900),  // tikka skewers on the grill
    tandoori: unsplash('photo-1626074353765-517a681e40be', 900),      // tandoori chicken
    breakfast: unsplash('photo-1613292443284-8d10ef9383fe', 900),     // paratha, samosa and chai
    samosa: unsplash('photo-1601050690597-df0568f70950', 900),
    halwa: unsplash('photo-1517244683847-7456b63c5969', 900),         // gajar ka halwa
    noodles: unsplash('photo-1585032226651-759b368d7246', 900),
    pasta: unsplash('photo-1621996346565-e3dbc646d9a9', 900),
    burger: unsplash('photo-1571091718767-18b5b1457add', 900),
    healthyBowl: unsplash('photo-1490645935967-10de6ba17061', 900),
    spices: unsplash('photo-1596040033229-a9821ebd058d', 1000),       // whole spices on a white board
    spiceBowls: unsplash('photo-1532336414038-cf19250c5757', 1000),   // bowls of spices and daals
    groceryShelves: unsplash('photo-1542838132-92c53300491e', 1600),  // vegetable shelves in a store
    vegMarket: unsplash('photo-1488459716781-31db52582fe9', 1200),    // fresh vegetable market
    choppingVeg: unsplash('photo-1507048331197-7d4ac70811cf', 1200),  // hands chopping fresh vegetables
    panCooking: unsplash('photo-1528712306091-ed0763094c98', 1000),   // stirring a pan on the stove
    foodTable: unsplash('photo-1504674900247-0877df9cc836', 1200)     // plates of food on a table
}

// Chefs have no photo in the backend, so a chef card shows a dish from their main cuisine
const cuisinePhoto = {
    'Desi': images.rotiThali,
    'BBQ': images.tikkaSkewers,
    'Karahi': images.heroKarahi,
    'Biryani & Rice': images.biryaniPlate,
    'Chinese': images.noodles,
    'Continental': images.pasta,
    'Fast Food': images.burger,
    'Baking & Desserts': images.halwa,
    'Healthy': images.healthyBowl,
    'Breakfast': images.breakfast
}

export const chefPhoto = (chef) => cuisinePhoto[chef.cuisines?.[0]] || images.rotiThali
