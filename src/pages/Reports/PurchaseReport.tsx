import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import PurchaseReportsTable from "../../components/Reports/PurchaseReportsTable";

export default function PurchaseReport() {
  return (
    <>
      <PageMeta
        title="Laporan Pembelian | Halal ERP"
        description="Laporan Pembelian Stock dan Inventaris"
      />
      <PageBreadcrumb pageTitle="Laporan Pembelian" />

      <PurchaseReportsTable />
    </>
  );
}
