import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { storage } from '@/lib/firebase'

/** Uploads one Second Hand Device Purchase image (device photo or ID proof photo) to
 * `companies/{companyId}/secondHandPurchases/{purchaseId}/{filename}` and returns its public
 * download URL — same pattern as `uploadJobCardImage` (`job-card-images.ts`), a sibling path
 * under `storage.rules` rather than a second upload mechanism. `purchaseId` may be a temporary
 * client-generated id when uploading *during* Create Purchase (before the real doc exists yet). */
export async function uploadSecondHandDeviceImage(
  companyId: string,
  purchaseId: string,
  file: File
): Promise<string> {
  const path = `companies/${companyId}/secondHandPurchases/${purchaseId}/${Date.now()}-${file.name}`
  const fileRef = ref(storage, path)
  await uploadBytes(fileRef, file)
  return getDownloadURL(fileRef)
}
