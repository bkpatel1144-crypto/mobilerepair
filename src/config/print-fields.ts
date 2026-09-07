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

/** `type` drives the badge in the designer's field list and which element type a field creates
 * when dropped on the canvas (an `image` field becomes an image element, not a text one). */
export type PrintFieldType = 'text' | 'currency' | 'date' | 'image' | 'barcode'

export interface PrintFieldDef {
  key: string
  label: string
  type: PrintFieldType
}

const SHOP_FIELDS: PrintFieldDef[] = [
  { key: 'shopName', label: 'Shop Name', type: 'text' },
  { key: 'shopPhone', label: 'Shop Phone', type: 'text' },
  { key: 'printedAt', label: 'Printed On', type: 'date' },
]

export const PRINT_FIELDS: Record<PrintDocumentType, PrintFieldDef[]> = {
  jobCard: [
    ...SHOP_FIELDS,
    { key: 'jobNumber', label: 'Job Number', type: 'text' },
    { key: 'createdAt', label: 'Date Received', type: 'date' },
    { key: 'customerName', label: 'Customer Name', type: 'text' },
    { key: 'customerMobile', label: 'Customer Mobile', type: 'text' },
    { key: 'deviceTypeName', label: 'Device Type', type: 'text' },
    { key: 'brandName', label: 'Brand', type: 'text' },
    { key: 'model', label: 'Model', type: 'text' },
    { key: 'imei', label: 'IMEI / Serial No', type: 'barcode' },
    { key: 'problemLabels', label: 'Reported Problems', type: 'text' },
    { key: 'estimatedCost', label: 'Estimated Cost', type: 'currency' },
    { key: 'advanceReceived', label: 'Advance Received', type: 'currency' },
    { key: 'receivedByName', label: 'Received By', type: 'text' },
    { key: 'status', label: 'Status', type: 'text' },
  ],
  jobCardBill: [
    ...SHOP_FIELDS,
    { key: 'jobNumber', label: 'Job Number', type: 'text' },
    { key: 'customerName', label: 'Customer Name', type: 'text' },
    { key: 'customerMobile', label: 'Customer Mobile', type: 'text' },
    { key: 'deviceTypeName', label: 'Device Type', type: 'text' },
    { key: 'brandName', label: 'Brand', type: 'text' },
    { key: 'model', label: 'Model', type: 'text' },
    { key: 'partsSummary', label: 'Parts / Service Items', type: 'text' },
    { key: 'finalAmount', label: 'Final Amount', type: 'currency' },
    { key: 'paidAmount', label: 'Amount Paid', type: 'currency' },
    { key: 'dueAmount', label: 'Amount Due', type: 'currency' },
    { key: 'deliveredByName', label: 'Delivered By', type: 'text' },
  ],
  paymentReceipt: [
    ...SHOP_FIELDS,
    { key: 'receiptNumber', label: 'Receipt Number', type: 'text' },
    { key: 'createdAt', label: 'Date', type: 'date' },
    { key: 'partyName', label: 'Party Name', type: 'text' },
    { key: 'amount', label: 'Amount', type: 'currency' },
    { key: 'mode', label: 'Payment Mode', type: 'text' },
    { key: 'purpose', label: 'Purpose', type: 'text' },
    { key: 'jobCardNumber', label: 'Against Job Card', type: 'text' },
    { key: 'createdByName', label: 'Received By', type: 'date' },
  ],
  purchaseReceipt: [
    ...SHOP_FIELDS,
    { key: 'partyName', label: 'Supplier Name', type: 'text' },
    { key: 'createdAt', label: 'Date', type: 'date' },
    { key: 'itemsSummary', label: 'Items', type: 'text' },
    { key: 'totalAmount', label: 'Total Amount', type: 'currency' },
    { key: 'createdByName', label: 'Purchased By', type: 'date' },
  ],
  secondHandPurchaseReceipt: [
    ...SHOP_FIELDS,
    { key: 'purchaseNumber', label: 'Purchase Number', type: 'text' },
    { key: 'createdAt', label: 'Purchase Date', type: 'date' },
    { key: 'sellerName', label: 'Seller Name', type: 'text' },
    { key: 'deviceTypeName', label: 'Device Type', type: 'text' },
    { key: 'brandName', label: 'Brand', type: 'text' },
    { key: 'model', label: 'Model', type: 'text' },
    { key: 'imei', label: 'IMEI / Serial No', type: 'barcode' },
    { key: 'purchasePrice', label: 'Purchase Price', type: 'currency' },
    { key: 'paymentMode', label: 'Payment Mode', type: 'text' },
    { key: 'purchasedByName', label: 'Purchased By', type: 'text' },
  ],
  secondHandSaleInvoice: [
    ...SHOP_FIELDS,
    { key: 'saleNumber', label: 'Sale/Invoice Number', type: 'text' },
    { key: 'createdAt', label: 'Sale Date', type: 'date' },
    { key: 'buyerName', label: 'Buyer Name', type: 'text' },
    { key: 'deviceLabel', label: 'Device', type: 'text' },
    { key: 'imei', label: 'IMEI / Serial No', type: 'barcode' },
    { key: 'salePrice', label: 'Sale Price', type: 'currency' },
    { key: 'warrantyDays', label: 'Warranty (days)', type: 'text' },
    { key: 'soldByName', label: 'Sold By', type: 'text' },
  ],
  secondHandDeviceLabel: [
    { key: 'deviceTypeName', label: 'Device Type', type: 'text' },
    { key: 'brandName', label: 'Brand', type: 'text' },
    { key: 'model', label: 'Model', type: 'text' },
    { key: 'imei', label: 'IMEI / Serial No', type: 'barcode' },
    { key: 'conditionGrade', label: 'Condition Grade', type: 'text' },
    { key: 'purchaseNumber', label: 'Purchase Number', type: 'text' },
    { key: 'salePrice', label: 'Price', type: 'currency' },
  ],
  deviceTagLabel: [
    { key: 'jobNumber', label: 'Job Number', type: 'text' },
    { key: 'customerName', label: 'Customer Name', type: 'text' },
    { key: 'customerMobile', label: 'Customer Mobile', type: 'text' },
    { key: 'deviceTypeName', label: 'Device Type', type: 'text' },
    { key: 'brandName', label: 'Brand', type: 'text' },
    { key: 'model', label: 'Model', type: 'text' },
    { key: 'createdAt', label: 'Date Received', type: 'date' },
  ],
  productLabel: [
    { key: 'itemName', label: 'Item Name', type: 'text' },
    { key: 'itemCode', label: 'Item Code', type: 'text' },
    { key: 'sellingPrice', label: 'Selling Price', type: 'currency' },
    { key: 'mrp', label: 'MRP', type: 'text' },
  ],
  barcodeLabel: [
    { key: 'itemName', label: 'Item Name', type: 'text' },
    { key: 'itemCode', label: 'Item Code / Barcode', type: 'barcode' },
    { key: 'sellingPrice', label: 'Price', type: 'currency' },
  ],
  customerLabel: [
    { key: 'customerName', label: 'Customer Name', type: 'text' },
    { key: 'customerMobile', label: 'Mobile', type: 'text' },
    { key: 'address', label: 'Address', type: 'text' },
  ],
}

/** Sample values shown in the template builder's own live preview — clearly fake ("Sample ..."),
 * never a real record, since the builder has no specific entity to bind to until something is
 * actually printed. */
export function samplePrintContext(type: PrintDocumentType): Record<string, string> {
  const base: Record<string, string> = {
    shopName: 'Your Shop Name',
    shopPhone: '98765 43210',
    printedAt: new Date().toLocaleString('en-IN'),
  }
  for (const field of PRINT_FIELDS[type]) {
    if (!(field.key in base)) base[field.key] = `Sample ${field.label}`
  }
  return base
}
