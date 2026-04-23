import Footer from "../../containers/footer/Footer";
import NavbarPassenger from "../../containers/nav/NavbarPassenger";
import PassengerEntries from "../../components/passenger/entries/PassengerEntries";

const PassengerDashboard = () => {
    return (
        <NavbarPassenger>
            <div className="bg-gray-200 min-h-screen flex flex-col">
                <div className="space-y-6">
                    <PassengerEntries />
                </div>
                <Footer />
            </div>
        </NavbarPassenger>
    );
};

export default PassengerDashboard;
