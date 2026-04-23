import NavbarIpb from "../../containers/nav/NavbarIpb";
import Footer from "../../containers/footer/Footer";
import UserHistory from "../../components/user/history/UserHistory";

const IpbHistory = () => {
    return (
        <NavbarIpb>
            <div className="bg-gray-50 min-h-screen flex flex-col">
                <div className="min-h-screen space-y-6">
                    <UserHistory/>
                </div>
                <Footer />
            </div>
        </NavbarIpb>
    );
};

export default IpbHistory;
