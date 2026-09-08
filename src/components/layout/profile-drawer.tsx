import { useState } from 'react'
import { Phone, ShieldCheck, User as UserIcon, Mail, Check, KeyRound } from 'lucide-react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormError } from '@/components/shared/form-error'
import { useAuth } from '@/hooks/use-auth'
import { useUpdateMyProfile, useChangePassword, passwordErrorMessage } from '@/hooks/use-my-profile'
import { getInitials } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

/** A field the user can see but not edit from here — role and mobile are administrative (see
 * `useUpdateMyProfile`'s doc comment for why editing them from your own profile would be a
 * privilege-escalation hole). Rendered as a filled card rather than a disabled input, so it
 * reads as information rather than as a control that happens to be switched off. */
function ReadOnlyField({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-[0.7rem] font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </p>
        <p className="truncate font-medium">{value}</p>
      </div>
    </div>
  )
}

export function ProfileDrawer({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const updateProfile = useUpdateMyProfile()
  const changePassword = useChangePassword()

  const [fullName, setFullName] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileSaved, setProfileSaved] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSaved, setPasswordSaved] = useState(false)

  if (!profile) return null

  // `?? profile.x` rather than seeding state from props: the profile rides a live onSnapshot, so
  // seeding would silently overwrite a field the user is mid-edit if another device saved.
  const effectiveName = fullName ?? profile.fullName
  const effectiveEmail = email ?? profile.email
  const profileDirty = fullName !== null || email !== null

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setProfileError(null)
    setProfileSaved(false)
    if (!effectiveName.trim()) {
      setProfileError('Full name is required.')
      return
    }
    try {
      await updateProfile.mutateAsync({ fullName: effectiveName, email: effectiveEmail })
      setFullName(null)
      setEmail(null)
      setProfileSaved(true)
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Could not save your profile.')
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSaved(false)
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('The two new passwords do not match.')
      return
    }
    if (newPassword === currentPassword) {
      setPasswordError('The new password must be different from the current one.')
      return
    }
    try {
      await changePassword.mutateAsync({ currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordSaved(true)
    } catch (err) {
      setPasswordError(passwordErrorMessage(err))
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent size="lg" className="flex w-full flex-col gap-0 p-0">
        <div className="flex shrink-0 items-center gap-3.5 border-b bg-muted/30 p-5 pr-12">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-teal-100 text-base font-semibold text-teal-700 dark:bg-teal-500/15 dark:text-teal-400">
            {getInitials(profile.fullName)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">{profile.fullName}</p>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <ShieldCheck className="size-3.5" />
              {profile.roleName}
            </p>
          </div>
        </div>

        <Tabs defaultValue="info" className="flex min-h-0 flex-1 flex-col">
          {/* `line`, not the default pill variant: the default is `w-fit` on `bg-muted`, so it
           * rendered as a grey slab that stopped partway across the drawer and read as a broken
           * element rather than a tab bar. Underlined tabs sitting on the drawer's own divider
           * are what the reference uses. */}
          <TabsList
            variant="line"
            className="h-auto w-full shrink-0 justify-start gap-6 rounded-none border-b px-5"
          >
            <TabsTrigger
              value="info"
              className="flex-none px-0 pb-2.5 text-sm data-active:text-teal-700 data-active:after:bg-teal-600 dark:data-active:text-teal-400"
            >
              Profile Info
            </TabsTrigger>
            <TabsTrigger
              value="password"
              className="flex-none px-0 pb-2.5 text-sm data-active:text-teal-700 data-active:after:bg-teal-600 dark:data-active:text-teal-400"
            >
              Change Password
            </TabsTrigger>
          </TabsList>

          {/* Each tab is its own scroll region with a pinned action button, so Save is reachable
           * without scrolling past the whole form — the same fix applied to the two-pane modals. */}
          <TabsContent value="info" className="min-h-0 flex-1 overflow-y-auto p-5">
            <form id="profile-info-form" onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(12rem,1fr))]">
                <ReadOnlyField
                  icon={Phone}
                  label={t('common.mobile')}
                  value={profile.mobile ?? '—'}
                />
                <ReadOnlyField
                  icon={ShieldCheck}
                  label={t('common.role')}
                  value={profile.roleName}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="profile-name" className="flex items-center gap-1.5">
                  <UserIcon className="size-3.5 text-muted-foreground" />
                  Full Name <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="profile-name"
                  value={effectiveName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="profile-email" className="flex items-center gap-1.5">
                  <Mail className="size-3.5 text-muted-foreground" />
                  Email{' '}
                  <span className="text-xs font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="profile-email"
                  type="email"
                  value={effectiveEmail}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
                {/* Worth being explicit: this is the profile record, not the Auth identity. */}
                <p className="text-xs text-muted-foreground">
                  Used for display and contact. Changing it does not change the email you sign in
                  with.
                </p>
              </div>

              {profileError && <FormError message={profileError} />}
              {profileSaved && !profileDirty && (
                <p className="flex items-center gap-1.5 text-sm text-teal-600 dark:text-teal-400">
                  <Check className="size-4" />
                  Profile updated.
                </p>
              )}
            </form>
          </TabsContent>

          <TabsContent value="password" className="min-h-0 flex-1 overflow-y-auto p-5">
            <form id="profile-password-form" onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="current-password">
                  Current Password <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-password">
                  New Password <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <p className="text-xs text-muted-foreground">
                  {t('components.layout.profileDrawer.atLeast6Characters')}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-password">
                  Confirm New Password <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>

              {passwordError && <FormError message={passwordError} />}
              {passwordSaved && (
                <p className="flex items-center gap-1.5 text-sm text-teal-600 dark:text-teal-400">
                  <Check className="size-4" />
                  Password updated. Your other devices stay signed in.
                </p>
              )}
            </form>
          </TabsContent>

          <div className="shrink-0 border-t bg-muted/30 p-4">
            <TabsContent value="info" className="m-0">
              <Button
                type="submit"
                form="profile-info-form"
                variant={profileDirty ? 'default' : 'outline'}
                className="w-full"
                disabled={!profileDirty || updateProfile.isPending}
              >
                <Check className="size-4" />
                {updateProfile.isPending ? 'Saving…' : 'Save Changes'}
              </Button>
            </TabsContent>
            <TabsContent value="password" className="m-0">
              <Button
                type="submit"
                form="profile-password-form"
                variant={currentPassword && newPassword && confirmPassword ? 'default' : 'outline'}
                className="w-full"
                disabled={
                  !currentPassword || !newPassword || !confirmPassword || changePassword.isPending
                }
              >
                <KeyRound className="size-4" />
                {changePassword.isPending ? 'Updating…' : 'Update Password'}
              </Button>
            </TabsContent>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
