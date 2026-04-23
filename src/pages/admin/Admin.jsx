import Chart from "../../components/admin/Chart";
import NavbarAdmin from "../../containers/nav/NavbarAdmin";
import Statistic from "../../components/admin/Statistic";
import FuelPieChart from "../../components/admin/FuelPieChart";
import PortMap from "../../components/admin/PortMap";
import Footer from "../../containers/footer/Footer";

const AdminDashboard = () => {
  return (
    <NavbarAdmin>
      <div className=" bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center px-4 sm:px-10 py-6">
          <h1 className="text-3xl font-bold mb-6 text-black dark:text-white">Admin Dashboard</h1>
          <Statistic />
        </div>

        <div className="p-4 grid md:grid-cols-2 gap-4">
          <Chart />
          <FuelPieChart />
        </div>

        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4 text-black dark:text-white">Peta Pelabuhan</h1>
          <div className="-z-10">
          <PortMap />
          </div>
        </div>
        <Footer />
      </div>
    </NavbarAdmin>

  );
}


export default AdminDashboard;