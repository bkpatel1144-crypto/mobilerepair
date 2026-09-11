module.exports = {
  pages: {
    service: {
      warranty: {
        warrantyLookup: { en: 'Warranty Lookup', hi: 'वारंटी जाँच', gu: 'વોરંટી તપાસ' },
        searchByAnything: {
          en: 'Search by phone number, IMEI, job card number or customer name.',
          hi: 'फ़ोन नंबर, IMEI, जॉब कार्ड नंबर या ग्राहक के नाम से खोजें।',
          gu: 'ફોન નંબર, IMEI, જોબ કાર્ડ નંબર અથવા ગ્રાહકના નામથી શોધો.',
        },
        searchPlaceholder: {
          en: 'Phone number, IMEI, job card number…',
          hi: 'फ़ोन नंबर, IMEI, जॉब कार्ड नंबर…',
          gu: 'ફોન નંબર, IMEI, જોબ કાર્ડ નંબર…',
        },
        backToJobCards: { en: 'Job Cards', hi: 'जॉब कार्ड', gu: 'જોબ કાર્ડ' },
        typeSomethingToSearch: {
          en: 'Type a phone number or IMEI to check what is still covered.',
          hi: 'क्या अभी भी कवर है यह देखने के लिए फ़ोन नंबर या IMEI लिखें।',
          gu: 'શું હજી કવર છે તે જોવા માટે ફોન નંબર અથવા IMEI લખો.',
        },
        nothingMatched: {
          en: 'Nothing matched "{{query}}".',
          hi: '"{{query}}" से कुछ नहीं मिला।',
          gu: '"{{query}}" સાથે કંઈ મળ્યું નહીં.',
        },
        couldNotLoadJobCards: {
          en: 'Could not load job cards.',
          hi: 'जॉब कार्ड लोड नहीं हो सके।',
          gu: 'જોબ કાર્ડ લોડ થઈ શક્યા નથી.',
        },
        wholeBill: { en: 'Whole bill', hi: 'पूरा बिल', gu: 'આખું બિલ' },
        noWarrantyRecorded: {
          en: 'No warranty was recorded on this job.',
          hi: 'इस जॉब पर कोई वारंटी दर्ज नहीं है।',
          gu: 'આ જોબ પર કોઈ વોરંટી નોંધાયેલી નથી.',
        },
        openJob: { en: 'Open', hi: 'खोलें', gu: 'ખોલો' },
        until: { en: 'until {{date}}', hi: '{{date}} तक', gu: '{{date}} સુધી' },
        nDaysLeft: {
          en: '{{count}} days left',
          hi: '{{count}} दिन बाकी',
          gu: '{{count}} દિવસ બાકી',
        },
        state: {
          live: { en: 'Under warranty', hi: 'वारंटी में', gu: 'વોરંટીમાં' },
          expired: { en: 'Expired', hi: 'समाप्त', gu: 'સમાપ્ત' },
          unknown: { en: 'Not started', hi: 'शुरू नहीं हुई', gu: 'શરૂ થઈ નથી' },
          none: { en: 'No warranty', hi: 'कोई वारंटी नहीं', gu: 'વોરંટી નથી' },
        },
      },
      rework: {
        reopenForRework: { en: 'Reopen for Rework', hi: 'रीवर्क के लिए खोलें', gu: 'રીવર્ક માટે ખોલો' },
        deviceCameBack: {
          en: 'The device came back. This raises a new job card linked to this one — the original keeps its bill, its dates and its warranty.',
          hi: 'डिवाइस वापस आया है। इससे इस कार्ड से जुड़ा नया जॉब कार्ड बनेगा — मूल कार्ड का बिल, तारीख़ें और वारंटी वैसी ही रहेंगी।',
          gu: 'ડિવાઇસ પાછું આવ્યું છે. આનાથી આ કાર્ડ સાથે જોડાયેલું નવું જોબ કાર્ડ બનશે — મૂળ કાર્ડનું બિલ, તારીખો અને વોરંટી એમ જ રહેશે.',
        },
        whyDidItComeBack: {
          en: 'Why did it come back?',
          hi: 'यह वापस क्यों आया?',
          gu: 'તે કેમ પાછું આવ્યું?',
        },
        reasonPlaceholder: {
          en: 'e.g. Screen flickering again after 10 days',
          hi: 'जैसे 10 दिन बाद स्क्रीन फिर से झपक रही है',
          gu: 'દા.ત. 10 દિવસ પછી સ્ક્રીન ફરી ઝબકે છે',
        },
        underWarrantyNoCharge: {
          en: 'Under warranty — no charge',
          hi: 'वारंटी में — कोई शुल्क नहीं',
          gu: 'વોરંટીમાં — કોઈ ચાર્જ નહીં',
        },
        warrantyStillLive: {
          en: 'This job is still under warranty. Untick if the fault is not covered — physical damage, for instance.',
          hi: 'यह जॉब अभी वारंटी में है। यदि ख़राबी कवर नहीं है — जैसे भौतिक क्षति — तो अनटिक करें।',
          gu: 'આ જોબ હજી વોરંટીમાં છે. જો ખામી કવર ન થતી હોય — જેમ કે ભૌતિક નુકસાન — તો અનટિક કરો.',
        },
        warrantyExpired: {
          en: 'The warranty on this job has run out, so this rework is chargeable by default.',
          hi: 'इस जॉब की वारंटी समाप्त हो चुकी है, इसलिए यह रीवर्क डिफ़ॉल्ट रूप से शुल्क योग्य है।',
          gu: 'આ જોબની વોરંટી પૂરી થઈ ગઈ છે, તેથી આ રીવર્ક ડિફોલ્ટ રૂપે ચાર્જપાત્ર છે.',
        },
        aReasonIsRequired: {
          en: 'Say why the device came back.',
          hi: 'बताएं कि डिवाइस क्यों वापस आया।',
          gu: 'જણાવો કે ડિવાઇસ કેમ પાછું આવ્યું.',
        },
        couldNotRaiseRework: {
          en: 'Could not raise the rework.',
          hi: 'रीवर्क नहीं बनाया जा सका।',
          gu: 'રીવર્ક બનાવી શકાયું નથી.',
        },
        reworkOf: { en: 'Rework of {{job}}', hi: '{{job}} का रीवर्क', gu: '{{job}} નું રીવર્ક' },
        cameBackAs: {
          en: 'Came back as {{job}}',
          hi: '{{job}} के रूप में वापस आया',
          gu: '{{job}} તરીકે પાછું આવ્યું',
        },
        warrantyJob: { en: 'Warranty job', hi: 'वारंटी जॉब', gu: 'વોરંટી જોબ' },
        previousRepairs: {
          en: 'Previous repairs on this device',
          hi: 'इस डिवाइस की पिछली मरम्मत',
          gu: 'આ ડિવાઇસનું અગાઉનું રિપેર',
        },
      },
    },
  },
}
