/**
 * Batch 8 — everything left: validation messages, confirm dialogs, search placeholders, toast
 * text, and the marketing FAQ. These are the strings that lived inside JSX expressions and call
 * arguments, which the original three extraction patterns never saw.
 *
 * `same: true` marks the two that must not be translated: "OVERWRITE" is the phrase a user types
 * to confirm overwriting live data and is compared against `CONFIRM_PHRASE`, and "UPI" is written
 * in English by every shop regardless of language.
 */
module.exports = {
  // ---- Shared ------------------------------------------------------------------------------
  'shared.saveChanges': { hi: 'बदलाव सहेजें', gu: 'ફેરફાર સાચવો' },
  'shared.ready': { hi: 'तैयार', gu: 'તૈયાર' },
  'shared.delivered': { hi: 'सौंप दिया', gu: 'આપી દીધું' },
  'shared.success': { hi: 'सफल', gu: 'સફળ' },
  'shared.blocked': { hi: 'रोका गया', gu: 'અટકાવેલ' },
  'shared.failed': { hi: 'असफल', gu: 'નિષ્ફળ' },
  'shared.unassigned': { hi: 'किसी को नहीं सौंपा', gu: 'કોઈને સોંપ્યું નથી' },
  'shared.searchReceiptParty': { hi: 'रसीद, पार्टी खोजें...', gu: 'રસીદ, પાર્ટી શોધો...' },
  'shared.enterAnAmountGreaterThanZero': {
    hi: 'शून्य से अधिक राशि डालें।',
    gu: 'શૂન્યથી વધુ રકમ નાખો.',
  },
  'shared.searchJobCardCustomerMobile': {
    hi: 'जॉब कार्ड, ग्राहक, मोबाइल खोजें...',
    gu: 'જોબ કાર્ડ, ગ્રાહક, મોબાઇલ શોધો...',
  },
  'shared.selectADeviceType': { hi: 'डिवाइस प्रकार चुनें।', gu: 'ડિવાઇસ પ્રકાર પસંદ કરો.' },
  'shared.pickADeviceTypeFirst': {
    hi: 'पहले डिवाइस प्रकार चुनें',
    gu: 'પહેલાં ડિવાઇસ પ્રકાર પસંદ કરો',
  },
  'shared.pickABrandFirst': { hi: 'पहले ब्रांड चुनें', gu: 'પહેલાં બ્રાન્ડ પસંદ કરો' },
  'shared.receiptInvoiceBrandModel': {
    hi: 'रसीद/बिल #, ब्रांड, मॉडल...',
    gu: 'રસીદ/બિલ #, બ્રાન્ડ, મોડેલ...',
  },
  'shared.somethingWentWrong': { hi: 'कुछ गड़बड़ हो गई।', gu: 'કંઈક ખોટું થયું.' },

  // ---- Components --------------------------------------------------------------------------
  'components.auth.ipBlockedScreen.yourCurrentIpCouldNotBe': {
    hi: ' आपका मौजूदा IP पता नहीं चल सका।',
    gu: ' તમારું હાલનું IP જાણી શકાયું નથી.',
  },
  'components.layout.appSidebar.collapseSidebar': { hi: 'साइडबार समेटें', gu: 'સાઇડબાર સંકોચો' },
  'components.layout.profileDrawer.fullNameIsRequired': {
    hi: 'पूरा नाम ज़रूरी है।',
    gu: 'પૂરું નામ જરૂરી છે.',
  },
  'components.layout.profileDrawer.couldNotSaveYourProfile': {
    hi: 'आपकी प्रोफ़ाइल सहेजी नहीं जा सकी।',
    gu: 'તમારી પ્રોફાઇલ સાચવી શકાઈ નથી.',
  },
  'components.layout.profileDrawer.newPasswordMustBeAtLeast': {
    hi: 'नया पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।',
    gu: 'નવો પાસવર્ડ ઓછામાં ઓછા 6 અક્ષરનો હોવો જોઈએ.',
  },
  'components.layout.profileDrawer.theTwoNewPasswordsDoNot': {
    hi: 'दोनों नए पासवर्ड मेल नहीं खाते।',
    gu: 'બંને નવા પાસવર્ડ મેળ ખાતા નથી.',
  },
  'components.layout.profileDrawer.theNewPasswordMustBeDifferent': {
    hi: 'नया पासवर्ड मौजूदा पासवर्ड से अलग होना चाहिए।',
    gu: 'નવો પાસવર્ડ હાલના પાસવર્ડથી અલગ હોવો જોઈએ.',
  },
  'components.layout.profileDrawer.updatePassword': {
    hi: 'पासवर्ड बदलें',
    gu: 'પાસવર્ડ બદલો',
  },
  'components.marketing.jobCardMockup.received': { hi: 'मिला', gu: 'મળ્યું' },
  'components.marketing.jobCardMockup.diagnosis': { hi: 'जाँच', gu: 'તપાસ' },
  'components.marketing.jobCardMockup.qualityCheck': {
    hi: 'गुणवत्ता जाँच',
    gu: 'ગુણવત્તા તપાસ',
  },
  'components.shared.cameraScanFrame.couldNotStartCamera': {
    hi: 'कैमरा चालू नहीं हो सका',
    gu: 'કેમેરા ચાલુ થઈ શક્યો નથી',
  },
  'components.shared.errorState.couldnTLoadThisData': {
    hi: 'यह जानकारी लोड नहीं हो सकी',
    gu: 'આ માહિતી લોડ થઈ શકી નથી',
  },

  // ---- Administration ----------------------------------------------------------------------
  'pages.administration.activeSessions.searchByUserDeviceIp': {
    hi: 'उपयोगकर्ता, डिवाइस, IP से खोजें...',
    gu: 'વપરાશકર્તા, ડિવાઇસ, IP થી શોધો...',
  },
  'pages.administration.activeSessions.thisIsYourCurrentSession': {
    hi: 'यह आपका मौजूदा सत्र है',
    gu: 'આ તમારું હાલનું સેશન છે',
  },
  'pages.administration.createRole.roleNameMustBeAtLeast': {
    hi: 'भूमिका का नाम कम से कम 2 अक्षरों का होना चाहिए।',
    gu: 'ભૂમિકાનું નામ ઓછામાં ઓછા 2 અક્ષરનું હોવું જોઈએ.',
  },
  'pages.administration.createRole.roleCodeIsRequired': {
    hi: 'भूमिका कोड ज़रूरी है।',
    gu: 'ભૂમિકા કોડ જરૂરી છે.',
  },
  'pages.administration.createRole.aRoleWithThatNameAlready': {
    hi: 'उस नाम की भूमिका पहले से मौजूद है।',
    gu: 'તે નામની ભૂમિકા પહેલેથી છે.',
  },
  'pages.administration.createRole.couldNotCreateThisRole': {
    hi: 'यह भूमिका बनाई नहीं जा सकी।',
    gu: 'આ ભૂમિકા બનાવી શકાઈ નથી.',
  },
  'pages.administration.createRole.createRole': { hi: 'भूमिका बनाएं', gu: 'ભૂમિકા બનાવો' },
  'pages.administration.createUser.fullNameMustBeAtLeast': {
    hi: 'पूरा नाम कम से कम 2 अक्षरों का होना चाहिए',
    gu: 'પૂરું નામ ઓછામાં ઓછા 2 અક્ષરનું હોવું જોઈએ',
  },
  'pages.administration.createUser.enterAValid10DigitMobile': {
    hi: 'सही 10 अंकों का मोबाइल नंबर डालें',
    gu: 'સાચો 10 અંકનો મોબાઇલ નંબર નાખો',
  },
  'pages.administration.createUser.emailIsRequired': {
    hi: 'ईमेल ज़रूरी है',
    gu: 'ઈમેલ જરૂરી છે',
  },
  'pages.administration.createUser.enterAValidEmailAddress': {
    hi: 'सही ईमेल पता डालें',
    gu: 'સાચું ઈમેલ સરનામું નાખો',
  },
  'pages.administration.createUser.passwordMustBeAtLeast6': {
    hi: 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए',
    gu: 'પાસવર્ડ ઓછામાં ઓછા 6 અક્ષરનો હોવો જોઈએ',
  },
  'pages.administration.createUser.incomplete': { hi: 'अपूर्ण', gu: 'અપૂર્ણ' },
  'pages.administration.createUser.showPassword': {
    hi: 'पासवर्ड दिखाएं',
    gu: 'પાસવર્ડ બતાવો',
  },
  'pages.administration.createUser.createUser': {
    hi: 'उपयोगकर्ता बनाएं',
    gu: 'વપરાશકર્તા બનાવો',
  },
  'pages.administration.ipWhitelist.searchByLabelOrIp': {
    hi: 'नाम या IP से खोजें...',
    gu: 'નામ કે IP થી શોધો...',
  },
  'pages.administration.ipWhitelist.thisPermanentlyRemovesThisIpRestriction': {
    hi: 'यह इस IP पाबंदी को हमेशा के लिए हटा देता है। यह पूर्ववत नहीं हो सकता।',
    gu: 'આ આ IP પ્રતિબંધ કાયમ માટે કાઢી નાખે છે. આ પાછું લઈ શકાતું નથી.',
  },
  'pages.administration.ipWhitelist.thisIpCidrWillStartAuthorizing': {
    hi: 'यह IP/CIDR मालिक के अलावा बाकी लोगों के लॉग इन को फिर से अनुमति देने लगेगा।',
    gu: 'આ IP/CIDR માલિક સિવાયના લોકોના લોગ ઇનને ફરી મંજૂરી આપવા લાગશે.',
  },
  'pages.administration.ipWhitelist.editWhitelistEntry': {
    hi: 'व्हाइटलिस्ट प्रविष्टि बदलें',
    gu: 'વ્હાઇટલિસ્ટ નોંધ બદલો',
  },
  'pages.administration.menusPermissionsTab.grantFullAccess': {
    hi: 'पूरी पहुँच दें',
    gu: 'પૂરી પહોંચ આપો',
  },
  'pages.administration.roleManagement.enableRole': {
    hi: 'भूमिका चालू करें',
    gu: 'ભૂમિકા ચાલુ કરો',
  },
  'pages.administration.roleManagement.customRole': {
    hi: 'कस्टम भूमिका',
    gu: 'કસ્ટમ ભૂમિકા',
  },
  'pages.administration.roleManagement.enableThisRole': {
    hi: 'यह भूमिका चालू करें?',
    gu: 'આ ભૂમિકા ચાલુ કરવી?',
  },
  'pages.administration.userManagement.protected': { hi: 'सुरक्षित', gu: 'સુરક્ષિત' },
  'pages.administration.userManagement.searchByNameEmailOrMobile': {
    hi: 'नाम, ईमेल या मोबाइल से खोजें...',
    gu: 'નામ, ઈમેલ કે મોબાઇલથી શોધો...',
  },
  'pages.administration.userManagement.enableUser': {
    hi: 'उपयोगकर्ता चालू करें',
    gu: 'વપરાશકર્તા ચાલુ કરો',
  },
  'pages.administration.userManagement.thisRestoresTheirAbilityToSign': {
    hi: 'इससे उनकी लॉग इन करने की सुविधा वापस आ जाती है।',
    gu: 'આનાથી તેમની લોગ ઇન કરવાની સુવિધા પાછી આવે છે.',
  },

  // ---- Dashboard ---------------------------------------------------------------------------
  'pages.dashboard.dashboard.goodMorning': { hi: 'सुप्रभात', gu: 'સુપ્રભાત' },
  'pages.dashboard.dashboard.goodAfternoon': { hi: 'नमस्कार', gu: 'નમસ્કાર' },
  'pages.dashboard.dashboard.goodEvening': { hi: 'शुभ संध्या', gu: 'શુભ સાંજ' },

  // ---- Finance -----------------------------------------------------------------------------
  'pages.finance.cashBook.manualEntry': { hi: 'हाथ से दर्ज', gu: 'હાથે નોંધેલ' },
  'pages.finance.expenses.pickACategory': { hi: 'श्रेणी चुनें।', gu: 'શ્રેણી પસંદ કરો.' },
  'pages.finance.expenses.couldNotRecordThisExpense': {
    hi: 'यह खर्च दर्ज नहीं हो सका।',
    gu: 'આ ખર્ચ નોંધી શકાયો નથી.',
  },
  'pages.finance.expenses.recordExpense': { hi: 'खर्च दर्ज करें', gu: 'ખર્ચ નોંધો' },
  'pages.finance.expenses.posted': { hi: 'दर्ज हुआ', gu: 'નોંધાયું' },
  'pages.finance.expenses.searchExpenseCategoryPartyNotes': {
    hi: 'खर्च #, श्रेणी, पार्टी, टिप्पणी खोजें...',
    gu: 'ખર્ચ #, શ્રેણી, પાર્ટી, નોંધ શોધો...',
  },
  'pages.finance.partyLedger.withJobCardActivity': {
    hi: 'जॉब कार्ड गतिविधि वाली',
    gu: 'જોબ કાર્ડ પ્રવૃત્તિ સાથે',
  },
  'pages.finance.partyLedger.activeJobsOnly': {
    hi: 'सिर्फ़ चालू जॉब',
    gu: 'ફક્ત ચાલુ જોબ',
  },
  'pages.finance.partyLedger.inclAdvanceOnUnbilledJobs': {
    hi: 'बिना बिल जॉब के अग्रिम सहित',
    gu: 'બિલ વગરના જોબના એડવાન્સ સહિત',
  },
  'pages.finance.partyLedger.pendingCollection': {
    hi: 'वसूली बाकी',
    gu: 'વસૂલાત બાકી',
  },
  'pages.finance.receiptsPayments.manualAdvance': {
    hi: 'हाथ से / अग्रिम',
    gu: 'હાથે / એડવાન્સ',
  },
  'pages.finance.receiptsPayments.afterMoneyOut': {
    hi: 'रकम बाहर जाने के बाद',
    gu: 'રકમ બહાર ગયા પછી',
  },
  'pages.finance.receiptsPayments.selectACustomer': {
    hi: 'ग्राहक चुनें।',
    gu: 'ગ્રાહક પસંદ કરો.',
  },
  'pages.finance.receiptsPayments.selectAJobCard': {
    hi: 'जॉब कार्ड चुनें।',
    gu: 'જોબ કાર્ડ પસંદ કરો.',
  },
  'pages.finance.receiptsPayments.enterAnAmountGreaterThan0': {
    hi: '0 से अधिक राशि डालें।',
    gu: '0 થી વધુ રકમ નાખો.',
  },
  'pages.finance.receiptsPayments.pickACustomerFirst': {
    hi: 'पहले ग्राहक चुनें',
    gu: 'પહેલાં ગ્રાહક પસંદ કરો',
  },
  'pages.finance.receivables.030Days': { hi: '0-30 दिन', gu: '0-30 દિવસ' },
  'pages.finance.receivables.3060Days': { hi: '30-60 दिन', gu: '30-60 દિવસ' },
  'pages.finance.receivables.6090Days': { hi: '60-90 दिन', gu: '60-90 દિવસ' },
  'pages.finance.receivables.90Days': { hi: '90+ दिन', gu: '90+ દિવસ' },
  'pages.finance.supplierPayables.pickASupplier': {
    hi: 'सप्लायर चुनें।',
    gu: 'સપ્લાયર પસંદ કરો.',
  },
  'pages.finance.supplierPayables.enterABillAmountGreaterThan': {
    hi: 'शून्य से अधिक बिल राशि डालें।',
    gu: 'શૂન્યથી વધુ બિલ રકમ નાખો.',
  },
  'pages.finance.supplierPayables.theDueDateCannotBeBefore': {
    hi: 'देय तारीख बिल की तारीख से पहले नहीं हो सकती।',
    gu: 'ચુકવણી તારીખ બિલની તારીખ પહેલાં હોઈ શકતી નથી.',
  },
  'pages.finance.supplierPayables.couldNotSaveThisBill': {
    hi: 'यह बिल सहेजा नहीं जा सका।',
    gu: 'આ બિલ સાચવી શકાયું નથી.',
  },
  'pages.finance.supplierPayables.saveBill': { hi: 'बिल सहेजें', gu: 'બિલ સાચવો' },
  'pages.finance.supplierPayables.couldNotRecordThisPayment': {
    hi: 'यह भुगतान दर्ज नहीं हो सका।',
    gu: 'આ ચુકવણી નોંધી શકાઈ નથી.',
  },
  'pages.finance.supplierPayables.devicePurchase': {
    hi: 'डिवाइस खरीद',
    gu: 'ડિવાઇસ ખરીદી',
  },

  // ---- Masters -----------------------------------------------------------------------------
  'pages.masters.itemCategories.searchCategories': {
    hi: 'श्रेणियाँ खोजें...',
    gu: 'શ્રેણીઓ શોધો...',
  },
  'pages.masters.itemCategories.thisCategoryWillBecomeSelectableAgain': {
    hi: 'यह श्रेणी नए आइटम के लिए फिर से चुनी जा सकेगी।',
    gu: 'આ શ્રેણી નવાં આઇટમ માટે ફરી પસંદ કરી શકાશે.',
  },
  'pages.masters.itemCategories.thisPermanentlyDeletesTheCategoryThis': {
    hi: 'यह श्रेणी हमेशा के लिए हट जाती है। यह पूर्ववत नहीं हो सकता।',
    gu: 'આ શ્રેણી કાયમ માટે કાઢી નાખે છે. આ પાછું લઈ શકાતું નથી.',
  },
  'pages.masters.itemCategories.editItemCategory': {
    hi: 'आइटम श्रेणी बदलें',
    gu: 'આઇટમ શ્રેણી બદલો',
  },
  'pages.masters.itemMaster.service': { hi: 'सर्विस', gu: 'સર્વિસ' },
  'pages.masters.itemMaster.sales': { hi: 'विक्रय', gu: 'વેચાણ' },
  'pages.masters.itemMaster.purchase': { hi: 'खरीद', gu: 'ખરીદી' },
  'pages.masters.itemMaster.production': { hi: 'उत्पादन', gu: 'ઉત્પાદન' },
  'pages.masters.itemMaster.servicePos': { hi: 'सर्विस / POS', gu: 'સર્વિસ / POS' },
  'pages.masters.itemMaster.thisItemWillBecomeSelectableAgain': {
    hi: 'यह आइटम फिर से चुना जा सकेगा।',
    gu: 'આ આઇટમ ફરી પસંદ કરી શકાશે.',
  },
  'pages.masters.itemMaster.editItem': { hi: 'आइटम बदलें', gu: 'આઇટમ બદલો' },
  'pages.masters.parties.both': { hi: 'दोनों', gu: 'બંને' },
  'pages.masters.parties.searchByNameMobileOrParty': {
    hi: 'नाम, मोबाइल या पार्टी कोड से खोजें...',
    gu: 'નામ, મોબાઇલ કે પાર્ટી કોડથી શોધો...',
  },
  'pages.masters.parties.editParty': { hi: 'पार्टी बदलें', gu: 'પાર્ટી બદલો' },
  'pages.masters.parties.allOptionalAddWhatYouNeed': {
    hi: 'सब वैकल्पिक — जो चाहिए वही भरें',
    gu: 'બધું વૈકલ્પિક — જે જોઈએ તે ભરો',
  },
  'pages.masters.partyCategories.editCategory': { hi: 'श्रेणी बदलें', gu: 'શ્રેણી બદલો' },
  'pages.masters.paymentModes.upi': { same: true },
  'pages.masters.paymentModes.bankTransfer': {
    hi: 'बैंक ट्रांसफ़र',
    gu: 'બેંક ટ્રાન્સફર',
  },
  'pages.masters.paymentModes.searchPaymentModes': {
    hi: 'भुगतान तरीके खोजें...',
    gu: 'ચુકવણી રીતો શોધો...',
  },
  'pages.masters.paymentModes.thisPaymentModeWillBecomeSelectable': {
    hi: 'यह भुगतान तरीका फिर से चुना जा सकेगा।',
    gu: 'આ ચુકવણી રીત ફરી પસંદ કરી શકાશે.',
  },
  'pages.masters.paymentModes.editPaymentMode': {
    hi: 'भुगतान तरीका बदलें',
    gu: 'ચુકવણી રીત બદલો',
  },
  'pages.masters.uom.length': { hi: 'लंबाई', gu: 'લંબાઈ' },
  'pages.masters.uom.weight': { hi: 'वज़न', gu: 'વજન' },
  'pages.masters.uom.volume': { hi: 'आयतन', gu: 'ઘનફળ' },
  'pages.masters.uom.thisUnitWillBecomeSelectableAgain': {
    hi: 'यह इकाई नए आइटम के लिए फिर से चुनी जा सकेगी।',
    gu: 'આ એકમ નવાં આઇટમ માટે ફરી પસંદ કરી શકાશે.',
  },
  'pages.masters.uom.editUnitOfMeasure': {
    hi: 'माप की इकाई बदलें',
    gu: 'માપનો એકમ બદલો',
  },

  // ---- Reports -----------------------------------------------------------------------------
  'pages.reports.fieldVisitReport.searchJobCustomer': {
    hi: 'जॉब, ग्राहक खोजें...',
    gu: 'જોબ, ગ્રાહક શોધો...',
  },
  'pages.reports.jobWiseProfit.searchJobCustomerTech': {
    hi: 'जॉब, ग्राहक, तकनीशियन खोजें...',
    gu: 'જોબ, ગ્રાહક, ટેકનિશિયન શોધો...',
  },
  'pages.reports.periodSummary.searchDate': {
    hi: 'तारीख खोजें...',
    gu: 'તારીખ શોધો...',
  },
  'pages.reports.profitLoss.thisWeek': { hi: 'इस सप्ताह', gu: 'આ અઠવાડિયે' },
  'pages.reports.profitLoss.thisMonth': { hi: 'इस महीने', gu: 'આ મહિને' },
  'pages.reports.profitLoss.thisYear': { hi: 'इस साल', gu: 'આ વર્ષે' },
  'pages.reports.profitLoss.lessRefunds': { hi: 'घटाएं: वापसी', gu: 'બાદ: રિફંડ' },
  'pages.reports.profitLoss.lessDirectCostSupplierPayments': {
    hi: 'घटाएं: सीधी लागत (सप्लायर भुगतान)',
    gu: 'બાદ: સીધો ખર્ચ (સપ્લાયર ચુકવણી)',
  },
  'pages.reports.profitLoss.paidToSuppliers': {
    hi: 'सप्लायरों को दिया',
    gu: 'સપ્લાયરોને ચૂકવ્યું',
  },
  'pages.reports.supplierReport.searchSupplier': {
    hi: 'सप्लायर खोजें...',
    gu: 'સપ્લાયર શોધો...',
  },
  'pages.reports.technicianReport.searchTechnician': {
    hi: 'तकनीशियन खोजें...',
    gu: 'ટેકનિશિયન શોધો...',
  },

  // ---- Sales -------------------------------------------------------------------------------
  'pages.sales.salesInvoices.closed': { hi: 'बंद', gu: 'બંધ' },

  // ---- Second Hand -------------------------------------------------------------------------
  'pages.secondHandDevice.createPurchase.chargerOnly': {
    hi: 'सिर्फ़ चार्जर',
    gu: 'ફક્ત ચાર્જર',
  },
  'pages.secondHandDevice.createPurchase.chargerBoxCable': {
    hi: 'चार्जर, डिब्बा, केबल',
    gu: 'ચાર્જર, બોક્સ, કેબલ',
  },
  'pages.secondHandDevice.createPurchase.chargerBoxCableEarphones': {
    hi: 'चार्जर, डिब्बा, केबल, ईयरफ़ोन',
    gu: 'ચાર્જર, બોક્સ, કેબલ, ઈયરફોન',
  },
  'pages.secondHandDevice.createPurchase.boxOnly': {
    hi: 'सिर्फ़ डिब्बा',
    gu: 'ફક્ત બોક્સ',
  },
  'pages.secondHandDevice.createPurchase.selectOrAddASeller': {
    hi: 'विक्रेता चुनें या जोड़ें।',
    gu: 'વેચનાર પસંદ કરો કે ઉમેરો.',
  },
  'pages.secondHandDevice.createPurchase.enterAPurchasePriceGreaterThan': {
    hi: '0 से अधिक खरीद कीमत डालें।',
    gu: '0 થી વધુ ખરીદ કિંમત નાખો.',
  },
  'pages.secondHandDevice.createPurchase.somethingWentWrongPleaseTryAgain': {
    hi: 'कुछ गड़बड़ हो गई। कृपया फिर कोशिश करें।',
    gu: 'કંઈક ખોટું થયું. કૃપા કરીને ફરી પ્રયાસ કરો.',
  },
  'pages.secondHandDevice.createPurchase.captureUploadIdProofPhoto': {
    hi: 'पहचान पत्र की तस्वीर लें / अपलोड करें',
    gu: 'ઓળખપત્રનો ફોટો લો / અપલોડ કરો',
  },
  'pages.secondHandDevice.createPurchase.savePurchase': {
    hi: 'खरीद सहेजें',
    gu: 'ખરીદી સાચવો',
  },
  'pages.secondHandDevice.createPurchase.scanImei2': {
    hi: 'IMEI 2 स्कैन करें',
    gu: 'IMEI 2 સ્કેન કરો',
  },
  'pages.secondHandDevice.deviceSale.searchReceiptImeiBrand': {
    hi: 'रसीद # / IMEI / ब्रांड खोजें...',
    gu: 'રસીદ # / IMEI / બ્રાન્ડ શોધો...',
  },
  'pages.secondHandDevice.deviceSale.selectOrAddABuyer': {
    hi: 'खरीदार चुनें या जोड़ें।',
    gu: 'ખરીદનાર પસંદ કરો કે ઉમેરો.',
  },
  'pages.secondHandDevice.deviceSale.enterASalePriceGreaterThan': {
    hi: '0 से अधिक विक्रय कीमत डालें।',
    gu: '0 થી વધુ વેચાણ કિંમત નાખો.',
  },
  'pages.secondHandDevice.deviceSale.confirmSale': {
    hi: 'विक्रय पक्का करें',
    gu: 'વેચાણ ખાતરી કરો',
  },
  'pages.secondHandDevice.deviceStock.searchStock': {
    hi: 'स्टॉक खोजें...',
    gu: 'સ્ટોક શોધો...',
  },
  'pages.secondHandDevice.purchaseDetailSections.purchase': { hi: 'खरीद', gu: 'ખરીદી' },
  'pages.secondHandDevice.purchaseDetailSections.inRefurb': {
    hi: 'मरम्मत में',
    gu: 'રિફર્બમાં',
  },

  // ---- Service -----------------------------------------------------------------------------
  'pages.service.actionButtons.returnDeviceCloseThisJob': {
    hi: 'डिवाइस लौटाकर यह जॉब बंद करें?',
    gu: 'ડિવાઇસ પરત કરીને આ જોબ બંધ કરવી?',
  },
  'pages.service.actionButtons.thisIsATerminalStatusAnd': {
    hi: 'यह अंतिम स्थिति है और इसके बाद बदली नहीं जा सकती।',
    gu: 'આ આખરી સ્થિતિ છે અને તે પછી બદલી શકાતી નથી.',
  },
  'pages.service.actionButtons.returnClose': {
    hi: 'लौटाकर बंद करें',
    gu: 'પરત કરીને બંધ કરો',
  },
  'pages.service.actionButtons.hold': { hi: 'रोकें', gu: 'અટકાવો' },
  'pages.service.actionButtons.jobDone': { hi: 'जॉब पूर्ण', gu: 'જોબ પૂર્ણ' },
  'pages.service.actionButtons.logVisit': { hi: 'विज़िट दर्ज करें', gu: 'વિઝિટ નોંધો' },
  'pages.service.createJobCard.enterTheNewCustomerSName': {
    hi: 'नए ग्राहक का नाम और सही 10 अंकों का मोबाइल नंबर डालें।',
    gu: 'નવા ગ્રાહકનું નામ અને સાચો 10 અંકનો મોબાઇલ નંબર નાખો.',
  },
  'pages.service.createJobCard.selectOrAddACustomer': {
    hi: 'ग्राहक चुनें या जोड़ें।',
    gu: 'ગ્રાહક પસંદ કરો કે ઉમેરો.',
  },
  'pages.service.createJobCard.selectAtLeastOneProblem': {
    hi: 'कम से कम एक समस्या चुनें।',
    gu: 'ઓછામાં ઓછી એક સમસ્યા પસંદ કરો.',
  },
  'pages.service.createJobCard.selectABrand': {
    hi: 'ब्रांड चुनें।',
    gu: 'બ્રાન્ડ પસંદ કરો.',
  },
  'pages.service.createJobCard.enterTheModel': { hi: 'मॉडल डालें।', gu: 'મોડેલ નાખો.' },
  'pages.service.createJobCard.couldNotCreateTheJobCard': {
    hi: 'जॉब कार्ड बनाया नहीं जा सका। फिर कोशिश करें।',
    gu: 'જોબ કાર્ડ બનાવી શકાયું નથી. ફરી પ્રયાસ કરો.',
  },
  'pages.service.jobCards.searchJobCustomerMobile': {
    hi: 'जॉब, ग्राहक, मोबाइल खोजें...',
    gu: 'જોબ, ગ્રાહક, મોબાઇલ શોધો...',
  },
  'pages.service.recordCostingModal.saveCosting': {
    hi: 'लागत सहेजें',
    gu: 'ખર્ચ સાચવો',
  },
  'pages.service.jobCosting.recorded': { hi: 'दर्ज', gu: 'નોંધાયેલ' },
  'pages.service.jobCosting.pendingCosting': {
    hi: 'लागत बाकी',
    gu: 'ખર્ચ બાકી',
  },
  'pages.service.jobCosting.costed': { hi: 'लागत दर्ज', gu: 'ખર્ચ નોંધાયો' },
  'pages.service.serviceItems.services': { hi: 'सर्विस', gu: 'સર્વિસ' },
  'pages.service.serviceItems.searchServiceItems': {
    hi: 'सर्विस आइटम खोजें...',
    gu: 'સર્વિસ આઇટમ શોધો...',
  },
  'pages.service.serviceItems.editServiceItem': {
    hi: 'सर्विस आइटम बदलें',
    gu: 'સર્વિસ આઇટમ બદલો',
  },

  // ---- Settings ----------------------------------------------------------------------------
  'pages.settings.backupRestore.overwrite': { same: true },
  'pages.settings.backupRestore.restoreFailed': {
    hi: 'वापस लाना असफल रहा।',
    gu: 'પાછું લાવવું નિષ્ફળ ગયું.',
  },
  'pages.settings.backupRestore.backupNow': { hi: 'अभी बैकअप लें', gu: 'હમણાં બેકઅપ લો' },
  'pages.settings.backupRestore.downloadBackup': {
    hi: 'बैकअप डाउनलोड करें',
    gu: 'બેકઅપ ડાઉનલોડ કરો',
  },
  'pages.settings.backupRestore.restoreAsArchiveSafe': {
    hi: 'संग्रह के रूप में वापस लाएं (सुरक्षित)',
    gu: 'આર્કાઇવ તરીકે પાછું લાવો (સુરક્ષિત)',
  },
  'pages.settings.billing.unlimitedAddAsManyTeammatesAs': {
    hi: 'असीमित — जितने साथी चाहिए जोड़ें',
    gu: 'અમર્યાદિત — જેટલા સાથી જોઈએ ઉમેરો',
  },
  'pages.settings.billing.unlimitedEveryLocationOneAccount': {
    hi: 'असीमित — हर जगह, एक ही खाता',
    gu: 'અમર્યાદિત — દરેક સ્થળ, એક જ ખાતું',
  },
  'pages.settings.billing.jobCardsInvoices': {
    hi: 'जॉब कार्ड और बिल',
    gu: 'જોબ કાર્ડ અને બિલ',
  },
  'pages.settings.billing.unlimitedWithNoMonthlyCap': {
    hi: 'असीमित, कोई मासिक सीमा नहीं',
    gu: 'અમર્યાદિત, કોઈ માસિક મર્યાદા નહીં',
  },
  'pages.settings.billing.dataBackups': {
    hi: 'डेटा और बैकअप',
    gu: 'ડેટા અને બેકઅપ',
  },
  'pages.settings.billing.yoursExportableAtAnyTime': {
    hi: 'आपका, कभी भी एक्सपोर्ट कर सकते हैं',
    gu: 'તમારો, ક્યારેય એક્સપોર્ટ કરી શકો',
  },
  'pages.settings.billing.organization': { hi: 'संगठन', gu: 'સંસ્થા' },
  'pages.settings.billing.billingContact': {
    hi: 'बिलिंग संपर्क',
    gu: 'બિલિંગ સંપર્ક',
  },
  'pages.settings.billing.currency': { hi: 'मुद्रा', gu: 'ચલણ' },
  'pages.settings.billing.customerSince': {
    hi: 'कब से ग्राहक',
    gu: 'ક્યારથી ગ્રાહક',
  },
  'pages.settings.branchManagement.main': { hi: 'मुख्य', gu: 'મુખ્ય' },
  'pages.settings.branchManagement.searchBranchesByNameOrCode': {
    hi: 'शाखाएं नाम या कोड से खोजें...',
    gu: 'શાખાઓ નામ કે કોડથી શોધો...',
  },
  'pages.settings.branchManagement.customBranch': {
    hi: 'कस्टम शाखा',
    gu: 'કસ્ટમ શાખા',
  },
  'pages.settings.branchManagement.createBranch': { hi: 'शाखा बनाएं', gu: 'શાખા બનાવો' },
  'pages.settings.branchManagement.thisBranchWillBecomeSelectableAgain': {
    hi: 'यह शाखा फिर से चुनी जा सकेगी।',
    gu: 'આ શાખા ફરી પસંદ કરી શકાશે.',
  },
  'pages.settings.companyForm.currencySelected': {
    hi: 'मुद्रा चुन ली',
    gu: 'ચલણ પસંદ થયું',
  },
  'pages.settings.companyForm.timezoneSelected': {
    hi: 'समय-क्षेत्र चुन लिया',
    gu: 'સમય ઝોન પસંદ થયો',
  },
  'pages.settings.companyForm.unregistered': {
    hi: 'अपंजीकृत',
    gu: 'નોંધણી વગરનું',
  },
  'pages.settings.companySettings.couldNotCreateThisCompany': {
    hi: 'यह कंपनी बनाई नहीं जा सकी।',
    gu: 'આ કંપની બનાવી શકાઈ નથી.',
  },
  'pages.settings.companySettings.couldNotSaveTheseChanges': {
    hi: 'ये बदलाव सहेजे नहीं जा सके।',
    gu: 'આ ફેરફાર સાચવી શકાયા નથી.',
  },
  'pages.settings.companySettings.nothingHereRightNow': {
    hi: 'अभी यहाँ कुछ नहीं।',
    gu: 'હાલ અહીં કંઈ નથી.',
  },
  'pages.settings.companySettings.unregisteredNoGst': {
    hi: 'अपंजीकृत (GST नहीं)',
    gu: 'નોંધણી વગરનું (GST નહીં)',
  },
  'pages.settings.companySettings.companyInformationAndSettings': {
    hi: 'कंपनी की जानकारी और सेटिंग्स।',
    gu: 'કંપનીની માહિતી અને સેટિંગ્સ.',
  },
  'pages.settings.financialYears.nameStartDateAndEndDate': {
    hi: 'नाम, शुरू की तारीख और अंत की तारीख — सब ज़रूरी हैं।',
    gu: 'નામ, શરૂ તારીખ અને અંતિમ તારીખ — બધું જરૂરી છે.',
  },
  'pages.settings.financialYears.theEndDateMustBeAfter': {
    hi: 'अंत की तारीख शुरू की तारीख के बाद होनी चाहिए।',
    gu: 'અંતિમ તારીખ શરૂ તારીખ પછીની હોવી જોઈએ.',
  },
  'pages.settings.financialYears.couldNotSaveThisFinancialYear': {
    hi: 'यह वित्तीय वर्ष सहेजा नहीं जा सका।',
    gu: 'આ નાણાકીય વર્ષ સાચવી શકાયું નથી.',
  },
  'pages.settings.financialYears.createNextFy': {
    hi: 'अगला वित्तीय वर्ष बनाएं',
    gu: 'આગલું નાણાકીય વર્ષ બનાવો',
  },
  'pages.settings.financialYears.activateAFinancialYearFirst': {
    hi: 'पहले कोई वित्तीय वर्ष सक्रिय करें',
    gu: 'પહેલાં કોઈ નાણાકીય વર્ષ સક્રિય કરો',
  },
  'pages.settings.financialYears.lock': { hi: 'लॉक करें', gu: 'લોક કરો' },
  'pages.settings.financialYears.createFinancialYear': {
    hi: 'वित्तीय वर्ष बनाएं',
    gu: 'નાણાકીય વર્ષ બનાવો',
  },
  'pages.settings.financialYears.addANewFinancialYearFor': {
    hi: 'अपने संगठन के लिए नया वित्तीय वर्ष जोड़ें',
    gu: 'તમારી સંસ્થા માટે નવું નાણાકીય વર્ષ ઉમેરો',
  },
  'pages.settings.financialYears.lockingThisPeriodIsAdvisoryIn': {
    hi: 'इस बिल्ड में इस अवधि को लॉक करना सिर्फ़ सलाह है — नया लेन-देन दर्ज करने से पहले कोई भी सुविधा इसे नहीं जाँचती।',
    gu: 'આ બિલ્ડમાં આ સમયગાળો લોક કરવો ફક્ત સલાહ છે — નવો વ્યવહાર નોંધતાં પહેલાં કોઈ સુવિધા તેને તપાસતી નથી.',
  },
  'pages.settings.designer.yourShop': { hi: 'आपकी दुकान', gu: 'તમારી દુકાન' },
  'pages.settings.designer.alignLeft': { hi: 'बाएं जमाएं', gu: 'ડાબે ગોઠવો' },
  'pages.settings.designer.alignCentre': { hi: 'बीच में जमाएं', gu: 'મધ્યમાં ગોઠવો' },
  'pages.settings.designer.alignRight': { hi: 'दाएं जमाएं', gu: 'જમણે ગોઠવો' },
  'pages.settings.designer.alignTop': { hi: 'ऊपर जमाएं', gu: 'ઉપર ગોઠવો' },
  'pages.settings.designer.selectAnElementToEditIts': {
    hi: 'गुण बदलने के लिए कोई तत्व चुनें।',
    gu: 'ગુણ બદલવા કોઈ તત્વ પસંદ કરો.',
  },
  'pages.settings.designer.imageUrl': { hi: 'तस्वीर का URL', gu: 'ફોટાનું URL' },
  'pages.settings.importTemplateDialog.thatFileIsNotATemplate': {
    hi: 'वह फ़ाइल टेम्पलेट नहीं है।',
    gu: 'તે ફાઇલ ટેમ્પલેટ નથી.',
  },
  'pages.settings.importTemplateDialog.theFileHasNoElementsArray': {
    hi: 'फ़ाइल में `elements` सूची नहीं है।',
    gu: 'ફાઇલમાં `elements` યાદી નથી.',
  },
  'pages.settings.importTemplateDialog.theFileHasNoValidPaper': {
    hi: 'फ़ाइल में सही `paper` आकार नहीं है।',
    gu: 'ફાઇલમાં સાચું `paper` માપ નથી.',
  },
  'pages.settings.importTemplateDialog.chooseATemplateJsonFileFirst': {
    hi: 'पहले कोई टेम्पलेट JSON फ़ाइल चुनें।',
    gu: 'પહેલાં કોઈ ટેમ્પલેટ JSON ફાઇલ પસંદ કરો.',
  },
  'pages.settings.importTemplateDialog.thatFileIsNotValidJson': {
    hi: 'वह फ़ाइल सही JSON नहीं है।',
    gu: 'તે ફાઇલ સાચી JSON નથી.',
  },
  'pages.settings.importTemplateDialog.importedTemplate': {
    hi: 'इम्पोर्ट किया टेम्पलेट',
    gu: 'ઇમ્પોર્ટ કરેલું ટેમ્પલેટ',
  },
  'pages.settings.importTemplateDialog.exportedFromTheDesigner': {
    hi: 'डिज़ाइनर से एक्सपोर्ट किया',
    gu: 'ડિઝાઇનરમાંથી એક્સપોર્ટ કરેલું',
  },
  'pages.settings.newTemplateDialog.template': { hi: 'टेम्पलेट', gu: 'ટેમ્પલેટ' },
  'pages.settings.newTemplateDialog.thatDocumentTypeHasNoBase': {
    hi: 'उस दस्तावेज़ प्रकार के लिए कोई आधार फ़ॉर्मेट नहीं है।',
    gu: 'તે દસ્તાવેજ પ્રકાર માટે કોઈ પાયાનું ફોર્મેટ નથી.',
  },
  'pages.settings.newTemplateDialog.aTemplateWithThatNameAlready': {
    hi: 'उस नाम का टेम्पलेट पहले से मौजूद है।',
    gu: 'તે નામનું ટેમ્પલેટ પહેલેથી છે.',
  },
  'pages.settings.newTemplateDialog.createDesign': {
    hi: 'बनाएं और डिज़ाइन करें',
    gu: 'બનાવો અને ડિઝાઇન કરો',
  },
  'pages.settings.newTemplateDialog.templateName': {
    hi: 'टेम्पलेट का नाम',
    gu: 'ટેમ્પલેટનું નામ',
  },
  'pages.settings.pageSetupDialog.labelsAcross': {
    hi: 'एक पंक्ति में लेबल',
    gu: 'એક પંક્તિમાં લેબલ',
  },
  'pages.settings.pageSetupDialog.printSpeed': { hi: 'प्रिंट गति', gu: 'પ્રિન્ટ ઝડપ' },
  'pages.settings.pageSetupDialog.printDensity': { hi: 'प्रिंट गहराई', gu: 'પ્રિન્ટ ઘનતા' },
  'pages.settings.printDevicesDialog.waitingForADevice': {
    hi: 'किसी डिवाइस का इंतज़ार…',
    gu: 'કોઈ ડિવાઇસની રાહ…',
  },
  'pages.settings.printDevicesDialog.codeNotUsedYet': {
    hi: 'कोड अभी इस्तेमाल नहीं हुआ',
    gu: 'કોડ હજી વપરાયો નથી',
  },
  'pages.settings.printDevicesDialog.pendingDevice': {
    hi: 'बाकी डिवाइस',
    gu: 'બાકી ડિવાઇસ',
  },
  'pages.settings.printFormats.addMissingDefaults': {
    hi: 'छूटे हुए डिफ़ॉल्ट जोड़ें',
    gu: 'ખૂટતાં ડિફોલ્ટ ઉમેરો',
  },
  'pages.settings.printFormats.deleteOnlyFormat': {
    hi: 'हटाएं — एकमात्र फ़ॉर्मेट',
    gu: 'કાઢી નાખો — એકમાત્ર ફોર્મેટ',
  },
  'pages.settings.fieldControlRow.hiddenClickToShow': {
    hi: 'छिपा — दिखाने के लिए क्लिक करें',
    gu: 'છુપાયેલ — બતાવવા ક્લિક કરો',
  },
  'pages.settings.fieldControlRow.requiredClickToMakeOptional': {
    hi: 'ज़रूरी — वैकल्पिक करने के लिए क्लिक करें',
    gu: 'જરૂરી — વૈકલ્પિક કરવા ક્લિક કરો',
  },
  'pages.settings.fieldControlRow.optionalClickToRequire': {
    hi: 'वैकल्पिक — ज़रूरी करने के लिए क्लिक करें',
    gu: 'વૈકલ્પિક — જરૂરી કરવા ક્લિક કરો',
  },
  'pages.settings.fieldControlRow.lockedAfterFirstSaveClickTo': {
    hi: 'पहली बार सहेजने के बाद लॉक — खोलने के लिए क्लिक करें',
    gu: 'પહેલી વાર સાચવ્યા પછી લોક — ખોલવા ક્લિક કરો',
  },
  'pages.settings.fieldControlRow.clickToLockAfterFirstSave': {
    hi: 'पहली बार सहेजने के बाद लॉक करने के लिए क्लिक करें',
    gu: 'પહેલી વાર સાચવ્યા પછી લોક કરવા ક્લિક કરો',
  },
  'pages.settings.fieldControlRow.mobileAppOnlyClickToShow': {
    hi: 'सिर्फ़ मोबाइल ऐप — हर जगह दिखाने के लिए क्लिक करें',
    gu: 'ફક્ત મોબાઇલ એપ — બધે બતાવવા ક્લિક કરો',
  },
  'pages.settings.fieldControlRow.clickToRestrictToTheMobile': {
    hi: 'सिर्फ़ मोबाइल ऐप तक सीमित करने के लिए क्लिक करें',
    gu: 'ફક્ત મોબાઇલ એપ પૂરતું મર્યાદિત કરવા ક્લિક કરો',
  },
  'pages.settings.fieldPreviewInput.searchUser': {
    hi: 'उपयोगकर्ता खोजें...',
    gu: 'વપરાશકર્તા શોધો...',
  },
  'pages.settings.fieldPreviewInput.select': { hi: 'चुनें...', gu: 'પસંદ કરો...' },
  'pages.settings.formBuilderTab.saveThisConfigurationAsATemplate': {
    hi: 'इस सेटिंग को इस नाम के टेम्पलेट के रूप में सहेजें:',
    gu: 'આ ગોઠવણને આ નામના ટેમ્પલેટ તરીકે સાચવો:',
  },
  'pages.settings.rolePermissionsTab.pickAConfiguredRoleFromThe': {
    hi: 'ऊपर की सूची से कोई कॉन्फ़िगर की हुई भूमिका चुनें, या किसी बिना कॉन्फ़िगर भूमिका को नए सिरे से सेट करें।',
    gu: 'ઉપરની યાદીમાંથી કોઈ કોન્ફિગર કરેલી ભૂમિકા પસંદ કરો, અથવા કોઈ કોન્ફિગર ન કરેલી ભૂમિકા નવેસરથી ગોઠવો.',
  },
  'pages.settings.rolePermissionsTab.controlWhichJobStatusesThisRole': {
    hi: 'तय करें कि यह भूमिका कौन-कौन सी जॉब स्थितियाँ देख सकती है और हर चरण पर ठीक कौन-सी कार्रवाइयाँ कर सकती है।',
    gu: 'નક્કી કરો કે આ ભૂમિકા કઈ કઈ જોબ સ્થિતિ જોઈ શકે અને દરેક પગલે બરાબર કઈ ક્રિયાઓ કરી શકે.',
  },
  'pages.settings.rolePermissionsTab.hitSaveConfigChangesApplyInstantly': {
    hi: 'सेटिंग सहेजें दबाएं — उस भूमिका वाले हर उपयोगकर्ता पर बदलाव तुरंत लागू हो जाते हैं। कुछ दोबारा शुरू करने की ज़रूरत नहीं।',
    gu: 'ગોઠવણ સાચવો દબાવો — તે ભૂમિકાવાળા દરેક વપરાશકર્તા પર ફેરફાર તરત લાગુ થાય છે. કંઈ ફરી શરૂ કરવાની જરૂર નથી.',
  },
  'pages.settings.rolePermissionsTab.saveConfig': {
    hi: 'सेटिंग सहेजें',
    gu: 'ગોઠવણ સાચવો',
  },
  'pages.settings.usersSubtab.allUsersCanBeSelected': {
    hi: 'सभी उपयोगकर्ता चुने जा सकते हैं',
    gu: 'બધા વપરાશકર્તા પસંદ કરી શકાય',
  },
  'pages.settings.usersSubtab.oneRoleCanBeSelected': {
    hi: 'एक भूमिका चुनी जा सकती है',
    gu: 'એક ભૂમિકા પસંદ કરી શકાય',
  },

  // ---- Auth and marketing ------------------------------------------------------------------
  'pages.completeSetup.completeSetup.finishSetup': {
    hi: 'सेटअप पूरा करें',
    gu: 'સેટઅપ પૂરું કરો',
  },
  'pages.forgotPassword.forgotPassword.sendResetLink': {
    hi: 'बदलने की लिंक भेजें',
    gu: 'બદલવાની લિંક મોકલો',
  },
  'pages.signup.signup.createAccount': { hi: 'खाता बनाएं', gu: 'ખાતું બનાવો' },
  'pages.landing.landing.isThisReallyFree': {
    hi: 'क्या यह सचमुच मुफ़्त है?',
    gu: 'શું આ ખરેખર મફત છે?',
  },
  'pages.landing.landing.yesEveryFeatureInAimIs': {
    hi: 'हाँ — aim की हर सुविधा हमेशा के लिए मुफ़्त है। कार्ड की ज़रूरत नहीं, कोई प्लान स्तर नहीं, कोई सुविधा बंद नहीं।',
    gu: 'હા — aim ની દરેક સુવિધા હંમેશાં મફત છે. કાર્ડની જરૂર નથી, કોઈ પ્લાન સ્તર નથી, કોઈ સુવિધા બંધ નથી.',
  },
  'pages.landing.landing.canIBringMyExistingData': {
    hi: 'क्या मैं अपना पुराना डेटा ला सकता हूँ?',
    gu: 'શું હું મારો જૂનો ડેટા લાવી શકું?',
  },
  'pages.landing.landing.yesWeOfferFreeDataMigration': {
    hi: 'हाँ — आपके ग्राहक, डिवाइस और इतिहास aim में लाने के लिए हम मुफ़्त डेटा माइग्रेशन देते हैं।',
    gu: 'હા — તમારા ગ્રાહકો, ડિવાઇસ અને ઇતિહાસ aim માં લાવવા અમે મફત ડેટા માઇગ્રેશન આપીએ છીએ.',
  },
  'pages.landing.landing.doesItWorkOnMobile': {
    hi: 'क्या यह मोबाइल पर चलता है?',
    gu: 'શું આ મોબાઇલ પર ચાલે છે?',
  },
  'pages.landing.landing.yesAimIsInstallableAsA': {
    hi: 'हाँ — aim मोबाइल ऐप की तरह इंस्टॉल हो जाता है और शुरू से मोबाइल-पहले बनाया गया है।',
    gu: 'હા — aim મોબાઇલ એપ જેમ ઇન્સ્ટોલ થાય છે અને શરૂઆતથી મોબાઇલ-પ્રથમ બનાવેલું છે.',
  },
  'pages.landing.landing.canDifferentStaffSeeDifferentThings': {
    hi: 'क्या अलग-अलग कर्मचारी अलग-अलग चीज़ें देख सकते हैं?',
    gu: 'શું અલગ અલગ કર્મચારી અલગ અલગ વસ્તુ જોઈ શકે?',
  },
  'pages.landing.landing.yesTheWorkflowDesignerLetsYou': {
    hi: 'हाँ — वर्कफ़्लो डिज़ाइनर से आप तय कर सकते हैं कि हर जॉब स्थिति पर हर भूमिका क्या देख और कर सकती है।',
    gu: 'હા — વર્કફ્લો ડિઝાઇનરથી તમે નક્કી કરી શકો કે દરેક જોબ સ્થિતિ પર દરેક ભૂમિકા શું જોઈ અને કરી શકે.',
  },
  'pages.pricing.pricing.unlimitedJobCardsTechniciansAndCustomers': {
    hi: 'असीमित जॉब कार्ड, तकनीशियन और ग्राहक',
    gu: 'અમર્યાદિત જોબ કાર્ડ, ટેકનિશિયન અને ગ્રાહકો',
  },
  'pages.pricing.pricing.fullRoleBasedAccessControlWorkflow': {
    hi: 'पूरा भूमिका-आधारित नियंत्रण और वर्कफ़्लो डिज़ाइनर',
    gu: 'સંપૂર્ણ ભૂમિકા-આધારિત નિયંત્રણ અને વર્કફ્લો ડિઝાઇનર',
  },
  'pages.pricing.pricing.financeReceiptsLedgersReceivablesPayables': {
    hi: 'वित्त: रसीदें, खाते, प्राप्य और देय',
    gu: 'નાણાં: રસીદો, ખાતાં, લેણું અને દેવું',
  },
  'pages.pricing.pricing.secondHandDevicePurchaseSaleTracking': {
    hi: 'सेकंड हैंड डिवाइस की खरीद और विक्रय का हिसाब',
    gu: 'સેકન્ડ હેન્ડ ડિવાઇસની ખરીદી અને વેચાણનો હિસાબ',
  },
  'pages.pricing.pricing.allReportsDashboardsAndCsvExcel': {
    hi: 'सभी रिपोर्ट, डैशबोर्ड और CSV/Excel एक्सपोर्ट',
    gu: 'બધી રિપોર્ટ, ડેશબોર્ડ અને CSV/Excel એક્સપોર્ટ',
  },
  'pages.pricing.pricing.freeDataMigrationFromYourCurrent': {
    hi: 'आपके मौजूदा सिस्टम से मुफ़्त डेटा माइग्रेशन',
    gu: 'તમારી હાલની સિસ્ટમમાંથી મફત ડેટા માઇગ્રેશન',
  },
}
