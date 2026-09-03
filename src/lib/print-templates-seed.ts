import { collection, doc, serverTimestamp, type WriteBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { printTemplatesCollection } from '@/lib/firestore-paths'
import type { PrintDocumentType, PrintTemplateBlock, PrintTemplateDoc } from '@/types/firestore'

function field(fieldKey: string, label: string, opts: Partial<PrintTemplateBlock> = {}): PrintTemplateBlock {
  return {
    id: crypto.randomUUID(),
    kind: 'field',
    fieldKey,
    label,
    text: null,
    bold: false,
    align: 'left',
    fontSize: 'sm',
    ...opts,
  }
}
function text(value: string, opts: Partial<PrintTemplateBlock> = {}): PrintTemplateBlock {
  return { id: crypto.randomUUID(), kind: 'text', fieldKey: null, label: 'Heading', text: value, bold: true, align: 'center', fontSize: 'md', ...opts }
}
function divider(): PrintTemplateBlock {
  return { id: crypto.randomUUID(), kind: 'divider', fieldKey: null, label: 'Divider', text: null, bold: false, align: 'left', fontSize: 'sm' }
}

interface DefaultTemplateSpec {
  documentType: PrintDocumentType
  name: string
  paperWidth: PrintTemplateDoc['paperWidth']
  blocks: PrintTemplateBlock[]
}

/** One sensible, real, usable default per document type — every company gets something a print
 * button can actually render from day one, matching the "seed real usable defaults, not an
 * empty shelf" convention already used for Service Options/Masters. Not an attempt to replicate
 * the reference's own observed per-type format *counts* (those grew from users adding more
 * templates over time) — just the honest starting point, editable/extendable afterward exactly
 * like any other seeded default in this app. */
const DEFAULT_TEMPLATES: DefaultTemplateSpec[] = [
  {
    documentType: 'jobCard',
    name: 'Default Job Card (58mm)',
    paperWidth: '58mm',
    blocks: [
      field('shopName', 'Shop Name', { bold: true, align: 'center', fontSize: 'md' }),
      divider(),
      field('jobNumber', 'Job Number', { bold: true }),
      field('createdAt', 'Date Received'),
      field('customerName', 'Customer Name'),
      field('customerMobile', 'Customer Mobile'),
      field('deviceTypeName', 'Device Type'),
      field('brandName', 'Brand'),
      field('model', 'Model'),
      field('problemLabels', 'Reported Problems'),
      field('estimatedCost', 'Estimated Cost'),
      field('advanceReceived', 'Advance Received'),
      field('receivedByName', 'Received By'),
    ],
  },
  {
    documentType: 'jobCardBill',
    name: 'Default Job Card Bill (58mm)',
    paperWidth: '58mm',
    blocks: [
      field('shopName', 'Shop Name', { bold: true, align: 'center', fontSize: 'md' }),
      text('TAX INVOICE', { fontSize: 'sm' }),
      divider(),
      field('jobNumber', 'Job Number', { bold: true }),
      field('customerName', 'Customer Name'),
      field('deviceTypeName', 'Device Type'),
      field('brandName', 'Brand'),
      field('model', 'Model'),
      divider(),
      field('partsSummary', 'Parts / Service Items'),
      divider(),
      field('finalAmount', 'Final Amount', { bold: true }),
      field('paidAmount', 'Amount Paid'),
      field('dueAmount', 'Amount Due'),
      text('Thank you for your business!', { bold: false, fontSize: 'sm' }),
    ],
  },
  {
    documentType: 'paymentReceipt',
    name: 'Default Payment Receipt (58mm)',
    paperWidth: '58mm',
    blocks: [
      field('shopName', 'Shop Name', { bold: true, align: 'center', fontSize: 'md' }),
      text('PAYMENT RECEIPT', { fontSize: 'sm' }),
      divider(),
      field('receiptNumber', 'Receipt Number', { bold: true }),
      field('createdAt', 'Date'),
      field('partyName', 'Party Name'),
      field('jobCardNumber', 'Against Job Card'),
      field('mode', 'Payment Mode'),
      field('amount', 'Amount', { bold: true }),
      field('createdByName', 'Received By'),
    ],
  },
  {
    documentType: 'purchaseReceipt',
    name: 'Default Purchase Receipt (58mm)',
    paperWidth: '58mm',
    blocks: [
      field('shopName', 'Shop Name', { bold: true, align: 'center', fontSize: 'md' }),
      text('PURCHASE RECEIPT', { fontSize: 'sm' }),
      divider(),
      field('createdAt', 'Date'),
      field('partyName', 'Supplier Name'),
      field('itemsSummary', 'Items'),
      field('totalAmount', 'Total Amount', { bold: true }),
      field('createdByName', 'Purchased By'),
    ],
  },
  {
    documentType: 'secondHandPurchaseReceipt',
    name: 'Default Second Hand Device Purchase Receipt (58mm)',
    paperWidth: '58mm',
    blocks: [
      field('shopName', 'Shop Name', { bold: true, align: 'center', fontSize: 'md' }),
      text('DEVICE PURCHASE RECEIPT', { fontSize: 'sm' }),
      divider(),
      field('purchaseNumber', 'Purchase Number', { bold: true }),
      field('createdAt', 'Purchase Date'),
      field('sellerName', 'Seller Name'),
      field('deviceTypeName', 'Device Type'),
      field('brandName', 'Brand'),
      field('model', 'Model'),
      field('imei', 'IMEI / Serial No'),
      field('purchasePrice', 'Purchase Price', { bold: true }),
      field('paymentMode', 'Payment Mode'),
      field('purchasedByName', 'Purchased By'),
    ],
  },
  {
    documentType: 'secondHandSaleInvoice',
    name: 'Default Second Hand Device Sale Invoice (58mm)',
    paperWidth: '58mm',
    blocks: [
      field('shopName', 'Shop Name', { bold: true, align: 'center', fontSize: 'md' }),
      text('SALE INVOICE', { fontSize: 'sm' }),
      divider(),
      field('saleNumber', 'Sale/Invoice Number', { bold: true }),
      field('createdAt', 'Sale Date'),
      field('buyerName', 'Buyer Name'),
      field('deviceLabel', 'Device'),
      field('imei', 'IMEI / Serial No'),
      field('salePrice', 'Sale Price', { bold: true }),
      field('warrantyDays', 'Warranty (days)'),
      field('soldByName', 'Sold By'),
    ],
  },
  {
    documentType: 'secondHandDeviceLabel',
    name: 'Default Second Hand Device Label',
    paperWidth: '58mm',
    blocks: [
      field('brandName', 'Brand', { bold: true }),
      field('model', 'Model', { bold: true }),
      field('imei', 'IMEI / Serial No'),
      field('conditionGrade', 'Condition Grade'),
      field('salePrice', 'Price', { bold: true, fontSize: 'md' }),
    ],
  },
  {
    documentType: 'deviceTagLabel',
    name: 'Default Device Tag Label',
    paperWidth: '58mm',
    blocks: [
      field('jobNumber', 'Job Number', { bold: true }),
      field('customerName', 'Customer Name'),
      field('deviceTypeName', 'Device Type'),
      field('brandName', 'Brand'),
      field('model', 'Model'),
      field('createdAt', 'Date Received'),
    ],
  },
  {
    documentType: 'productLabel',
    name: 'Default Product Label',
    paperWidth: '58mm',
    blocks: [
      field('itemName', 'Item Name', { bold: true }),
      field('itemCode', 'Item Code'),
      field('sellingPrice', 'Selling Price', { bold: true, fontSize: 'md' }),
    ],
  },
  {
    documentType: 'barcodeLabel',
    name: 'Default Barcode Label',
    paperWidth: '58mm',
    blocks: [
      field('itemName', 'Item Name', { bold: true }),
      field('itemCode', 'Item Code / Barcode', { align: 'center', fontSize: 'md' }),
      field('sellingPrice', 'Price'),
    ],
  },
  {
    documentType: 'customerLabel',
    name: 'Default Customer Label',
    paperWidth: '58mm',
    blocks: [field('customerName', 'Customer Name', { bold: true }), field('customerMobile', 'Mobile'), field('address', 'Address')],
  },
]

/** Adds one protected default `PrintTemplateDoc` per document type to `batch` — called from
 * `seedTenantForUser()` alongside every other Phase 2+ default dataset, so a fresh company's
 * Print Formats page (and every real print button elsewhere) has something to render from the
 * very first signup, never an empty shelf. */
export function addDefaultPrintTemplatesToBatch(
  batch: WriteBatch,
  companyId: string,
  uid: string,
  userName: string
): void {
  const now = serverTimestamp()
  for (const spec of DEFAULT_TEMPLATES) {
    const ref = doc(collection(db, printTemplatesCollection(companyId)))
    const data: PrintTemplateDoc = {
      name: spec.name,
      documentType: spec.documentType,
      paperWidth: spec.paperWidth,
      blocks: spec.blocks,
      isDefault: true,
      protected: true,
      createdById: uid,
      createdByName: userName,
      createdAt: now as never,
      updatedAt: now as never,
    }
    batch.set(ref, data)
  }
}
