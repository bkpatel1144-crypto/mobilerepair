/**
 * Shared domain vocabulary — terms that appear on many pages and must read identically on all of
 * them. A shop that sees "જોબ કાર્ડ" in the sidebar and something else as a column header will
 * not trust the translation, so these live in `common.*` rather than being repeated per page.
 *
 * Keyed by the exact English string, because that is what the codemod matches on. Order does not
 * matter; the key name is derived from the English.
 *
 * English terms deliberately kept as-is in all three languages: statutory identifiers (GSTIN,
 * PAN, IMEI), payment rails (UPI), brand names (WhatsApp), and the technical words Indian shops
 * use in English regardless of the language they speak (IP, OTP, PDF, CSV).
 */
module.exports = {
  // ---- People and parties -----------------------------------------------------------------
  Customer: { key: 'customer', hi: 'ग्राहक', gu: 'ગ્રાહક' },
  Customers: { key: 'customers', hi: 'ग्राहक', gu: 'ગ્રાહકો' },
  Supplier: { key: 'supplier', hi: 'सप्लायर', gu: 'સપ્લાયર' },
  Suppliers: { key: 'suppliers', hi: 'सप्लायर', gu: 'સપ્લાયર' },
  Technician: { key: 'technician', hi: 'तकनीशियन', gu: 'ટેકનિશિયન' },
  Technicians: { key: 'technicians', hi: 'तकनीशियन', gu: 'ટેકનિશિયન' },
  Party: { key: 'party', hi: 'पार्टी', gu: 'પાર્ટી' },
  Parties: { key: 'parties', hi: 'पार्टियाँ', gu: 'પાર્ટીઓ' },
  User: { key: 'user', hi: 'उपयोगकर्ता', gu: 'વપરાશકર્તા' },
  Users: { key: 'users', hi: 'उपयोगकर्ता', gu: 'વપરાશકર્તાઓ' },
  'Received By': { key: 'receivedBy', hi: 'प्राप्तकर्ता', gu: 'સ્વીકારનાર' },
  'Assigned To': { key: 'assignedTo', hi: 'सौंपा गया', gu: 'સોંપેલ' },
  'Created By': { key: 'createdByLabel', hi: 'बनाने वाला', gu: 'બનાવનાર' },

  // ---- Devices and repair -----------------------------------------------------------------
  Device: { key: 'device', hi: 'डिवाइस', gu: 'ડિવાઇસ' },
  Devices: { key: 'devices', hi: 'डिवाइस', gu: 'ડિવાઇસ' },
  'Job Card': { key: 'jobCard', hi: 'जॉब कार्ड', gu: 'જોબ કાર્ડ' },
  'Job Cards': { key: 'jobCards', hi: 'जॉब कार्ड', gu: 'જોબ કાર્ડ' },
  Jobs: { key: 'jobs', hi: 'जॉब', gu: 'જોબ' },
  Job: { key: 'job', hi: 'जॉब', gu: 'જોબ' },
  Brand: { key: 'brand', hi: 'ब्रांड', gu: 'બ્રાન્ડ' },
  Model: { key: 'model', hi: 'मॉडल', gu: 'મોડેલ' },
  Problem: { key: 'problem', hi: 'समस्या', gu: 'સમસ્યા' },
  Problems: { key: 'problems', hi: 'समस्याएं', gu: 'સમસ્યાઓ' },
  Part: { key: 'part', hi: 'पुर्ज़ा', gu: 'પાર્ટ' },
  Parts: { key: 'parts', hi: 'पुर्ज़े', gu: 'પાર્ટ્સ' },
  Repair: { key: 'repair', hi: 'मरम्मत', gu: 'મરામત' },
  Warranty: { key: 'warranty', hi: 'वारंटी', gu: 'વોરંટી' },
  Item: { key: 'item', hi: 'आइटम', gu: 'આઇટમ' },
  Items: { key: 'items', hi: 'आइटम', gu: 'આઇટમ' },
  Stock: { key: 'stock', hi: 'स्टॉक', gu: 'સ્ટોક' },

  // ---- Money ------------------------------------------------------------------------------
  Revenue: { key: 'revenue', hi: 'आय', gu: 'આવક' },
  Profit: { key: 'profit', hi: 'लाभ', gu: 'નફો' },
  Loss: { key: 'loss', hi: 'हानि', gu: 'નુકસાન' },
  Margin: { key: 'margin', hi: 'मार्जिन', gu: 'માર્જિન' },
  Outstanding: { key: 'outstanding', hi: 'बाकी राशि', gu: 'બાકી રકમ' },
  Cash: { key: 'cash', hi: 'नकद', gu: 'રોકડ' },
  Card: { key: 'cardMode', hi: 'कार्ड', gu: 'કાર્ડ' },
  Receipt: { key: 'receipt', hi: 'रसीद', gu: 'રસીદ' },
  Receipts: { key: 'receipts', hi: 'रसीदें', gu: 'રસીદો' },
  Payment: { key: 'payment', hi: 'भुगतान', gu: 'ચુકવણી' },
  Payments: { key: 'payments', hi: 'भुगतान', gu: 'ચુકવણી' },
  Refund: { key: 'refund', hi: 'वापसी', gu: 'રિફંડ' },
  Advance: { key: 'advance', hi: 'अग्रिम', gu: 'એડવાન્સ' },
  Expense: { key: 'expense', hi: 'खर्च', gu: 'ખર્ચ' },
  Expenses: { key: 'expensesLabel', hi: 'खर्च', gu: 'ખર્ચ' },
  Bill: { key: 'bill', hi: 'बिल', gu: 'બિલ' },
  Invoice: { key: 'invoice', hi: 'बिल', gu: 'બિલ' },
  'Payment Mode': { key: 'paymentMode', hi: 'भुगतान का तरीका', gu: 'ચુકવણીની રીત' },
  'Purchase Price': { key: 'purchasePrice', hi: 'खरीद कीमत', gu: 'ખરીદ કિંમત' },
  'Selling Price': { key: 'sellingPrice', hi: 'विक्रय कीमत', gu: 'વેચાણ કિંમત' },
  'Sale Price': { key: 'salePrice', hi: 'विक्रय कीमत', gu: 'વેચાણ કિંમત' },
  'Estimated Cost': { key: 'estimatedCost', hi: 'अनुमानित लागत', gu: 'અંદાજિત ખર્ચ' },
  'Final Amount': { key: 'finalAmount', hi: 'अंतिम राशि', gu: 'આખરી રકમ' },
  Credit: { key: 'credit', hi: 'जमा', gu: 'જમા' },
  Debit: { key: 'debit', hi: 'नामे', gu: 'ઉધાર' },
  Opening: { key: 'opening', hi: 'प्रारंभिक', gu: 'શરૂઆતની' },
  Closing: { key: 'closing', hi: 'अंतिम', gu: 'આખરી' },

  // ---- Time and structure -----------------------------------------------------------------
  Time: { key: 'time', hi: 'समय', gu: 'સમય' },
  Timeline: { key: 'timeline', hi: 'समय-रेखा', gu: 'સમયરેખા' },
  Today: { key: 'today', hi: 'आज', gu: 'આજે' },
  Yesterday: { key: 'yesterday', hi: 'कल', gu: 'ગઈકાલે' },
  'This Week': { key: 'thisWeek', hi: 'इस सप्ताह', gu: 'આ અઠવાડિયે' },
  'This Month': { key: 'thisMonth', hi: 'इस महीने', gu: 'આ મહિને' },
  'This Year': { key: 'thisYear', hi: 'इस साल', gu: 'આ વર્ષે' },
  'All Time': { key: 'allTime', hi: 'सभी समय', gu: 'બધો સમય' },
  Custom: { key: 'customRange', hi: 'कस्टम', gu: 'કસ્ટમ' },
  From: { key: 'from', hi: 'से', gu: 'થી' },
  To: { key: 'to', hi: 'तक', gu: 'સુધી' },
  Sold: { key: 'sold', hi: 'बिका', gu: 'વેચાયું' },
  Available: { key: 'available', hi: 'उपलब्ध', gu: 'ઉપલબ્ધ' },
  Details: { key: 'details', hi: 'विवरण', gu: 'વિગતો' },
  Summary: { key: 'summary', hi: 'सारांश', gu: 'સારાંશ' },
  Overview: { key: 'overview', hi: 'अवलोकन', gu: 'ઝલક' },
  Information: { key: 'information', hi: 'जानकारी', gu: 'માહિતી' },
  Permissions: { key: 'permissions', hi: 'अनुमतियाँ', gu: 'પરવાનગીઓ' },
  Menus: { key: 'menus', hi: 'मेन्यू', gu: 'મેન્યુ' },
  Company: { key: 'company', hi: 'कंपनी', gu: 'કંપની' },
  Branches: { key: 'branches', hi: 'शाखाएं', gu: 'શાખાઓ' },
  Roles: { key: 'rolesLabel', hi: 'भूमिकाएं', gu: 'ભૂમિકાઓ' },

  // ---- Common filter option labels --------------------------------------------------------
  'All Types': { key: 'allTypes', hi: 'सभी प्रकार', gu: 'બધા પ્રકાર' },
  'All Statuses': { key: 'allStatuses', hi: 'सभी स्थितियाँ', gu: 'બધી સ્થિતિ' },
  'All Categories': { key: 'allCategories', hi: 'सभी श्रेणियाँ', gu: 'બધી શ્રેણી' },
  'All Branches': { key: 'allBranches', hi: 'सभी शाखाएं', gu: 'બધી શાખાઓ' },
  'All Roles': { key: 'allRoles', hi: 'सभी भूमिकाएं', gu: 'બધી ભૂમિકાઓ' },

  // ---- Frequent placeholders --------------------------------------------------------------
  '10-digit mobile': { key: 'tenDigitMobile', hi: '10 अंकों का मोबाइल', gu: '10 અંકનો મોબાઇલ' },
}
