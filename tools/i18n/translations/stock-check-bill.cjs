module.exports = {
  pages: {
    sales: {
      editBill: {
        lineExceedsStock: {
          en: '{{name}}: only {{onHand}} available, {{short}} short.',
          hi: '{{name}}: केवल {{onHand}} उपलब्ध, {{short}} कम।',
          gu: '{{name}}: ફક્ત {{onHand}} ઉપલબ્ધ, {{short}} ઓછા.',
        },
        billItAnyway: {
          en: 'Bill it anyway — recorded on the timeline as a stock override',
          hi: 'फिर भी बिल करें — टाइमलाइन पर स्टॉक ओवरराइड के रूप में दर्ज होगा',
          gu: 'તેમ છતાં બિલ કરો — ટાઇમલાઇન પર સ્ટોક ઓવરરાઇડ તરીકે નોંધાશે',
        },
        notEnoughStockFor: {
          en: 'Not enough stock for {{items}}.',
          hi: '{{items}} के लिए पर्याप्त स्टॉक नहीं है।',
          gu: '{{items}} માટે પૂરતો સ્ટોક નથી.',
        },
      },
    },
  },
}
