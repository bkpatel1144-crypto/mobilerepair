import type { PrintDocumentType } from '@/types/firestore'

/**
 * The picklist a template's field-block dropdown offers, per document type — purely UI
 * metadata for the builder (`print-formats-page.tsx`). The actual *values* substituted at print
 * time come from a separate, per-caller "print context" object built by whichever page owns the
 * real record (`src/lib/print-render.ts`'s `renderPrintHtml`); this file only says which keys
 * exist and what to label them, never how to compute one.
 */
export const PRINT_DOCUMENT_TYPES: { key: PrintDocumentType; label: string }[] = [
  { key: 'jobCard', label: 'Job Card' },
  { key: 'jobCardBill', label: 'Job Card Bill' },
  { key: 'paymentReceipt', label: 'Payment Receipt' },
  { key: 'purchaseReceipt', label: 'Purchase Receipt' },
  { key: 'secondHandPurchaseReceipt', label: 'Second Hand Device Purchase Receipt' },
  { key: 'secondHandSaleInvoice', label: 'Second Hand Device Sale Invoice' },
  { key: 'secondHandDeviceLabel', label: 'Second Hand Device Label' },
  { key: 'deviceTagLabel', label: 'Device Tag Label' },
  { key: 'productLabel', label: 'Product Label' },
  { key: 'barcodeLabel', label: 'Barcode Label' },
  { key: 'customerLabel', label: 'Customer Label' },
]

export function printDocumentTypeLabel(type: PrintDocumentType): string {
  return PRINT_DOCUMENT_TYPES.find((t) => t.key === type)?.label ?? type
}

export interface PrintFieldDef {
  key: string
  label: string
}

const SHOP_FIELDS: PrintFieldDef[] = [
  { key: 'shopName', label: 'Shop Name' },
  { key: 'shopPhone', label: 'Shop Phone' },
  { key: 'printedAt', label: 'Printed On' },
]

export const PRINT_FIELDS: Record<PrintDocumentType, PrintFieldDef[]> = {
  jobCard: [
    ...SHOP_FIELDS,
    { key: 'jobNumber', label: 'Job Number' },
    { key: 'createdAt', label: 'Date Received' },
    { key: 'customerName', label: 'Customer Name' },
    { key: 'customerMobile', label: 'Customer Mobile' },
    { key: 'deviceTypeName', label: 'Device Type' },
    { key: 'brandName', label: 'Brand' },
    { key: 'model', label: 'Model' },
    { key: 'imei', label: 'IMEI / Serial No' },
    { key: 'problemLabels', label: 'Reported Problems' },
    { key: 'estimatedCost', label: 'Estimated Cost' },
    { key: 'advanceReceived', label: 'Advance Received' },
    { key: 'receivedByName', label: 'Received By' },
    { key: 'status', label: 'Status' },
  ],
  jobCardBill: [
    ...SHOP_FIELDS,
    { key: 'jobNumber', label: 'Job Number' },
    { key: 'customerName', label: 'Customer Name' },
    { key: 'customerMobile', label: 'Customer Mobile' },
    { key: 'deviceTypeName', label: 'Device Type' },
    { key: 'brandName', label: 'Brand' },
    { key: 'model', label: 'Model' },
    { key: 'partsSummary', label: 'Parts / Service Items' },
    { key: 'finalAmount', label: 'Final Amount' },
    { key: 'paidAmount', label: 'Amount Paid' },
    { key: 'dueAmount', label: 'Amount Due' },
    { key: 'deliveredByName', label: 'Delivered By' },
  ],
  paymentReceipt: [
    ...SHOP_FIELDS,
    { key: 'receiptNumber', label: 'Receipt Number' },
    { key: 'createdAt', label: 'Date' },
    { key: 'partyName', label: 'Party Name' },
    { key: 'amount', label: 'Amount' },
    { key: 'mode', label: 'Payment Mode' },
    { key: 'purpose', label: 'Purpose' },
    { key: 'jobCardNumber', label: 'Against Job Card' },
    { key: 'createdByName', label: 'Received By' },
  ],
  purchaseReceipt: [
    ...SHOP_FIELDS,
    { key: 'partyName', label: 'Supplier Name' },
    { key: 'createdAt', label: 'Date' },
    { key: 'itemsSummary', label: 'Items' },
    { key: 'totalAmount', label: 'Total Amount' },
    { key: 'createdByName', label: 'Purchased By' },
  ],
  secondHandPurchaseReceipt: [
    ...SHOP_FIELDS,
    { key: 'purchaseNumber', label: 'Purchase Number' },
    { key: 'createdAt', label: 'Purchase Date' },
    { key: 'sellerName', label: 'Seller Name' },
    { key: 'deviceTypeName', label: 'Device Type' },
    { key: 'brandName', label: 'Brand' },
    { key: 'model', label: 'Model' },
    { key: 'imei', label: 'IMEI / Serial No' },
    { key: 'purchasePrice', label: 'Purchase Price' },
    { key: 'paymentMode', label: 'Payment Mode' },
    { key: 'purchasedByName', label: 'Purchased By' },
  ],
  secondHandSaleInvoice: [
    ...SHOP_FIELDS,
    { key: 'saleNumber', label: 'Sale/Invoice Number' },
    { key: 'createdAt', label: 'Sale Date' },
    { key: 'buyerName', label: 'Buyer Name' },
    { key: 'deviceLabel', label: 'Device' },
    { key: 'imei', label: 'IMEI / Serial No' },
    { key: 'salePrice', label: 'Sale Price' },
    { key: 'warrantyDays', label: 'Warranty (days)' },
    { key: 'soldByName', label: 'Sold By' },
  ],
  secondHandDeviceLabel: [
    { key: 'deviceTypeName', label: 'Device Type' },
    { key: 'brandName', label: 'Brand' },
    { key: 'model', label: 'Model' },
    { key: 'imei', label: 'IMEI / Serial No' },
    { key: 'conditionGrade', label: 'Condition Grade' },
    { key: 'purchaseNumber', label: 'Purchase Number' },
    { key: 'salePrice', label: 'Price' },
  ],
  deviceTagLabel: [
    { key: 'jobNumber', label: 'Job Number' },
    { key: 'customerName', label: 'Customer Name' },
    { key: 'customerMobile', label: 'Customer Mobile' },
    { key: 'deviceTypeName', label: 'Device Type' },
    { key: 'brandName', label: 'Brand' },
    { key: 'model', label: 'Model' },
    { key: 'createdAt', label: 'Date Received' },
  ],
  productLabel: [
    { key: 'itemName', label: 'Item Name' },
    { key: 'itemCode', label: 'Item Code' },
    { key: 'sellingPrice', label: 'Selling Price' },
    { key: 'mrp', label: 'MRP' },
  ],
  barcodeLabel: [
    { key: 'itemName', label: 'Item Name' },
    { key: 'itemCode', label: 'Item Code / Barcode' },
    { key: 'sellingPrice', label: 'Price' },
  ],
  customerLabel: [
    { key: 'customerName', label: 'Customer Name' },
    { key: 'customerMobile', label: 'Mobile' },
    { key: 'address', label: 'Address' },
  ],
}

/** Sample values shown in the template builder's own live preview — clearly fake ("Sample ..."),
 * never a real record, since the builder has no specific entity to bind to until something is
 * actually printed. */
export function samplePrintContext(type: PrintDocumentType): Record<string, string> {
  const base: Record<string, string> = { shopName: 'Your Shop Name', shopPhone: '98765 43210', printedAt: new Date().toLocaleString('en-IN') }
  for (const field of PRINT_FIELDS[type]) {
    if (!(field.key in base)) base[field.key] = `Sample ${field.label}`
  }
  return base
}
