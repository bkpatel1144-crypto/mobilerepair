/** GST lines on the bill, shown only when the shop is registered as Regular. */
module.exports = {
  pages: {
    sales: {
      editBill: {
        taxableValue: { en: 'Taxable value', hi: 'कर योग्य मूल्य', gu: 'કરપાત્ર મૂલ્ય' },
        cgstSgst: {
          en: 'CGST {{rate}}% + SGST {{rate}}%',
          hi: 'CGST {{rate}}% + SGST {{rate}}%',
          gu: 'CGST {{rate}}% + SGST {{rate}}%',
        },
      },
    },
    settings: {
      company: {
        pricesIncludeGst: {
          en: 'Prices include GST',
          hi: 'कीमतों में GST शामिल है',
          gu: 'કિંમતોમાં GST સામેલ છે',
        },
        pricesIncludeGstHelp: {
          en: 'On: "₹500 to fix it" means ₹500 from the customer, tax taken out of it. Off: tax is added on top.',
          hi: 'चालू: "₹500 में ठीक" यानी ग्राहक से ₹500, उसी में से कर। बंद: कर ऊपर से जुड़ेगा।',
          gu: 'ચાલુ: "₹500માં રિપેર" એટલે ગ્રાહક પાસેથી ₹500, તેમાંથી જ કર. બંધ: કર ઉપરથી ઉમેરાશે.',
        },
        gstRate: { en: 'GST rate %', hi: 'GST दर %', gu: 'GST દર %' },
        onlyWhenRegular: {
          en: 'Only used when GST registration is Regular. A Composition dealer cannot charge GST, and an Unregistered shop bills without it.',
          hi: 'केवल "Regular" पंजीकरण पर लागू। Composition डीलर GST नहीं ले सकता, और अपंजीकृत दुकान बिना GST बिल बनाती है।',
          gu: 'ફક્ત "Regular" નોંધણી પર લાગુ. Composition ડીલર GST લઈ શકતો નથી, અને નોંધણી વગરની દુકાન GST વગર બિલ બનાવે છે.',
        },
      },
    },
  },
}
