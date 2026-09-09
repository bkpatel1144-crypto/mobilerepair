/** /pricing, /about and /contact. */
const g = (en, hi, gu) => ({ en, hi, gu })

module.exports = {
  marketing: {
    pricing: {
      title: g(
        'Free forever, and here is why',
        'हमेशा मुफ़्त, और वजह यह है',
        'કાયમ મફત, અને કારણ આ છે'
      ),
      lead: g(
        'One plan, no tiers, no card. The unusual part is not the price — it is that nothing is held back — so this page explains what that means and what it does not.',
        'एक प्लान, कोई टियर नहीं, कोई कार्ड नहीं। अजीब बात कीमत नहीं है — अजीब यह है कि कुछ भी रोका नहीं गया — तो यह पेज बताता है इसका मतलब क्या है और क्या नहीं।',
        'એક પ્લાન, કોઈ ટિયર નહીં, કોઈ કાર્ડ નહીં. વિચિત્ર વાત કિંમત નથી — વિચિત્ર એ છે કે કંઈ પણ રોકેલું નથી — તો આ પેજ સમજાવે છે એનો અર્થ શું છે અને શું નથી.'
      ),
      planNote: g(
        'Everything in the product, for every member of your staff, with no expiry date.',
        'प्रोडक्ट की हर चीज़, आपके हर स्टाफ़ के लिए, बिना किसी एक्सपायरी के।',
        'પ્રોડક્ટની દરેક વસ્તુ, તમારા દરેક સ્ટાફ માટે, કોઈ એક્સપાયરી વગર.'
      ),
      includedTitle: g("What's included", 'क्या शामिल है', 'શું સામેલ છે'),
      assuranceEyebrow: g('The obvious questions', 'ज़ाहिर सवाल', 'સ્પષ્ટ સવાલો'),
      assuranceTitle: g(
        'Free usually has a catch. These are the three things worth asking about.',
        'मुफ़्त में आम तौर पर कोई पेच होता है। ये तीन बातें पूछने लायक हैं।',
        'મફતમાં સામાન્ય રીતે કોઈ પેચ હોય છે. આ ત્રણ વાતો પૂછવા લાયક છે.'
      ),
      ctaTitle: g(
        'Start today, decide later',
        'आज शुरू करें, बाद में तय करें',
        'આજે શરૂ કરો, પછી નક્કી કરો'
      ),
      ctaLead: g(
        'There is no commitment to make and no card to enter, so the only way to find out if it fits is to use it.',
        'न कोई वादा करना है, न कार्ड डालना है — तो यह जानने का एक ही तरीक़ा है कि इस्तेमाल कर देखें।',
        'ન કોઈ વચન આપવાનું છે, ન કાર્ડ નાખવાનું — તો આ જાણવાનો એક જ રસ્તો છે કે વાપરીને જુઓ.'
      ),
      includes: {
        languages: g(
          'English, Hindi and Gujarati throughout',
          'पूरे सिस्टम में अंग्रेज़ी, हिन्दी और गुजराती',
          'સંપૂર્ણ સિસ્ટમમાં અંગ્રેજી, હિન્દી અને ગુજરાતી'
        ),
        branches: g('Unlimited branches', 'अनलिमिटेड ब्रांच', 'અમર્યાદિત બ્રાન્ચ'),
        print: g(
          'Print format designer for bills and labels',
          'बिल और लेबल के लिए प्रिंट फ़ॉर्मैट डिज़ाइनर',
          'બિલ અને લેબલ માટે પ્રિન્ટ ફોર્મેટ ડિઝાઇનર'
        ),
        updates: g('Every future update', 'आगे आने वाला हर अपडेट', 'આગળ આવનારો દરેક અપડેટ'),
      },
      assurances: {
        why: {
          title: g('Why is it free?', 'यह मुफ़्त क्यों है?', 'આ મફત કેમ છે?'),
          body: g(
            'AIM ENTERPRISE builds this for the repair trade it already works in. It is not funded by advertising and your data is not the product — if that ever changes, it will be said plainly here first.',
            'AIM ENTERPRISE इसे उसी रिपेयर कारोबार के लिए बनाता है जिसमें वह पहले से है। इसे विज्ञापन से पैसा नहीं मिलता और आपका डेटा प्रोडक्ट नहीं है — अगर यह कभी बदले, तो पहले यहीं साफ़ लिखा जाएगा।',
            'AIM ENTERPRISE આ એ જ રિપેર ધંધા માટે બનાવે છે જેમાં તે પહેલેથી છે. તેને જાહેરાતથી પૈસા મળતા નથી અને તમારો ડેટા પ્રોડક્ટ નથી — જો આ કદી બદલાય, તો પહેલાં અહીં જ સ્પષ્ટ લખાશે.'
          ),
        },
        data: {
          title: g('Whose data is it?', 'डेटा किसका है?', 'ડેટા કોનો છે?'),
          body: g(
            'Yours. Backup & Restore inside the app exports everything you have entered, at any time, without asking anyone.',
            'आपका। ऐप में बैकअप और रीस्टोर से आपका डाला हुआ सब कुछ, जब चाहें, किसी से पूछे बिना एक्सपोर्ट हो जाता है।',
            'તમારો. એપમાં બેકઅપ અને રીસ્ટોરથી તમે નાખેલું બધું, જ્યારે ઇચ્છો, કોઈને પૂછ્યા વગર એક્સપોર્ટ થાય છે.'
          ),
        },
        noLockIn: {
          title: g('Can I leave?', 'क्या मैं छोड़ सकता हूँ?', 'શું હું છોડી શકું?'),
          body: g(
            'Yes, and you can take your data with you as CSV or Excel. Nothing here is designed to make leaving expensive.',
            'हाँ, और अपना डेटा CSV या Excel में साथ ले जा सकते हैं। यहाँ कुछ भी ऐसा नहीं बनाया गया कि छोड़ना महँगा पड़े।',
            'હા, અને તમારો ડેટા CSV કે Excel માં સાથે લઈ જઈ શકો. અહીં કંઈ પણ એવું બનાવેલું નથી કે છોડવું મોંઘું પડે.'
          ),
        },
      },
    },

    about: {
      title: g(
        'The company behind the software',
        'सॉफ़्टवेयर के पीछे की कंपनी',
        'સોફ્ટવેર પાછળની કંપની'
      ),
      lead: g(
        'Before you put your customers and your accounts into someone else’s software, it is fair to know who they are.',
        'अपने ग्राहक और अपने खाते किसी और के सॉफ़्टवेयर में डालने से पहले यह जानना जायज़ है कि वे कौन हैं।',
        'તમારા ગ્રાહકો અને તમારા ખાતા બીજા કોઈના સોફ્ટવેરમાં નાખતા પહેલાં એ જાણવું યોગ્ય છે કે તેઓ કોણ છે.'
      ),
      storyTitle: g('Why this exists', 'यह क्यों बना', 'આ કેમ બન્યું'),
      story1: g(
        'Most repair shops in India run on a notebook at the counter, a WhatsApp thread per customer, and an Excel sheet somebody updates on Sundays. It works, right up to the point where two of the three disagree.',
        'भारत की ज़्यादातर रिपेयर शॉप काउंटर की नोटबुक, हर ग्राहक के लिए एक व्हाट्सएप चैट, और रविवार को कोई अपडेट करने वाली एक्सेल शीट पर चलती हैं। यह चलता है — जब तक तीनों में से दो एक-दूसरे से मेल न खाएँ।',
        'ભારતની મોટાભાગની રિપેર શોપ કાઉન્ટરની નોટબુક, દરેક ગ્રાહક માટે એક વોટ્સએપ ચેટ, અને રવિવારે કોઈ અપડેટ કરતી એક્સેલ શીટ પર ચાલે છે. આ ચાલે છે — જ્યાં સુધી ત્રણમાંથી બે એકબીજા સાથે મેળ ન ખાય.'
      ),
      story2: g(
        'The software that claims to fix this is usually either a billing app that knows nothing about repairs, or a large ERP priced and shaped for a factory. Neither knows what a job card is, or that the person typing at the counter may not be comfortable in English.',
        'जो सॉफ़्टवेयर इसे ठीक करने का दावा करते हैं वे आम तौर पर या तो बिलिंग ऐप होते हैं जिन्हें रिपेयर की समझ नहीं, या बड़े ERP जो फ़ैक्टरी के हिसाब से बने और महँगे हैं। दोनों को न जॉब कार्ड का पता है, न यह कि काउंटर पर टाइप करने वाले को अंग्रेज़ी सहज न हो सकती है।',
        'જે સોફ્ટવેર આને ઠીક કરવાનો દાવો કરે છે તે સામાન્ય રીતે કાં તો બિલિંગ એપ હોય છે જેને રિપેરની સમજ નથી, કાં તો મોટા ERP જે ફેક્ટરી પ્રમાણે બનેલા અને મોંઘા છે. બંનેને ન જોબ કાર્ડની ખબર છે, ન એ કે કાઉન્ટર પર ટાઇપ કરનારને અંગ્રેજી સહજ ન હોઈ શકે.'
      ),
      story3: g(
        'So this was built around the job card instead of around the invoice, in three languages from the start, and given away — because a shop that cannot afford software is exactly the shop that needs it.',
        'इसलिए यह इनवॉइस के बजाय जॉब कार्ड के आसपास बनाया गया, शुरू से तीन भाषाओं में, और मुफ़्त दिया गया — क्योंकि जो दुकान सॉफ़्टवेयर का ख़र्च नहीं उठा सकती, उसे ही उसकी सबसे ज़्यादा ज़रूरत है।',
        'તેથી આ ઇન્વોઇસના બદલે જોબ કાર્ડની આસપાસ બનાવ્યું, શરૂથી ત્રણ ભાષામાં, અને મફત આપ્યું — કારણ કે જે દુકાન સોફ્ટવેરનો ખર્ચ ઉઠાવી શકતી નથી, તેને જ તેની સૌથી વધુ જરૂર છે.'
      ),
      detailsTitle: g('Company details', 'कंपनी की जानकारी', 'કંપનીની માહિતી'),
      legalName: g('Registered name', 'रजिस्टर्ड नाम', 'રજિસ્ટર્ડ નામ'),
      builtFor: g('Built for', 'किसके लिए बना', 'કોના માટે બનેલું'),
      builtForValue: g(
        'Mobile and electronics repair shops, and second-hand device dealers',
        'मोबाइल और इलेक्ट्रॉनिक्स रिपेयर शॉप, और सेकंड-हैंड डिवाइस डीलर',
        'મોબાઇલ અને ઇલેક્ટ્રોનિક્સ રિપેર શોપ, અને સેકન્ડ-હેન્ડ ડિવાઇસ ડીલર'
      ),
      principlesEyebrow: g('How we build', 'हम कैसे बनाते हैं', 'અમે કેવી રીતે બનાવીએ'),
      principlesTitle: g(
        'Four things we decided at the start',
        'चार बातें जो हमने शुरू में तय कीं',
        'ચાર વાતો જે અમે શરૂમાં નક્કી કરી'
      ),
      principles: {
        oneSystem: {
          title: g('One system, not five', 'एक सिस्टम, पाँच नहीं', 'એક સિસ્ટમ, પાંચ નહીં'),
          body: g(
            'If a number has to be typed twice, we have not finished the feature.',
            'अगर कोई आँकड़ा दो बार टाइप करना पड़े, तो हमने फ़ीचर पूरा नहीं किया।',
            'જો કોઈ આંકડો બે વાર ટાઇપ કરવો પડે, તો અમે ફીચર પૂરું કર્યું નથી.'
          ),
        },
        everyone: {
          title: g('Everyone reads it', 'सब पढ़ सकें', 'બધા વાંચી શકે'),
          body: g(
            'Three languages and a real accessibility toolbar, not an afterthought.',
            'तीन भाषाएँ और असली सुलभता टूलबार — बाद में जोड़ी गई चीज़ नहीं।',
            'ત્રણ ભાષાઓ અને સાચું સુલભતા ટૂલબાર — પછી ઉમેરેલી વસ્તુ નહીં.'
          ),
        },
        realShops: {
          title: g('Shaped by real shops', 'असली दुकानों से बना', 'સાચી દુકાનોથી બનેલું'),
          body: g(
            'Built around the job card, because that is what the counter actually works from.',
            'जॉब कार्ड के आसपास बना, क्योंकि काउंटर असल में उसी से चलता है।',
            'જોબ કાર્ડની આસપાસ બનેલું, કારણ કે કાઉન્ટર ખરેખર એનાથી જ ચાલે છે.'
          ),
        },
        yourData: {
          title: g('Your data stays yours', 'डेटा आपका ही रहे', 'ડેટા તમારો જ રહે'),
          body: g(
            'Exportable at any time, and never sold to anyone.',
            'जब चाहें एक्सपोर्ट करें, और किसी को कभी बेचा नहीं जाएगा।',
            'જ્યારે ઇચ્છો એક્સપોર્ટ કરો, અને કોઈને કદી વેચાશે નહીં.'
          ),
        },
      },
    },

    contact: {
      title: g('Talk to a person', 'किसी व्यक्ति से बात करें', 'કોઈ વ્યક્તિ સાથે વાત કરો'),
      lead: g(
        'WhatsApp is fastest. There is no ticket queue and no chatbot in the way.',
        'व्हाट्सएप सबसे तेज़ है। कोई टिकट कतार नहीं, बीच में कोई चैटबॉट नहीं।',
        'વોટ્સએપ સૌથી ઝડપી છે. કોઈ ટિકિટ કતાર નહીં, વચ્ચે કોઈ ચેટબોટ નહીં.'
      ),
      channelsTitle: g('Ways to reach us', 'हमसे संपर्क के तरीक़े', 'અમારો સંપર્ક કરવાની રીતો'),
      hoursTitle: g('Hours', 'समय', 'સમય'),
      demoTitle: g('Ask for a demo', 'डेमो के लिए कहें', 'ડેમો માટે કહો'),
      demoLead: g(
        'We will walk through the software on your own shop’s example. Mention these four things and we can make the call useful straight away:',
        'हम आपकी ही दुकान के उदाहरण पर सॉफ़्टवेयर दिखाएँगे। ये चार बातें बता दें तो बातचीत सीधे काम की हो जाएगी:',
        'અમે તમારી જ દુકાનના ઉદાહરણ પર સોફ્ટવેર બતાવીશું. આ ચાર વાતો કહી દો તો વાતચીત સીધી કામની થઈ જશે:'
      ),
      demoPoints: {
        shopName: g(
          'Your shop name and city',
          'आपकी दुकान का नाम और शहर',
          'તમારી દુકાનનું નામ અને શહેર'
        ),
        staffCount: g(
          'How many people work there',
          'वहाँ कितने लोग काम करते हैं',
          'ત્યાં કેટલા લોકો કામ કરે છે'
        ),
        currentSystem: g(
          'What you use today',
          'आज आप क्या इस्तेमाल करते हैं',
          'આજે તમે શું વાપરો છો'
        ),
        language: g(
          'Which language you prefer',
          'आपको कौन सी भाषा ठीक लगती है',
          'તમને કઈ ભાષા યોગ્ય લાગે છે'
        ),
      },
      channels: {
        whatsapp: {
          title: g('WhatsApp', 'व्हाट्सएप', 'વોટ્સએપ'),
          note: g(
            'Usually the fastest reply',
            'आम तौर पर सबसे तेज़ जवाब',
            'સામાન્ય રીતે સૌથી ઝડપી જવાબ'
          ),
        },
        phone: {
          title: g('Call us', 'कॉल करें', 'કોલ કરો'),
          note: g('During working hours', 'काम के समय में', 'કામના સમયમાં'),
        },
        support: {
          title: g('Support', 'सपोर्ट', 'સપોર્ટ'),
          note: g('For an existing account', 'मौजूदा अकाउंट के लिए', 'હાલના એકાઉન્ટ માટે'),
        },
        sales: {
          title: g('Demo and setup', 'डेमो और सेटअप', 'ડેમો અને સેટઅપ'),
          note: g('For a new shop', 'नई दुकान के लिए', 'નવી દુકાન માટે'),
        },
      },
      selfServeTitle: g(
        'Or skip the conversation entirely',
        'या बातचीत की ज़रूरत ही न पड़े',
        'અથવા વાતચીતની જરૂર જ ન પડે'
      ),
      selfServeLead: g(
        'Nothing here needs a sales call. Create an account and the software sets your shop up on its own.',
        'यहाँ किसी चीज़ के लिए सेल्स कॉल ज़रूरी नहीं। अकाउंट बनाइए और सॉफ़्टवेयर ख़ुद आपकी दुकान सेट कर देगा।',
        'અહીં કોઈ વસ્તુ માટે સેલ્સ કોલ જરૂરી નથી. એકાઉન્ટ બનાવો અને સોફ્ટવેર પોતે તમારી દુકાન સેટ કરી દેશે.'
      ),
    },
  },
}
