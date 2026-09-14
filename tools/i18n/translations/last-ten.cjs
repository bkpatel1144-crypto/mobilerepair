module.exports = {
  components: {
    auth: {
      ipBlockedScreen: {
        roleRequiresWhitelistedIp: {
          en: "Your account's role requires signing in from a whitelisted IP address.",
          hi: 'आपके खाते की भूमिका के लिए व्हाइटलिस्टेड IP पते से साइन इन करना आवश्यक है।',
          gu: 'તમારા ખાતાની ભૂમિકા માટે વ્હાઇટલિસ્ટ કરેલા IP સરનામાંથી સાઇન ઇન કરવું જરૂરી છે.',
        },
        currentIpNotOnList: {
          en: " Your current IP ({{ip}}) isn't on the list.",
          hi: ' आपका वर्तमान IP ({{ip}}) सूची में नहीं है।',
          gu: ' તમારું વર્તમાન IP ({{ip}}) યાદીમાં નથી.',
        },
      },
    },
  },
  pages: {
    service: {
      jobCosting: {
        deviceLabel: { en: 'Device: {{device}}', hi: 'डिवाइस: {{device}}', gu: 'ડિવાઇસ: {{device}}' },
      },
    },
    settings: {
      whatsapp: {
        availablePlaceholders: {
          en: 'Available placeholders: {{list}}',
          hi: 'उपलब्ध प्लेसहोल्डर: {{list}}',
          gu: 'ઉપલબ્ધ પ્લેસહોલ્ડર: {{list}}',
        },
      },
      printFormats: {
        defaultNamed: { en: 'Default: {{name}}', hi: 'डिफ़ॉल्ट: {{name}}', gu: 'ડિફોલ્ટ: {{name}}' },
      },
      workflowDesigner: {
        allChangesSavedEditing: {
          en: 'All changes saved · Editing "{{role}}"',
          hi: 'सभी बदलाव सहेजे गए · "{{role}}" संपादित कर रहे हैं',
          gu: 'બધા ફેરફારો સાચવ્યા · "{{role}}" સંપાદિત કરી રહ્યા છો',
        },
      },
    },
  },
}
