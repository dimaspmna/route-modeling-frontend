import NavbarSuperAdmin from "../../../containers/nav/NavbarSuperAmin";
import FuelPrice from "../../../components/superadmin/transaction/FuelPrice";
import Footer from "../../../containers/footer/Footer";

const FuelPriceDashboard = () => {
    return (
        <NavbarSuperAdmin>
            <div className="bg-gray- min-h-screen flex flex-col">
                <div className="space-y-6">
                    <FuelPrice/>
                </div>
                <Footer />
            </div>
        </NavbarSuperAdmin>
    );
};

export default FuelPriceDashboard;
