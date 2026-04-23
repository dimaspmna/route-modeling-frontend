import NavbarFw from "../../containers/nav/NavbarFw";
import Footer from "../../containers/footer/Footer";
import FwEntries from "../../components/fw/entries/FwEntries";

const FwDashboard = () => {
    return (
        <div className="min-h-screen flex flex-col">
            <NavbarFw>
                <div className="bg-gray-200 flex-1">
                    <div className="space-y-6">
                        <FwEntries />
                    </div>
                </div>
            </NavbarFw>
            <Footer />
        </div>
    );
};

export default FwDashboard;