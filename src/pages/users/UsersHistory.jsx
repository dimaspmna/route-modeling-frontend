import NavbarUser from "../../containers/nav/NavbarUser";
import Footer from "../../containers/footer/Footer";
import ShipForm from "../../components/user/form/ShipForm";
import UserHistory from "../../components/user/history/UserHistory";
import SuccessAlert from "../../components/user/components/SuccessAlert";

const UsersHistory = () => {
    return (
        <NavbarUser>
            <div className="bg-gray-50 min-h-screen flex flex-col">
                <div className="min-h-screen space-y-6">
                    <UserHistory/>
                </div>
                <Footer />
            </div>
        </NavbarUser>
    );
};

export default UsersHistory;
