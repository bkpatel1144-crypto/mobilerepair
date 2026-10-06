/** Generate Bill was one-way: a bill for the wrong amount could not be cancelled. */
module.exports = {
  pages: {
    sales: {
      salesInvoices: {
        cancelBill: { en: 'Cancel bill', hi: 'बिल रद्द करें', gu: 'બિલ રદ કરો' },
        cancelBillTitle: {
          en: 'Cancel {{number}}?',
          hi: '{{number}} रद्द करें?',
          gu: '{{number}} રદ કરીએ?',
        },
        cancelBillMessage: {
          en: 'The job goes back to Tech Done so a new bill can be raised. {{number}} is kept on this list marked Cancelled and is never issued again — the next bill gets a fresh number. Payments already received are not touched.',
          hi: 'जॉब वापस Tech Done पर जाएगा ताकि नया बिल बन सके। {{number}} इस सूची में "रद्द" के रूप में रहेगा और दोबारा जारी नहीं होगा — अगले बिल को नया नंबर मिलेगा। पहले मिले भुगतान अछूते रहेंगे।',
          gu: 'જોબ પાછી Tech Done પર જશે જેથી નવું બિલ બનાવી શકાય. {{number}} આ યાદીમાં "રદ" તરીકે રહેશે અને ફરી ઇશ્યૂ થશે નહીં — આગલા બિલને નવો નંબર મળશે. અગાઉ મળેલી ચુકવણી યથાવત રહેશે.',
        },
        cancelReason: { en: 'Why is this bill being cancelled?', hi: 'यह बिल क्यों रद्द किया जा रहा है?', gu: 'આ બિલ કેમ રદ થઈ રહ્યું છે?' },
        cancelled: { en: 'Cancelled', hi: 'रद्द', gu: 'રદ' },
        onlyBeforeHandover: {
          en: 'A bill can only be cancelled before the device is handed over.',
          hi: 'बिल केवल डिवाइस सौंपने से पहले ही रद्द किया जा सकता है।',
          gu: 'બિલ ફક્ત ઉપકરણ સોંપતા પહેલાં જ રદ કરી શકાય છે.',
        },
      },
    },
  },
}
