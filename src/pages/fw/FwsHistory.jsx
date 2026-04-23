import NavbarFw from "../../containers/nav/NavbarFw";
import Footer from "../../containers/footer/Footer";
import FwHistory from "../../components/fw/history/FwHistory";
import SuccessAlert from "../../components/user/components/SuccessAlert";

const FwsHistory = () => {
    return (
        <div className="min-h-screen flex flex-col">
            <NavbarFw>
                <div className="bg-gray-50 flex-1">
                    <div className="space-y-6">
                        <FwHistory/>
                    </div>
                </div>
            </NavbarFw>
            <Footer />
        </div>
    );
};

export default FwsHistory;