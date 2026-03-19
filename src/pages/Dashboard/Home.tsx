import { useState, useEffect } from "react";
import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics";
import MonthlySalesChart from "../../components/ecommerce/MonthlySalesChart";
import RecentOrders from "../../components/ecommerce/RecentOrders";
import HalalExpiryTable from "../../components/ecommerce/HalalExpiryTable";
import PageMeta from "../../components/common/PageMeta";
import { supabase } from "../../lib/supabaseClient";
import { toast } from "sonner";

export default function Home() {
  const [data, setData] = useState({
    totalProducts: 0,
    totalCategories: 0,
    totalSales: 0,
    totalRevenue: 0,
    recentSales: [],
    halalExpiringProducts: [] as any[],
    monthlySeries: [] as { name: string; data: number[] }[],
    monthlyCategories: [] as string[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // fetch products count
      const { count: productsCount, error: pError } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true });
      if (pError) throw pError;
      
      // fetch categories count
      const { count: catCount, error: cError } = await supabase
        .from("categories")
        .select("*", { count: "exact", head: true });
      if (cError) throw cError;

      // fetch sales
      const { data: sales, error: salesError } = await supabase
        .from("sales")
        .select("*")
        .order("created_at", { ascending: false });
      if (salesError) throw salesError;

      const totalSales = sales?.length || 0;
      const totalRevenue = sales?.reduce((sum, sale) => sum + (sale.total || 0), 0) || 0;
      const recentSales: any = sales?.slice(0, 5) || [];

      // fetch products with halal expiry within next 30 days
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      const { data: halalProducts, error: hError } = await supabase
        .from("products")
        .select("id, name, halal_certificate_number, halal_expired")
        .not("halal_expired", "is", null)
        .lte("halal_expired", thirtyDaysFromNow.toISOString())
        .order("halal_expired", { ascending: true })
        .limit(10);
      
      if (hError) throw hError;

      // Calculate monthly sales for the current year
      const currentYear = new Date().getFullYear();
      const monthlyData = new Array(12).fill(0);
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      
      sales?.forEach((sale: any) => {
        const date = new Date(sale.created_at);
        if (date.getFullYear() === currentYear) {
          monthlyData[date.getMonth()] += (sale.total || 0);
        }
      });

      setData({
        totalProducts: productsCount || 0,
        totalCategories: catCount || 0,
        totalSales,
        totalRevenue,
        recentSales,
        halalExpiringProducts: halalProducts || [],
        monthlySeries: [{ name: "Sales (Rp)", data: monthlyData }],
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
        <div className="flex h-[50vh] items-center justify-center text-gray-500">Loading dashboard data...</div>
      ) : (
        <div className="grid grid-cols-12 gap-4 md:gap-6">
          <div className="col-span-12 space-y-6 xl:col-span-8">
            <EcommerceMetrics 
              totalProducts={data.totalProducts}
              totalCategories={data.totalCategories}
              totalSales={data.totalSales}
              totalRevenue={data.totalRevenue}
            />
            <MonthlySalesChart 
              series={data.monthlySeries}
              categories={data.monthlyCategories}
            />
            <HalalExpiryTable products={data.halalExpiringProducts} />
          </div>

          <div className="col-span-12 xl:col-span-4 space-y-6">
            <RecentOrders sales={data.recentSales} />
          </div>
        </div>
      )}
    </>
  );
}
