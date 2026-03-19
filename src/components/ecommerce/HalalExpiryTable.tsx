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
    <div className="overflow-hidden rounded-2xl border border-warning-200 bg-white px-4 pb-3 pt-4 dark:border-warning-800 dark:bg-white/[0.03] sm:px-6">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-warning-700 dark:text-warning-500">
            Halal Certificate Expiring Soon
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Products with halal certificates expiring within the next 30 days
          </p>
        </div>
      </div>
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
            <TableRow>
              <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Product Name
              </TableCell>
              <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Certificate Number
              </TableCell>
              <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Expiry Date
              </TableCell>
              <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Status
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {products.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-6 text-center text-gray-500">
                  No certificates expiring soon.
                </TableCell>
              </TableRow>
            )}
            {products.map((product) => {
              const today = new Date();
              const expDate = new Date(product.halal_expired || "");
              const isExpired = expDate < today;

              return (
                <TableRow key={product.id}>
                  <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90 font-medium">
                    {product.name}
                  </TableCell>
                  <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {product.halal_certificate_number || "-"}
                  </TableCell>
                  <TableCell className="py-3 text-gray-800 font-bold text-theme-sm dark:text-white/90">
                    {expDate.toLocaleDateString()}
                  </TableCell>
                  <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    <Badge size="sm" color={isExpired ? "error" : "warning"}>
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
