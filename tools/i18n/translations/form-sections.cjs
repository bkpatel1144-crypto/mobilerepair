/**
 * Copy for the shared device PIN field and the section headings the Create Job Card form gains
 * when it is rebuilt in the Buy Mobile layout.
 */
module.exports = {
  components: {
    shared: {
      devicePinField: {
        eG1234OrTapDraw: {
          en: 'e.g. 1234 or tap Draw',
          hi: 'जैसे 1234 या Draw दबाएँ',
          gu: 'જેમ કે 1234 અથવા Draw દબાવો',
        },
      },
    },
  },
  pages: {
    service: {
      createJobCard: {
        sections: {
          customerInformation: {
            en: 'Customer Information',
            hi: 'ग्राहक जानकारी',
            gu: 'ગ્રાહક માહિતી',
          },
          deviceInformation: {
            en: 'Device Information',
            hi: 'डिवाइस जानकारी',
            gu: 'ડિવાઇસ માહિતી',
          },
          repairInformation: {
            en: 'Repair Information',
            hi: 'मरम्मत जानकारी',
            gu: 'રિપેર માહિતી',
          },
          financial: { en: 'Financial', hi: 'वित्तीय', gu: 'નાણાકીય' },
          accessories: { en: 'Accessories', hi: 'सहायक सामान', gu: 'એક્સેસરીઝ' },
          internalDetails: { en: 'Internal Details', hi: 'आंतरिक विवरण', gu: 'આંતરિક વિગતો' },
          images: { en: 'Images', hi: 'तस्वीरें', gu: 'છબીઓ' },
        },
      },
    },
    secondHandDevice: {
      createPurchase: {
        sections: {
          deviceDetails: { en: 'Device Details', hi: 'डिवाइस विवरण', gu: 'ડિવાઇસ વિગતો' },
          sellerVerification: {
            en: 'Seller & ID Verification',
            hi: 'विक्रेता और आईडी सत्यापन',
            gu: 'વિક્રેતા અને ઓળખ ચકાસણી',
          },
          purchaseDetails: { en: 'Purchase Details', hi: 'खरीद विवरण', gu: 'ખરીદી વિગતો' },
        },
      },
    },
  },
}
