/** Copy for Edit Bill — the only route to changing a job that has already been billed. */
module.exports = {
  pages: {
    sales: {
      editBill: {
        editBill: { en: 'Edit Bill', hi: 'बिल संपादित करें', gu: 'બિલ સંપાદિત કરો' },
        saveChanges: { en: 'Save Changes', hi: 'बदलाव सहेजें', gu: 'ફેરફારો સાચવો' },
        parts_one: { en: 'Parts ({{count}})', hi: 'पुर्जे ({{count}})', gu: 'પાર્ટ્સ ({{count}})' },
        parts_other: { en: 'Parts ({{count}})', hi: 'पुर्जे ({{count}})', gu: 'પાર્ટ્સ ({{count}})' },
        supplier: { en: 'Supplier:', hi: 'सप्लायर:', gu: 'સપ્લાયર:' },
        searchSupplier: { en: 'Search supplier…', hi: 'सप्लायर खोजें…', gu: 'સપ્લાયર શોધો…' },
        warranty: { en: 'Warranty', hi: 'वारंटी', gu: 'વોરંટી' },
        value: { en: 'Value', hi: 'मान', gu: 'મૂલ્ય' },
        units: {
          days: { en: 'Days', hi: 'दिन', gu: 'દિવસ' },
          months: { en: 'Months', hi: 'महीने', gu: 'મહિના' },
          years: { en: 'Years', hi: 'साल', gu: 'વર્ષ' },
        },
        addPartsServices: {
          en: 'Add Parts / Services',
          hi: 'पुर्जे / सेवाएँ जोड़ें',
          gu: 'પાર્ટ્સ / સેવાઓ ઉમેરો',
        },
        searchOrTypePartName: {
          en: 'Search or type part name…',
          hi: 'पुर्जे का नाम खोजें या लिखें…',
          gu: 'પાર્ટનું નામ શોધો અથવા લખો…',
        },
        serviceCharge: { en: 'Service Charge ₹', hi: 'सेवा शुल्क ₹', gu: 'સેવા શુલ્ક ₹' },
        discount: { en: 'Discount ₹', hi: 'छूट ₹', gu: 'ડિસ્કાઉન્ટ ₹' },
        partsServices: { en: 'Parts / Services', hi: 'पुर्जे / सेवाएँ', gu: 'પાર્ટ્સ / સેવાઓ' },
        alreadyPaid: { en: 'Already Paid', hi: 'पहले भुगतान', gu: 'પહેલાં ચૂકવેલ' },
        balanceDue: { en: 'Balance Due', hi: 'शेष देय', gu: 'બાકી રકમ' },
        refundDue: { en: 'Refund Due', hi: 'वापसी देय', gu: 'રિફંડ બાકી' },
        thisWillRecordARefund: {
          en: 'Saving records a ₹{{amount}} refund to the customer, because the bill is now below what they have already paid.',
          hi: 'सहेजने पर ग्राहक को ₹{{amount}} की वापसी दर्ज होगी, क्योंकि बिल अब उनके भुगतान से कम है।',
          gu: 'સાચવવાથી ગ્રાહકને ₹{{amount}} રિફંડ નોંધાશે, કારણ કે બિલ હવે તેમણે ચૂકવેલી રકમથી ઓછું છે.',
        },
        aBillNeedsAtLeastOneLine: {
          en: 'A bill needs at least one part or a service charge.',
          hi: 'बिल में कम से कम एक पुर्जा या सेवा शुल्क होना चाहिए।',
          gu: 'બિલમાં ઓછામાં ઓછો એક પાર્ટ કે સેવા શુલ્ક હોવો જોઈએ.',
        },
        couldNotSaveTheBill: {
          en: 'Could not save the bill. Please try again.',
          hi: 'बिल सहेजा नहीं जा सका। कृपया फिर कोशिश करें।',
          gu: 'બિલ સાચવી શકાયું નહીં. કૃપા કરી ફરી પ્રયાસ કરો.',
        },
      },
    },
  },
}
