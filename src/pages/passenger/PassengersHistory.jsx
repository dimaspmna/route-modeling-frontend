import NavbarPassenger from "../../containers/nav/NavbarPassenger";
import Footer from "../../containers/footer/Footer";
import PassengerHistory from "../../components/passenger/history/PassengerHistory";
import SuccessAlert from "../../components/user/components/SuccessAlert";

const PassengersHistory = () => {
    return (
        <NavbarPassenger>
            <div className="bg-gray-50 min-h-screen flex flex-col">
                <div className="min-h-screen space-y-6">
                    <PassengerHistory/>
                </div>
                <Footer />
            </div>
        </NavbarPassenger>
    );
};

export default PassengersHistory;
