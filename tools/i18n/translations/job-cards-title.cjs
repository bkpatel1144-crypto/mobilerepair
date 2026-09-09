/**
 * The Job Cards page title was built from a template literal — `${profile?.roleName} — Jobs` —
 * so the English "Jobs" in it was invisible to the hardcoded-string detector, which only reads
 * JSX text nodes. Interpolation keeps the role name dynamic while the word is translated.
 */
module.exports = {
  pages: {
    service: {
      jobCards: {
        roleJobs: {
          en: '{{role}} — Jobs',
          hi: '{{role}} — जॉब',
          gu: '{{role}} — જોબ',
        },
      },
    },
  },
}
