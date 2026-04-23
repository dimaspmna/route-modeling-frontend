import NavbarSuperAdmin from "../../containers/nav/NavbarSuperAmin";
import SuperAdminChart from "../../components/superadmin/components/SuperAdminChart";
import Footer from "../../containers/footer/Footer";

const SuperAdminDashboard = () => {
    return (
        <NavbarSuperAdmin>
            <div className="bg-gray- min-h-screen flex flex-col">
                <div className="space-y-6">
                    <SuperAdminChart/>
                </div>
                <Footer />
            </div>
        </NavbarSuperAdmin>
    );
};

export default SuperAdminDashboard;
