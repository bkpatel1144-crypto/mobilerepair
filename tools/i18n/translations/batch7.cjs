/**
 * Batch 7 — the strings the extractor's own filter had been hiding.
 *
 * Two filter rules were too broad: rejecting any `&` (to avoid matching `&&` in code) and any
 * parenthesis. Between them they excluded real page titles — "Profit & Loss", "Receipts &
 * Payments", "Backup & Restore", "Billing & Subscription" — and every unit or qualifier in
 * brackets, like "Width (mm)" and "Credit (IN)".
 */
module.exports = {
  // ---- Page and section titles that were being missed --------------------------------------
  'pages.reports.profitLoss.profitLoss': { hi: 'लाभ और हानि', gu: 'નફો અને નુકસાન' },
  'pages.finance.receiptsPayments.receiptsPayments': {
    hi: 'रसीद और भुगतान',
    gu: 'રસીદ અને ચુકવણી',
  },
  'pages.settings.backupRestore.backupRestore': {
    hi: 'बैकअप और रिस्टोर',
    gu: 'બેકઅપ અને રિસ્ટોર',
  },
  'pages.settings.billing.billingSubscription': {
    hi: 'बिलिंग और सदस्यता',
    gu: 'બિલિંગ અને સબ્સ્ક્રિપ્શન',
  },
  'pages.administration.roleConfigure.menusPermissions': {
    hi: 'मेन्यू और अनुमतियाँ',
    gu: 'મેન્યુ અને પરવાનગીઓ',
  },
  'pages.administration.roleConfigure.dashboardLanding': {
    hi: 'डैशबोर्ड और शुरुआती पेज',
    gu: 'ડેશબોર્ડ અને શરૂઆતનું પાનું',
  },
  'pages.administration.userManagement.roleAccess': {
    hi: 'भूमिका और पहुँच',
    gu: 'ભૂમિકા અને પહોંચ',
  },
  'pages.administration.activeSessions.networkDevice': {
    hi: 'नेटवर्क और डिवाइस',
    gu: 'નેટવર્ક અને ડિવાઇસ',
  },
  'pages.administration.menusPermissionsTab.clearAllMenusPermissions': {
    hi: 'सभी मेन्यू और अनुमतियाँ हटाएं?',
    gu: 'બધા મેન્યુ અને પરવાનગીઓ કાઢી નાખવી?',
  },
  'pages.settings.branchManagement.statusType': {
    hi: 'स्थिति और प्रकार',
    gu: 'સ્થિતિ અને પ્રકાર',
  },
  'pages.settings.printFormats.billLabelDesigner': {
    hi: 'बिल और लेबल डिज़ाइनर',
    gu: 'બિલ અને લેબલ ડિઝાઇનર',
  },
  'pages.secondHandDevice.purchaseDetailSections.sellerIdVerification': {
    hi: 'विक्रेता और पहचान जाँच',
    gu: 'વેચનાર અને ઓળખ ચકાસણી',
  },
  'pages.landing.landing.billingPaymentsConnected': {
    hi: 'बिलिंग और भुगतान, आपस में जुड़े',
    gu: 'બિલિંગ અને ચુકવણી, એકબીજા સાથે જોડાયેલાં',
  },
  'pages.landing.landing.assignRepair': { hi: 'सौंपना और मरम्मत', gu: 'સોંપણી અને મરામત' },
  'pages.landing.landing.billCollect': { hi: 'बिल और वसूली', gu: 'બિલ અને વસૂલાત' },
  'pages.landing.landing.deliverWarranty': {
    hi: 'सौंपना और वारंटी',
    gu: 'સોંપણી અને વોરંટી',
  },
  'pages.settings.rolePermissionsTab.saveGoLive': {
    hi: 'सहेजें और चालू करें',
    gu: 'સાચવો અને ચાલુ કરો',
  },
  'pages.settings.rolePermissionsTab.setVisibilityActions': {
    hi: 'दिखावट और कार्रवाइयाँ तय करें',
    gu: 'દેખાવ અને ક્રિયાઓ ગોઠવો',
  },

  // ---- Qualifiers and units in brackets ----------------------------------------------------
  'pages.administration.activeSessions.idle30m': {
    hi: 'निष्क्रिय (30 मिनट+)',
    gu: 'નિષ્ક્રિય (30 મિનિટ+)',
  },
  'pages.finance.cashBook.creditIn': { hi: 'जमा (आया)', gu: 'જમા (આવ્યું)' },
  'pages.finance.cashBook.debitOut': { hi: 'नामे (गया)', gu: 'ઉધાર (ગયું)' },
  'pages.finance.cashBook.totalCreditIn': { hi: 'कुल जमा (आया)', gu: 'કુલ જમા (આવ્યું)' },
  'pages.finance.cashBook.totalDebitOut': { hi: 'कुल नामे (गया)', gu: 'કુલ ઉધાર (ગયું)' },
  'pages.finance.partyLedger.creditCr': { hi: 'जमा (Cr)', gu: 'જમા (Cr)' },
  'pages.finance.partyLedger.debitDr': { hi: 'नामे (Dr)', gu: 'ઉધાર (Dr)' },
  'pages.finance.receiptsPayments.notesOptional': {
    hi: 'टिप्पणी (वैकल्पिक)',
    gu: 'નોંધ (વૈકલ્પિક)',
  },
  'pages.masters.itemCategories.noneRoot': { hi: 'कोई नहीं (मूल)', gu: 'કોઈ નહીં (મૂળ)' },
  'pages.masters.partyCategories.defaultCustomer': {
    hi: 'डिफ़ॉल्ट (ग्राहक)',
    gu: 'ડિફોલ્ટ (ગ્રાહક)',
  },
  'pages.masters.partyCategories.defaultSupplier': {
    hi: 'डिफ़ॉल्ट (सप्लायर)',
    gu: 'ડિફોલ્ટ (સપ્લાયર)',
  },
  'pages.masters.uom.conversionOptional': {
    hi: 'रूपांतरण (वैकल्पिक)',
    gu: 'રૂપાંતરણ (વૈકલ્પિક)',
  },
  'pages.secondHandDevice.createPurchase.accountLockIcloudGoogle': {
    hi: 'खाता लॉक (iCloud / Google)',
    gu: 'ખાતા લોક (iCloud / Google)',
  },
  'pages.secondHandDevice.createPurchase.secondImeiDualSim': {
    hi: 'दूसरा IMEI (डुअल सिम)',
    gu: 'બીજું IMEI (ડ્યુઅલ સિમ)',
  },
  'pages.secondHandDevice.deviceSale.warrantyDays': {
    hi: 'वारंटी (दिन)',
    gu: 'વોરંટી (દિવસ)',
  },
  'pages.secondHandDevice.saleRegister.profit': { hi: 'लाभ (₹)', gu: 'નફો (₹)' },
  'pages.service.createJobCard.alternateNumberOptional': {
    hi: 'दूसरा नंबर (वैकल्पिक)',
    gu: 'બીજો નંબર (વૈકલ્પિક)',
  },
  'pages.service.createJobCard.secondImeiOptional': {
    hi: 'दूसरा IMEI (वैकल्पिक)',
    gu: 'બીજું IMEI (વૈકલ્પિક)',
  },
  'pages.service.createJobCard.serialNumberOptional': {
    hi: 'सीरियल नंबर (वैकल्पिक)',
    gu: 'સિરિયલ નંબર (વૈકલ્પિક)',
  },
  'pages.settings.backupRestore.keepForDays': {
    hi: 'कितने दिन रखें (दिन)',
    gu: 'કેટલા દિવસ રાખવું (દિવસ)',
  },
  'pages.settings.designer.fontSizePt': { hi: 'अक्षर का आकार (pt)', gu: 'અક્ષરનું માપ (pt)' },
  'pages.settings.designer.rotation': { hi: 'घुमाव (°)', gu: 'ફેરવણી (°)' },
  'pages.settings.formBuilderTab.autoAdaptsToScreenSize': {
    hi: 'अपने आप (स्क्रीन के अनुसार)',
    gu: 'આપોઆપ (સ્ક્રીન પ્રમાણે)',
  },
  'pages.settings.formBuilderTab.compactPairedFields': {
    hi: 'सघन (जोड़े में फ़ील्ड)',
    gu: 'સઘન (જોડીમાં ફીલ્ડ)',
  },
  'pages.settings.formBuilderTab.standardOneFieldPerRow': {
    hi: 'मानक (एक पंक्ति में एक फ़ील्ड)',
    gu: 'પ્રમાણભૂત (એક પંક્તિમાં એક ફીલ્ડ)',
  },
  'pages.settings.pageSetupDialog.gapMm': { hi: 'अंतर (mm)', gu: 'અંતર (mm)' },
  'pages.settings.pageSetupDialog.heightMm': { hi: 'ऊँचाई (mm)', gu: 'ઊંચાઈ (mm)' },
  'pages.settings.pageSetupDialog.marginsMm': { hi: 'हाशिये (mm)', gu: 'હાંસિયા (mm)' },
  'pages.settings.pageSetupDialog.widthMm': { hi: 'चौड़ाई (mm)', gu: 'પહોળાઈ (mm)' },
  'pages.settings.usersSubtab.noneManualSelect': {
    hi: 'कोई नहीं (हाथ से चुनें)',
    gu: 'કોઈ નહીં (હાથે પસંદ કરો)',
  },
  'shared.15DigitImeiOptional': {
    hi: '15 अंकों का IMEI (वैकल्पिक)',
    gu: '15 અંકનો IMEI (વૈકલ્પિક)',
  },
  'shared.notesOptional': { hi: 'टिप्पणी (वैकल्पिक)', gu: 'નોંધ (વૈકલ્પિક)' },
  'shared.optional': { hi: '(वैकल्पिक)', gu: '(વૈકલ્પિક)' },
  'shared.optional2': { hi: '(वैकल्पिक)', gu: '(વૈકલ્પિક)' },

  // ---- Remaining prose ---------------------------------------------------------------------
  'pages.finance.expenses.recordRentSalariesAndOtherRunning': {
    hi: 'किराया, वेतन और बाकी चालू खर्च यहाँ दर्ज करें — ये सीधे रोकड़ बही और लाभ-हानि में जाते हैं।',
    gu: 'ભાડું, પગાર અને બાકીના ચાલુ ખર્ચ અહીં નોંધો — તે સીધા રોકડ ખાતાવહી અને નફા-નુકસાનમાં જાય છે.',
  },
  'pages.finance.expenses.shopRunningCostsRentSalariesUtilities': {
    hi: 'दुकान के चालू खर्च — किराया, वेतन, बिजली-पानी और बाकी सब जो लाभ-हानि में घटाया जाता है',
    gu: 'દુકાનના ચાલુ ખર્ચ — ભાડું, પગાર, વીજળી-પાણી અને બાકીનું બધું જે નફા-નુકસાનમાં બાદ થાય છે',
  },
  'pages.masters.parties.thisRemovesThePartyFromEvery': {
    hi: 'यह पार्टी को हर सूची (जॉब कार्ड, रसीदें, खरीद) से हटा देता है। ऐप में इसे वापस लाने की कोई स्क्रीन नहीं है — वापस लाने के लिए सीधे Firestore में बदलाव करना पड़ेगा।',
    gu: 'આ પાર્ટીને દરેક યાદી (જોબ કાર્ડ, રસીદો, ખરીદી) માંથી કાઢી નાખે છે. એપમાં તેને પાછી લાવવાની કોઈ સ્ક્રીન નથી — પાછી લાવવા સીધા Firestore માં ફેરફાર કરવો પડશે.',
  },
  'pages.reports.fieldVisitReport.onFieldTechnicianLogbookTimeSpent': {
    hi: 'फील्ड तकनीशियन लॉगबुक — हर जॉब पर लगा समय और इंजीनियर',
    gu: 'ફીલ્ડ ટેકનિશિયન લોગબુક — દરેક જોબ પર લાગેલો સમય અને એન્જિનિયર',
  },
  'pages.reports.profitLoss.profitLossIsBuiltFromReceipts': {
    hi: 'लाभ-हानि रसीदों और भुगतानों से बनती है। कोई भुगतान लें या खर्च दर्ज करें, तो वह यहाँ दिखेगा।',
    gu: 'નફો-નુકસાન રસીદો અને ચુકવણીમાંથી બને છે. કોઈ ચુકવણી લો કે ખર્ચ નોંધો, તો તે અહીં દેખાશે.',
  },
  'pages.secondHandDevice.devicePurchase.buyUsedMobilesLaptopsOtherDevices': {
    hi: 'विक्रेताओं से पुराने मोबाइल, लैपटॉप और दूसरी डिवाइस खरीदें',
    gu: 'વેચનારો પાસેથી જૂના મોબાઇલ, લેપટોપ અને બીજી ડિવાઇસ ખરીદો',
  },
  'pages.service.jobCosting.closedJobsRecordActualPartsLabor': {
    hi: 'बंद जॉब — असल पुर्ज़े, मज़दूरी और ऊपरी खर्च दर्ज करें',
    gu: 'બંધ જોબ — ખરા પાર્ટ્સ, મજૂરી અને ઉપરી ખર્ચ નોંધો',
  },
  'pages.settings.behaviorSubtab.canViewPricesPaymentData': {
    hi: 'कीमतें और भुगतान की जानकारी देख सकता है',
    gu: 'કિંમતો અને ચુકવણીની માહિતી જોઈ શકે છે',
  },
  'pages.settings.behaviorSubtab.collectPaymentSectionShowsInThe': {
    hi: 'बिल बनाएं पॉपअप में भुगतान लें वाला हिस्सा दिखता है (आंशिक / बँटा हुआ / बाकी)।',
    gu: 'બિલ બનાવો પોપઅપમાં ચુકવણી લો વાળો ભાગ દેખાય છે (આંશિક / વહેંચેલી / બાકી).',
  },
  'pages.settings.usersSubtab.cancelledBy': { hi: 'रद्द करने वाला', gu: 'રદ કરનાર' },
  'pages.settings.usersSubtab.deliveredBy': { hi: 'सौंपने वाला', gu: 'આપનાર' },
  'pages.secondHandDevice.purchaseDetailSections.buyer': { hi: 'खरीदार', gu: 'ખરીદનાર' },
  'pages.secondHandDevice.purchaseDetailSections.pinPattern': {
    hi: 'PIN / पैटर्न',
    gu: 'PIN / પેટર્ન',
  },
  'pages.secondHandDevice.purchaseDetailSections.profit': { hi: 'लाभ', gu: 'નફો' },
  'pages.secondHandDevice.purchaseDetailSections.returnedToSeller': {
    hi: 'विक्रेता को वापस',
    gu: 'વેચનારને પરત',
  },
  'pages.secondHandDevice.purchaseDetailSections.saleInvoice': {
    hi: 'विक्रय बिल #',
    gu: 'વેચાણ બિલ #',
  },
  'pages.secondHandDevice.purchaseDetailSections.seller': { hi: 'विक्रेता', gu: 'વેચનાર' },
}
