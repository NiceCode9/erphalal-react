import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";

interface SaleRecord {
  id: number;
  invoice_number: string;
  total: number;
  payment_method: string;
  created_at: string;
}

interface RecentOrdersProps {
  sales: SaleRecord[];
}

export default function RecentOrders({ sales }: RecentOrdersProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Recent Transactions
          </h3>
        </div>
      </div>
      <div className="max-w-full overflow-x-auto">
        <Table>
          {/* Table Header */}
          <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
            <TableRow>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Invoice Date
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Invoice Number
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Payment Method
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Total
              </TableCell>
            </TableRow>
          </TableHeader>

          {/* Table Body */}
          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {sales.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-6 text-center text-gray-500">
                  No recent transactions.
                </TableCell>
              </TableRow>
            )}
            {sales.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90 font-medium">
                  {new Date(sale.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {sale.invoice_number}
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  <Badge size="sm" color="success">
                    {sale.payment_method || "Cash"}
                  </Badge>
                </TableCell>
                <TableCell className="py-3 text-gray-800 font-bold text-theme-sm dark:text-white/90">
                  Rp {sale.total.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
