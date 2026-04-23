import NavbarSuperAdmin from "../../../containers/nav/NavbarSuperAmin";
import UsersData from "../../../components/superadmin/data/UsersData";
import Footer from "../../../containers/footer/Footer";

const UserDataComponent = () => {
    return (
        <NavbarSuperAdmin>
            <div className="bg-gray- min-h-screen flex flex-col">
                <div className="space-y-6">
                    <UsersData/>
                </div>
                <Footer />
            </div>
        </NavbarSuperAdmin>
    );
};

export default UserDataComponent;
