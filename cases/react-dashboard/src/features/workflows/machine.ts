import { createMachine, initialTransition, transition } from 'xstate';

export const approvalMachine = createMachine({
  id: 'approval',
  types: { events: {} as { type: 'SUBMIT' | 'APPROVE' | 'REJECT' | 'REVISE' } },
  initial: 'draft',
  states: {
    draft: { on: { SUBMIT: 'review' } },
    review: { on: { APPROVE: 'approved', REJECT: 'rejected' } },
    approved: { type: 'final' },
    rejected: { on: { REVISE: 'draft' } },
  },
});
export const createApproval = () => initialTransition(approvalMachine)[0];
export const advanceApproval = (
  snapshot: ReturnType<typeof createApproval>,
  type: 'SUBMIT' | 'APPROVE' | 'REJECT' | 'REVISE',
) => transition(approvalMachine, snapshot, { type })[0];
