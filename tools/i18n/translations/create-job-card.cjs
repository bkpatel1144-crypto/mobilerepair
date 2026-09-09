/**
 * The Create Job Card form's field labels.
 *
 * Every one of these was hardcoded English on the most-used screen in the app, so a shopkeeper
 * working in Gujarati saw Gujarati chrome around an English form. They were invisible to
 * `no-hardcoded-strings.test.ts` because each sits beside a sibling element — a required-field
 * asterisk or an "(Optional)" hint — which the old pattern could not match past.
 */
const g = (en, hi, gu) => ({ en, hi, gu })

module.exports = {
  pages: {
    service: {
      createJobCard: {
        labels: {
          customer: g('Customer', 'ग्राहक', 'ગ્રાહક'),
          alternativeMobile: g('Alternative Mobile', 'वैकल्पिक मोबाइल', 'વૈકલ્પિક મોબાઇલ'),
          deviceType: g('Device Type', 'डिवाइस टाइप', 'ડિવાઇસ પ્રકાર'),
          brand: g('Brand', 'ब्रांड', 'બ્રાન્ડ'),
          model: g('Model', 'मॉडल', 'મોડલ'),
          serialNo: g('Serial No', 'सीरियल नंबर', 'સીરિયલ નંબર'),
          devicePin: g('Device PIN / Pattern', 'डिवाइस पिन / पैटर्न', 'ડિવાઇસ પિન / પેટર્ન'),
          problems: g('Problems', 'ख़राबी', 'ખામી'),
          serviceItems: g('Service Items', 'सर्विस आइटम', 'સર્વિસ આઇટમ'),
          estimatedCost: g('Estimated Cost', 'अनुमानित लागत', 'અંદાજિત ખર્ચ'),
          advanceReceived: g('Advance Received', 'एडवांस मिला', 'એડવાન્સ મળ્યું'),
          itemsReceived: g('Items received', 'मिले आइटम', 'મળેલ આઇટમ'),
          itemsReturned: g('Items returned', 'लौटाए आइटम', 'પરત કરેલ આઇટમ'),
          receivedBy: g('Received By', 'किसने लिया', 'કોણે લીધું'),
          assignTo: g('Assign To', 'किसे सौंपें', 'કોને સોંપવું'),
          remark: g('Remark', 'टिप्पणी', 'ટિપ્પણી'),
        },
        draftSavedAt: g('Draft saved at', 'ड्राफ़्ट सेव हुआ', 'ડ્રાફ્ટ સેવ થયો'),
      },
    },
  },
  shared: {
    back: g('Back', 'वापस', 'પાછા'),
    clear: g('Clear', 'साफ़ करें', 'સાફ કરો'),
  },
}
