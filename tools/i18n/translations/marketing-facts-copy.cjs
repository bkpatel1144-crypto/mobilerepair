/** The numbers the home page leads with, and the brand marquee's label. */
const g = (en, hi, gu) => ({ en, hi, gu })

module.exports = {
  marketing: {
    home: {
      stats: {
        brands: g(
          'Device brands ready on day one',
          'पहले दिन से तैयार डिवाइस ब्रांड',
          'પહેલા દિવસથી તૈયાર ડિવાઇસ બ્રાન્ડ'
        ),
        models: g(
          'Handset models already in the list',
          'सूची में पहले से मौजूद हैंडसेट मॉडल',
          'યાદીમાં પહેલેથી હાજર હેન્ડસેટ મોડલ'
        ),
        screens: g(
          'Screens across the whole system',
          'पूरे सिस्टम में स्क्रीन',
          'સંપૂર્ણ સિસ્ટમમાં સ્ક્રીન'
        ),
        languages: g(
          'Languages, everywhere in the app',
          'भाषाएँ, ऐप में हर जगह',
          'ભાષાઓ, એપમાં દરેક જગ્યાએ'
        ),
      },
      brands: {
        eyebrow: g(
          'Every new shop starts with {{count}} handset models already loaded',
          'हर नई दुकान {{count}} हैंडसेट मॉडल पहले से लोड होकर शुरू होती है',
          'દરેક નવી દુકાન {{count}} હેન્ડસેટ મોડલ પહેલેથી લોડ થઈને શરૂ થાય છે'
        ),
      },
      language: {
        stringCount: g(
          'Over {{count}} strings translated into each language — not just the menus.',
          'हर भाषा में {{count}} से ज़्यादा स्ट्रिंग अनुवादित — सिर्फ़ मेन्यू नहीं।',
          'દરેક ભાષામાં {{count}} થી વધુ સ્ટ્રિંગ અનુવાદિત — ફક્ત મેનુ નહીં.'
        ),
      },
    },
  },
}
