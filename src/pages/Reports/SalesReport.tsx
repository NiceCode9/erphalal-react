import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import SalesReportsTable from "../../components/Reports/SalesReportsTable";

export default function SalesReport() {
  return (
    <>
      <PageMeta title="Laporan Penjualan | Halal ERP" description="Laporan performa penjualan" />
      <PageBreadcrumb pageTitle="Laporan Penjualan" />
      <SalesReportsTable />
    </>
  );
}
