/**
 * A shop whose Problems list is empty is stopped at the only mandatory field on Create Job Card
 * with nothing to choose. This is the way out, offered where they hit it.
 */
module.exports = {
  pages: {
    service: {
      createJobCard: {
        noProblemsYet: {
          en: 'No problems set up yet — this field is required.',
          hi: 'अभी तक कोई समस्या सेट नहीं है — यह फ़ील्ड आवश्यक है।',
          gu: 'હજુ સુધી કોઈ સમસ્યા સેટ કરી નથી — આ ફીલ્ડ જરૂરી છે.',
        },
        loadStandardProblems: {
          en: 'Load the standard list',
          hi: 'मानक सूची लोड करें',
          gu: 'પ્રમાણભૂત યાદી લોડ કરો',
        },
        loadedNProblems: {
          en: 'Loaded {{count}} problems. Pick the ones that apply.',
          hi: '{{count}} समस्याएँ लोड हुईं। लागू होने वाली चुनें।',
          gu: '{{count}} સમસ્યાઓ લોડ થઈ. લાગુ પડતી પસંદ કરો.',
        },
      },
    },
  },
}
