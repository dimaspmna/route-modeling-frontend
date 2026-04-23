import NavbarIpb from "../../containers/nav/NavbarIpb";
import ShipForm from "../../components/user/form/ShipForm";
import Footer from "../../containers/footer/Footer";

const IpbDashboard = () => {
    return (
        <NavbarIpb>
            <div className="bg-gray- min-h-screen flex flex-col">
                <div className="space-y-6">
                    <ShipForm />
                </div>
                <Footer />
            </div>
        </NavbarIpb>
    );
};

export default IpbDashboard;
