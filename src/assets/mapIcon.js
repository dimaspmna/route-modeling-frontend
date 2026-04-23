import L from "leaflet";

// import langsung file SVG biar bisa dibundle React
import centralRegion from "../assets/icon/icon_platform_central.svg";
import northRegion from "../assets/icon/icon_platform_north.svg";
import southRegion from "../assets/icon/icon_platform_south.svg";
import tankerRigBarge from "../assets/icon/icon_Subsea_wellhead.svg";
import otherRegion from "../assets/icon/icon_platform_other.svg";
import boat from "../assets/icon/icon_boat.svg";

// helper supaya ga ngulang2
const createIcon = (iconUrl) =>
  new L.Icon({
    iconUrl,
    iconSize: [24, 24],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

export const centralRegionIcon = createIcon(centralRegion);
export const northRegionIcon = createIcon(northRegion);
export const southRegionIcon = createIcon(southRegion);
export const tankerRigBargeIcon = createIcon(tankerRigBarge);
export const otherRegionIcon = createIcon(otherRegion);
export const boatIcon = createIcon(boat);
