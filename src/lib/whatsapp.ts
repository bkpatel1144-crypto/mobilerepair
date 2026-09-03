import type { WhatsAppTemplateDoc } from '@/types/firestore'

/** Seeded onto every new company's `whatsappConfig/config` doc (Phase 10) — replaces what was,
 * until now, a single hardcoded message string baked directly into the Job Card detail page's
 * own WhatsApp button (`{{...}}` placeholders resolved by `resolveWhatsAppMessage()` below). */
export const DEFAULT_WHATSAPP_TEMPLATES: WhatsAppTemplateDoc[] = [
  {
    event: 'jobCreated',
    label: 'Job Card Created',
    enabled: true,
    message: 'Hi {{customerName}}, your job card {{jobNumber}} has been created at {{shopName}}. We will keep you updated on the progress.',
  },
  {
    event: 'statusChanged',
    label: 'Status Update',
    enabled: true,
    message: 'Hi {{customerName}}, an update on your job {{jobNumber}}: status is now "{{status}}".',
  },
  {
    event: 'billGenerated',
    label: 'Bill Generated',
    enabled: true,
    message: 'Hi {{customerName}}, the bill for your job {{jobNumber}} is ready. Amount: {{amount}}. Please visit {{shopName}} to collect your device.',
  },
  {
    event: 'delivered',
    label: 'Device Delivered',
    enabled: true,
    message: 'Hi {{customerName}}, your device for job {{jobNumber}} has been delivered. Thank you for choosing {{shopName}}!',
  },
  {
    event: 'paymentReceived',
    label: 'Payment Received',
    enabled: true,
    message: 'Hi {{customerName}}, we have received your payment of {{amount}} for job {{jobNumber}}. Thank you!',
  },
]

/** `{{customerName}}` → the matching key in `values`, or removed entirely if that key is
 * missing — never leaves a literal `{{...}}` placeholder visible in a sent message. */
export function resolveWhatsAppMessage(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => values[key] ?? '')
}

/** A job's current status picks which lifecycle template reads most naturally — a job that's
 * `ready` (bill generated) or `delivered` gets that specific message; anything else falls back
 * to the general status-update template. */
export function whatsAppEventForStatus(status: string): WhatsAppTemplateDoc['event'] {
  if (status === 'ready') return 'billGenerated'
  if (status === 'delivered') return 'delivered'
  return 'statusChanged'
}

export function buildWhatsAppLink(mobile: string, countryCode: string, message: string): string {
  const digits = mobile.replace(/\D/g, '')
  return `https://wa.me/${countryCode}${digits}?text=${encodeURIComponent(message)}`
}
