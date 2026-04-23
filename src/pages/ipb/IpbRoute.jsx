import NavbarIpb from "../../containers/nav/NavbarIpb";
import Footer from "../../containers/footer/Footer";
import IpbRoute from "../../components/ipb/route/IpbRoute";

const IpbRouteDashboard = () => {
    return (
        <NavbarIpb>
            <div className="bg-gray- min-h-screen flex flex-col">
                <div className=" min-h-screen space-y-6">
                    <IpbRoute />
                </div>
                <Footer />
            </div>
        </NavbarIpb>
    );
};

export default IpbRouteDashboard;
