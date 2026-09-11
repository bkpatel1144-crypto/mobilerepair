/** Inventory > Stock — on-hand derived from purchases in and job parts out. */
module.exports = {
  pages: {
    inventory: {
      stock: {
        stock: { en: 'Stock', hi: 'स्टॉक', gu: 'સ્ટોક' },
        whatIsOnTheShelf: {
          en: 'What is on the shelf — purchases in, job parts out.',
          hi: 'शेल्फ पर क्या है — खरीद आई, जॉब में लगे पुर्जे गए।',
          gu: 'શેલ્ફ પર શું છે — ખરીદી આવી, જોબમાં વપરાયેલા પાર્ટ્સ ગયા.',
        },
        tracked: { en: 'Tracked items', hi: 'ट्रैक किए आइटम', gu: 'ટ્રેક કરેલી આઇટમ' },
        lowStock: { en: 'Low stock', hi: 'कम स्टॉक', gu: 'ઓછો સ્ટોક' },
        outOfStock: { en: 'Out of stock', hi: 'स्टॉक खत्म', gu: 'સ્ટોક ખતમ' },
        stockValue: { en: 'Stock value', hi: 'स्टॉक मूल्य', gu: 'સ્ટોક મૂલ્ય' },
        purchased: { en: 'Purchased', hi: 'खरीदा', gu: 'ખરીદેલ' },
        usedOnJobs: { en: 'Used on jobs', hi: 'जॉब में लगा', gu: 'જોબમાં વપરાયું' },
        onHand: { en: 'On hand', hi: 'उपलब्ध', gu: 'ઉપલબ્ધ' },
        reorderPoint: { en: 'Reorder point', hi: 'रीऑर्डर स्तर', gu: 'રીઓર્ડર સ્તર' },
        value: { en: 'Value', hi: 'मूल्य', gu: 'મૂલ્ય' },
        searchItems: { en: 'Search items…', hi: 'आइटम खोजें…', gu: 'આઇટમ શોધો…' },
        openItemMaster: { en: 'Open Item Master', hi: 'आइटम मास्टर खोलें', gu: 'આઇટમ માસ્ટર ખોલો' },
        nothingIsStockTracked: {
          en: 'Nothing is stock-tracked yet',
          hi: 'अभी कुछ भी स्टॉक-ट्रैक नहीं है',
          gu: 'હજી કંઈ સ્ટોક-ટ્રેક નથી',
        },
        turnOnStockTracked: {
          en: 'Turn on "Stock tracked" on an item and it will appear here.',
          hi: 'किसी आइटम पर "स्टॉक ट्रैक" चालू करें, वह यहाँ दिखेगा।',
          gu: 'આઇટમ પર "સ્ટોક ટ્રેક" ચાલુ કરો, તે અહીં દેખાશે.',
        },
        onHandIsDerived: {
          en: 'On hand is counted from active purchases minus parts fitted to jobs, so it always matches those records.',
          hi: 'उपलब्ध मात्रा सक्रिय खरीद में से जॉब में लगे पुर्जे घटाकर गिनी जाती है, इसलिए वह हमेशा रिकॉर्ड से मेल खाती है।',
          gu: 'ઉપલબ્ધ જથ્થો સક્રિય ખરીદીમાંથી જોબમાં વપરાયેલા પાર્ટ્સ બાદ કરીને ગણાય છે, એટલે તે હંમેશા રેકોર્ડ સાથે મેળ ખાય છે.',
        },
        state: {
          ok: { en: 'In stock', hi: 'स्टॉक में', gu: 'સ્ટોકમાં' },
          low: { en: 'Low', hi: 'कम', gu: 'ઓછું' },
          out: { en: 'Out', hi: 'खत्म', gu: 'ખતમ' },
        },
      },
    },
  },
}
