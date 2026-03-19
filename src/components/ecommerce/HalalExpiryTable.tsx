import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";

interface Product {
  id: number;
  name: string;
  halal_certificate_number: string | null;
  halal_expired: string | null;
}

interface HalalExpiryTableProps {
  products: Product[];
}

export default function HalalExpiryTable({ products }: HalalExpiryTableProps) {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-warning-100 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-warning-500/10 dark:bg-white/[0.02]">
      <div className="flex flex-col gap-2 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-warning-700 dark:text-warning-500">
            Sertifikat Halal Mendekati Kadaluarsa
          </h3>
          <p className="text-xs text-gray-400 font-medium tracking-wide uppercase">
            Produk dalam 30 Hari Terakhir
          </p>
        </div>
      </div>
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-warning-50 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader className="py-3 px-2 font-bold text-gray-400 text-start text-[10px] uppercase tracking-wider">
                Nama Produk
              </TableCell>
              <TableCell isHeader className="py-3 px-2 font-bold text-gray-400 text-start text-[10px] uppercase tracking-wider">
                No. Sertifikat
              </TableCell>
              <TableCell isHeader className="py-3 px-2 font-bold text-gray-400 text-start text-[10px] uppercase tracking-wider">
                Tgl Kadaluarsa
              </TableCell>
              <TableCell isHeader className="py-3 px-2 font-bold text-gray-400 text-end text-[10px] uppercase tracking-wider">
                Status
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody>
            {products.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-gray-400 text-sm font-medium">
                  Semua sertifikat aman (tidak ada yang segera habis).
                </TableCell>
              </TableRow>
            )}
            {products.map((product) => {
              const today = new Date();
              const expDate = new Date(product.halal_expired || "");
              const isExpired = expDate < today;

              return (
                <TableRow key={product.id} className="border-b border-gray-50 last:border-0 dark:border-white/[0.02]">
                  <TableCell className="py-4 px-2 text-gray-800 dark:text-white/90 text-sm font-black">
                    {product.name}
                  </TableCell>
                  <TableCell className="py-4 px-2 text-gray-500 text-sm">
                    {product.halal_certificate_number || "-"}
                  </TableCell>
                  <TableCell className="py-4 px-2 text-gray-700 font-bold text-sm dark:text-gray-300">
                    {expDate.toLocaleDateString('id-ID')}
                  </TableCell>
                  <TableCell className="py-4 px-2 text-end">
                    <Badge 
                      size="sm" 
                      color={isExpired ? "error" : "warning"}
                      className={`px-3 py-1 font-bold rounded-lg border-0 ${
                        isExpired 
                          ? "bg-error-50 text-error-600 dark:bg-error-500/10" 
                          : "bg-warning-50 text-warning-600 dark:bg-warning-500/10"
                      }`}
                    >
                      {isExpired ? "Expired" : "Expiring Soon"}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
