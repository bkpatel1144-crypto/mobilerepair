/**
 * Keys for the three dashboard widgets the reference lists that this app had never built —
 * Job Cards Trend, Jobs by Technician, Recent Job Cards — plus the copy the newly gated
 * Dashboard needs when a role has every widget switched off.
 *
 * `shared.unassigned` and `common.allTime` already exist and are reused rather than duplicated.
 */
module.exports = {
  common: {
    others: { en: 'Others', hi: 'अन्य', gu: 'અન્ય' },
  },
  pages: {
    dashboard: {
      dashboard: {
        periodJobCards: {
          en: 'Period Job Cards',
          hi: 'अवधि के जॉब कार्ड',
          gu: 'સમયગાળાના જોબ કાર્ડ',
        },
        jobCardsTrend: { en: 'Job Cards Trend', hi: 'जॉब कार्ड ट्रेंड', gu: 'જોબ કાર્ડ ટ્રેન્ડ' },
        jobsByTechnician: {
          en: 'Jobs by Technician',
          hi: 'तकनीशियन अनुसार जॉब',
          gu: 'ટેકનિશિયન પ્રમાણે જોબ',
        },
        recentJobCards: { en: 'Recent Job Cards', hi: 'हाल के जॉब कार्ड', gu: 'તાજેતરના જોબ કાર્ડ' },
        viewAll: { en: 'View all', hi: 'सभी देखें', gu: 'બધા જુઓ' },
        thisChartFillsInAsJobCards: {
          en: 'This chart fills in as job cards are created.',
          hi: 'जॉब कार्ड बनने के साथ यह चार्ट भरता जाएगा।',
          gu: 'જોબ કાર્ડ બનતાં આ ચાર્ટ ભરાતો જશે.',
        },
        noJobsAssignedYet: {
          en: 'No jobs assigned yet',
          hi: 'अभी कोई जॉब असाइन नहीं',
          gu: 'હજી કોઈ જોબ સોંપાયેલ નથી',
        },
        thisChartFillsInOnceJobsAreAssigned: {
          en: 'This chart fills in once jobs are assigned to a technician.',
          hi: 'जॉब किसी तकनीशियन को असाइन होने पर यह चार्ट भरता जाएगा।',
          gu: 'જોબ ટેકનિશિયનને સોંપાય પછી આ ચાર્ટ ભરાશે.',
        },
        theTenNewestJobCardsAppear: {
          en: 'The ten newest job cards appear here.',
          hi: 'दस सबसे नए जॉब कार्ड यहाँ दिखेंगे।',
          gu: 'દસ સૌથી નવા જોબ કાર્ડ અહીં દેખાશે.',
        },
        noWidgetsEnabled: {
          en: 'No widgets enabled',
          hi: 'कोई विजेट चालू नहीं',
          gu: 'કોઈ વિજેટ ચાલુ નથી',
        },
        yourRoleHasEveryDashboardWidget: {
          en: 'Your role has every dashboard widget switched off. An administrator can turn them back on under Role Management.',
          hi: 'आपकी भूमिका के लिए सभी डैशबोर्ड विजेट बंद हैं। व्यवस्थापक इन्हें रोल मैनेजमेंट से फिर चालू कर सकते हैं।',
          gu: 'તમારી ભૂમિકા માટે બધા ડેશબોર્ડ વિજેટ બંધ છે. વ્યવસ્થાપક તેને રોલ મેનેજમેન્ટમાંથી ફરી ચાલુ કરી શકે છે.',
        },
      },
    },
  },
}
