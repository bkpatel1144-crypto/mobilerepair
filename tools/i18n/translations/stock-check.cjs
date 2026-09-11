module.exports = {
  pages: {
    service: {
      jobCardDetailContent: {
        nInStock: {
          en: '{{count}} in stock',
          hi: '{{count}} स्टॉक में',
          gu: '{{count}} સ્ટોકમાં',
        },
        outOfStock: { en: 'Out of stock', hi: 'स्टॉक में नहीं', gu: 'સ્ટોકમાં નથી' },
        onlyNLeft: {
          en: 'Only {{count}} left',
          hi: 'सिर्फ़ {{count}} बचे',
          gu: 'ફક્ત {{count}} બાકી',
        },
        notEnoughStock: {
          en: 'Only {{onHand}} on hand, but you are fitting {{qty}} — {{short}} short.',
          hi: 'सिर्फ़ {{onHand}} उपलब्ध हैं, पर आप {{qty}} लगा रहे हैं — {{short}} कम।',
          gu: 'ફક્ત {{onHand}} ઉપલબ્ધ છે, પણ તમે {{qty}} લગાવી રહ્યા છો — {{short}} ઓછા.',
        },
        fitItAnyway: {
          en: 'Fit it anyway — recorded on the timeline as a stock override',
          hi: 'फिर भी लगाएँ — टाइमलाइन पर स्टॉक ओवरराइड के रूप में दर्ज होगा',
          gu: 'તેમ છતાં લગાવો — ટાઇમલાઇન પર સ્ટોક ઓવરરાઇડ તરીકે નોંધાશે',
        },
      },
    },
    dashboard: {
      dashboard: {
        nItemsBelowReorderPoint: {
          en: '{{count}} items at or below their reorder point',
          hi: '{{count}} वस्तुएँ पुनःक्रम स्तर पर या उससे नीचे',
          gu: '{{count}} વસ્તુઓ પુનઃઓર્ડર સ્તરે અથવા તેનાથી નીચે',
        },
        nItemsOutOfStock: {
          en: '{{count}} items out of stock',
          hi: '{{count}} वस्तुएँ स्टॉक में नहीं',
          gu: '{{count}} વસ્તુઓ સ્ટોકમાં નથી',
        },
      },
    },
  },
}
