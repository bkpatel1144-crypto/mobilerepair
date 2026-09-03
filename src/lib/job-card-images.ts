import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { storage } from '@/lib/firebase'

/** Uploads one Job Card image to `companies/{companyId}/jobCards/{jobId}/{filename}` and
 * returns its public download URL — see `storage.rules` for the access boundary this path
 * relies on. `jobId` may be a temporary client-generated id when uploading *during* Create Job
 * Card (before the real job doc exists yet); the URL itself doesn't care which. */
export async function uploadJobCardImage(companyId: string, jobId: string, file: File): Promise<string> {
  const path = `companies/${companyId}/jobCards/${jobId}/${Date.now()}-${file.name}`
  const fileRef = ref(storage, path)
  await uploadBytes(fileRef, file)
  return getDownloadURL(fileRef)
}
