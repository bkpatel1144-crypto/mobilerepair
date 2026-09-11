import { describe, expect, it } from 'vitest'
import { ACTION_APPLICABLE_STATUSES, actionAppliesTo } from './job-action-statuses'

/**
 * The rule this file exists to hold: a part cannot be added to a job that has been billed.
 *
 * `addPart` writes `partsUsed` and `partsCost` and never touches `finalAmount`. While it had no
 * entry in the applicability map it was offered at every status, so a part added after Generate
 * Bill raised what the job cost the shop and left what the customer owed alone. These are the
 * statuses that mean a bill exists, asserted by name rather than by counting, so adding a status
 * to the list later cannot quietly reopen the hole.
 */

const BILLED_STATUSES = ['ready', 'delivered', 'closed']
const PRE_BILL_STATUSES = ['pending', 'inQueue', 'inProgress', 'onHold', 'techDone']

describe('parts cannot be added to a billed job', () => {
  it('refuses every status in which a bill exists', () => {
    for (const status of BILLED_STATUSES) {
      expect(actionAppliesTo('addPart', status), `addPart should be off at ${status}`).toBe(false)
    }
  })

  it('still allows every status before the bill', () => {
    for (const status of PRE_BILL_STATUSES) {
      expect(actionAppliesTo('addPart', status), `addPart should be on at ${status}`).toBe(true)
    }
    // A guard against the assertion above passing because the list is empty.
    expect(PRE_BILL_STATUSES).toHaveLength(5)
  })

  it('leaves Generate Bill available exactly where it was', () => {
    // `ready` keeps Generate Bill so a bill can be re-generated after an edit or an undo — this
    // is deliberately *not* the same set as addPart's.
    expect(ACTION_APPLICABLE_STATUSES.generateBill).toEqual(['techDone', 'ready'])
  })
})

describe('an action with no entry is treated as not applicable', () => {
  it('refuses an unknown action rather than allowing it', () => {
    // The permissive reading is what let `addPart` run everywhere: it simply had no entry. A
    // missing entry is far likelier to be an oversight than a deliberate "any status".
    expect(actionAppliesTo('somethingNobodyDeclared', 'techDone')).toBe(false)
  })
})
