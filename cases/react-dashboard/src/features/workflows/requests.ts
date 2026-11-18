import { createApproval, advanceApproval } from './machine';

const templates: Record<
  string,
  { name: string; owner: string; amount: number }[]
> = {
  approvals: [
    { name: 'Annual software renewal', owner: 'Finance', amount: 12400 },
    { name: 'Customer onboarding package', owner: 'Success', amount: 3600 },
    { name: 'Regional team workshop', owner: 'People', amount: 1800 },
  ],
  procurement: [
    { name: 'Warehouse scanner purchase', owner: 'Operations', amount: 8400 },
    {
      name: 'Supplier contract extension',
      owner: 'Procurement',
      amount: 22000,
    },
    { name: 'Packaging materials order', owner: 'Logistics', amount: 4200 },
  ],
  releases: [
    { name: 'Customer portal release', owner: 'Platform', amount: 48 },
    { name: 'Billing service rollout', owner: 'Payments', amount: 32 },
    { name: 'Inventory migration', owner: 'Commerce', amount: 64 },
  ],
};
export function createRequests(workspace: string) {
  return (templates[workspace] ?? templates.approvals).map(
    (request, index) => ({
      ...request,
      id: `${workspace}-${index + 1}`,
      snapshot:
        index === 1
          ? advanceApproval(createApproval(), 'SUBMIT')
          : createApproval(),
    }),
  );
}
