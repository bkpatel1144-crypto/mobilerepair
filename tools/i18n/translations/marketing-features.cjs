/** /features and /solutions. */
const g = (en, hi, gu) => ({ en, hi, gu })

module.exports = {
  marketing: {
    features: {
      title: g(
        'Every part of the shop, in one place',
        'दुकान का हर हिस्सा, एक ही जगह',
        'દુકાનનો દરેક ભાગ, એક જ જગ્યાએ'
      ),
      lead: g(
        'Grouped the way the software itself is grouped, so what you read here is where you will find it after signing up.',
        'जैसे सॉफ़्टवेयर में बाँटा गया है, वैसे ही यहाँ भी — जो आप यहाँ पढ़ेंगे, साइन अप के बाद वहीं मिलेगा।',
        'જેમ સોફ્ટવેરમાં વહેંચાયેલું છે, તેમ જ અહીં પણ — જે તમે અહીં વાંચશો, સાઇન અપ પછી ત્યાં જ મળશે.'
      ),
      ctaTitle: g('All of it, on the free plan', 'यह सब, मुफ़्त प्लान में', 'આ બધું, મફત પ્લાનમાં'),
      ctaLead: g(
        'Nothing on this page is held back for a paid tier. There is no paid tier.',
        'इस पेज की कोई चीज़ किसी पेड प्लान के लिए रोकी नहीं गई। पेड प्लान ही नहीं है।',
        'આ પેજની કોઈ વસ્તુ પેઇડ પ્લાન માટે રોકેલી નથી. પેઇડ પ્લાન જ નથી.'
      ),
      groups: {
        service: {
          title: g('Service and repairs', 'सर्विस और रिपेयर', 'સર્વિસ અને રિપેર'),
          body: g(
            'The core of the shop: taking a device in, tracking the work, and keeping the customer informed until they collect it.',
            'दुकान का मुख्य काम: डिवाइस लेना, काम पर नज़र रखना, और ग्राहक को जानकारी देते रहना जब तक वह ले न जाए।',
            'દુકાનનું મુખ્ય કામ: ડિવાઇસ લેવું, કામ પર નજર રાખવી, અને ગ્રાહકને માહિતી આપતા રહેવું જ્યાં સુધી તે લઈ ન જાય.'
          ),
        },
        finance: {
          title: g('Money and accounts', 'पैसा और खाते', 'પૈસા અને ખાતા'),
          body: g(
            'Every rupee that comes in or goes out, reconciled to the job or party it belongs to.',
            'आने-जाने वाला हर रुपया, उसी जॉब या पार्टी से जुड़ा हुआ जिससे वह संबंधित है।',
            'આવતો-જતો દરેક રૂપિયો, તે જ જોબ કે પાર્ટી સાથે જોડાયેલો જેને તે સંબંધિત છે.'
          ),
        },
        secondHand: {
          title: g('Second-hand devices', 'सेकंड-हैंड डिवाइस', 'સેકન્ડ-હેન્ડ ડિવાઇસ'),
          body: g(
            'Buying, refurbishing and reselling used devices, with the profit on each unit tracked from purchase to sale.',
            'पुराने डिवाइस ख़रीदना, ठीक करना और बेचना — हर यूनिट का मुनाफ़ा ख़रीद से बिक्री तक ट्रैक।',
            'જૂના ડિવાઇસ ખરીદવા, રિપેર કરવા અને વેચવા — દરેક યુનિટનો નફો ખરીદીથી વેચાણ સુધી ટ્રેક.'
          ),
        },
        masters: {
          title: g('Masters and stock', 'मास्टर और स्टॉक', 'માસ્ટર અને સ્ટોક'),
          body: g(
            'The lists everything else is built on — customers, suppliers, parts and the units you measure them in.',
            'वे सूचियाँ जिन पर बाक़ी सब टिका है — ग्राहक, सप्लायर, पुर्ज़े और उनकी माप की इकाइयाँ।',
            'એ યાદીઓ જેના પર બાકીનું બધું ટકે છે — ગ્રાહકો, સપ્લાયર, પાર્ટ્સ અને તેમના માપના એકમો.'
          ),
        },
        administration: {
          title: g('Staff and access', 'स्टाफ़ और एक्सेस', 'સ્ટાફ અને એક્સેસ'),
          body: g(
            'Who works here, what each of them can reach, and a record of what everyone actually did.',
            'यहाँ कौन काम करता है, किसकी पहुँच कहाँ तक है, और किसने क्या किया उसका रिकॉर्ड।',
            'અહીં કોણ કામ કરે છે, કોની પહોંચ ક્યાં સુધી છે, અને કોણે શું કર્યું તેનો રેકોર્ડ.'
          ),
        },
        settings: {
          title: g('Setup and configuration', 'सेटअप और कॉन्फ़िगरेशन', 'સેટઅપ અને કોન્ફિગરેશન'),
          body: g(
            'Shape the software around how your shop already works, instead of the other way round.',
            'सॉफ़्टवेयर को अपनी दुकान के तरीक़े के हिसाब से ढालें, उल्टा नहीं।',
            'સોફ્ટવેરને તમારી દુકાનની રીત પ્રમાણે ઢાળો, ઊલટું નહીં.'
          ),
        },
      },
      items: {
        service: {
          jobCards: g(
            'Job cards with status workflow',
            'स्टेटस वर्कफ़्लो के साथ जॉब कार्ड',
            'સ્ટેટસ વર્કફ્લો સાથે જોબ કાર્ડ'
          ),
          intakeForms: g(
            'Intake forms per device type',
            'हर डिवाइस टाइप के लिए इनटेक फ़ॉर्म',
            'દરેક ડિવાઇસ પ્રકાર માટે ઇનટેક ફોર્મ'
          ),
          timeline: g(
            'Full audit timeline per job',
            'हर जॉब की पूरी ऑडिट टाइमलाइन',
            'દરેક જોબની સંપૂર્ણ ઓડિટ ટાઇમલાઇન'
          ),
          costing: g(
            'Job costing: parts and labour',
            'जॉब कॉस्टिंग: पुर्ज़े और मज़दूरी',
            'જોબ કોસ્ટિંગ: પાર્ટ્સ અને મજૂરી'
          ),
          options: g(
            'Device types, brands and models',
            'डिवाइस टाइप, ब्रांड और मॉडल',
            'ડિવાઇસ પ્રકાર, બ્રાન્ડ અને મોડલ'
          ),
          whatsapp: g(
            'WhatsApp templates per status',
            'हर स्टेटस के लिए व्हाट्सएप टेम्पलेट',
            'દરેક સ્ટેટસ માટે વોટ્સએપ ટેમ્પલેટ'
          ),
        },
        finance: {
          receipts: g('Receipts and payments', 'रसीदें और पेमेंट', 'રસીદો અને પેમેન્ટ'),
          ledger: g(
            'Party ledger with running balance',
            'चालू बैलेंस के साथ पार्टी लेजर',
            'ચાલુ બેલેન્સ સાથે પાર્ટી લેજર'
          ),
          cashBook: g('Cash book', 'कैश बुक', 'કેશ બુક'),
          receivables: g('Receivables ageing', 'प्राप्य की एजिंग', 'લેણાંની એજિંગ'),
          payables: g('Supplier payables', 'सप्लायर को देय', 'સપ્લાયરને દેણું'),
          expenses: g('Expenses by category', 'श्रेणी के अनुसार ख़र्च', 'શ્રેણી પ્રમાણે ખર્ચ'),
        },
        secondHand: {
          purchase: g(
            'Purchase entry with IMEI',
            'IMEI के साथ ख़रीद एंट्री',
            'IMEI સાથે ખરીદ એન્ટ્રી'
          ),
          refurbish: g(
            'Refurbishment cost tracking',
            'रिपेयर लागत की ट्रैकिंग',
            'રિપેર ખર્ચનું ટ્રેકિંગ'
          ),
          sale: g('Sale with printed receipt', 'छपी रसीद के साथ बिक्री', 'છાપેલી રસીદ સાથે વેચાણ'),
          profit: g('Profit per device', 'हर डिवाइस पर मुनाफ़ा', 'દરેક ડિવાઇસ પર નફો'),
        },
        masters: {
          parties: g('Customers and suppliers', 'ग्राहक और सप्लायर', 'ગ્રાહકો અને સપ્લાયર'),
          items: g('Item master with stock', 'स्टॉक के साथ आइटम मास्टर', 'સ્ટોક સાથે આઇટમ માસ્ટર'),
          categories: g(
            'Item and party categories',
            'आइटम और पार्टी श्रेणियाँ',
            'આઇટમ અને પાર્ટી શ્રેણીઓ'
          ),
          uom: g('Units of measure', 'माप की इकाइयाँ', 'માપના એકમો'),
          paymentModes: g('Payment modes', 'पेमेंट के तरीक़े', 'પેમેન્ટની રીતો'),
        },
        administration: {
          roles: g(
            'Roles with per-menu permissions',
            'हर मेन्यू की अनुमति के साथ रोल',
            'દરેક મેનુની પરમિશન સાથે રોલ'
          ),
          users: g('Staff accounts', 'स्टाफ़ अकाउंट', 'સ્ટાફ એકાઉન્ટ'),
          sessions: g('Active sessions', 'चालू सेशन', 'ચાલુ સેશન'),
          audit: g('System audit log', 'सिस्टम ऑडिट लॉग', 'સિસ્ટમ ઓડિટ લોગ'),
          ipWhitelist: g('IP whitelist', 'IP व्हाइटलिस्ट', 'IP વ્હાઇટલિસ્ટ'),
          loginReport: g('Login report', 'लॉगिन रिपोर्ट', 'લોગિન રિપોર્ટ'),
        },
        settings: {
          company: g('Company profile and GST', 'कंपनी प्रोफ़ाइल और GST', 'કંપની પ્રોફાઇલ અને GST'),
          branches: g('Multiple branches', 'कई ब्रांच', 'અનેક બ્રાન્ચ'),
          financialYears: g('Financial years', 'वित्तीय वर्ष', 'નાણાકીય વર્ષ'),
          workflow: g('Workflow Designer', 'वर्कफ़्लो डिज़ाइनर', 'વર્કફ્લો ડિઝાઇનર'),
          printFormats: g(
            'Print format designer',
            'प्रिंट फ़ॉर्मैट डिज़ाइनर',
            'પ્રિન્ટ ફોર્મેટ ડિઝાઇનર'
          ),
          backup: g('Backup and restore', 'बैकअप और रीस्टोर', 'બેકઅપ અને રીસ્ટોર'),
        },
      },
    },

    solutions: {
      title: g(
        'Built for the shop you actually run',
        'उसी दुकान के लिए बना जो आप चलाते हैं',
        'એ જ દુકાન માટે બનેલું જે તમે ચલાવો છો'
      ),
      lead: g(
        'A single counter and a three-branch operation want opposite things from the same software. Here is which part matters to you.',
        'एक काउंटर और तीन ब्रांच वाली दुकान को एक ही सॉफ़्टवेयर से अलग-अलग चीज़ें चाहिए। देखिए आपके लिए कौन सा हिस्सा ज़रूरी है।',
        'એક કાઉન્ટર અને ત્રણ બ્રાન્ચવાળી દુકાનને એક જ સોફ્ટવેરથી અલગ-અલગ વસ્તુઓ જોઈએ. જુઓ તમારા માટે કયો ભાગ જરૂરી છે.'
      ),
      ctaTitle: g(
        'Not sure which of these is you?',
        'तय नहीं कर पा रहे कि इनमें से कौन आप हैं?',
        'નક્કી નથી કરી શકતા કે આમાંથી કોણ તમે છો?'
      ),
      ctaLead: g(
        'Tell us how your shop works today and we will tell you honestly whether this fits.',
        'बताइए आपकी दुकान आज कैसे चलती है, और हम सच बताएँगे कि यह आपके लिए ठीक है या नहीं।',
        'કહો તમારી દુકાન આજે કેવી રીતે ચાલે છે, અને અમે સાચું કહીશું કે આ તમારા માટે યોગ્ય છે કે નહીં.'
      ),
      ctaButton: g('Talk to us', 'हमसे बात करें', 'અમારી સાથે વાત કરો'),
      audiences: {
        singleShop: {
          title: g('The single repair shop', 'एक रिपेयर शॉप', 'એક રિપેર શોપ'),
          who: g(
            'One counter, one to five staff',
            'एक काउंटर, एक से पाँच लोग',
            'એક કાઉન્ટર, એકથી પાંચ લોકો'
          ),
          body: g(
            'You are behind the counter yourself. The software has to be faster than the notebook it replaces, or it will not get used past the first week.',
            'आप ख़ुद काउंटर पर होते हैं। सॉफ़्टवेयर उस नोटबुक से तेज़ होना चाहिए जिसकी वह जगह ले रहा है, वरना पहले हफ़्ते के बाद कोई इस्तेमाल नहीं करेगा।',
            'તમે પોતે કાઉન્ટર પર હોવ છો. સોફ્ટવેર એ નોટબુક કરતાં ઝડપી હોવું જોઈએ જેની જગ્યા તે લે છે, નહીં તો પહેલા અઠવાડિયા પછી કોઈ વાપરશે નહીં.'
          ),
        },
        dealer: {
          title: g('The second-hand dealer', 'सेकंड-हैंड डीलर', 'સેકન્ડ-હેન્ડ ડીલર'),
          who: g(
            'Buying, refurbishing, reselling',
            'ख़रीद, रिपेयर, दोबारा बिक्री',
            'ખરીદી, રિપેર, ફરી વેચાણ'
          ),
          body: g(
            'Your margin lives in the gap between what you paid, what the repair cost, and what it sold for — and that gap is per device, not per month.',
            'आपका मुनाफ़ा उस अंतर में है जो ख़रीद, रिपेयर की लागत और बिक्री के बीच है — और यह अंतर हर डिवाइस का होता है, महीने का नहीं।',
            'તમારો નફો એ ફરકમાં છે જે ખરીદી, રિપેરના ખર્ચ અને વેચાણ વચ્ચે છે — અને એ ફરક દરેક ડિવાઇસનો હોય છે, મહિનાનો નહીં.'
          ),
        },
        multiBranch: {
          title: g('The multi-branch business', 'कई ब्रांच वाला बिज़नेस', 'અનેક બ્રાન્ચવાળો ધંધો'),
          who: g('Two or more locations', 'दो या ज़्यादा जगहें', 'બે કે વધુ જગ્યાઓ'),
          body: g(
            'You cannot stand in two shops at once. What you need is to see what the branch you are not in did today, and to be sure staff can only see their own.',
            'आप एक साथ दो दुकानों में नहीं हो सकते। आपको यह देखना है कि जिस ब्रांच में आप नहीं हैं वहाँ आज क्या हुआ, और भरोसा चाहिए कि स्टाफ़ को सिर्फ़ अपनी ब्रांच दिखे।',
            'તમે એકસાથે બે દુકાનમાં હોઈ શકતા નથી. તમારે એ જોવું છે કે જે બ્રાન્ચમાં તમે નથી ત્યાં આજે શું થયું, અને ખાતરી જોઈએ કે સ્ટાફને ફક્ત પોતાની બ્રાન્ચ દેખાય.'
          ),
        },
      },
      points: {
        singleShop: {
          speed: g(
            'Job card in under a minute',
            'एक मिनट से कम में जॉब कार्ड',
            'એક મિનિટથી ઓછામાં જોબ કાર્ડ'
          ),
          noTraining: g(
            'No training needed to start',
            'शुरू करने के लिए ट्रेनिंग नहीं चाहिए',
            'શરૂ કરવા માટે ટ્રેનિંગ જોઈતી નથી'
          ),
          phone: g(
            'Works on the phone in your pocket',
            'जेब के फ़ोन पर चलता है',
            'ખિસ્સાના ફોન પર ચાલે છે'
          ),
          walkIn: g(
            'Search a returning customer by number',
            'नंबर से पुराने ग्राहक को खोजें',
            'નંબરથી જૂના ગ્રાહકને શોધો'
          ),
        },
        dealer: {
          perUnit: g(
            'Profit per device, not per month',
            'हर डिवाइस का मुनाफ़ा, महीने का नहीं',
            'દરેક ડિવાઇસનો નફો, મહિનાનો નહીં'
          ),
          refurbish: g(
            'Repair cost added to the unit',
            'रिपेयर लागत उसी यूनिट में जुड़ती है',
            'રિપેર ખર્ચ એ જ યુનિટમાં ઉમેરાય'
          ),
          margin: g(
            'Know your margin before you sell',
            'बेचने से पहले मुनाफ़ा पता हो',
            'વેચતા પહેલાં નફો ખબર હોય'
          ),
          stock: g(
            'Unsold stock at a glance',
            'बिना बिका स्टॉक एक नज़र में',
            'ન વેચાયેલો સ્ટોક એક નજરમાં'
          ),
        },
        multiBranch: {
          branchScope: g(
            'Staff see only their branch',
            'स्टाफ़ को सिर्फ़ अपनी ब्रांच दिखे',
            'સ્ટાફને ફક્ત પોતાની બ્રાન્ચ દેખાય'
          ),
          consolidated: g(
            'Owner sees every branch together',
            'मालिक को सभी ब्रांच एक साथ दिखें',
            'માલિકને બધી બ્રાન્ચ એકસાથે દેખાય'
          ),
          roles: g(
            'A different role per person',
            'हर व्यक्ति के लिए अलग रोल',
            'દરેક વ્યક્તિ માટે અલગ રોલ'
          ),
          audit: g(
            'A record of who changed what',
            'किसने क्या बदला उसका रिकॉर्ड',
            'કોણે શું બદલ્યું તેનો રેકોર્ડ'
          ),
        },
      },
    },
  },
}
