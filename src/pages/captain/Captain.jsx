import NavbarCaptain from "../../containers/nav/NavbarCaptain";
import Footer from "../../containers/footer/Footer";
import CaptainMap from "../../components/captain/CaptainMap";

const CaptainDashboard = () => {
    return (
        <NavbarCaptain>
            <div className="bg-gray min-h-screen flex flex-col">
                <div className="space-y-6">
                    <CaptainMap />
                </div>
            </div>
                <Footer />
        </NavbarCaptain>
    );
};

export default CaptainDashboard;
