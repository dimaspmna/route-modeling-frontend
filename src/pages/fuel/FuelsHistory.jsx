import NavbarFuel from "../../containers/nav/NavbarFuel";
import Footer from "../../containers/footer/Footer";
import FuelHistory from "../../components/fuel/history/FuelHistory";
import SuccessAlert from "../../components/user/components/SuccessAlert";

const FuelsHistory = () => {
    return (
        <div className="min-h-screen flex flex-col">
            <NavbarFuel>
                <div className="bg-gray-50 flex-1">
                    <div className="space-y-6">
                        <FuelHistory/>
                    </div>
                </div>
            </NavbarFuel>
            <Footer />
        </div>
    );
};

export default FuelsHistory;