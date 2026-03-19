import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import SalesReportsTable from "../../components/Reports/SalesReportsTable";

export default function SalesReport() {
  return (
    <>
      <PageMeta title="Sales Report | Halal ERP" description="Sales performance report" />
      <PageBreadcrumb pageTitle="Laporan Penjualan" />
      <SalesReportsTable />
    </>
  );
}
