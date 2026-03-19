import {
  BoxIconLine,
  DollarLineIcon,
} from "../../icons";

interface EcommerceMetricsProps {
  totalProducts: number;
  totalCategories: number;
  totalRevenue: number;
  totalSpending: number;
  revenueGrowth: number;
  lowStockCount: number;
}

export default function EcommerceMetrics({
  totalProducts,
  totalCategories,
  totalRevenue,
  totalSpending,
  revenueGrowth,
  lowStockCount,
}: EcommerceMetricsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
      {/* Metric 1: Total Revenue */}
      <div className="relative overflow-hidden rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-white/[0.05] dark:bg-white/[0.02]">
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10">
            <DollarLineIcon className="size-6" />
          </div>
          {revenueGrowth !== 0 && (
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
              revenueGrowth >= 0
                ? "bg-success-50 text-success-600 dark:bg-success-500/10"
                : "bg-error-50 text-error-600 dark:bg-error-500/10"
            }`}>
              {revenueGrowth >= 0 ? "↑" : "↓"} {Math.abs(revenueGrowth).toFixed(1)}%
            </div>
          )}
        </div>
        <div className="mt-5">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Total Penjualan
          </span>
          <h4 className="mt-1 text-2xl font-black text-gray-800 dark:text-white/90">
            Rp {totalRevenue.toLocaleString("id-ID")}
          </h4>
          <p className="mt-1 text-[10px] font-medium text-gray-400">vs bulan lalu</p>
        </div>
      </div>

      {/* Metric 2: Total Spending (Purchases) */}
      <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-white/[0.05] dark:bg-white/[0.02]">
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-500/10">
          <DollarLineIcon className="size-6" />
        </div>
        <div className="mt-5">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Total Pembelian
          </span>
          <h4 className="mt-1 text-2xl font-black text-gray-800 dark:text-white/90">
            Rp {totalSpending.toLocaleString("id-ID")}
          </h4>
          <p className="mt-1 text-[10px] font-medium text-gray-400">Total belanja stok</p>
        </div>
      </div>

      {/* Metric 3: Low Stock Alert */}
      <div className={`rounded-[2rem] border p-6 shadow-sm transition-all hover:shadow-md ${
        lowStockCount > 0 
          ? "border-warning-100 bg-warning-50/30 dark:border-warning-500/20 dark:bg-warning-500/5" 
          : "border-gray-100 bg-white dark:border-white/[0.05] dark:bg-white/[0.02]"
      }`}>
        <div className={`flex items-center justify-center w-12 h-12 rounded-2xl ${
          lowStockCount > 0 
            ? "bg-warning-100 text-warning-600 dark:bg-warning-500/20" 
            : "bg-blue-50 text-blue-600 dark:bg-blue-500/10"
        }`}>
          <BoxIconLine className="size-6" />
        </div>
        <div className="mt-5">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Stok Hampir Habis
          </span>
          <h4 className={`mt-1 text-2xl font-black ${
            lowStockCount > 0 ? "text-warning-600" : "text-gray-800 dark:text-white/90"
          }`}>
            {lowStockCount} <span className="text-sm font-bold text-gray-400 ml-1">Produk</span>
          </h4>
          <p className="mt-1 text-[10px] font-medium text-gray-400">Butuh restock segera</p>
        </div>
      </div>

      {/* Metric 4: Inventory Overview */}
      <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-white/[0.05] dark:bg-white/[0.02]">
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-500/10">
          <BoxIconLine className="size-6" />
        </div>
        <div className="mt-5 flex justify-between items-end">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Total Katalog
            </span>
            <h4 className="mt-1 text-2xl font-black text-gray-800 dark:text-white/90">
              {totalProducts}
            </h4>
          </div>
          <div className="text-right">
             <span className="text-[10px] font-bold text-gray-400 block uppercase">Kategori</span>
             <span className="text-sm font-black text-purple-600">{totalCategories}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
