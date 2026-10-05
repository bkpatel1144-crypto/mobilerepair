/**
 * User Management could create and disable a user but never change one — not their name, not
 * their mobile, and not their role. Active Sessions could show every signed-in device and end
 * none of them.
 */
module.exports = {
  pages: {
    administration: {
      userManagement: {
        disableUser: { en: 'Disable User', hi: 'उपयोगकर्ता अक्षम करें', gu: 'વપરાશકર્તા નિષ્ક્રિય કરો' },
        editUser: { en: 'Edit User', hi: 'उपयोगकर्ता संपादित करें', gu: 'વપરાશકર્તા સંપાદિત કરો' },
        emailCannotChange: {
          en: 'Email is the sign-in address and cannot be changed here.',
          hi: 'ईमेल साइन-इन पता है और इसे यहाँ बदला नहीं जा सकता।',
          gu: 'ઈમેલ એ સાઇન-ઇન સરનામું છે અને તેને અહીં બદલી શકાતું નથી.',
        },
      },
      activeSessions: {
        revokeSession: { en: 'Sign out this device', hi: 'इस डिवाइस को साइन आउट करें', gu: 'આ ઉપકરણને સાઇન આઉટ કરો' },
        revokeConfirm: {
          en: 'Sign out {{user}} on {{device}}? They drop off within a minute. This ends the session, not the password — disable the user if you need that.',
          hi: '{{device}} पर {{user}} को साइन आउट करें? वे एक मिनट में हट जाएंगे। यह सत्र समाप्त करता है, पासवर्ड नहीं — उसके लिए उपयोगकर्ता को अक्षम करें।',
          gu: '{{device}} પર {{user}} ને સાઇન આઉટ કરીએ? તેઓ એક મિનિટમાં નીકળી જશે. આ સત્ર સમાપ્ત કરે છે, પાસવર્ડ નહીં — તે માટે વપરાશકર્તાને નિષ્ક્રિય કરો.',
        },
      },
    },
  },
}
