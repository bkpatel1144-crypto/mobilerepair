/**
 * Widget Library chrome: the five group headings and the copy around them.
 *
 * The 34 widget labels and descriptions are not here — they resolve through
 * `useWidgetLabels()`'s `defaultValue`, i.e. the English in `dashboard-widgets.ts`, until that
 * batch is written. Adding it is a locale-file change only.
 */
module.exports = {
  widgets: {
    groups: {
      personal: { en: 'Personal', hi: 'व्यक्तिगत', gu: 'વ્યક્તિગત' },
      quick: { en: 'Quick Actions', hi: 'त्वरित कार्य', gu: 'ઝડપી ક્રિયાઓ' },
      kpi: { en: 'KPI Cards', hi: 'KPI कार्ड', gu: 'KPI કાર્ડ' },
      chart: { en: 'Charts & Graphs', hi: 'चार्ट और ग्राफ़', gu: 'ચાર્ટ અને ગ્રાફ' },
      list: { en: 'Lists', hi: 'सूचियाँ', gu: 'યાદીઓ' },
    },
  },
  pages: {
    administration: {
      dashboardLandingTab: {
        addedCount: { en: '{{added}} / {{total}} added', hi: '{{added}} / {{total}} जोड़े गए', gu: '{{added}} / {{total}} ઉમેરાયા' },
        activeCount: {
          en: '{{count}} active',
          hi: '{{count}} सक्रिय',
          gu: '{{count}} સક્રિય',
        },
        widgetsShownOnThisRoleSDashboard: {
          en: 'Widgets shown on this role’s dashboard.',
          hi: 'इस भूमिका के डैशबोर्ड पर दिखने वाले विजेट।',
          gu: 'આ ભૂમિકાના ડેશબોર્ડ પર દેખાતા વિજેટ.',
        },
        notBuiltYet: { en: 'Not built yet', hi: 'अभी नहीं बना', gu: 'હજી બન્યું નથી' },
        thisWidgetIsInTheReference: {
          en: 'Listed for parity with the reference app, but this build does not render it yet — so it cannot be switched on.',
          hi: 'संदर्भ ऐप से मेल के लिए सूचीबद्ध है, पर यह बिल्ड इसे अभी नहीं दिखाता — इसलिए इसे चालू नहीं किया जा सकता।',
          gu: 'સંદર્ભ એપ સાથે મેળ માટે યાદીમાં છે, પણ આ બિલ્ડ તેને હજી બતાવતું નથી — તેથી તે ચાલુ કરી શકાતું નથી.',
        },
      },
    },
  },
}
