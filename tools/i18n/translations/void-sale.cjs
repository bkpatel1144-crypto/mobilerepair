/** A device sale could be recorded and never reversed, which left the handset marked sold. */
module.exports = {
  pages: {
    secondHandDevice: {
      saleRegister: {
        voidSale: { en: 'Void sale', hi: 'बिक्री रद्द करें', gu: 'વેચાણ રદ કરો' },
        voidSaleTitle: { en: 'Void {{number}}?', hi: '{{number}} रद्द करें?', gu: '{{number}} રદ કરીએ?' },
        voidSaleMessage: {
          en: 'The sale stays in the register marked Voided and stops counting towards sales and profit. {{device}} goes back into Device Stock and can be sold again.',
          hi: 'बिक्री रजिस्टर में "रद्द" के रूप में रहेगी और बिक्री व लाभ में नहीं गिनी जाएगी। {{device}} वापस डिवाइस स्टॉक में आ जाएगा और फिर से बेचा जा सकेगा।',
          gu: 'વેચાણ રજિસ્ટરમાં "રદ" તરીકે રહેશે અને વેચાણ તથા નફામાં ગણાશે નહીં. {{device}} પાછું ડિવાઇસ સ્ટોકમાં આવશે અને ફરી વેચી શકાશે.',
        },
        voidReason: { en: 'Reason', hi: 'कारण', gu: 'કારણ' },
        voided: { en: 'Voided', hi: 'रद्द', gu: 'રદ' },
      },
    },
  },
}
