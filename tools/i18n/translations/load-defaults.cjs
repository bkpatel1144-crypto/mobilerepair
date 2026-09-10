/** Copy for the "Load default catalogue" action, which applies the signup seed to a company
 *  that already exists. */
module.exports = {
  components: {
    shared: {
      loadDefaults: {
        loadDefaultCatalogue: {
          en: 'Load default catalogue',
          hi: 'डिफ़ॉल्ट कैटलॉग लोड करें',
          gu: 'ડિફોલ્ટ કેટલોગ લોડ કરો',
        },
        thisAddsTheStandardCatalogue: {
          en: 'This adds the standard catalogue to your company. Anything you added or edited yourself is left alone.',
          hi: 'यह आपकी कंपनी में मानक कैटलॉग जोड़ता है। आपने जो खुद जोड़ा या बदला है, वह वैसा ही रहेगा।',
          gu: 'આ તમારી કંપનીમાં પ્રમાણભૂત કેટલોગ ઉમેરે છે. તમે જાતે ઉમેરેલું કે બદલેલું બધું એમ જ રહેશે.',
        },
        load: { en: 'Load', hi: 'लोड करें', gu: 'લોડ કરો' },
        nItems_one: { en: '{{count}} item', hi: '{{count}} आइटम', gu: '{{count}} આઇટમ' },
        nItems_other: { en: '{{count}} items', hi: '{{count}} आइटम', gu: '{{count}} આઇટમ' },
        nCategories_one: {
          en: '{{count}} category',
          hi: '{{count}} श्रेणी',
          gu: '{{count}} શ્રેણી',
        },
        nCategories_other: {
          en: '{{count}} categories',
          hi: '{{count}} श्रेणियाँ',
          gu: '{{count}} શ્રેણીઓ',
        },
        nCorrected_one: {
          en: '{{count}} corrected',
          hi: '{{count}} सुधारी गई',
          gu: '{{count}} સુધારેલ',
        },
        nCorrected_other: {
          en: '{{count}} corrected',
          hi: '{{count}} सुधारी गईं',
          gu: '{{count}} સુધારેલ',
        },
        couldNotLoadTheCatalogue: {
          en: 'Could not load the catalogue.',
          hi: 'कैटलॉग लोड नहीं हो सका।',
          gu: 'કેટલોગ લોડ થઈ શક્યું નથી.',
        },
        yourItemMasterIsEmpty: {
          en: 'Your Item Master is empty. Load the standard services and spare-part categories to start from.',
          hi: 'आपका आइटम मास्टर खाली है। शुरू करने के लिए मानक सेवाएँ और स्पेयर-पार्ट श्रेणियाँ लोड करें।',
          gu: 'તમારું આઇટમ માસ્ટર ખાલી છે. શરૂ કરવા માટે પ્રમાણભૂત સેવાઓ અને સ્પેર-પાર્ટ શ્રેણીઓ લોડ કરો.',
        },
      },
    },
  },
}
