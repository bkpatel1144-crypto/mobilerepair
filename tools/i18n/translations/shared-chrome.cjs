module.exports = {
  shared: {
    // One key for the whole sentence, not "Showing" + "of" glued around numbers: the word order
    // differs in Hindi and Gujarati, and a fragment on its own is untranslatable.
    showingRange: {
      en: 'Showing {{from}}–{{to}} of {{total}}',
      hi: '{{total}} में से {{from}}–{{to}} दिखा रहे हैं',
      gu: '{{total}} માંથી {{from}}–{{to}} બતાવી રહ્યા છીએ',
    },
    pageOf: {
      en: 'Page {{page}} of {{total}}',
      hi: 'पृष्ठ {{page}} / {{total}}',
      gu: 'પૃષ્ઠ {{page}} / {{total}}',
    },
    prev: { en: 'Prev', hi: 'पिछला', gu: 'પાછળ' },
    next: { en: 'Next', hi: 'अगला', gu: 'આગળ' },
    fullName: { en: 'Full Name', hi: 'पूरा नाम', gu: 'પૂરું નામ' },
    currentPassword: { en: 'Current Password', hi: 'वर्तमान पासवर्ड', gu: 'વર્તમાન પાસવર્ડ' },
    newPassword: { en: 'New Password', hi: 'नया पासवर्ड', gu: 'નવો પાસવર્ડ' },
    confirmNewPassword: {
      en: 'Confirm New Password',
      hi: 'नया पासवर्ड दोहराएँ',
      gu: 'નવો પાસવર્ડ ફરી લખો',
    },
    myProfile: { en: 'My Profile', hi: 'मेरी प्रोफ़ाइल', gu: 'મારી પ્રોફાઇલ' },
    logout: { en: 'Logout', hi: 'लॉग आउट', gu: 'લૉગ આઉટ' },
    draw: { en: 'Draw', hi: 'बनाएँ', gu: 'દોરો' },
    dotsConnected: {
      en: 'Pattern: {{count}} dots connected',
      hi: 'पैटर्न: {{count}} बिंदु जुड़े',
      gu: 'પેટર્ન: {{count}} બિંદુ જોડાયા',
    },
    stepOf: {
      en: 'Step {{step}} of {{total}}',
      hi: 'चरण {{step}} / {{total}}',
      gu: 'પગલું {{step}} / {{total}}',
    },
  },
}
