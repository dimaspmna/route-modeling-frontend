import NavbarFuel from "../../containers/nav/NavbarFuel";
import Footer from "../../containers/footer/Footer";
import FuelEntries from "../../components/fuel/entries/FuelEntries";

const FuelDashboard = () => {
    return (
        <div className="min-h-screen flex flex-col">
            <NavbarFuel>
                <div className="bg-gray- flex-1">
                    <div className="space-y-6">
                        <FuelEntries />
                    </div>
                </div>
            </NavbarFuel>
            <Footer />
        </div>
    );
};

export default FuelDashboard;