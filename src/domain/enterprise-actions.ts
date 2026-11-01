import { z } from 'zod';
export const retailPolicySchema = z
  .object({
    price: z.enum(['budget', 'balanced', 'premium']),
    marketing: z.boolean(),
    reorderTarget: z.number().int().min(0).max(200),
  })
  .strict();
export const enterpriseActionSchema = z
  .object({
    type: z.literal('enterprise'),
    operation: z.enum(['found', 'policy', 'fund', 'withdraw', 'suspend', 'resume', 'close']),
    expected: z.number().int().min(0).max(511),
    id: z.enum(['enterprise:0', 'enterprise:1', 'enterprise:2', 'enterprise:3']).optional(),
    category: z.enum(['clothing', 'household', 'handmade']).optional(),
    capital: z.number().int().positive().safe().optional(),
    policy: retailPolicySchema.optional(),
    amount: z.number().int().positive().safe().optional(),
  })
  .strict()
  .superRefine((a, ctx) => {
    const fields = ['id', 'category', 'capital', 'policy', 'amount'] as const;
    const required =
      a.operation === 'found'
        ? ['category', 'capital', 'policy']
        : a.operation === 'policy'
          ? ['id', 'policy']
          : ['fund', 'withdraw'].includes(a.operation)
            ? ['id', 'amount']
            : ['id'];
    for (const field of fields)
      if (required.includes(field) !== (a[field] !== undefined))
        ctx.addIssue({
          code: 'custom',
          path: [field],
          message: 'Tham số không khớp thao tác cửa hàng.',
        });
  });
export type EnterpriseAction = z.infer<typeof enterpriseActionSchema>;
