import NavbarUser from "../../containers/nav/NavbarUser";
import Footer from "../../containers/footer/Footer";
import ShipForm from "../../components/user/form/ShipForm";
import SuccessAlert from "../../components/user/components/SuccessAlert";

const UsersDashboard = () => {
    return (
        <div className="min-h-screen flex flex-col">
            <NavbarUser>
                <div className="bg-gray-50 flex-1">
                    <div className="space-y-6">
                        <ShipForm />
                    </div>
                    <div className="space-y-6">
                        {/* <SuccessAlert /> */}
                    </div>
                </div>
            </NavbarUser>
            <Footer />
        </div>
    );
};

export default UsersDashboard;