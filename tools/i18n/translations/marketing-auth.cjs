/** The auth screens' brand panel. */
const g = (en, hi, gu) => ({ en, hi, gu })

module.exports = {
  marketing: {
    auth: {
      panelTitle: g(
        'Run your whole repair shop from one screen',
        'अपनी पूरी रिपेयर शॉप एक ही स्क्रीन से चलाइए',
        'તમારી આખી રિપેર શોપ એક જ સ્ક્રીનથી ચલાવો'
      ),
      backToSite: g('Back to the website', 'वेबसाइट पर वापस', 'વેબસાઇટ પર પાછા'),
      panelPoints: {
        free: g(
          'Free forever, with every feature included',
          'हमेशा मुफ़्त, हर फ़ीचर के साथ',
          'કાયમ મફત, દરેક ફીચર સાથે'
        ),
        languages: g(
          'English, Hindi and Gujarati throughout',
          'पूरे सिस्टम में अंग्रेज़ी, हिन्दी और गुजराती',
          'સંપૂર્ણ સિસ્ટમમાં અંગ્રેજી, હિન્દી અને ગુજરાતી'
        ),
        noCard: g(
          'No card, no trial period, no expiry',
          'कोई कार्ड नहीं, कोई ट्रायल नहीं, कोई एक्सपायरी नहीं',
          'કોઈ કાર્ડ નહીં, કોઈ ટ્રાયલ નહીં, કોઈ એક્સપાયરી નહીં'
        ),
        migration: g(
          'We help move your existing data across',
          'आपका पुराना डेटा लाने में हम मदद करते हैं',
          'તમારો જૂનો ડેટા લાવવામાં અમે મદદ કરીએ છીએ'
        ),
      },
    },
  },
}
