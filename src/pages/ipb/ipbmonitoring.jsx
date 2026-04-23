import NavbarIpb from "../../containers/nav/NavbarIpb";
import Footer from "../../containers/footer/Footer";
import FleetMonitoring from "../../components/fleet/monitoring/FleetMonitoring";

const IpbMonitoring = () => {
    return (
        <NavbarIpb>
            <div className="bg-gray- min-h-screen flex flex-col">
                <div className=" min-h-screen space-y-6">
                    <FleetMonitoring />
                </div>
                <Footer />
            </div>
        </NavbarIpb>
    );
};

export default IpbMonitoring;
