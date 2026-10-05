/**
 * Every job-card action modal fired its mutation and closed, surfacing nothing when the write
 * failed. Add Note failed on every attempt for months and looked exactly like success.
 */
module.exports = {
  pages: {
    service: {
      actionButtons: {
        actionFailed: {
          en: "That didn't save. {{reason}}",
          hi: 'यह सहेजा नहीं गया। {{reason}}',
          gu: 'તે સાચવાયું નથી. {{reason}}',
        },
      },
    },
  },
}
