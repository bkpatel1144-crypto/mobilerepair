/**
 * /faq, /privacy and /terms.
 *
 * The legal text is written to describe what this app actually does rather than pasted from a
 * template — data lives in the project's own Firestore database, no server of ours sits in the
 * path, nothing is sold, and export is available from Backup & Restore. Narrow and accurate beats
 * broad and untrue. Still needs review by someone qualified; see WEB_PLAN.md.
 */
const g = (en, hi, gu) => ({ en, hi, gu })
const qa = (q, a) => ({ q, a })

module.exports = {
  marketing: {
    faq: {
      title: g('Questions, answered plainly', 'सवाल, सीधे जवाब', 'સવાલો, સીધા જવાબ'),
      lead: g(
        'Grouped so you can read the part that worries you and skip the rest.',
        'इस तरह बाँटा गया है कि जो बात आपको खटक रही है वही पढ़ें, बाक़ी छोड़ दें।',
        'એવી રીતે વહેંચેલું છે કે જે વાત તમને ખટકે એ જ વાંચો, બાકી છોડી દો.'
      ),
      ctaTitle: g('Still not answered?', 'जवाब नहीं मिला?', 'જવાબ ન મળ્યો?'),
      ctaLead: g(
        'Ask on WhatsApp and a person will reply, usually the same day.',
        'व्हाट्सएप पर पूछें, कोई व्यक्ति जवाब देगा — आम तौर पर उसी दिन।',
        'વોટ્સએપ પર પૂછો, કોઈ વ્યક્તિ જવાબ આપશે — સામાન્ય રીતે એ જ દિવસે.'
      ),
      groups: {
        money: g('Cost and billing', 'ख़र्च और बिलिंग', 'ખર્ચ અને બિલિંગ'),
        data: g('Your data', 'आपका डेटा', 'તમારો ડેટા'),
        usage: g('Using it day to day', 'रोज़ का इस्तेमाल', 'રોજનો વપરાશ'),
        staff: g('Staff and branches', 'स्टाफ़ और ब्रांच', 'સ્ટાફ અને બ્રાન્ચ'),
      },
      q: {
        money: {
          reallyFree: qa(
            g('Is it really free?', 'क्या यह सच में मुफ़्त है?', 'શું આ ખરેખર મફત છે?'),
            g(
              'Yes. Every feature, for unlimited staff and jobs, with no card and no expiry date.',
              'हाँ। हर फ़ीचर, अनलिमिटेड स्टाफ़ और जॉब के लिए, बिना कार्ड और बिना एक्सपायरी।',
              'હા. દરેક ફીચર, અમર્યાદિત સ્ટાફ અને જોબ માટે, કાર્ડ વગર અને એક્સપાયરી વગર.'
            )
          ),
          catch: qa(
            g("What's the catch?", 'पेच क्या है?', 'પેચ શું છે?'),
            g(
              'There is no advertising, and your data is not sold or used as the product. Support is best-effort over WhatsApp and email rather than a contracted response time — that is the honest trade.',
              'कोई विज्ञापन नहीं, और आपका डेटा न बेचा जाता है न प्रोडक्ट की तरह इस्तेमाल होता है। सपोर्ट व्हाट्सएप और ईमेल पर पूरी कोशिश के साथ मिलता है, किसी तय समय की गारंटी के साथ नहीं — यही सच्चा सौदा है।',
              'કોઈ જાહેરાત નહીં, અને તમારો ડેટા ન વેચાય છે ન પ્રોડક્ટ તરીકે વપરાય છે. સપોર્ટ વોટ્સએપ અને ઈમેલ પર પૂરી કોશિશ સાથે મળે છે, કોઈ નક્કી સમયની ગેરંટી સાથે નહીં — આ જ સાચો સોદો છે.'
            )
          ),
          futureCharge: qa(
            g('Will you start charging later?', 'क्या आगे पैसे लेंगे?', 'શું આગળ પૈસા લેશો?'),
            g(
              'If that ever changes it will be said plainly on this site first, and your existing data will remain exportable either way.',
              'अगर यह कभी बदला तो पहले इसी साइट पर साफ़ लिखा जाएगा, और आपका मौजूदा डेटा हर हाल में एक्सपोर्ट किया जा सकेगा।',
              'જો આ કદી બદલાય તો પહેલાં આ જ સાઇટ પર સ્પષ્ટ લખાશે, અને તમારો હાલનો ડેટા દરેક સ્થિતિમાં એક્સપોર્ટ કરી શકાશે.'
            )
          ),
          hiddenLimits: qa(
            g('Are there hidden limits?', 'कोई छिपी सीमा है?', 'કોઈ છૂપી મર્યાદા છે?'),
            g(
              'No caps on job cards, customers, staff or branches. The only real limits are your device and your internet connection.',
              'जॉब कार्ड, ग्राहक, स्टाफ़ या ब्रांच पर कोई सीमा नहीं। असली सीमा सिर्फ़ आपका डिवाइस और इंटरनेट है।',
              'જોબ કાર્ડ, ગ્રાહક, સ્ટાફ કે બ્રાન્ચ પર કોઈ મર્યાદા નહીં. સાચી મર્યાદા ફક્ત તમારું ડિવાઇસ અને ઇન્ટરનેટ છે.'
            )
          ),
        },
        data: {
          migration: qa(
            g(
              'Can I bring my existing data?',
              'क्या मैं पुराना डेटा ला सकता हूँ?',
              'શું હું જૂનો ડેટા લાવી શકું?'
            ),
            g(
              'Yes. Send whatever you have — Excel, a billing app export, even photographs of a register — and we will help move it in.',
              'हाँ। आपके पास जो हो भेज दें — एक्सेल, बिलिंग ऐप का एक्सपोर्ट, या रजिस्टर की फ़ोटो भी — हम उसे लाने में मदद करेंगे।',
              'હા. તમારી પાસે જે હોય મોકલો — એક્સેલ, બિલિંગ એપનું એક્સપોર્ટ, કે રજિસ્ટરના ફોટા પણ — અમે તેને લાવવામાં મદદ કરીશું.'
            )
          ),
          ownData: qa(
            g('Who owns what I enter?', 'जो मैं डालूँ वह किसका है?', 'જે હું નાખું તે કોનું છે?'),
            g(
              'You do. It is your shop’s record of your own customers and accounts.',
              'आपका। यह आपकी दुकान का, आपके ही ग्राहकों और खातों का रिकॉर्ड है।',
              'તમારો. આ તમારી દુકાનનો, તમારા જ ગ્રાહકો અને ખાતાનો રેકોર્ડ છે.'
            )
          ),
          export: qa(
            g(
              'Can I get my data out?',
              'क्या डेटा बाहर निकाल सकता हूँ?',
              'શું ડેટા બહાર કાઢી શકું?'
            ),
            g(
              'Yes, at any time. Backup & Restore exports a full copy, and every list screen exports to CSV or Excel.',
              'हाँ, जब चाहें। बैकअप और रीस्टोर पूरी कॉपी एक्सपोर्ट करता है, और हर लिस्ट स्क्रीन CSV या Excel में एक्सपोर्ट होती है।',
              'હા, જ્યારે ઇચ્છો. બેકઅપ અને રીસ્ટોર સંપૂર્ણ કોપી એક્સપોર્ટ કરે છે, અને દરેક લિસ્ટ સ્ક્રીન CSV કે Excel માં એક્સપોર્ટ થાય છે.'
            )
          ),
          backup: qa(
            g('Is it backed up?', 'बैकअप होता है?', 'બેકઅપ થાય છે?'),
            g(
              'Your data sits in Google Cloud Firestore, which is replicated by Google. You can also take your own copy whenever you like from Backup & Restore.',
              'आपका डेटा Google Cloud Firestore में रहता है, जिसे Google ख़ुद कई जगह रखता है। आप बैकअप और रीस्टोर से जब चाहें अपनी कॉपी भी ले सकते हैं।',
              'તમારો ડેટા Google Cloud Firestore માં રહે છે, જેને Google પોતે અનેક જગ્યાએ રાખે છે. તમે બેકઅપ અને રીસ્ટોરથી જ્યારે ઇચ્છો પોતાની કોપી પણ લઈ શકો.'
            )
          ),
          security: qa(
            g(
              'Can another shop see my data?',
              'क्या दूसरी दुकान मेरा डेटा देख सकती है?',
              'શું બીજી દુકાન મારો ડેટા જોઈ શકે?'
            ),
            g(
              'No. Every record is scoped to your company, and the database rules reject a read from any account that does not belong to it — the check is on the server, not just in the app.',
              'नहीं। हर रिकॉर्ड आपकी कंपनी से बँधा है, और डेटाबेस के नियम किसी बाहरी अकाउंट की रीड को रोक देते हैं — जाँच सर्वर पर होती है, सिर्फ़ ऐप में नहीं।',
              'નહીં. દરેક રેકોર્ડ તમારી કંપની સાથે બંધાયેલો છે, અને ડેટાબેઝના નિયમો કોઈ બહારના એકાઉન્ટની રીડ રોકી દે છે — તપાસ સર્વર પર થાય છે, ફક્ત એપમાં નહીં.'
            )
          ),
        },
        usage: {
          mobile: qa(
            g('Does it work on a phone?', 'फ़ोन पर चलता है?', 'ફોન પર ચાલે છે?'),
            g(
              'Yes. It installs to the home screen like an app and every screen is built for a phone as well as a desktop.',
              'हाँ। यह ऐप की तरह होम स्क्रीन पर इंस्टॉल होता है और हर स्क्रीन फ़ोन और डेस्कटॉप दोनों के लिए बनी है।',
              'હા. આ એપની જેમ હોમ સ્ક્રીન પર ઇન્સ્ટોલ થાય છે અને દરેક સ્ક્રીન ફોન અને ડેસ્કટોપ બંને માટે બનેલી છે.'
            )
          ),
          offline: qa(
            g('What if the internet drops?', 'इंटरनेट चला जाए तो?', 'ઇન્ટરનેટ જાય તો?'),
            g(
              'Screens you have already opened keep working from a local copy, and changes sync once the connection returns.',
              'जो स्क्रीन आप पहले खोल चुके हैं वे लोकल कॉपी से चलती रहती हैं, और कनेक्शन आने पर बदलाव सिंक हो जाते हैं।',
              'જે સ્ક્રીન તમે પહેલાં ખોલી ચૂક્યા છો તે લોકલ કોપીથી ચાલતી રહે છે, અને કનેક્શન આવતાં ફેરફાર સિંક થઈ જાય છે.'
            )
          ),
          training: qa(
            g(
              'Will my staff need training?',
              'स्टाफ़ को ट्रेनिंग चाहिए?',
              'સ્ટાફને ટ્રેનિંગ જોઈએ?'
            ),
            g(
              'Creating a job card is designed to be faster than writing it in the notebook. For the rest, ask on WhatsApp and we will walk through it.',
              'जॉब कार्ड बनाना नोटबुक में लिखने से तेज़ हो — इसी हिसाब से बनाया गया है। बाक़ी के लिए व्हाट्सएप पर पूछें, हम समझा देंगे।',
              'જોબ કાર્ડ બનાવવું નોટબુકમાં લખવા કરતાં ઝડપી હોય — એ જ હિસાબે બનાવેલું છે. બાકીના માટે વોટ્સએપ પર પૂછો, અમે સમજાવી દઈશું.'
            )
          ),
          printer: qa(
            g('Will it print on my printer?', 'मेरे प्रिंटर पर छपेगा?', 'મારા પ્રિન્ટર પર છપાશે?'),
            g(
              'Bills and labels print through your browser, so any printer already set up on that computer works. Formats are editable in the print designer.',
              'बिल और लेबल ब्राउज़र से छपते हैं, इसलिए उस कंप्यूटर पर पहले से लगा कोई भी प्रिंटर काम करेगा। फ़ॉर्मैट प्रिंट डिज़ाइनर में बदले जा सकते हैं।',
              'બિલ અને લેબલ બ્રાઉઝરથી છપાય છે, તેથી એ કમ્પ્યુટર પર પહેલેથી લગાવેલું કોઈપણ પ્રિન્ટર કામ કરશે. ફોર્મેટ પ્રિન્ટ ડિઝાઇનરમાં બદલી શકાય છે.'
            )
          ),
          whatsapp: qa(
            g(
              'How do WhatsApp updates work?',
              'व्हाट्सएप अपडेट कैसे चलते हैं?',
              'વોટ્સએપ અપડેટ કેવી રીતે ચાલે છે?'
            ),
            g(
              'The app prepares the message from your template and opens WhatsApp with it ready to send, so it goes from your own number.',
              'ऐप आपके टेम्पलेट से मैसेज तैयार करके व्हाट्सएप खोल देता है, भेजने के लिए तैयार — यानी वह आपके ही नंबर से जाता है।',
              'એપ તમારા ટેમ્પલેટથી મેસેજ તૈયાર કરીને વોટ્સએપ ખોલી દે છે, મોકલવા તૈયાર — એટલે એ તમારા જ નંબરથી જાય છે.'
            )
          ),
        },
        staff: {
          permissions: qa(
            g(
              'Can staff see different things?',
              'क्या स्टाफ़ को अलग-अलग दिखे?',
              'શું સ્ટાફને અલગ-અલગ દેખાય?'
            ),
            g(
              'Yes, down to the individual menu and button. A salesman need never see purchase cost, and a technician need never see the ledger.',
              'हाँ, हर मेन्यू और बटन तक। सेल्समैन को ख़रीद लागत देखने की ज़रूरत नहीं, और टेक्नीशियन को बहीखाता देखने की ज़रूरत नहीं।',
              'હા, દરેક મેનુ અને બટન સુધી. સેલ્સમેનને ખરીદ કિંમત જોવાની જરૂર નથી, અને ટેકનિશિયનને ખાતાવહી જોવાની જરૂર નથી.'
            )
          ),
          staffCount: qa(
            g(
              'How many staff can I add?',
              'कितने स्टाफ़ जोड़ सकता हूँ?',
              'કેટલા સ્ટાફ ઉમેરી શકું?'
            ),
            g(
              'As many as you need. There is no per-user charge.',
              'जितने चाहें। प्रति यूज़र कोई शुल्क नहीं है।',
              'જેટલા ઇચ્છો. પ્રતિ યુઝર કોઈ ચાર્જ નથી.'
            )
          ),
          branches: qa(
            g(
              'Does it handle more than one shop?',
              'एक से ज़्यादा दुकान चलेगी?',
              'એકથી વધુ દુકાન ચાલશે?'
            ),
            g(
              'Yes. Add a branch per location, scope staff to their own, and the owner sees all of them together.',
              'हाँ। हर जगह के लिए ब्रांच जोड़ें, स्टाफ़ को अपनी ब्रांच तक सीमित रखें, और मालिक को सब एक साथ दिखे।',
              'હા. દરેક જગ્યા માટે બ્રાન્ચ ઉમેરો, સ્ટાફને પોતાની બ્રાન્ચ સુધી સીમિત રાખો, અને માલિકને બધું એકસાથે દેખાય.'
            )
          ),
          languages: qa(
            g(
              'Can two people use different languages?',
              'दो लोग अलग भाषा में चला सकते हैं?',
              'બે લોકો અલગ ભાષામાં ચલાવી શકે?'
            ),
            g(
              'Yes. Language is per person, not per shop, so each account keeps its own choice.',
              'हाँ। भाषा हर व्यक्ति की होती है, दुकान की नहीं — हर अकाउंट अपनी पसंद रखता है।',
              'હા. ભાષા દરેક વ્યક્તિની હોય છે, દુકાનની નહીં — દરેક એકાઉન્ટ પોતાની પસંદ રાખે છે.'
            )
          ),
        },
      },
    },

    legal: {
      eyebrow: g('Legal', 'कानूनी', 'કાનૂની'),
      lastUpdated: g('Last updated {{date}}', 'अंतिम अपडेट {{date}}', 'છેલ્લે અપડેટ {{date}}'),
      lastUpdatedDate: g('September 2026', 'सितंबर 2026', 'સપ્ટેમ્બર 2026'),
      contactTitle: g('Contact', 'संपर्क', 'સંપર્ક'),
      contactBody: g(
        'For any question about this document, or to ask for a copy or deletion of your data, write to {{company}} at the address below.',
        'इस दस्तावेज़ के बारे में किसी भी सवाल के लिए, या अपने डेटा की कॉपी या डिलीट के लिए, नीचे दिए पते पर {{company}} को लिखें।',
        'આ દસ્તાવેજ વિશે કોઈપણ સવાલ માટે, અથવા તમારા ડેટાની કોપી કે ડિલીટ માટે, નીચે આપેલા સરનામે {{company}} ને લખો.'
      ),
      privacy: {
        title: g('Privacy policy', 'प्राइवेसी पॉलिसी', 'પ્રાઇવસી પોલિસી'),
        lead: g(
          'What this software stores, why, and what you can do about it.',
          'यह सॉफ़्टवेयर क्या स्टोर करता है, क्यों, और आप उसके बारे में क्या कर सकते हैं।',
          'આ સોફ્ટવેર શું સ્ટોર કરે છે, કેમ, અને તમે તેના વિશે શું કરી શકો.'
        ),
        sections: {
          collect: {
            title: g('What we collect', 'हम क्या इकट्ठा करते हैं', 'અમે શું એકત્ર કરીએ છીએ'),
            body: g(
              'Your account details (name, email and optional mobile number), your company and branch details, and the business records you enter — customers, job cards, payments and stock. We also record login events and an audit trail of changes made inside your company.',
              'आपके अकाउंट की जानकारी (नाम, ईमेल और वैकल्पिक मोबाइल नंबर), आपकी कंपनी और ब्रांच की जानकारी, और आपके डाले हुए बिज़नेस रिकॉर्ड — ग्राहक, जॉब कार्ड, पेमेंट और स्टॉक। हम लॉगिन की घटनाएँ और आपकी कंपनी में हुए बदलावों का ऑडिट रिकॉर्ड भी रखते हैं।',
              'તમારા એકાઉન્ટની માહિતી (નામ, ઈમેલ અને વૈકલ્પિક મોબાઇલ નંબર), તમારી કંપની અને બ્રાન્ચની માહિતી, અને તમે નાખેલા બિઝનેસ રેકોર્ડ — ગ્રાહકો, જોબ કાર્ડ, પેમેન્ટ અને સ્ટોક. અમે લોગિનની ઘટનાઓ અને તમારી કંપનીમાં થયેલા ફેરફારોનો ઓડિટ રેકોર્ડ પણ રાખીએ છીએ.'
            ),
          },
          use: {
            title: g('How it is used', 'इसका उपयोग कैसे होता है', 'આનો ઉપયોગ કેવી રીતે થાય છે'),
            body: g(
              'Only to run the software for you: to show you your own records, to enforce the permissions you configure, and to let you print and export. It is not used for advertising and is not sold or shared for marketing by anyone.',
              'सिर्फ़ आपके लिए सॉफ़्टवेयर चलाने के लिए: आपके ही रिकॉर्ड दिखाने, आपकी तय की गई अनुमतियाँ लागू करने, और प्रिंट व एक्सपोर्ट देने के लिए। इसका उपयोग विज्ञापन के लिए नहीं होता और इसे मार्केटिंग के लिए किसी को बेचा या साझा नहीं किया जाता।',
              'ફક્ત તમારા માટે સોફ્ટવેર ચલાવવા માટે: તમારા જ રેકોર્ડ બતાવવા, તમે નક્કી કરેલી પરમિશન લાગુ કરવા, અને પ્રિન્ટ અને એક્સપોર્ટ આપવા માટે. આનો ઉપયોગ જાહેરાત માટે થતો નથી અને તેને માર્કેટિંગ માટે કોઈને વેચાતો કે શેર કરાતો નથી.'
            ),
          },
          storage: {
            title: g('Where it is stored', 'यह कहाँ रखा जाता है', 'આ ક્યાં રખાય છે'),
            body: g(
              'In Google Cloud Firestore and Firebase Authentication, operated by Google. Your browser also keeps a local copy so the app keeps working when the connection drops.',
              'Google द्वारा संचालित Google Cloud Firestore और Firebase Authentication में। आपका ब्राउज़र एक लोकल कॉपी भी रखता है ताकि कनेक्शन जाने पर ऐप चलता रहे।',
              'Google દ્વારા સંચાલિત Google Cloud Firestore અને Firebase Authentication માં. તમારું બ્રાઉઝર એક લોકલ કોપી પણ રાખે છે જેથી કનેક્શન જાય ત્યારે એપ ચાલતી રહે.'
            ),
          },
          sharing: {
            title: g('Who else sees it', 'इसे और कौन देखता है', 'આને બીજું કોણ જુએ છે'),
            body: g(
              'Only the accounts you create inside your own company, and only as far as the permissions you give them allow. Google acts as our infrastructure provider. We do not sell your data.',
              'सिर्फ़ वे अकाउंट जो आप अपनी कंपनी में बनाते हैं, और उतना ही जितनी अनुमति आप उन्हें देते हैं। Google हमारा इन्फ़्रास्ट्रक्चर प्रदाता है। हम आपका डेटा नहीं बेचते।',
              'ફક્ત એ એકાઉન્ટ જે તમે તમારી કંપનીમાં બનાવો છો, અને એટલું જ જેટલી પરમિશન તમે તેમને આપો છો. Google અમારો ઇન્ફ્રાસ્ટ્રક્ચર પ્રદાતા છે. અમે તમારો ડેટા વેચતા નથી.'
            ),
          },
          retention: {
            title: g('How long it is kept', 'कितने समय तक रखा जाता है', 'કેટલા સમય સુધી રખાય છે'),
            body: g(
              'For as long as your account is open. Business records such as job cards and payments are kept as a permanent record unless you ask for them to be removed.',
              'जब तक आपका अकाउंट चालू है। जॉब कार्ड और पेमेंट जैसे बिज़नेस रिकॉर्ड स्थायी रिकॉर्ड की तरह रखे जाते हैं, जब तक आप हटाने के लिए न कहें।',
              'જ્યાં સુધી તમારું એકાઉન્ટ ચાલુ છે. જોબ કાર્ડ અને પેમેન્ટ જેવા બિઝનેસ રેકોર્ડ કાયમી રેકોર્ડ તરીકે રખાય છે, જ્યાં સુધી તમે હટાવવા ન કહો.'
            ),
          },
          rights: {
            title: g('Your rights', 'आपके अधिकार', 'તમારા અધિકારો'),
            body: g(
              'You can export a full copy at any time from Backup & Restore, correct anything through the app, and ask us in writing to delete your account and its data.',
              'आप बैकअप और रीस्टोर से कभी भी पूरी कॉपी एक्सपोर्ट कर सकते हैं, ऐप से कुछ भी ठीक कर सकते हैं, और लिखकर हमें अपना अकाउंट व डेटा डिलीट करने के लिए कह सकते हैं।',
              'તમે બેકઅપ અને રીસ્ટોરથી કદી પણ સંપૂર્ણ કોપી એક્સપોર્ટ કરી શકો, એપથી કંઈપણ સુધારી શકો, અને લખીને અમને તમારું એકાઉન્ટ અને ડેટા ડિલીટ કરવા કહી શકો.'
            ),
          },
          cookies: {
            title: g(
              'Cookies and local storage',
              'कुकीज़ और लोकल स्टोरेज',
              'કૂકીઝ અને લોકલ સ્ટોરેજ'
            ),
            body: g(
              'We use browser storage to keep you signed in and to remember your language, theme and reading preferences. There are no advertising or tracking cookies.',
              'हम ब्राउज़र स्टोरेज का उपयोग आपको साइन इन रखने और आपकी भाषा, थीम और पठन सेटिंग याद रखने के लिए करते हैं। कोई विज्ञापन या ट्रैकिंग कुकी नहीं है।',
              'અમે બ્રાઉઝર સ્ટોરેજનો ઉપયોગ તમને સાઇન ઇન રાખવા અને તમારી ભાષા, થીમ અને વાંચન સેટિંગ યાદ રાખવા માટે કરીએ છીએ. કોઈ જાહેરાત કે ટ્રેકિંગ કૂકી નથી.'
            ),
          },
          children: {
            title: g('Age', 'उम्र', 'ઉંમર'),
            body: g(
              'This is business software and is not intended for use by anyone under 18.',
              'यह बिज़नेस सॉफ़्टवेयर है और 18 साल से कम उम्र के किसी के उपयोग के लिए नहीं है।',
              'આ બિઝનેસ સોફ્ટવેર છે અને 18 વર્ષથી નીચેના કોઈના વપરાશ માટે નથી.'
            ),
          },
          changes: {
            title: g('Changes to this policy', 'इस पॉलिसी में बदलाव', 'આ પોલિસીમાં ફેરફાર'),
            body: g(
              'If this policy changes, the updated date above will change with it, and any material change will be stated plainly rather than buried in a revision.',
              'अगर यह पॉलिसी बदलेगी तो ऊपर लिखी तारीख़ भी बदलेगी, और कोई बड़ा बदलाव किसी संशोधन में छिपाने के बजाय साफ़ लिखा जाएगा।',
              'જો આ પોલિસી બદલાશે તો ઉપર લખેલી તારીખ પણ બદલાશે, અને કોઈ મોટો ફેરફાર કોઈ સુધારામાં છુપાવવાના બદલે સ્પષ્ટ લખાશે.'
            ),
          },
        },
      },
      terms: {
        title: g('Terms of use', 'उपयोग की शर्तें', 'વપરાશની શરતો'),
        lead: g(
          'The agreement between your shop and AIM ENTERPRISE for using this software.',
          'इस सॉफ़्टवेयर के उपयोग के लिए आपकी दुकान और AIM ENTERPRISE के बीच समझौता।',
          'આ સોફ્ટવેરના વપરાશ માટે તમારી દુકાન અને AIM ENTERPRISE વચ્ચેનો કરાર.'
        ),
        sections: {
          acceptance: {
            title: g('Accepting these terms', 'इन शर्तों को स्वीकार करना', 'આ શરતો સ્વીકારવી'),
            body: g(
              'By creating an account you accept these terms on behalf of your business.',
              'अकाउंट बनाकर आप अपने बिज़नेस की ओर से इन शर्तों को स्वीकार करते हैं।',
              'એકાઉન્ટ બનાવીને તમે તમારા ધંધા વતી આ શરતો સ્વીકારો છો.'
            ),
          },
          service: {
            title: g('What is provided', 'क्या दिया जाता है', 'શું આપવામાં આવે છે'),
            body: g(
              'Access to the software as it exists at the time, free of charge, for running a repair or second-hand-device business.',
              'रिपेयर या सेकंड-हैंड डिवाइस का कारोबार चलाने के लिए, सॉफ़्टवेयर जैसा उस समय है वैसा, बिना शुल्क।',
              'રિપેર કે સેકન્ડ-હેન્ડ ડિવાઇસનો ધંધો ચલાવવા માટે, સોફ્ટવેર જેવું તે સમયે છે તેવું, વિના શુલ્ક.'
            ),
          },
          account: {
            title: g('Your account', 'आपका अकाउंट', 'તમારું એકાઉન્ટ'),
            body: g(
              'You are responsible for your password, for the staff accounts you create, and for the permissions you give them. Tell us promptly if you believe an account has been misused.',
              'आपके पासवर्ड, आपके बनाए स्टाफ़ अकाउंट, और उन्हें दी गई अनुमतियों की ज़िम्मेदारी आपकी है। अगर लगे कि किसी अकाउंट का दुरुपयोग हुआ है तो तुरंत बताएँ।',
              'તમારા પાસવર્ડ, તમે બનાવેલા સ્ટાફ એકાઉન્ટ, અને તેમને આપેલી પરમિશનની જવાબદારી તમારી છે. જો લાગે કે કોઈ એકાઉન્ટનો દુરુપયોગ થયો છે તો તરત જણાવો.'
            ),
          },
          acceptableUse: {
            title: g('Acceptable use', 'उचित उपयोग', 'યોગ્ય વપરાશ'),
            body: g(
              'Do not use it for anything unlawful, do not attempt to reach another company’s data, and do not try to disrupt the service for others.',
              'इसका उपयोग किसी ग़ैरक़ानूनी काम के लिए न करें, किसी दूसरी कंपनी के डेटा तक पहुँचने की कोशिश न करें, और दूसरों के लिए सेवा बाधित करने की कोशिश न करें।',
              'આનો ઉપયોગ કોઈ ગેરકાયદેસર કામ માટે ન કરો, બીજી કંપનીના ડેટા સુધી પહોંચવાનો પ્રયાસ ન કરો, અને બીજા માટે સેવા ખોરવવાનો પ્રયાસ ન કરો.'
            ),
          },
          yourData: {
            title: g('Your data', 'आपका डेटा', 'તમારો ડેટા'),
            body: g(
              'The records you enter remain yours. You are responsible for their accuracy and for having the right to store the customer details you enter.',
              'आपके डाले हुए रिकॉर्ड आपके ही रहते हैं। उनकी सटीकता और आपके डाले गए ग्राहक विवरण रखने का अधिकार आपकी ज़िम्मेदारी है।',
              'તમે નાખેલા રેકોર્ડ તમારા જ રહે છે. તેમની સચોટતા અને તમે નાખેલી ગ્રાહક વિગત રાખવાનો અધિકાર તમારી જવાબદારી છે.'
            ),
          },
          availability: {
            title: g('Availability', 'उपलब्धता', 'ઉપલબ્ધતા'),
            body: g(
              'We aim to keep the service running but do not promise uninterrupted availability. Since the service is free, no uptime guarantee is offered.',
              'हम सेवा चालू रखने की कोशिश करते हैं, लेकिन बिना रुकावट उपलब्धता का वादा नहीं करते। सेवा मुफ़्त है, इसलिए अपटाइम की कोई गारंटी नहीं दी जाती।',
              'અમે સેવા ચાલુ રાખવાનો પ્રયાસ કરીએ છીએ, પણ વિના અવરોધ ઉપલબ્ધતાનું વચન આપતા નથી. સેવા મફત છે, તેથી અપટાઇમની કોઈ ગેરંટી અપાતી નથી.'
            ),
          },
          warranty: {
            title: g('No warranty', 'कोई वारंटी नहीं', 'કોઈ વોરંટી નહીં'),
            body: g(
              'The software is provided as it is. Keep your own exported copies of anything your business depends on.',
              'सॉफ़्टवेयर जैसा है वैसा दिया जाता है। जिस चीज़ पर आपका बिज़नेस टिका है, उसकी अपनी एक्सपोर्ट की हुई कॉपी रखें।',
              'સોફ્ટવેર જેવું છે તેવું આપવામાં આવે છે. જે વસ્તુ પર તમારો ધંધો ટકે છે, તેની પોતાની એક્સપોર્ટ કરેલી કોપી રાખો.'
            ),
          },
          liability: {
            title: g('Liability', 'दायित्व', 'જવાબદારી'),
            body: g(
              'To the extent the law allows, AIM ENTERPRISE is not liable for business losses arising from use of the software.',
              'क़ानून जहाँ तक अनुमति देता है, सॉफ़्टवेयर के उपयोग से होने वाले बिज़नेस नुक़सान के लिए AIM ENTERPRISE ज़िम्मेदार नहीं है।',
              'કાયદો જ્યાં સુધી પરવાનગી આપે, સોફ્ટવેરના વપરાશથી થતા ધંધાકીય નુકસાન માટે AIM ENTERPRISE જવાબદાર નથી.'
            ),
          },
          termination: {
            title: g('Ending the agreement', 'समझौता समाप्त करना', 'કરાર સમાપ્ત કરવો'),
            body: g(
              'You can stop using the service at any time and export your data first. We may suspend an account that breaks these terms.',
              'आप कभी भी सेवा छोड़ सकते हैं और पहले अपना डेटा एक्सपोर्ट कर सकते हैं। इन शर्तों को तोड़ने वाले अकाउंट को हम रोक सकते हैं।',
              'તમે કદી પણ સેવા છોડી શકો અને પહેલાં તમારો ડેટા એક્સપોર્ટ કરી શકો. આ શરતો તોડનારા એકાઉન્ટને અમે રોકી શકીએ.'
            ),
          },
          governing: {
            title: g('Governing law', 'लागू क़ानून', 'લાગુ કાયદો'),
            body: g(
              'These terms are governed by the laws of India, with the courts of Gujarat having jurisdiction.',
              'ये शर्तें भारत के क़ानून के अधीन हैं, और गुजरात की अदालतों का क्षेत्राधिकार होगा।',
              'આ શરતો ભારતના કાયદા હેઠળ છે, અને ગુજરાતની અદાલતોનું ક્ષેત્રાધિકાર રહેશે.'
            ),
          },
          changes: {
            title: g('Changes to these terms', 'इन शर्तों में बदलाव', 'આ શરતોમાં ફેરફાર'),
            body: g(
              'If these terms change, the updated date above will change with them. Continuing to use the service means accepting the revised terms.',
              'अगर ये शर्तें बदलेंगी तो ऊपर लिखी तारीख़ भी बदलेगी। सेवा का उपयोग जारी रखना बदली शर्तों को स्वीकार करना माना जाएगा।',
              'જો આ શરતો બદલાશે તો ઉપર લખેલી તારીખ પણ બદલાશે. સેવાનો વપરાશ ચાલુ રાખવો બદલાયેલી શરતો સ્વીકારવા સમાન ગણાશે.'
            ),
          },
        },
      },
    },
  },
}
