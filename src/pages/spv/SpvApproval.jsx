import NavbarSpv from "../../containers/nav/NavbarSpv";
import Spv from "../../components/spv/Spv";
import Footer from "../../containers/footer/Footer";

const SpvApproval = () => {
    return (
        <div className="min-h-screen flex flex-col">
            <NavbarSpv>
                <div className="bg-gray- flex-1">
                    <div className="space-y-6">
                        <Spv/>
                    </div>
                </div>
            </NavbarSpv>
            <Footer />
        </div>
    );
};

export default SpvApproval;