import type { JobCardWithId } from '@/hooks/use-job-cards'
import type { SecondHandPurchaseWithId } from '@/hooks/use-second-hand-purchases'
import type { SecondHandSaleWithId } from '@/hooks/use-second-hand-sales'
import type { ReceiptWithId } from '@/hooks/use-receipts'
import type { CompanyWithId } from '@/hooks/use-company'
import { formatCurrency, formatTimestamp } from '@/lib/utils'

type PrintContext = Record<string, string | number | null | undefined>

function shopFields(company: CompanyWithId | null | undefined): PrintContext {
  return {
    shopName: company?.name ?? '',
    shopPhone: company?.phone ?? '',
    printedAt: new Date().toLocaleString('en-IN'),
  }
}

/** Backs the Job Card detail page's "Print Job Card"/"Print Label" buttons (`jobCard`/
 * `deviceTagLabel` templates) — real field values, not the honest-but-fake `window.print()` stub
 * this replaces. */
export function jobCardPrintContext(job: JobCardWithId, company: CompanyWithId | null | undefined): PrintContext {
  return {
    ...shopFields(company),
    jobNumber: job.jobNumber,
    createdAt: formatTimestamp(job.createdAt, false),
    customerName: job.customerName,
    customerMobile: job.customerMobile,
    deviceTypeName: job.deviceTypeName,
    brandName: job.brandName,
    model: job.model,
    imei: job.imei,
    problemLabels: job.problemLabels.join(', '),
    estimatedCost: formatCurrency(job.estimatedCost),
    advanceReceived: formatCurrency(job.advanceReceived),
    receivedByName: job.receivedByName,
    status: job.status,
  }
}

/** Backs "Print Bill" (`jobCardBill` template). */
export function jobCardBillPrintContext(job: JobCardWithId, company: CompanyWithId | null | undefined): PrintContext {
  const partsSummary = [
    ...job.partsUsed.map((p) => `${p.itemName} x${p.qty} - ${formatCurrency(p.rate * p.qty)}`),
    ...job.serviceItems.map((s) => `${s.itemName} - ${formatCurrency(s.price)}`),
  ].join('; ')
  const finalAmount = job.finalAmount ?? job.estimatedCost
  return {
    ...shopFields(company),
    jobNumber: job.jobNumber,
    customerName: job.customerName,
    customerMobile: job.customerMobile,
    deviceTypeName: job.deviceTypeName,
    brandName: job.brandName,
    model: job.model,
    partsSummary: partsSummary || 'None',
    finalAmount: formatCurrency(finalAmount),
    paidAmount: formatCurrency(job.paidAmount),
    dueAmount: formatCurrency(Math.max(0, finalAmount - job.paidAmount)),
    deliveredByName: job.deliveredByName,
  }
}

export function secondHandPurchaseReceiptContext(purchase: SecondHandPurchaseWithId, company: CompanyWithId | null | undefined): PrintContext {
  return {
    ...shopFields(company),
    purchaseNumber: purchase.purchaseNumber,
    createdAt: formatTimestamp(purchase.createdAt, false),
    sellerName: purchase.sellerName,
    deviceTypeName: purchase.deviceTypeName,
    brandName: purchase.brandName,
    model: purchase.model,
    imei: purchase.imei,
    purchasePrice: formatCurrency(purchase.purchasePrice),
    paymentMode: purchase.paymentMode.toUpperCase(),
    purchasedByName: purchase.purchasedByName,
  }
}

export function secondHandDeviceLabelContext(
  device: { deviceTypeName: string | null; brandName: string | null; model: string | null; imei: string | null; conditionGrade?: string; purchaseNumber?: string; price?: number },
  company: CompanyWithId | null | undefined
): PrintContext {
  return {
    ...shopFields(company),
    deviceTypeName: device.deviceTypeName,
    brandName: device.brandName,
    model: device.model,
    imei: device.imei,
    conditionGrade: device.conditionGrade,
    purchaseNumber: device.purchaseNumber,
    salePrice: device.price != null ? formatCurrency(device.price) : undefined,
  }
}

export function secondHandSaleInvoiceContext(sale: SecondHandSaleWithId, company: CompanyWithId | null | undefined): PrintContext {
  return {
    ...shopFields(company),
    saleNumber: sale.saleNumber,
    createdAt: formatTimestamp(sale.createdAt, false),
    buyerName: sale.buyerName,
    deviceLabel: sale.deviceLabel,
    salePrice: formatCurrency(sale.salePrice),
    warrantyDays: sale.warrantyDays,
    soldByName: sale.soldByName,
  }
}

export function paymentReceiptContext(receipt: ReceiptWithId, company: CompanyWithId | null | undefined): PrintContext {
  return {
    ...shopFields(company),
    receiptNumber: receipt.receiptNumber,
    createdAt: formatTimestamp(receipt.createdAt, false),
    partyName: receipt.partyName,
    amount: formatCurrency(receipt.amount),
    mode: receipt.mode.toUpperCase(),
    purpose: receipt.purpose,
    jobCardNumber: receipt.jobCardNumber,
    createdByName: receipt.createdByName,
  }
}
