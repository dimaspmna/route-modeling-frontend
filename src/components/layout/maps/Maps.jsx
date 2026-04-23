import React, { useEffect, useState } from 'react';
import * as xml2js from 'xml2js';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Sample OSM Data
const osmData = `
<osm version="0.6" generator="CGImap 0.9.2 (1853298 spike-07.openstreetmap.org)" copyright="OpenStreetMap and contributors" attribution="http://www.openstreetmap.org/copyright" license="http://opendatacommons.org/licenses/odbl/1-0/">
  <way id="297308286" visible="true" version="2" changeset="132589574" timestamp="2023-02-15T16:10:08Z" user="ahhmmaadibrmm01" uid="18491492">
    <nd ref="3011821704"/>
    <nd ref="3011821705"/>
    <nd ref="10665041518"/>
    <nd ref="10665041517"/>
    <nd ref="10665041519"/>
    <nd ref="3011821706"/>
    <nd ref="3011811161"/>
    <nd ref="3011821704"/>
    <tag k="amenity" v="university"/>
    <tag k="name" v="UTY Kampus 1"/>
  </way>
</osm>
`;

// Parse OSM Data
const parseOsmData = (data) => {
  let result = null;
  xml2js.parseString(data, { explicitArray: false }, (err, parsed) => {
    if (!err) {
      result = parsed;
    }
  });
  return result;
};

// Fix for default icon issue in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const Maps = () => {
  const [universityData, setUniversityData] = useState(null);

  useEffect(() => {
    const parsedData = parseOsmData(osmData);
    setUniversityData(parsedData);
  }, []);

  if (!universityData) {
    return <div>Loading...</div>;
  }

  const way = universityData.osm?.way;
  if (!way) {
    return <div>Invalid OSM data</div>;
  }

  const universityName = Array.isArray(way.tag)
    ? way.tag.find(tag => tag.k === 'name')?.v
    : way.tag?.k === 'name'
      ? way.tag.v
      : 'Unknown University';

  const coordinates = [
    { lat: -7.748, lon: 110.3552 }, // Provided coordinates for the university
  ];

  return (
    <div className="flex isolate items-center rounded-lg">
      <div className="mt-2 bg-white rounded-lg shadow-lg w-full max-w-full">
        <MapContainer center={[coordinates[0].lat, coordinates[0].lon]} zoom={15} style={{ height: '400px', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {coordinates.map((coord, index) => (
            <Marker key={index} position={[coord.lat, coord.lon]}>
              <Popup>
                {universityName}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default Maps;
