import NavbarSuperAdmin from "../../../containers/nav/NavbarSuperAmin";
import CaptainData from "../../../components/superadmin/data/CaptainsData";
import Footer from "../../../containers/footer/Footer";

const CaptainDataComponent = () => {
    return (
        <NavbarSuperAdmin>
            <div className="bg-gray- min-h-screen flex flex-col">
                <div className="space-y-6">
                    <CaptainData/>
                </div>
                <Footer />
            </div>
        </NavbarSuperAdmin>
    );
};

export default CaptainDataComponent;
