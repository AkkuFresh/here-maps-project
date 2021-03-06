window.addEventListener('load', function() {
  // declarando variables
  var directionsBtn = document.getElementById('finder-btn');
  var startInput = document.getElementById('start-input');
  var finishingInput = document.getElementById('finishing-input');
  var latA;
  var lngA;
  var latB;
  var lngB;
  
  // Step 1: initialize communication with the platform
  var platform = new H.service.Platform({
    app_id: 'OGYLftP8d2ca44VEO7PF',
    app_code: 'xil_Gm8hAdrTOIHhwDc2rg',
    useCIT: true,
    useHTTPS: true
  });

  // getting route
  // var router = platform.getRoutingService(),
  //   parameters = {
  //     representation: 'display',
  //     routeattributes : 'waypoints,summary,shape,legs',
  //     maneuverattributes: 'direction,action',
  //     waypoint0: '52.5160,13.3779',
  //     waypoint1: '52.5206,13.3862',
  //     mode: 'fastest;car;traffic:enabled',
  //     departure: 'now'};

  // router.calculateRoute(parameters,
  //   function(result) {
  //     console.log(result.response.route[0]);
  //   }, function(error) {
  //     console.log(error);
  //   });
  
  // getting actual location with html5 geolocation feature
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      console.log(position.coords.latitude, position.coords.longitude);
      var pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      map.setCenter(pos);
      var marker = new H.map.Marker(pos);
      map.addObject(marker);
    });
  } 

  var defaultLayers = platform.createDefaultLayers();
  
  // Step 2: initialize a map  - not specificing a location will give a whole world view.
  var map = new H.Map(document.getElementById('map'),
    defaultLayers.normal.map);
  
  // Step 3: make the map interactive
  // MapEvents enables the event system
  // Behavior implements default interactions for pan/zoom (also on mobile touch environments)
  var behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
  
  // Create the default UI components
  var ui = H.ui.UI.createDefault(map, defaultLayers);
  

  function getHereMap(map) {
    map.setCenter({lat: 52.5159,
      lng: 13.3777});
    map.setZoom(14);
  }
  // Now use the map as required...
  getHereMap(map);
  // startInput.addEventListener('search', function() {
  //   geocode(platform);
  // });
  // finishingInput.addEventListener('search', function() {
  //   geocode2(platform);
  // });
  directionsBtn.addEventListener('click', function() {
    getRoute(platform);
  });

  // getting route from point A to point B
  function getRoute(platform) {
    var searching1 = startInput.value;
    var searching2 = finishingInput.value;
    console.log(`starting: ${searching1}`);
    console.log(`finishing: ${searching2}`);
    var geocoder = platform.getGeocodingService(),
      geocodingParameters = {
        searchText: `${searching2}`,
        jsonattributes : 1
      };

    // var geocoder2 = platform.getGeocodingService(),
    // geocodingParameters = {
    //   searchText: `${searching2}`,
    //   jsonattributes : 1
    // };

    geocoder.geocode(
      geocodingParameters,
      function(result) {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(function(position) {
            console.log(position.coords.latitude, position.coords.longitude);
            console.log(result);
            var locations = result.response.view[0].result;
            console.log(locations[0].location.displayPosition.latitude);
            console.log(locations[0].location.displayPosition.longitude);
            latB = locations[0].location.displayPosition.latitude;
            lngB = locations[0].location.displayPosition.longitude;
    
            var router = platform.getRoutingService(),
              routeRequestParams = {
                mode: 'fastest;pedestrian',
                representation: 'display',
                routeattributes: 'waypoints,summary,shape,legs',
                maneuverattributes: 'direction,action',
                waypoint0: `${position.coords.latitude},${position.coords.longitude}`, 
                waypoint1: `${latB},${lngB}` 
              };
      
      
            router.calculateRoute(
              routeRequestParams,
              onSuccess,
              onError
            );
           
            // map.setCenter(pos);
            // var marker = new H.map.Marker(pos);
            // map.addObject(marker);
          });
        }
      },
      function(error) {
        alert('Ooops!');
      }
    ); // fin de geocode
  } // fin de getRoute
  
  /**
  * This function will be called once the Routing REST API provides a response
  * @param  {Object} result          A JSONP object representing the calculated route
  *
  * see: http://developer.here.com/rest-apis/documentation/routing/topics/resource-type-calculate-route.html
  */
  function onSuccess(result) {
    var route = result.response.route[0];
    console.log(result);
    /*
   * The styling of the route response on the map is entirely under the developer's control.
   * A representitive styling can be found the full JS + HTML code of this example
   * in the functions below:
   */
    addRouteShapeToMap(route);
    addManueversToMap(route);
 
    // addWaypointsToPanel(route.waypoint);
    // addManueversToPanel(route);
    // addSummaryToPanel(route.summary);
    // ... etc.
  }

  /**
   * This function will be called if a communication error occurs during the JSON-P request
   * @param  {Object} error  The error message received.
   */
  function onError(error) {
    alert('Ooops!');
  }

  // Hold a reference to any infobubble opened
  var bubble;
  
  /**
   * Opens/Closes a infobubble
   * @param  {H.geo.Point} position     The location on the map.
   * @param  {String} text              The contents of the infobubble.
   */
  function openBubble(position, text) {
    if (!bubble) {
      bubble = new H.ui.InfoBubble(
        position,
        // The FO property holds the province name.
        {content: text});
      ui.addBubble(bubble);
    } else {
      bubble.setPosition(position);
      bubble.setContent(text);
      bubble.open();
    }
  }

  /**
   * Creates a H.map.Polyline from the shape of the route and adds it to the map.
   * @param {Object} route A route as received from the H.service.RoutingService
   */
  function addRouteShapeToMap(route) {
    var lineString = new H.geo.LineString(),
      routeShape = route.shape,
      polyline;
  
    routeShape.forEach(function(point) {
      var parts = point.split(',');
      lineString.pushLatLngAlt(parts[0], parts[1]);
    });
  
    polyline = new H.map.Polyline(lineString, {
      style: {
        lineWidth: 4,
        strokeColor: 'rgba(0, 128, 255, 0.7)'
      }
    });
    // Add the polyline to the map
    map.addObject(polyline);
    // And zoom to its bounding rectangle
    map.setViewBounds(polyline.getBounds(), true);
  }

  /**
   * Creates a series of H.map.Marker points from the route and adds them to the map.
   * @param {Object} route  A route as received from the H.service.RoutingService
   */
  function addManueversToMap(route) {
    var svgMarkup = '<svg width="18" height="18" ' +
      'xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="8" cy="8" r="8" ' +
        'fill="#1b468d" stroke="white" stroke-width="1"  />' +
      '</svg>',
      dotIcon = new H.map.Icon(svgMarkup, {anchor: {x: 8,
        y: 8}}),
      group = new H.map.Group(),
      i,
      j;
  
    // Add a marker for each maneuver
    for (i = 0; i < route.leg.length; i += 1) {
      for (j = 0; j < route.leg[i].maneuver.length; j += 1) {
        // Get the next maneuver.
        maneuver = route.leg[i].maneuver[j];
        // Add a marker to the maneuvers group
        var marker = new H.map.Marker({
          lat: maneuver.position.latitude,
          lng: maneuver.position.longitude},
        {icon: dotIcon});
        marker.instruction = maneuver.instruction;
        group.addObject(marker);
      }
    }
  
    group.addEventListener('tap', function(evt) {
      map.setCenter(evt.target.getPosition());
      openBubble(
        evt.target.getPosition(), evt.target.instruction);
    }, false);
  
    // Add the maneuvers group to the map
    map.addObject(group);
  }

  // getting geocodes from inputs
  function geocode(platform) {
    var searching1 = startInput.value;
    console.log(searching1);
    var geocoder = platform.getGeocodingService(),
      geocodingParameters = {
        searchText: `${searching1}`,
        jsonattributes: 1
      };
  
    geocoder.geocode(
      geocodingParameters,
      onSuccess,
      onError
    );
  }
  
  function geocode(platform) {
    var searching1 = startInput.value;
    console.log(searching1);
    var geocoder = platform.getGeocodingService(),
      geocodingParameters = {
        searchText: `${searching1}`,
        jsonattributes: 1
      };
  
    geocoder.geocode(
      geocodingParameters,
      onSuccess,
      onError
    );
  }
  
  function geocode2(platform) {
    var searching2 = finishingInput.value;
    console.log(searching2);
    var geocoder = platform.getGeocodingService(),
      geocodingParameters = {
        searchText: `${searching2}`,
        jsonattributes: 1
      };
  
    geocoder.geocode(
      geocodingParameters,
      onSuccess,
      onError
    );
  }
  /**
   * This function will be called once the Geocoder REST API provides a response
   * @param  {Object} result          A JSONP object representing the  location(s) found.
   *
   * see: http://developer.here.com/rest-apis/documentation/geocoder/topics/resource-type-response-geocode.html
   */
  // function onSuccess(result) {
  //   var locations = result.response.view[0].result;
  //   console.log(locations[0].location.displayPosition.latitude);
  //   console.log(locations[0].location.displayPosition.longitude);
  //   var latA = locations[0].location.displayPosition.latitude;
  //   var lngB = locations[0].location.displayPosition.longitude;
  //   /*
  //   * The styling of the geocoding response on the map is entirely under the developer's control.
  //   * A representitive styling can be found the full JS + HTML code of this example
  //   * in the functions below:
  //   */
  //   // addLocationsToMap(locations);
  //   // addLocationsToPanel(locations);
  //   // ... etc.
  // }
  
  // /**
  //  * This function will be called if a communication error occurs during the JSON-P request
  //  * @param  {Object} error  The error message received.
  //  */
  // function onError(error) {
  //   alert('Ooops!');
  // }

  // 

  // fetching data from Places feature
  const form = document.getElementById('search-form');
  const searchField = document.getElementById('search-keyword');
  const responseContainer = document.getElementById('response-container');
  let searchForText;

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      console.log(position.coords.latitude, position.coords.longitude);
      var lat = position.coords.latitude;
      var lng = position.coords.longitude;
      var currentLoc = lat+','+lng;

      form.addEventListener('submit', function(event) {
        event.preventDefault();
        responseContainer.innerHTML = '';
        searchForText = searchField.value;
        var output = '';
        console.log(searchForText);
    
        let url = `https://places.cit.api.here.com/places/v1/autosuggest?at=${currentLoc}&q=${searchForText}&app_id=OGYLftP8d2ca44VEO7PF&app_code=xil_Gm8hAdrTOIHhwDc2rg`;
    
        fetch(url)
          .then(function(response) {
            return response.json();
          })
          .then(function(data) {
            console.log(data);
            console.log(data.results);
            data.results.forEach(function(item) {
              console.log(item);
              var name = item.title;
              var address = item.vicinity;
              var distance = item.distance;
              var href = item.href;
              output += `
              <div class="card col-10">
                <div class="card-body">
                  <h5 class="card-title">${name.toUpperCase()}</h5>
                  <p class="card-text"><strong class="here-aqua">Address:</strong> ${address}</p>
                  <p class="card-text"><strong class="here-aqua">Distance:</strong> ${distance} m</p>
                </div>
              </div>
              `;
              document.getElementById('response-container').innerHTML = output;
              // document.getElementById('response-container').removeChild(document.getElementById('icon-container'));
            });
          })
          .catch(function(error) {
            console.log('something went wrong');
          });
      });
    });
  } 
});


