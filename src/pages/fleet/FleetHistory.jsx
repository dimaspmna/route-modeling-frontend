import NavbarFleet from "../../containers/nav/NavbarFleet";
import Footer from "../../containers/footer/Footer";
import FleetHistory from "../../components/fleet/history/FleetHistory";

const FleetDashboard = () => {
    return (
        <NavbarFleet>
            <div className="bg-gray- min-h-screen flex flex-col">
                <div className=" min-h-screen space-y-6">
                    <FleetHistory />
                </div>
                <Footer />
            </div>
        </NavbarFleet>
    );
};

export default FleetDashboard;
