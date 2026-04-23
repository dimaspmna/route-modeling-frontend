import NavbarFleet from "../../containers/nav/NavbarFleet";
import Footer from "../../containers/footer/Footer";
import FleetRoute from "../../components/fleet/route/FleetRoute";

const FleetRoutes = () => {
    return (
        <NavbarFleet>
            <div className="bg-gray- min-h-screen flex flex-col">
                <div className=" min-h-screen space-y-6">
                    <FleetRoute />
                </div>
                <Footer />
            </div>
        </NavbarFleet>
    );
};

export default FleetRoutes;
