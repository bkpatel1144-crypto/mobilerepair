/**
 * The one string in `JobCardMockup` that was still hardcoded English.
 *
 * It sat as JSX text immediately after an element — `<ShieldCheck /> 90-day warranty on repair` —
 * which is the same shape that let the landing page's `<h1>` through. Both were invisible to
 * `no-hardcoded-strings.test.ts`, so its detector has a gap for text that follows a sibling
 * element rather than opening the node.
 */
module.exports = {
  components: {
    marketing: {
      jobCardMockup: {
        warrantyOnRepair: {
          en: '90-day warranty on repair',
          hi: 'रिपेयर पर 90 दिन की वारंटी',
          gu: 'રિપેર પર 90 દિવસની વોરંટી',
        },
      },
    },
  },
}
