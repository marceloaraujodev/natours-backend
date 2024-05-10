// Not really mapbox I changed to leaflet! Just didnt change the name of the file
import L from 'leaflet';

// const locations = JSON.parse(document.getElementById('map').dataset.locations);

export const displayMap = (locations) => {
  const [latCenterMap, longCenterMap] = locations[0].coordinates;

//  sets the view related to the first tour in locations obj
 var map = L.map('map', {
  center: [longCenterMap, latCenterMap],
  zoom: 4,
  scrollWheelZoom: false,
  zoomControl: false
});
L.control.zoom({
  position: 'bottomleft'
}).addTo(map);




L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
crossOrigin: ""
}).addTo(map);

const marker = L.icon({
  iconUrl: '../img/pin.png',
  iconSize: [32, 40],
  // iconAnchor: [22, 94],
  // popupAnchor: [22, 94],
  // shadowSize: [68, 95],
  // shadowAnchor: [22, 94]
});

// adds icons to maps
locations.forEach(loc => {
  const [lat, long] = loc.coordinates;
  // console.log(lat, long)
  L.marker([long, lat], {icon: marker}).addTo(map);
  //// openOn if making the map not center on the dot, fix it so we can see day 1 day 2 and 3 for the tours
  // const popup = L.popup([long, lat], {content: '<p>Day 1</p>', offset: [10, 10]})
  //     .openOn(map);
});
}




// document.querySelector('.form').addEventListener('submit', (e) => {
//   e.preventDefault();

//   const email = document.getElementById('email').value;
//   const password = document.getElementById('password').value;
//   login(email, password);
// });