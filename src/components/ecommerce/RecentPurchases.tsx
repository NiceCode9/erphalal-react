import Badge from "../ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";

interface RecentPurchasesProps {
  purchases: any[];
}

export default function RecentPurchases({ purchases }: RecentPurchasesProps) {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-white/[0.05] dark:bg-white/[0.02]">
      <div className="flex flex-col gap-2 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">
            Pembelian Terakhir
          </h3>
          <p className="text-xs text-gray-400 font-medium tracking-wide uppercase">
            5 Transaksi Stok Terbaru
          </p>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-50 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader className="py-3 px-2 font-bold text-gray-400 text-start text-[10px] uppercase tracking-wider">
                Supplier
              </TableCell>
              <TableCell isHeader className="py-3 px-2 font-bold text-gray-400 text-start text-[10px] uppercase tracking-wider">
                Total
              </TableCell>
              <TableCell isHeader className="py-3 px-2 font-bold text-gray-400 text-start text-[10px] uppercase tracking-wider">
                Tanggal
              </TableCell>
              <TableCell isHeader className="py-3 px-2 font-bold text-gray-400 text-end text-[10px] uppercase tracking-wider">
                Status
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody>
            {purchases.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-gray-400 text-sm font-medium">
                  Belum ada data pembelian.
                </TableCell>
              </TableRow>
            )}
            {purchases.map((purchase) => (
              <TableRow key={purchase.id} className="border-b border-gray-50 last:border-0 dark:border-white/[0.02]">
                <TableCell className="py-4 px-2 text-gray-800 dark:text-white/90 text-sm font-black">
                  {purchase.suppliers?.name || "Unknown"}
                </TableCell>
                <TableCell className="py-4 px-2 text-gray-700 font-bold text-sm dark:text-gray-300">
                  Rp {purchase.total.toLocaleString("id-ID")}
                </TableCell>
                <TableCell className="py-4 px-2 text-gray-500 text-sm whitespace-nowrap">
                  {new Date(purchase.purchase_date).toLocaleDateString('id-ID')}
                </TableCell>
                <TableCell className="py-4 px-2 text-end">
                  <Badge 
                    size="sm" 
                    color="success"
                    className="px-3 py-1 font-bold rounded-lg border-0 bg-success-50 text-success-600 dark:bg-success-500/10"
                  >
                    Selesai
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
