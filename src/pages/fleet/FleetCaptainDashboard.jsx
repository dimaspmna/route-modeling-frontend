import NavbarFleet from "../../containers/nav/NavbarFleet";
import Footer from "../../containers/footer/Footer";
import FleetCaptain from "../../components/fleet/captain/FleetCaptain";

const FleetCaptainDashboard = () => {
    return (
        <NavbarFleet>
            <div className="bg-gray- min-h-screen flex flex-col">
                <div className=" min-h-screen space-y-6">
                    <FleetCaptain />
                </div>
                <Footer />
            </div>
        </NavbarFleet>
    );
};

export default FleetCaptainDashboard;
