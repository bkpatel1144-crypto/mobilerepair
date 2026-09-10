/** Copy for the three menus the client's menu export adds: Attributes, General Purchase, Stock. */
module.exports = {
  pages: {
    masters: {
      attributes: {
        attributes: { en: 'Attributes', hi: 'विशेषताएँ', gu: 'લક્ષણો' },
        theVocabularyItemVariantsAre: {
          en: 'The vocabulary item variants are defined by — colour, capacity, and so on.',
          hi: 'आइटम वेरिएंट जिन शब्दों से परिभाषित होते हैं — रंग, क्षमता आदि।',
          gu: 'આઇટમ વેરિઅન્ટ જે શબ્દોથી વ્યાખ્યાયિત થાય છે — રંગ, ક્ષમતા વગેરે.',
        },
        values: { en: 'Values', hi: 'मान', gu: 'મૂલ્યો' },
        inUse: { en: 'In use', hi: 'उपयोग में', gu: 'ઉપયોગમાં' },
        searchAttributes: { en: 'Search attributes…', hi: 'विशेषताएँ खोजें…', gu: 'લક્ષણો શોધો…' },
        noAttributesYet: {
          en: 'No attributes yet',
          hi: 'अभी कोई विशेषता नहीं',
          gu: 'હજી કોઈ લક્ષણ નથી',
        },
        addColourOrCapacityToStart: {
          en: 'Add Colour or Capacity to start describing item variants.',
          hi: 'आइटम वेरिएंट बताने के लिए रंग या क्षमता जोड़ें।',
          gu: 'આઇટમ વેરિઅન્ટ વર્ણવવા રંગ કે ક્ષમતા ઉમેરો.',
        },
        addAttribute: { en: 'Add attribute', hi: 'विशेषता जोड़ें', gu: 'લક્ષણ ઉમેરો' },
        aNameIsRequired: { en: 'A name is required.', hi: 'नाम आवश्यक है।', gu: 'નામ જરૂરી છે.' },
        eGColour: { en: 'e.g. Colour', hi: 'जैसे रंग', gu: 'જેમ કે રંગ' },
        eGBlackWhiteBlue: {
          en: 'e.g. Black, White, Blue',
          hi: 'जैसे काला, सफेद, नीला',
          gu: 'જેમ કે કાળો, સફેદ, વાદળી',
        },
        noValuesYet: { en: 'No values yet.', hi: 'अभी कोई मान नहीं।', gu: 'હજી કોઈ મૂલ્ય નથી.' },
        aDeactivatedAttributeIsNotOffered: {
          en: 'A deactivated attribute is no longer offered when describing an item.',
          hi: 'निष्क्रिय विशेषता आइटम बताते समय नहीं दिखेगी।',
          gu: 'નિષ્ક્રિય લક્ષણ આઇટમ વર્ણવતી વખતે દેખાશે નહીં.',
        },
        thisPermanentlyDeletesTheAttribute: {
          en: 'This permanently deletes the attribute. It cannot be undone.',
          hi: 'यह विशेषता को स्थायी रूप से हटा देगा। इसे वापस नहीं लाया जा सकता।',
          gu: 'આ લક્ષણ કાયમ માટે કાઢી નાખશે. તે પાછું લાવી શકાશે નહીં.',
        },
        nItemsStillNameThisAttribute_one: {
          en: '{{count}} item still names this attribute and keeps the name it stored. This cannot be undone.',
          hi: '{{count}} आइटम अब भी इस विशेषता का नाम रखता है और वही नाम बनाए रखेगा। इसे वापस नहीं लाया जा सकता।',
          gu: '{{count}} આઇટમ હજી આ લક્ષણનું નામ ધરાવે છે અને એ જ નામ રાખશે. આ પાછું લાવી શકાશે નહીં.',
        },
        nItemsStillNameThisAttribute_other: {
          en: '{{count}} items still name this attribute and keep the names they stored. This cannot be undone.',
          hi: '{{count}} आइटम अब भी इस विशेषता का नाम रखते हैं और वही नाम बनाए रखेंगे। इसे वापस नहीं लाया जा सकता।',
          gu: '{{count}} આઇટમ હજી આ લક્ષણનું નામ ધરાવે છે અને એ જ નામ રાખશે. આ પાછું લાવી શકાશે નહીં.',
        },
      },
    },
    inventory: {
      stock: {
        stock: { en: 'Stock', hi: 'स्टॉक', gu: 'સ્ટોક' },
        stockTrackedItemsAndTheirLevels: {
          en: 'Stock-tracked items and the levels they should be held at.',
          hi: 'स्टॉक-ट्रैक किए गए आइटम और उनके निर्धारित स्तर।',
          gu: 'સ્ટોક-ટ્રેક કરેલી આઇટમ અને તેમના નિર્ધારિત સ્તર.',
        },
        openItemMaster: { en: 'Open Item Master', hi: 'आइटम मास्टर खोलें', gu: 'આઇટમ માસ્ટર ખોલો' },
        tracked: { en: 'Tracked', hi: 'ट्रैक किए गए', gu: 'ટ્રેક કરેલ' },
        atReorderPoint: { en: 'At reorder point', hi: 'रीऑर्डर स्तर पर', gu: 'રીઓર્ડર સ્તરે' },
        nothingIsStockTracked: {
          en: 'Nothing is stock-tracked',
          hi: 'कुछ भी स्टॉक-ट्रैक नहीं है',
          gu: 'કંઈ સ્ટોક-ટ્રેક નથી',
        },
        turnOnStockTrackedOnAnItem: {
          en: 'Turn on Stock tracked on an item to see it here.',
          hi: 'किसी आइटम पर स्टॉक ट्रैक चालू करें ताकि वह यहाँ दिखे।',
          gu: 'આઇટમ પર સ્ટોક ટ્રેક ચાલુ કરો જેથી તે અહીં દેખાય.',
        },
      },
    },
    purchase: {
      generalPurchase: {
        generalPurchase: { en: 'General Purchase', hi: 'सामान्य खरीद', gu: 'સામાન્ય ખરીદી' },
        partsAndStockBoughtFromSuppliers: {
          en: 'Parts and stock bought from suppliers.',
          hi: 'आपूर्तिकर्ताओं से खरीदे गए पुर्जे और स्टॉक।',
          gu: 'સપ્લાયર પાસેથી ખરીદેલા પાર્ટ્સ અને સ્ટોક.',
        },
        recordPurchase: { en: 'Record purchase', hi: 'खरीद दर्ज करें', gu: 'ખરીદી નોંધો' },
        purchaseNo: { en: 'Purchase No.', hi: 'खरीद क्र.', gu: 'ખરીદી ક્ર.' },
        lines: { en: 'Lines', hi: 'पंक्तियाँ', gu: 'લાઇન' },
        totalSpend: { en: 'Total spend', hi: 'कुल खर्च', gu: 'કુલ ખર્ચ' },
        searchPurchases: { en: 'Search purchases…', hi: 'खरीद खोजें…', gu: 'ખરીદી શોધો…' },
        noPurchasesYet: { en: 'No purchases yet', hi: 'अभी कोई खरीद नहीं', gu: 'હજી કોઈ ખરીદી નથી' },
        recordWhatYouBuyFromSuppliers: {
          en: 'Record what you buy from suppliers to see it against Supplier Payables.',
          hi: 'आपूर्तिकर्ताओं से की गई खरीद दर्ज करें ताकि वह सप्लायर पेएबल्स में दिखे।',
          gu: 'સપ્લાયર પાસેથી કરેલી ખરીદી નોંધો જેથી તે સપ્લાયર પેયેબલ્સમાં દેખાય.',
        },
        supplierInvoiceNo: {
          en: 'Supplier invoice no.',
          hi: 'सप्लायर बिल क्र.',
          gu: 'સપ્લાયર બિલ ક્ર.',
        },
        addAnItem: { en: 'Add an item…', hi: 'आइटम जोड़ें…', gu: 'આઇટમ ઉમેરો…' },
        chooseASupplier: {
          en: 'Choose a supplier.',
          hi: 'एक आपूर्तिकर्ता चुनें।',
          gu: 'એક સપ્લાયર પસંદ કરો.',
        },
        addAtLeastOneLine: {
          en: 'Add at least one item.',
          hi: 'कम से कम एक आइटम जोड़ें।',
          gu: 'ઓછામાં ઓછી એક આઇટમ ઉમેરો.',
        },
        aCancelledPurchaseStopsCounting: {
          en: 'A cancelled purchase stops counting towards spend and supplier dues. The record is kept.',
          hi: 'रद्द की गई खरीद खर्च और सप्लायर बकाया में नहीं गिनी जाएगी। रिकॉर्ड बना रहेगा।',
          gu: 'રદ કરેલી ખરીદી ખર્ચ અને સપ્લાયર બાકીમાં ગણાશે નહીં. રેકોર્ડ રહેશે.',
        },
      },
    },
  },
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
