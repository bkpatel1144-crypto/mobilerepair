/**
 * Hand Over listed the person the job was already assigned to, so in a one-technician shop the
 * only name in the list was the current one and every Hand Over wrote a timeline row that
 * changed nothing.
 */
module.exports = {
  pages: {
    service: {
      actionButtons: {
        alreadyAssignedTo: {
          en: 'Already with {{name}}',
          hi: 'पहले से {{name}} के पास',
          gu: 'પહેલેથી {{name}} પાસે',
        },
        noOneElseToHandTo: {
          en: 'There is no one else to hand this job to. Add another user in Administration › User Management first.',
          hi: 'इस जॉब को सौंपने के लिए कोई और नहीं है। पहले Administration › User Management में दूसरा उपयोगकर्ता जोड़ें।',
          gu: 'આ જોબ સોંપવા માટે બીજું કોઈ નથી. પહેલા Administration › User Management માં બીજો વપરાશકર્તા ઉમેરો.',
        },
      },
    },
  },
}
