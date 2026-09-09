/**
 * Nav, footer, home page and the pricing strings the home page shares with /pricing.
 *
 * Written as one file per batch with all three languages side by side, so a key cannot be added
 * to English and forgotten in Gujarati — the drift that `locales.test.ts` exists to catch.
 *
 *   node tools/i18n/add-keys.cjs tools/i18n/translations/marketing-shell.cjs
 */
module.exports = {
  marketing: {
    nav: {
      home: { en: 'Home', hi: 'होम', gu: 'હોમ' },
      features: { en: 'Features', hi: 'सुविधाएँ', gu: 'સુવિધાઓ' },
      solutions: { en: 'Solutions', hi: 'समाधान', gu: 'ઉકેલો' },
      pricing: { en: 'Pricing', hi: 'कीमत', gu: 'કિંમત' },
      about: { en: 'About', hi: 'हमारे बारे में', gu: 'અમારા વિશે' },
      contact: { en: 'Contact', hi: 'संपर्क', gu: 'સંપર્ક' },
      faq: { en: 'FAQ', hi: 'सामान्य प्रश्न', gu: 'સામાન્ય પ્રશ્નો' },
      login: { en: 'Log in', hi: 'लॉग इन', gu: 'લોગ ઇન' },
      signUpFree: { en: 'Sign up free', hi: 'मुफ़्त साइन अप', gu: 'મફત સાઇન અપ' },
      toggleMenu: { en: 'Toggle menu', hi: 'मेन्यू खोलें या बंद करें', gu: 'મેનુ ખોલો કે બંધ કરો' },
      language: { en: 'Language', hi: 'भाषा', gu: 'ભાષા' },
    },

    footer: {
      tagline: {
        en: 'Repair-shop and second-hand-device software built for Indian shops — job cards, technicians, billing and stock in one place.',
        hi: 'भारतीय दुकानों के लिए बनाया गया रिपेयर शॉप और सेकंड-हैंड डिवाइस सॉफ़्टवेयर — जॉब कार्ड, टेक्नीशियन, बिलिंग और स्टॉक एक ही जगह।',
        gu: 'ભારતીય દુકાનો માટે બનાવેલ રિપેર શોપ અને સેકન્ડ-હેન્ડ ડિવાઇસ સોફ્ટવેર — જોબ કાર્ડ, ટેકનિશિયન, બિલિંગ અને સ્ટોક એક જ જગ્યાએ.',
      },
      product: { en: 'Product', hi: 'प्रोडक्ट', gu: 'પ્રોડક્ટ' },
      company: { en: 'Company', hi: 'कंपनी', gu: 'કંપની' },
      legal: { en: 'Legal', hi: 'कानूनी', gu: 'કાનૂની' },
      privacy: { en: 'Privacy policy', hi: 'प्राइवेसी पॉलिसी', gu: 'પ્રાઇવસી પોલિસી' },
      terms: { en: 'Terms of use', hi: 'उपयोग की शर्तें', gu: 'વપરાશની શરતો' },
      address: { en: 'Address', hi: 'पता', gu: 'સરનામું' },
      phone: { en: 'Phone', hi: 'फ़ोन', gu: 'ફોન' },
      whatsapp: { en: 'WhatsApp', hi: 'व्हाट्सएप', gu: 'વોટ્સએપ' },
      email: { en: 'Email', hi: 'ईमेल', gu: 'ઈમેલ' },
      chatWithUs: { en: 'Chat with us', hi: 'हमसे चैट करें', gu: 'અમારી સાથે ચેટ કરો' },
      copyright: {
        en: '© {{year}} {{company}}. All rights reserved.',
        hi: '© {{year}} {{company}}. सर्वाधिकार सुरक्षित।',
        gu: '© {{year}} {{company}}. સર્વાધિકાર સુરક્ષિત.',
      },
      builtIn: { en: 'Built in India', hi: 'भारत में बना', gu: 'ભારતમાં બનેલું' },
    },

    contact: {
      hoursValue: {
        en: 'Monday to Saturday, 10am to 8pm IST',
        hi: 'सोमवार से शनिवार, सुबह 10 से रात 8 बजे (IST)',
        gu: 'સોમવારથી શનિવાર, સવારે 10 થી રાત્રે 8 (IST)',
      },
      whatsappPrefill: {
        en: "Hello, I'd like to know more about aim for my repair shop.",
        hi: 'नमस्ते, मैं अपनी रिपेयर शॉप के लिए aim के बारे में और जानना चाहता/चाहती हूँ।',
        gu: 'નમસ્તે, હું મારી રિપેર શોપ માટે aim વિશે વધુ જાણવા માંગું છું.',
      },
    },

    pricing: {
      planName: { en: 'Every shop', hi: 'हर दुकान', gu: 'દરેક દુકાન' },
      amount: { en: '₹0', hi: '₹0', gu: '₹0' },
      period: { en: 'forever', hi: 'हमेशा के लिए', gu: 'કાયમ માટે' },
      includes: {
        unlimited: {
          en: 'Unlimited job cards, technicians and customers',
          hi: 'अनलिमिटेड जॉब कार्ड, टेक्नीशियन और ग्राहक',
          gu: 'અમર્યાદિત જોબ કાર્ડ, ટેકનિશિયન અને ગ્રાહકો',
        },
        rbac: {
          en: 'Full role-based access control and Workflow Designer',
          hi: 'पूरा रोल-आधारित एक्सेस कंट्रोल और वर्कफ़्लो डिज़ाइनर',
          gu: 'સંપૂર્ણ રોલ-આધારિત એક્સેસ કંટ્રોલ અને વર્કફ્લો ડિઝાઇનર',
        },
        finance: {
          en: 'Receipts, ledgers, receivables and payables',
          hi: 'रसीदें, बहीखाते, प्राप्य और देय',
          gu: 'રસીદો, ખાતાવહી, લેણું અને દેણું',
        },
        secondHand: {
          en: 'Second-hand device purchase and sale tracking',
          hi: 'सेकंड-हैंड डिवाइस की खरीद और बिक्री की ट्रैकिंग',
          gu: 'સેકન્ડ-હેન્ડ ડિવાઇસની ખરીદી અને વેચાણનું ટ્રેકિંગ',
        },
        reports: {
          en: 'Every report, dashboard and CSV or Excel export',
          hi: 'हर रिपोर्ट, डैशबोर्ड और CSV या Excel एक्सपोर्ट',
          gu: 'દરેક રિપોર્ટ, ડેશબોર્ડ અને CSV કે Excel એક્સપોર્ટ',
        },
        migration: {
          en: 'Free data migration from your current system',
          hi: 'आपके मौजूदा सिस्टम से मुफ़्त डेटा माइग्रेशन',
          gu: 'તમારી હાલની સિસ્ટમમાંથી મફત ડેટા માઇગ્રેશન',
        },
      },
    },

    home: {
      hero: {
        badge: {
          en: 'Free forever for every repair shop',
          hi: 'हर रिपेयर शॉप के लिए हमेशा मुफ़्त',
          gu: 'દરેક રિપેર શોપ માટે કાયમ મફત',
        },
        titleLead: {
          en: 'Run your whole repair shop on',
          hi: 'अपनी पूरी रिपेयर शॉप चलाइए',
          gu: 'તમારી આખી રિપેર શોપ ચલાવો',
        },
        subtitle: {
          en: 'From the moment a customer walks in to the moment they collect a repaired device — job cards, technician workflows, WhatsApp updates, billing, payments and warranty in one connected system.',
          hi: 'ग्राहक के दुकान में आने से लेकर ठीक हुआ डिवाइस लेने तक — जॉब कार्ड, टेक्नीशियन वर्कफ़्लो, व्हाट्सएप अपडेट, बिलिंग, पेमेंट और वारंटी, सब एक जुड़े हुए सिस्टम में।',
          gu: 'ગ્રાહક દુકાનમાં આવે ત્યારથી રિપેર થયેલ ડિવાઇસ લઈ જાય ત્યાં સુધી — જોબ કાર્ડ, ટેકનિશિયન વર્કફ્લો, વોટ્સએપ અપડેટ, બિલિંગ, પેમેન્ટ અને વોરંટી, બધું એક જોડાયેલી સિસ્ટમમાં.',
        },
        primaryCta: { en: 'Start free', hi: 'मुफ़्त शुरू करें', gu: 'મફત શરૂ કરો' },
        secondaryCta: { en: 'Book a demo', hi: 'डेमो बुक करें', gu: 'ડેમો બુક કરો' },
        demoSubject: {
          en: 'Demo request for aim',
          hi: 'aim के लिए डेमो का अनुरोध',
          gu: 'aim માટે ડેમો વિનંતી',
        },
        trust: {
          freeForever: { en: 'Free forever', hi: 'हमेशा मुफ़्त', gu: 'કાયમ મફત' },
          noCard: { en: 'No card required', hi: 'कार्ड की ज़रूरत नहीं', gu: 'કાર્ડની જરૂર નથી' },
          migration: {
            en: 'Free data migration',
            hi: 'मुफ़्त डेटा माइग्रेशन',
            gu: 'મફત ડેટા માઇગ્રેશન',
          },
        },
      },

      replaces: {
        title: {
          en: 'One system in place of the four you are using now',
          hi: 'जो चार चीज़ें आप अब इस्तेमाल करते हैं, उनकी जगह एक सिस्टम',
          gu: 'તમે હાલ વાપરો છો તે ચાર વસ્તુઓની જગ્યાએ એક સિસ્ટમ',
        },
        notebook: {
          en: 'The counter notebook',
          hi: 'काउंटर की नोटबुक',
          gu: 'કાઉન્ટરની નોટબુક',
        },
        whatsapp: {
          en: 'WhatsApp messages typed by hand',
          hi: 'हाथ से टाइप किए व्हाट्सएप मैसेज',
          gu: 'હાથે ટાઇપ કરેલા વોટ્સએપ મેસેજ',
        },
        spreadsheet: {
          en: 'Excel sheets for stock and dues',
          hi: 'स्टॉक और बकाया के लिए एक्सेल शीट',
          gu: 'સ્ટોક અને બાકી માટે એક્સેલ શીટ',
        },
        billingApp: {
          en: 'A separate billing app',
          hi: 'अलग बिलिंग ऐप',
          gu: 'અલગ બિલિંગ એપ',
        },
      },

      capabilities: {
        eyebrow: { en: 'What you get', hi: 'आपको क्या मिलता है', gu: 'તમને શું મળે છે' },
        title: {
          en: 'Not another billing tool. A complete system for running the business.',
          hi: 'यह कोई और बिलिंग टूल नहीं है। यह बिज़नेस चलाने का पूरा सिस्टम है।',
          gu: 'આ બીજું કોઈ બિલિંગ ટૂલ નથી. આ ધંધો ચલાવવાની સંપૂર્ણ સિસ્ટમ છે.',
        },
        lead: {
          en: 'Every part of a repair shop that normally lives in someone’s head, a notebook or a chat thread — given a place in the software.',
          hi: 'रिपेयर शॉप का हर वह हिस्सा जो आम तौर पर किसी के दिमाग़, नोटबुक या चैट में रहता है — उसे सॉफ़्टवेयर में जगह मिली।',
          gu: 'રિપેર શોપનો દરેક એ ભાગ જે સામાન્ય રીતે કોઈના મગજમાં, નોટબુકમાં કે ચેટમાં રહે છે — તેને સોફ્ટવેરમાં જગ્યા મળી.',
        },
        jobCards: {
          title: {
            en: 'Job cards that run themselves',
            hi: 'जॉब कार्ड जो खुद चलते हैं',
            gu: 'જોબ કાર્ડ જે પોતે ચાલે છે',
          },
          body: {
            en: 'A dynamic intake form for every device type, actions that unlock only at the right status, and a full audit timeline on every job — so nobody has to remember what happened or ask who touched it last.',
            hi: 'हर डिवाइस टाइप के लिए डायनामिक इनटेक फ़ॉर्म, ऐसे एक्शन जो सही स्टेटस पर ही खुलते हैं, और हर जॉब पर पूरी ऑडिट टाइमलाइन — किसी को याद रखने या पूछने की ज़रूरत नहीं कि आख़िरी बार किसने छुआ।',
            gu: 'દરેક ડિવાઇસ પ્રકાર માટે ડાયનેમિક ઇનટેક ફોર્મ, એવા એક્શન જે યોગ્ય સ્ટેટસ પર જ ખૂલે, અને દરેક જોબ પર સંપૂર્ણ ઓડિટ ટાઇમલાઇન — કોઈને યાદ રાખવાની કે પૂછવાની જરૂર નથી કે છેલ્લે કોણે હાથ લગાવ્યો.',
          },
        },
        workflows: {
          title: {
            en: 'Technician workflows',
            hi: 'टेक्नीशियन वर्कफ़्लो',
            gu: 'ટેકનિશિયન વર્કફ્લો',
          },
          body: {
            en: 'Who can see what, and do what, at every status — configured by you, enforced everywhere.',
            hi: 'हर स्टेटस पर कौन क्या देख सकता है और कर सकता है — आप तय करें, हर जगह लागू।',
            gu: 'દરેક સ્ટેટસ પર કોણ શું જોઈ શકે અને કરી શકે — તમે નક્કી કરો, બધે લાગુ.',
          },
        },
        updates: {
          title: {
            en: 'Customers stay informed',
            hi: 'ग्राहक जानकारी में रहें',
            gu: 'ગ્રાહકો માહિતગાર રહે',
          },
          body: {
            en: 'Automatic WhatsApp updates when a device is received, in progress, or ready for pickup.',
            hi: 'डिवाइस मिलने, काम चलने और पिकअप के लिए तैयार होने पर अपने आप व्हाट्सएप अपडेट।',
            gu: 'ડિવાઇસ મળે, કામ ચાલુ હોય અને પિકઅપ માટે તૈયાર થાય ત્યારે આપમેળે વોટ્સએપ અપડેટ.',
          },
        },
        money: {
          title: { en: 'Billing and payments', hi: 'बिलिंग और पेमेंट', gu: 'બિલિંગ અને પેમેન્ટ' },
          body: {
            en: 'Advances, part payments and final bills all reconcile into one ledger automatically.',
            hi: 'एडवांस, आंशिक पेमेंट और फ़ाइनल बिल सब अपने आप एक बहीखाते में मिल जाते हैं।',
            gu: 'એડવાન્સ, આંશિક પેમેન્ટ અને ફાઇનલ બિલ બધું આપમેળે એક ખાતાવહીમાં મળી જાય.',
          },
        },
        secondHand: {
          title: {
            en: 'Second-hand trading',
            hi: 'सेकंड-हैंड ट्रेडिंग',
            gu: 'સેકન્ડ-હેન્ડ ટ્રેડિંગ',
          },
          body: {
            en: 'Buy, refurbish and sell used devices with purchase-to-sale profit tracked per unit.',
            hi: 'पुराने डिवाइस ख़रीदें, ठीक करें और बेचें — हर यूनिट पर ख़रीद से बिक्री तक का मुनाफ़ा ट्रैक।',
            gu: 'જૂના ડિવાઇસ ખરીદો, રિપેર કરો અને વેચો — દરેક યુનિટ પર ખરીદીથી વેચાણ સુધીનો નફો ટ્રેક.',
          },
        },
        access: {
          title: {
            en: 'Access you actually control',
            hi: 'एक्सेस जो सच में आपके हाथ में है',
            gu: 'એક્સેસ જે ખરેખર તમારા હાથમાં',
          },
          body: {
            en: 'Every menu and every action is gated by a permission you set, not hardcoded by us. A salesman never sees purchase cost, a technician never sees the ledger, and you decide the rest — down to the individual button.',
            hi: 'हर मेन्यू और हर एक्शन उस अनुमति से नियंत्रित है जो आप तय करते हैं, हमने कोड में तय नहीं की। सेल्समैन को ख़रीद लागत कभी नहीं दिखती, टेक्नीशियन को बहीखाता कभी नहीं दिखता, और बाक़ी आप तय करें — हर बटन तक।',
            gu: 'દરેક મેનુ અને દરેક એક્શન તમે નક્કી કરેલી પરમિશનથી નિયંત્રિત છે, અમે કોડમાં નક્કી કરેલી નથી. સેલ્સમેનને ખરીદ કિંમત ક્યારેય દેખાતી નથી, ટેકનિશિયનને ખાતાવહી ક્યારેય દેખાતી નથી, અને બાકીનું તમે નક્કી કરો — દરેક બટન સુધી.',
          },
        },
      },

      workflow: {
        eyebrow: { en: 'How it works', hi: 'यह कैसे काम करता है', gu: 'આ કેવી રીતે કામ કરે છે' },
        title: {
          en: 'From intake to delivery, one path',
          hi: 'आने से लेकर देने तक, एक ही रास्ता',
          gu: 'આવવાથી લઈને આપવા સુધી, એક જ રસ્તો',
        },
        lead: {
          en: 'Every job follows the same connected path, with no spreadsheet in between.',
          hi: 'हर जॉब एक ही जुड़े हुए रास्ते से गुज़रती है, बीच में कोई स्प्रेडशीट नहीं।',
          gu: 'દરેક જોબ એક જ જોડાયેલા રસ્તે જાય છે, વચ્ચે કોઈ સ્પ્રેડશીટ નહીં.',
        },
        intake: {
          title: { en: 'Intake', hi: 'इनटेक', gu: 'ઇનટેક' },
          body: {
            en: 'Find the customer or add them, capture the device details and the reported problem.',
            hi: 'ग्राहक खोजें या जोड़ें, डिवाइस की जानकारी और बताई गई ख़राबी दर्ज करें।',
            gu: 'ગ્રાહક શોધો કે ઉમેરો, ડિવાઇસની વિગત અને જણાવેલી ખામી નોંધો.',
          },
        },
        assign: {
          title: {
            en: 'Assign and repair',
            hi: 'सौंपें और रिपेयर करें',
            gu: 'સોંપો અને રિપેર કરો',
          },
          body: {
            en: 'A technician picks up the job. Status, parts used and cost are tracked as work happens.',
            hi: 'टेक्नीशियन जॉब लेता है। स्टेटस, लगे पुर्ज़े और लागत काम के साथ-साथ दर्ज होते हैं।',
            gu: 'ટેકનિશિયન જોબ લે છે. સ્ટેટસ, વપરાયેલા પાર્ટ્સ અને ખર્ચ કામ સાથે નોંધાય છે.',
          },
        },
        bill: {
          title: { en: 'Bill and collect', hi: 'बिल और वसूली', gu: 'બિલ અને વસૂલી' },
          body: {
            en: 'Generate the bill, take payment by any mode, and the ledgers update themselves.',
            hi: 'बिल बनाएँ, किसी भी तरीक़े से पेमेंट लें, और बहीखाते अपने आप अपडेट हो जाते हैं।',
            gu: 'બિલ બનાવો, કોઈપણ રીતે પેમેન્ટ લો, અને ખાતાવહી આપમેળે અપડેટ થાય.',
          },
        },
        deliver: {
          title: {
            en: 'Deliver with warranty',
            hi: 'वारंटी के साथ डिलीवरी',
            gu: 'વોરંટી સાથે ડિલિવરી',
          },
          body: {
            en: 'Hand over the device with a printed warranty note the customer can hold on to.',
            hi: 'डिवाइस के साथ छपा हुआ वारंटी नोट दें, जिसे ग्राहक अपने पास रख सके।',
            gu: 'ડિવાઇસ સાથે છાપેલી વોરંટી નોટ આપો, જે ગ્રાહક પોતાની પાસે રાખી શકે.',
          },
        },
      },

      language: {
        title: {
          en: 'Your staff work in the language they think in',
          hi: 'आपका स्टाफ़ उसी भाषा में काम करे जिसमें वह सोचता है',
          gu: 'તમારો સ્ટાફ એ જ ભાષામાં કામ કરે જેમાં તે વિચારે છે',
        },
        lead: {
          en: 'The entire system — every screen, every button, every report — in English, Hindi and Gujarati. Each person picks their own; nobody has to work around somebody else’s choice.',
          hi: 'पूरा सिस्टम — हर स्क्रीन, हर बटन, हर रिपोर्ट — अंग्रेज़ी, हिन्दी और गुजराती में। हर व्यक्ति अपनी भाषा चुने; किसी और की पसंद के साथ काम करने की ज़रूरत नहीं।',
          gu: 'સંપૂર્ણ સિસ્ટમ — દરેક સ્ક્રીન, દરેક બટન, દરેક રિપોર્ટ — અંગ્રેજી, હિન્દી અને ગુજરાતીમાં. દરેક વ્યક્તિ પોતાની ભાષા પસંદ કરે; બીજા કોઈની પસંદ સાથે કામ કરવાની જરૂર નથી.',
        },
        names: {
          en: { en: 'English', hi: 'अंग्रेज़ी', gu: 'અંગ્રેજી' },
          hi: { en: 'Hindi', hi: 'हिन्दी', gu: 'હિન્દી' },
          gu: { en: 'Gujarati', hi: 'गुजराती', gu: 'ગુજરાતી' },
        },
      },

      pricing: {
        eyebrow: { en: 'Pricing', hi: 'कीमत', gu: 'કિંમત' },
        title: {
          en: 'Free forever. Not a trial, not a starter tier.',
          hi: 'हमेशा मुफ़्त। न ट्रायल, न कोई शुरुआती प्लान।',
          gu: 'કાયમ મફત. ન ટ્રાયલ, ન કોઈ શરૂઆતનો પ્લાન.',
        },
        lead: {
          en: 'Every feature, every report, unlimited staff and jobs — with no card, no expiry and nothing held back for a paid plan that does not exist.',
          hi: 'हर फ़ीचर, हर रिपोर्ट, अनलिमिटेड स्टाफ़ और जॉब — कोई कार्ड नहीं, कोई एक्सपायरी नहीं, और किसी पेड प्लान के लिए कुछ रोका नहीं गया, क्योंकि ऐसा कोई प्लान ही नहीं है।',
          gu: 'દરેક ફીચર, દરેક રિપોર્ટ, અમર્યાદિત સ્ટાફ અને જોબ — કોઈ કાર્ડ નહીં, કોઈ એક્સપાયરી નહીં, અને કોઈ પેઇડ પ્લાન માટે કંઈ રોકેલું નહીં, કારણ કે એવો પ્લાન જ નથી.',
        },
        cta: { en: 'See what is included', hi: 'देखें क्या शामिल है', gu: 'જુઓ શું સામેલ છે' },
      },

      cta: {
        title: {
          en: 'Set up your shop in the next ten minutes',
          hi: 'अगले दस मिनट में अपनी दुकान सेट कर लें',
          gu: 'આવતી દસ મિનિટમાં તમારી દુકાન સેટ કરી લો',
        },
        lead: {
          en: 'Create an account, add your branch, and start writing job cards today. Bring your existing data across and we will help you move it.',
          hi: 'अकाउंट बनाएँ, अपनी ब्रांच जोड़ें, और आज ही जॉब कार्ड बनाना शुरू करें। अपना पुराना डेटा साथ लाएँ, हम उसे लाने में मदद करेंगे।',
          gu: 'એકાઉન્ટ બનાવો, તમારી બ્રાન્ચ ઉમેરો, અને આજથી જ જોબ કાર્ડ બનાવવાનું શરૂ કરો. તમારો જૂનો ડેટા સાથે લાવો, અમે તેને લાવવામાં મદદ કરીશું.',
        },
      },
    },
  },
}
