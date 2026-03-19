import {
  BoxIconLine,
  GroupIcon,
  DollarLineIcon,
} from "../../icons";

interface EcommerceMetricsProps {
  totalProducts: number;
  totalCategories: number;
  totalSales: number;
  totalRevenue: number;
}

export default function EcommerceMetrics({
  totalProducts,
  totalCategories,
  totalSales,
  totalRevenue,
}: EcommerceMetricsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
      {/* Metric 1 */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 shadow-sm">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <DollarLineIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="mt-5">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</span>
          <h4 className="mt-1 flex items-baseline gap-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
            Rp {totalRevenue.toLocaleString()}
          </h4>
        </div>
      </div>

      {/* Metric 2 */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 shadow-sm">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="mt-5">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Sales</span>
          <h4 className="mt-1 flex items-baseline gap-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
            {totalSales.toLocaleString()}
          </h4>
        </div>
      </div>

      {/* Metric 3 */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 shadow-sm">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="mt-5">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Products</span>
          <h4 className="mt-1 flex items-baseline gap-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
            {totalProducts.toLocaleString()}
          </h4>
        </div>
      </div>

      {/* Metric 4 */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 shadow-sm">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="mt-5">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Categories</span>
          <h4 className="mt-1 flex items-baseline gap-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
            {totalCategories.toLocaleString()}
          </h4>
        </div>
      </div>
    </div>
  );
}
