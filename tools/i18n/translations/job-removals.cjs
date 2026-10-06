/** Remove a part, an image or a note — three things the job card could create and never undo. */
module.exports = {
  pages: {
    service: {
      jobCardDetailContent: {
        removePart: { en: 'Remove part', hi: 'पार्ट हटाएँ', gu: 'પાર્ટ દૂર કરો' },
        removePartConfirm: {
          en: 'Remove {{name}} from this job? ₹{{amount}} comes off the parts cost and the timeline records it.',
          hi: 'इस जॉब से {{name}} हटाएँ? पार्ट्स लागत से ₹{{amount}} घटेगा और टाइमलाइन में दर्ज होगा।',
          gu: 'આ જોબમાંથી {{name}} દૂર કરીએ? પાર્ટ્સ ખર્ચમાંથી ₹{{amount}} ઘટશે અને ટાઈમલાઈનમાં નોંધાશે.',
        },
        removeImage: { en: 'Remove image', hi: 'छवि हटाएँ', gu: 'છબી દૂર કરો' },
        removeImageConfirm: {
          en: 'Remove this image from the job card?',
          hi: 'इस जॉब कार्ड से यह छवि हटाएँ?',
          gu: 'આ જોબ કાર્ડમાંથી આ છબી દૂર કરીએ?',
        },
        removeNote: { en: 'Remove note', hi: 'नोट हटाएँ', gu: 'નોંધ દૂર કરો' },
        removeNoteConfirm: {
          en: 'Remove this note? The timeline keeps a record that it was removed.',
          hi: 'यह नोट हटाएँ? टाइमलाइन में इसके हटाए जाने का रिकॉर्ड रहेगा।',
          gu: 'આ નોંધ દૂર કરીએ? ટાઈમલાઈનમાં તે દૂર કર્યાનો રેકોર્ડ રહેશે.',
        },
      },
    },
  },
}
