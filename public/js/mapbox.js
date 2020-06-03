
export const displayMap = locations => {

    mapboxgl.accessToken = 'pk.eyJ1Ijoic2liaTA0MTIyMDE3IiwiYSI6ImNrOXVjdHg3cTAwaGczbG4yOXp0NW0yNWQifQ.yiZfv_SL38J_uF8rf3yytg';

    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/sibi04122017/ckaqopxux11ib1jpet4282muk',
        scrollZoom: false

    });

    const bounds = new mapboxgl.LngLatBounds();

    locations.forEach(loc => {

        //Create a marker
        const el = document.createElement('div');
        el.className = 'marker';

        // add a marker
        new mapboxgl.Marker({
            element: el,
            anchor: 'bottom'
        })
            .setLngLat(loc.coordinates)
            .addTo(map)

        // add a popup
        new mapboxgl.Popup({
            offset: 30
        })
            .setLngLat(loc.coordinates)
            .setHTML(`<p>Day ${loc.day} : ${loc.description}</p>`)
            .addTo(map)

        // extends map bounds to include current location
        bounds.extend(loc.coordinates);
    });

    // permet de zoomer le map et de fixer le marker 
    map.fitBounds(bounds, {
        padding: {
            top: 200,
            bottom: 150,
            left: 100,
            right: 100
        }
    });



}

