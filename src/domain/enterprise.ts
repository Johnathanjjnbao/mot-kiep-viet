export type ProductCategory = 'clothing' | 'household' | 'handmade';
export interface RetailPolicy {
  price: 'budget' | 'balanced' | 'premium';
  marketing: boolean;
  reorderTarget: number;
}
export interface RetailMonth {
  month: number;
  bought: number;
  orders: number;
  returned: number;
  revenue: number;
  cogs: number;
  operating: number;
  cashFlow: number;
  profit: number;
}
/** Bounded ledger owned by the immutable enterprise-v1 ruleset. */
export interface Enterprise {
  rules: 'enterprise-v1';
  id: string;
  owner: string;
  type: 'retail';
  category: ProductCategory;
  foundedMonth: number;
  closedMonth: number | null;
  settledThrough: number;
  status: 'operating' | 'suspended' | 'closed';
  cash: number;
  stock: number;
  unitCost: number;
  reputation: number;
  policy: RetailPolicy;
  totals: {
    contributed: number;
    withdrawn: number;
    revenue: number;
    cogs: number;
    operating: number;
    writeOff: number;
  };
  recent: RetailMonth[];
}
