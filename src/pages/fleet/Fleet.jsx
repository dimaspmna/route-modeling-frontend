import NavbarFleet from "../../containers/nav/NavbarFleet";
import Footer from "../../containers/footer/Footer";
import FleetEntries from "../../components/fleet/entries/FleetEntries";

const FleetDashboard = () => {
    return (
        <NavbarFleet>
            <div className="bg-gray- min-h-screen flex flex-col">
                <div className="space-y-6">
                    <FleetEntries />
                </div>
                <Footer />
            </div>
        </NavbarFleet>
    );
};

export default FleetDashboard;
