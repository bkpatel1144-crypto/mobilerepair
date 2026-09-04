import { PRINT_FIELDS } from '@/config/print-fields'
import type { PrintContext } from '@/lib/print-contexts'
import type { PrintDocumentType } from '@/types/firestore'

/**
 * Stand-in values for the designer's canvas only.
 *
 * Never used by a real print: `renderPrintHtml` is always called with a context built from an
 * actual record (`print-contexts.ts`). This exists because a designer showing empty boxes is
 * unusable — you cannot judge whether a row fits 58mm paper without something in it. Values are
 * obviously specimen data so a screenshot of the designer can never be mistaken for a real bill.
 */
const SAMPLES: Record<string, string> = {
  jobNumber: 'JC-2607-00042',
  receiptNumber: 'RC-2607-00018',
  createdAt: '03/09/2026',
  printedAt: '03/09/2026 11:10',
  status: 'In Progress',
  customerName: 'Rahul Sharma',
  customerMobile: '9876543210',
  customerAddress: 'Shop 4, MG Road',
  partyName: 'Rahul Sharma',
  deviceTypeName: 'Mobile',
  brandName: 'Samsung',
  model: 'Galaxy A54',
  deviceLabel: 'Samsung Galaxy A54',
  imei: '356938035643809',
  serialNo: 'SN-7781-2290',
  devicePinPattern: '1234',
  problemLabels: 'Display not working',
  remark: 'Handle with care',
  receivedByName: 'Owner',
  assignedToName: 'Technician',
  estimatedCost: '2500',
  advanceReceived: '500',
  finalAmount: '2500',
  paidAmount: '500',
  balance: '2000',
  amount: '500',
  mode: 'Cash',
  itemName: 'Tempered Glass',
  sellingPrice: '199',
  purchasePrice: '8000',
  salePrice: '11500',
  notes: 'Thank you for your business',
}

export function samplePrintContext(documentType: PrintDocumentType, shopName: string): PrintContext {
  const ctx: PrintContext = {
    shopName,
    shopPhone: '9898767654',
    shopEmail: 'shop@example.com',
    shopAddress: 'MG Road, Rajkot',
    shopGstin: '24ABCDE1234F1Z5',
  }
  // Every field the document type declares gets *something*, so no row on the canvas is blank
  // just because this file forgot a key.
  for (const f of PRINT_FIELDS[documentType] ?? []) {
    if (ctx[f.key] !== undefined) continue
    ctx[f.key] =
      SAMPLES[f.key] ?? (f.type === 'currency' ? '0' : f.type === 'date' ? '03/09/2026' : f.label)
  }
  return ctx
}
