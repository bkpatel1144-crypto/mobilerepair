/**
 * Sidebar copy for the three menus the client's menu structure has and this app did not:
 * Purchase > General Purchase, Inventory > Stock, and Masters > Attributes.
 *
 * `useNavLabels` falls back to the English label in `nav.ts` when a key is missing, so without
 * these the two new modules would read in English on a Hindi or Gujarati sidebar and nothing
 * would fail to tell us.
 */
module.exports = {
  nav: {
    sections: {
      purchase: { en: 'Purchase', hi: 'खरीद', gu: 'ખરીદી' },
      inventory: { en: 'Inventory', hi: 'इन्वेंटरी', gu: 'ઇન્વેન્ટરી' },
    },
    items: {
      'purchase/general': { en: 'General Purchase', hi: 'सामान्य खरीद', gu: 'સામાન્ય ખરીદી' },
      'inventory/stock': { en: 'Stock', hi: 'स्टॉक', gu: 'સ્ટોક' },
      'masters/attributes': { en: 'Attributes', hi: 'विशेषताएँ', gu: 'લક્ષણો' },
    },
  },
}
