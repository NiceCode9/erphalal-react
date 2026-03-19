import { useState, useEffect } from "react";
import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics";
import MonthlySalesChart from "../../components/ecommerce/MonthlySalesChart";
import RecentOrders from "../../components/ecommerce/RecentOrders";
import HalalExpiryTable from "../../components/ecommerce/HalalExpiryTable";
import RecentPurchases from "../../components/ecommerce/RecentPurchases";
import PageMeta from "../../components/common/PageMeta";
import { supabase } from "../../lib/supabaseClient";
import { toast } from "sonner";

export default function Home() {
  const [data, setData] = useState({
    totalProducts: 0,
    totalCategories: 0,
    totalSales: 0,
    totalRevenue: 0,
    totalSpending: 0,
    revenueGrowth: 0,
    lowStockCount: 0,
    recentSales: [] as any[],
    recentPurchases: [] as any[],
    halalExpiringProducts: [] as any[],
    monthlySeries: [] as { name: string; data: number[]; color?: string }[],
    monthlyCategories: [] as string[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // 1. Fetch counts
      const [
        { count: productsCount },
        { count: catCount },
        { count: lowStockCount },
      ] = await Promise.all([
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("categories").select("*", { count: "exact", head: true }),
        supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .lt("stock", 10),
      ]);

      // 2. Fetch revenue & spending data for current year
      const currentYear = new Date().getFullYear();
      const startOfYear = new Date(currentYear, 0, 1).toISOString();

      const [
        { data: yearSales, error: salesError },
        { data: yearPurchases, error: purchaseError },
      ] = await Promise.all([
        supabase
          .from("sales")
          .select("total, created_at")
          .gte("created_at", startOfYear),
        supabase
          .from("purchases")
          .select("total, purchase_date")
          .gte("purchase_date", startOfYear),
      ]);

      if (salesError) throw salesError;
      if (purchaseError) throw purchaseError;

      // 3. Calculate Monthly Data & MoM Comparison
      const now = new Date();
      const currentMonth = now.getMonth();

      const monthlySalesData = new Array(12).fill(0);
      const monthlyPurchaseData = new Array(12).fill(0);

      let thisMonthRevenue = 0;
      let lastMonthRevenue = 0;
      let totalRevenue = 0;
      let totalSpending = 0;

      yearSales?.forEach((sale: any) => {
        const date = new Date(sale.created_at);
        const m = date.getMonth();
        const amount = sale.total || 0;

        monthlySalesData[m] += amount;
        if (m === currentMonth) thisMonthRevenue += amount;
        if (m === currentMonth - 1) lastMonthRevenue += amount;
        totalRevenue += amount;
      });

      yearPurchases?.forEach((purchase: any) => {
        const date = new Date(purchase.purchase_date);
        const m = date.getMonth();
        const amount = purchase.total || 0;

        monthlyPurchaseData[m] += amount;
        totalSpending += amount;
      });

      // Calculate growth (percentage)
      let revenueGrowth = 0;
      if (lastMonthRevenue > 0) {
        revenueGrowth =
          ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
      } else if (thisMonthRevenue > 0) {
        revenueGrowth = 100;
      }

      // 4. Fetch Total Sales Count
      const { count: totalSalesCount } = await supabase
        .from("sales")
        .select("*", { count: "exact", head: true });

      // 5. Fetch Recent Data
      const [{ data: recentSales }, { data: recentPurchases }] =
        await Promise.all([
          supabase
            .from("sales")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("purchases")
            .select("*, suppliers(name)")
            .order("purchase_date", { ascending: false })
            .limit(5),
        ]);

      // 6. Fetch products with halal expiry within next 30 days
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const { data: halalProducts } = await supabase
        .from("products")
        .select("id, name, halal_certificate_number, halal_expired")
        .not("halal_expired", "is", null)
        .lte("halal_expired", thirtyDaysFromNow.toISOString())
        .order("halal_expired", { ascending: true })
        .limit(5);

      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      setData({
        totalProducts: productsCount || 0,
        totalCategories: catCount || 0,
        totalSales: totalSalesCount || 0,
        totalRevenue,
        totalSpending,
        revenueGrowth,
        lowStockCount: lowStockCount || 0,
        recentSales: recentSales || [],
        recentPurchases: recentPurchases || [],
        halalExpiringProducts: halalProducts || [],
        monthlySeries: [
          { name: "Penjualan", data: monthlySalesData, color: "#465fff" },
          { name: "Pembelian", data: monthlyPurchaseData, color: "#f97316" },
        ],
        monthlyCategories: monthNames,
      });
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Dashboard | Halal ERP"
        description="ERP Dashboard Overview"
      />
      {loading ? (
        <div className="flex h-[50vh] items-center justify-center text-gray-500">
          Loading dashboard data...
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Top Metrics Row */}
          <EcommerceMetrics
            totalProducts={data.totalProducts}
            totalCategories={data.totalCategories}
            totalRevenue={data.totalRevenue}
            totalSpending={data.totalSpending}
            revenueGrowth={data.revenueGrowth}
            lowStockCount={data.lowStockCount}
          />

          {/* Halal Expiry - Priority Top Row */}
          {data.halalExpiringProducts.length > 0 && (
            <HalalExpiryTable products={data.halalExpiringProducts} />
          )}

          {/* Monthly Chart (Sales vs Purchases) */}
          <MonthlySalesChart
            series={data.monthlySeries}
            categories={data.monthlyCategories}
          />

          {/* Middle Row: Recent Data */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <RecentPurchases purchases={data.recentPurchases} />
            <RecentOrders sales={data.recentSales} />
          </div>
        </div>
      )}
    </>
  );
}
