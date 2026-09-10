/** Buy Mobile's one twenty-field "Device Details" card, split into the small titled sections
 *  Create Job Card uses. */
module.exports = {
  pages: {
    secondHandDevice: {
      createPurchase: {
        sections: {
          deviceInformation: {
            en: 'Device Information',
            hi: 'डिवाइस जानकारी',
            gu: 'ડિવાઇસ માહિતી',
          },
          specifications: { en: 'Specifications', hi: 'विशेषताएँ', gu: 'સ્પેસિફિકેશન' },
          conditionAccessories: {
            en: 'Condition & Accessories',
            hi: 'हालत और सहायक सामान',
            gu: 'સ્થિતિ અને એસેસરીઝ',
          },
          devicePhotos: { en: 'Device Photos', hi: 'डिवाइस फोटो', gu: 'ડિવાઇસ ફોટા' },
        },
      },
    },
  },
}
