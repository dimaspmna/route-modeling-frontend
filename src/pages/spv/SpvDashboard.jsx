import NavbarSpv from "../../containers/nav/NavbarSpv";
import Footer from "../../containers/footer/Footer";
import SpvChart from "../../components/spv/components/SpvChart";

const SpvDashboard = () => {
    return (
        <div className="min-h-screen flex flex-col">
            <NavbarSpv>
                <div className="bg-gray- min-h-screen flex flex-col">
                    <div className="space-y-6 flex-1">
                        <SpvChart/>
                    </div>
                </div>
            </NavbarSpv>
            <div className="w-full">
                <Footer />
            </div>
        </div>
    );
};

export default SpvDashboard;