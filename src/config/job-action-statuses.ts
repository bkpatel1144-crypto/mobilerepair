/**
 * Which statuses each job-card action even makes sense in.
 *
 * Two different gates sit in front of every action and they answer different questions. The
 * status × action matrix a role carries (Phase 4's Workflow Designer, via `useJobActionGating`)
 * says whether this *user* is allowed to do it. This says whether doing it would *mean* anything
 * given where the job currently is. A control shows only when both are true.
 *
 * It lives here rather than beside the buttons because two screens need it and one of them is a
 * component file: a file that exports both components and constants breaks Fast Refresh, which
 * has already cost this repo a lint failure once.
 */
export const ACTION_APPLICABLE_STATUSES: Record<string, string[]> = {
  takeJob: ['pending', 'inQueue'],
  jobDone: ['inProgress'],
  hold: ['pending', 'inQueue', 'inProgress'],
  resume: ['onHold'],
  generateBill: ['techDone', 'ready'],
  /**
   * Parts stop being addable the moment a bill exists, and that is the point.
   *
   * `addPart` writes `partsUsed` and `partsCost` and never touches `finalAmount`, and it had no
   * entry here at all — so a part added after Generate Bill raised what the job cost the shop and
   * left what the customer owed exactly where it was. Five hundred rupees of parts added to a
   * billed job was five hundred rupees the shop paid and never charged for, with both numbers
   * sitting in the Payment panel next to each other and nothing saying they disagreed.
   *
   * `ready`, `delivered` and `closed` are therefore absent: all three mean a bill exists. To
   * change what was billed you go to Sales Invoices and edit the bill, which recomputes the
   * total and settles the difference — the flow the client's reference app uses.
   */
  addPart: ['pending', 'inQueue', 'inProgress', 'onHold', 'techDone'],
  payment: ['techDone', 'ready', 'delivered', 'closed'],
  deliver: ['ready'],
  close: ['delivered'],
  cancel: ['pending', 'inQueue', 'inProgress', 'onHold', 'techDone', 'ready'],
  returnAndClose: ['cancelled'],
  fieldVisit: ['pending', 'inQueue', 'inProgress', 'onHold', 'techDone', 'ready'],
  handover: ['pending', 'inQueue', 'inProgress', 'onHold', 'techDone', 'ready'],
}

/**
 * Does this action mean anything for a job in this status?
 *
 * An action with no entry is treated as *not* applicable rather than always applicable. The
 * permissive reading is what let `addPart` run at every status including `closed`; a missing
 * entry is far more likely to be an oversight than a deliberate "any status".
 */
export function actionAppliesTo(action: string, status: string): boolean {
  return ACTION_APPLICABLE_STATUSES[action]?.includes(status) === true
}
