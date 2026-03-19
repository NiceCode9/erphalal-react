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
    <div className="overflow-hidden rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-white/[0.05] dark:bg-white/[0.02]">
      <div className="flex flex-col gap-2 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">
            Transaksi Terakhir
          </h3>
          <p className="text-xs text-gray-400 font-medium tracking-wide uppercase">
            5 Penjualan Terbaru
          </p>
        </div>
      </div>
      <div className="max-w-full overflow-x-auto">
        <Table>
          {/* Table Header */}
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell
                isHeader
                className="py-3 px-2 font-bold text-gray-400 text-start text-[10px] uppercase tracking-wider"
              >
                Tanggal
              </TableCell>
              <TableCell
                isHeader
                className="py-3 px-2 font-bold text-gray-400 text-start text-[10px] uppercase tracking-wider"
              >
                No. Invoice
              </TableCell>
              <TableCell
                isHeader
                className="py-3 px-2 font-bold text-gray-400 text-start text-[10px] uppercase tracking-wider"
              >
                Metode
              </TableCell>
              <TableCell
                isHeader
                className="py-3 px-2 font-bold text-gray-400 text-end text-[10px] uppercase tracking-wider"
              >
                Total
              </TableCell>
            </TableRow>
          </TableHeader>

          {/* Table Body */}
          <TableBody>
            {sales.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-gray-400 text-sm font-medium">
                  Belum ada transaksi hari ini.
                </TableCell>
              </TableRow>
            )}
            {sales.map((sale) => (
              <TableRow key={sale.id} className="border-b border-gray-50 last:border-0 dark:border-white/[0.02]">
                <TableCell className="py-4 px-2 text-gray-600 dark:text-gray-400 text-sm font-medium">
                  {new Date(sale.created_at).toLocaleDateString('id-ID')}
                </TableCell>
                <TableCell className="py-4 px-2 text-gray-800 dark:text-white/90 text-sm font-black">
                  #{sale.invoice_number}
                </TableCell>
                <TableCell className="py-4 px-2 text-gray-500 text-theme-sm">
                  <Badge size="sm" color="success" className="px-3 py-1 font-bold rounded-lg border-0 bg-success-50 text-success-600 dark:bg-success-500/10">
                    {sale.payment_method || "Tunai"}
                  </Badge>
                </TableCell>
                <TableCell className="py-4 px-2 text-gray-800 font-black text-sm text-end dark:text-white">
                  Rp {sale.total.toLocaleString("id-ID")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
