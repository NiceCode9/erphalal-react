import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import StockReportsTable from "../../components/Reports/StockReportsTable";

export default function StockReport() {
  return (
    <>
      <PageMeta title="Stock Report | Halal ERP" description="Current inventory levels" />
      <PageBreadcrumb pageTitle="Laporan Stok" />
      <StockReportsTable />
    </>
  );
}
