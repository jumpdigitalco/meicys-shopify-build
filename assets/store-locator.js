
export default class storeLocator {
    constructor( mapContainerSelector, locationOptionsContainer, storesInfo ) {
        console.log('Init Store Locator', mapContainerSelector, locationOptionsContainer);

        // Define default country
        // Define default country
        var coordenatesPerLocation = {
            "meicys.com.co": { defaultCountry: "Colombia", defaultLat: 4.7110, defaultLng: -74.0721 },
            "meicyscolombia.myshopify.com": { defaultCountry: "Colombia", defaultLat: 4.7110, defaultLng: -74.0721 }
        };

        // Get the current domain
        var currentDomain = window.location.hostname;

        // Retrieve the configuration for the current domain
        var defaultCoordenates = coordenatesPerLocation[currentDomain] || { defaultCountry: "Colombia", defaultLat: 4.7110, defaultLng: -74.0721 };

        console.log("Default Country:", defaultCoordenates.defaultCountry);
        console.log("Default Latitude:", defaultCoordenates.defaultLat);
        console.log("Default Longitude:", defaultCoordenates.defaultLng);

        this.$locationOptionsContainer = document.querySelector( locationOptionsContainer );
        this.$mapContainer = document.querySelector( mapContainerSelector );
        this.storesMapApiKey = document.querySelector( '.store-locator' ).getAttribute('data-maps-api-key');
        this.googleApiKey = this.storesMapApiKey || 'AIzaSyCgOxMziM6XWWrKQqLOntwD4BVrnH-fgnM';
        this.lat_act = 0;
        this.lon_act = 0;
        this.activePosition = false;
        this.counter = 0;
        this.markers = [];
        this.a_counter = 0;
        this.infowindow = {};
        this.storesInfo = storesInfo;
        // this.icon = "/arquivos/pinStore.png";
        this.defaultCountry = defaultCoordenates.defaultCountry;
        this.defaultLat = defaultCoordenates.defaultLat;
        this.defaultLng = defaultCoordenates.defaultLng;

        this.storeLanguage = document.querySelector('html').getAttribute('lang') || 'es';

        //Initiate the mapLocator
        this.storesInfo = this.loadJSONFile(
            () => {
                this.loadApiGoogle( () => {

                    this.storesMapData = this.storesInfo;
            
                    const   divCountry = document.createElement("div");
                            divCountry.id = "container_country";
            
                    const   divCities = document.createElement("div");
                            divCities.id = "container_city";
            
                    const   divSeeAll = document.createElement("button");
                        divSeeAll.className = "see-all-locations";
                        divSeeAll.innerText = this.translations( this.storeLanguage, 'see_all' );
            
                    this.$locationOptionsContainer.appendChild(divCountry);
                    this.$locationOptionsContainer.appendChild(divCities);
                    this.$locationOptionsContainer.appendChild(divSeeAll);
        
                    // console.log('this.$locationOptionsContainer', this.$locationOptionsContainer );
        
                    this.getLocation();
                
                    const seeAllLocationsButton = document.querySelector("button.see-all-locations");
            
                    seeAllLocationsButton.addEventListener("click", function() {
                        const countriesSelect = document.getElementById("countries");
                        countriesSelect.value = 'NULL';
                        countriesSelect.dispatchEvent(new Event("change"));
                    });
                } );

                this.storeInMap();
            }
        );
        
    }

    async loadJSONFile( $positiveCallback ){
        const JSONFilelocation = document.querySelector('.store-locator').getAttribute('data-stores-info');
        console.log('JSONFilelocation', JSONFilelocation)

       await fetch(JSONFilelocation)
        .then(response => response.json())
        .then(data => {
            // console.log(data);
            $positiveCallback();

            return this.storesInfo = data;
        })
        .catch(error => {
            console.log(error);
        });
    }

    loadApiGoogle( $callback ){
        const script = document.createElement("script");
        script.type = "text/javascript";
  
        if (script.readyState) {
            script.onreadystatechange = function() {
                if (script.readyState == "loaded" || script.readyState == "complete") {
                    script.onreadystatechange = null;
                    $callback();
                }
            };
        } else {
            script.onload = function() {
                $callback();
            };
        }
        script.src = `https://maps.googleapis.com/maps/api/js?libraries=places&key=${this.googleApiKey}`;
        document.getElementsByTagName("head")[0].appendChild(script);

    }//loadApiGoogle

    //Initiates the script
    getLocation(){
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(this.showPosition, this.showError() );
        } else {
            document.getElementById("error").innerHTML = "Geolocalizacion no es compatible con este navegador.";
        }
    }
    
    //Creates the map and all its options
    createMap( $options ){
        const map = new google.maps.Map( this.$mapContainer , $options);
        return map;
    }

    showPosition( $position ){
        console.log('showPosition this:', this)

        this.activePosition = true;

        console.log('showPosition:', this.activePosition)
    
        lat = $position.coords.latitude;
        lon = $position.coords.longitude;

        this.lat_act = lat;
        this.lon_act = lon;
        
        latlon = new google.maps.LatLng(lat, lon);
        console.log('showPosition, lat:', lat, ', lon:', lon)
  
        this.validateCountry(function($data) {
            //  mapsStores.showError(true);
            console.log('validateCountry $data', $data);
            const mapOptions = {
                center: latlon,
                zoom: 12,
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                mapTypeControl: false,
                navigationControlOptions: { style: google.maps.NavigationControlStyle.SMALL }
            };
            const map = this.createMap(mapOptions);
            const marker = new google.maps.Marker({ position: latlon, map: map, title: "Store Locator Marker", animation: google.maps.Animation.DROP });
            this.paintStores(map, $data, function() {
                this.addMarker(map);
            });
        });

        this.loadList();

        if (typeof this.defaultCountry !== "undefined" && this.defaultCountry != "") {
            $("#countries").val($("#countries option[country='" + this.defaultCountry + "'").val()).trigger('change');
        }

    }//showPosition

    //add the locations to map
    paintStores( $map, $data, $callback, $centinela ){

        this.markers = [];

        for (var i = 0; i < $data.length; i++) {
            var store = $data[i];
            var marker = new google.maps.Marker({
                data_complete: store,
                position: { lat: store[2], lng: store[1] },
                map: $map,
                content: store[3],
                icon: this.icon,
                title: store[0]
            });
            this.markers.push(marker);
        }

        var data = this.markers;
        var listHTML = '<ul>';

        for (var i = 0; i < data.length; i++) {

            console.log('store data:', data[i].content);
            let todaySchedule = '';
            let scheduleItem = '';
            let fullSchedule = '';

            const storePhone = data[i].content.phone != "" ? `<a href="tel:${ data[i].content.phone }">${ data[i].content.phone }</a>` : ``;
            const storeWA =  data[i].content.whatsapp != "" && typeof data[i].content.whatsapp !== 'undefined' ? `<a href="${ data[i].content.whatsapp }">${ this.translations( this.storeLanguage, 'whatsapp' ) }</a>` : ``;

            // console.log('data[i].content.schedules', data[i].content.schedules)

            if(data[i].content.schedules != '' && typeof data[i].content.schedules !== 'undefined'){

                let getToday = new Date();
                let getDay = getToday.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                let getTime = getToday.getHours();

                Object.keys(data[i].content.schedules).forEach((key) => {
                    // console.log(key, data[i].content.schedules[key], 'getDay', getDay );
                    if(getDay == key){
                        todaySchedule = `<div class="store-info todays-schedule"><i class="icon icon-clock"></i> ${ this.translations( this.storeLanguage, 'todays_schedule' ) }: ${data[i].content.schedules[key]}</div>`;
                    }
                    scheduleItem +=  `<dl class="schedule-item${getDay == key ? ' current' : ''}"><dt>${ this.translations( this.storeLanguage, key ) }</dt><dd>${data[i].content.schedules[key]}</dd></dl>`
                });

                if(scheduleItem != ''){
                    fullSchedule = `<div class="store-info full-schedule"><dl class="schedule-item current"><dt>${ this.translations( this.storeLanguage, 'store_hours' ) }</dt></dl>${scheduleItem}</div><!--.full-schedule-->`;
                }

            }

            listHTML += `<li class="single-store" store-index="${ i }">
                <h4 class="store-info store-name">${ data[i].content.name }</h4>
                <div class="store-info store-address"><span class="label">${ this.translations( this.storeLanguage, 'address' ) }: </span><span class="value">${ data[i].content.address }</span></div>
                <div class="store-info store-contact">
                    ${ storePhone || storeWA ? `${ this.translations( this.storeLanguage, 'contact_line' ) }:&nbsp;` : '' }
                    ${ storePhone }
                    ${ storeWA}
                </div>
                ${ todaySchedule }
                ${ fullSchedule }
                <div class="store-info store-directions">
                    <a href="https://www.google.com/maps/search/?api=1&query=${data[i].content.lat}%2C${data[i].content.lng}&zoom=11" target="_blank"> ${ this.translations( this.storeLanguage, 'view_in' ) } Google Maps</a>
                </div>

            </li>`;
        }

        listHTML += '</ul>';

        document.getElementById("stores-list").innerHTML = listHTML;

        if ($callback != undefined) {
            $callback();
        }
    }//paintStores

    addMarker( $map ){
        //console.log('addMarker');
        const self = this;
        if (this.a_counter < this.markers.length) {
            var i = this.a_counter;
            var markers_alls = this.markers;
            var marker = markers_alls[i];

            //console.log('marker:', marker);

            google.maps.event.addListener(marker, 'click', function() {
                if (self.infowindow.content != undefined) {
                    self.infowindow.close();
                }
                self.infowindow = new google.maps.InfoWindow({
                    content: self.contentHTML(marker.content, marker.content.name)
                });
                //document.getElementById("storeContent").innerHTML = self.contentHTML(marker.content, marker.content.name);
                $map.setZoom(15);
                $map.setCenter(marker.getPosition());
                self.infowindow.open($map, marker);
                $map.panTo(marker.getPosition());
            });
            this.a_counter++;
            this.addMarker($map);
        } else {
            this.a_counter = 0;
        }
    }//addMarker

    contentHTML( $store, $storeName, $city, $country ) {
        const contentString = '<div id="content">' +
            '<div id="siteNotice">' +
            '</div>' +
            '<h2 id="firstHeading" class="firstHeading"><strong>' + $storeName + '</strong></h2><br>' +
            '<div id="bodyContent">' +
            // '<p><strong>City: </strong> ' + $city + '</p>' +       
            // '<p><strong>Pais: </strong> ' + $country + '</p>' +
            ($store.address != null && $.trim($store.address) != "" ?
                `<p><strong> ${ this.translations( this.storeLanguage, 'address' ) }: </strong> ${ $store.address }</p>`:
                '') +
            ($store.phone != null && $.trim($store.phone) != "" ?
                `<p><strong>${ this.translations( this.storeLanguage, 'phone' ) }: </strong>${ $store.phone }</p>` :
                '') +
                ($store.email != null && $.trim($store.email) != "" ?
                    `<p><strong>${ this.translations( this.storeLanguage, 'email' ) }: </strong> '${ $store.email } </p>` :
                    '') +
            // ($store.schedules != null && $.trim($store.schedules) != "" ?
            //     '<p><strong>Store Hours: </strong> ' + $store.schedules + '</p>' :
            //     '') +
                `<p><a href="https://www.google.com/maps/search/?api=1&query=${$store.lat}%2C${$store.lng}&zoom=11" target="_blank" style="text-decoration: underline;">${ this.translations( this.storeLanguage, 'get_directions' ) }</a></p>` +
            '</div>' +
            '</div>';
        return contentString;
    }//contentHTML

    validateCountry( $callBack ){
        $.ajax({
            url: `//maps.googleapis.com/maps/api/geocode/json?libraries=places&key=${this.googleApiKey}&latlng=${this.lat_act},${this.lon_act}&sensor=false`,
            taype: "GET",
            success: function(_data) {
                console.log(_data);
                var name_count = _data.results[_data.results.length - 1].formatted_address.toUpperCase().split(" ").join("");
                var data_all = this.storesMapData;
                var centinela = false;
                for (name in data_all) {
                    var name_obj = name.toUpperCase().split(" ").join("");
                    if (name_obj == name_count) {
                        centinela = true;
                        this.validateCities(data_all[name], _data, $callBack);
                    }
                }
                if (centinela == false) {
                    this.loadMapDefault();
                }
            }
        });
    }//validateCountry

    validateCities( $data_country, $data_ajax, $callBack ){
        const data = $data_country.cities;
        const city_act = $data_ajax.results[0].formatted_address.toUpperCase().split(" ").join("");
        const centinela = false;

        for (name in data) {
            var city_obj = name.toUpperCase().split(" ").join("");
            if (city_act.indexOf(city_obj) >= 0) {
                this.createStoresMap(data[name].stores, $callBack);
                centinela = true;
            }
        }
        if (centinela == false) {
            this.createStoresMap($data_country, $callBack)
        }
    }//validateCities

    createStoresMap($stores, $callBack) {
        var stores_map = { type: 'FeatureCollection', features: [] };
        var coor_stores = [];
        if ($stores.cities != undefined) {
            $stores = $stores.cities;
            for (name_city in $stores) {
                var data_city = $stores[name_city].stores;
                console.log(data_city);
                for (name in data_city) {
                    var data = data_city[name];
                    coor_stores.push([name, Number(data.lng), Number(data.lat), { 
                        name: name, 
                        lat: data.lat, 
                        lng: data.lng, 
                        phone: data.phone, 
                        email: data.email, 
                        whatsapp: data.whatsapp,
                        address: data.address, 
                        schedules: data.schedules 
                    }]);
                }
            }
            this.loadList();
        } else {
            for (name in $stores) {
                var data = $stores[name];
                coor_stores.push([name, Number(data.lng), Number(data.lat), { 
                    name: name, 
                    lat: data.lat, 
                    lng: data.lng, 
                    phone: data.phone, 
                    email: data.email, 
                    whatsapp: data.whatsapp,
                    address: data.address, 
                    schedules: data.schedules 
                }]);
            }
        }
        $callBack(coor_stores);
    }//createStoresMap

    loadList(){
        const self = this;

        const list = document.createElement("select");
        list.id = "countries";
        
        list.onchange = function() {
           // document.getElementById("storeContent").innerHTML = ""
            if (self.value != "NULL") {
                var list_city = document.createElement("select");
                list_city.id = "cities";
                // list_city.style.width = "100%";
                list_city.onchange = function() {
                    console.log('cambia la lista de ciudades')
                    //document.getElementById("storeContent").innerHTML = ""
                    self.detectedStoresPaint(self.getOption("countries").getAttribute('country'), self.getOption("cities").text);
                }
                document.getElementById("container_city").innerHTML = "";
                document.getElementById("container_city").innerHTML = '<span class="sr-only">Filter by City</span>';
                document.getElementById("container_city").appendChild(list_city);
                self.fullList("city");
                self.detectedStoresPaint(self.getOption("countries").getAttribute('country'), "");
            } else {
                document.getElementById("container_city").innerHTML = "";
            }
        };
        if (document.getElementById("countries") == null) {
            document.getElementById("container_country").innerHTML = '<span class="sr-only">Filter by Country</span>';
            document.getElementById("container_country").appendChild(list);
        }
  
        this.fullList("country");
    }//loadList

    showError( $centinela ){
        console.log('showError this.activePosition: ', this.activePosition, 'centinela:', $centinela);
        if (this.activePosition == false) {
            var obj = this.storesMapData;
            var country = this.getURLParam("pais");
            var city = this.getURLParam("tiendas");

            this.loadList();

            console.log('country: ',country);
            console.log('city: ',city);

            if ($centinela != true) {
                if (country == "" && city == "") {
                    if (typeof this.defaultCountry !== "undefined" && this.defaultCountry != "") {
                        $("#countries").val($("#countries option[country='" + this.defaultCountry + "'").val()).change();
                        this.detectedStoresPaint(this.defaultCountry, "");
                    }
                } else {
                    if (typeof this.defaultCountry !== "undefined" && this.defaultCountry != "") {
                        // $("#countries").val($("#countries option[country='" + this.defaultCountry + "'").val()).change();

                        // $("#cities").val($("#cities option[value='" +  this.storesInfo[this.defaultCountry].cities["Medellin"].lat + "," +  this.storesInfo[this.defaultCountry].cities["Medellin"].lng + "'").val()).change();

                        // this.detectedStoresPaint(country, "Medellin");

                        // $('.stores_ul ul li').each(function() {
                        //     console.log($(this).text())
                        //     if ($(this).text() == city) {
                        //         $(this).trigger("click");
                        //     }
                        // });
                    }
                }
            }
        }
    }//showError

    detectedStoresPaint( $country, $city ) {
        const self = this;
        console.log('detectedStoresPaint');

        var obj = this.storesMapData;
        var pais = "";
        var cuidad = "";
        var options_map = { zoom: 5, mapTypeId: google.maps.MapTypeId.ROADMAP };
        var stores_arr = [];
        var centinela_global = false;
        
        // console.log('country: ',$country);
        // console.log('city: ',$city);
  
        if ($country != "" && $city == "") {
            pais = obj[$country];
            console.log(pais);
            if (pais != undefined) {
                options_map["center"] = new google.maps.LatLng(pais.lat, pais.lng);
                var cudades = pais.cities;

                // console.log('ciudades' ,cudades);

                for (name in cudades) {
                    var stores = cudades[name].stores;

                    // console.log('stores' ,stores);

                    for (var name_store in stores) {

                        // console.log('name_store', name_store);
                        var store = stores[name_store];
                        stores_arr.push([name_store, store.lng, store.lat, 
                        { 
                            name: name_store, 
                            lat: store.lat, 
                            lng: store.lng, 
                            phone: store.phone, 
                            email: store.email, 
                            whatsapp: store.whatsapp,
                            address: store.address, 
                            schedules: store.schedules 
                        }]);
                    }
                }
            } else {
                centinela_global = true;
                this.loadMapDefault();
            }
        }
  
        if ($country == "" && $city != "") {
            var centinela = false;
            for (name in obj) {
                var city = obj[name].cities[$city];
                if (city != undefined) {
                    centinela = true;
                    options_map.zoom = 11;
                    options_map["center"] = new google.maps.LatLng(city.lat, city.lng);
                    var stores = city.stores;
                    for (var name_store in stores) {
                        var store = stores[name_store];
                        stores_arr.push([name_store, store.lng, store.lat, , 
                            { 
                                name: name_store, 
                                lat: store.lat, 
                                lng: store.lng, 
                                phone: store.phone, 
                                email: store.email, 
                                whatsapp: store.whatsapp, 
                                address: store.address, 
                                schedules: store.schedules 
                            }]);
                    }
                } else {
                    console.log("no esta la ciudad");
                }
            }
            if (centinela == false) {
                centinela_global = true;
                this.loadMapDefault();
            }
        }
  
        if ($country == "" && $city == "") {
            centinela_global = true;
            this.loadMapDefault();
        }
  
        if ($country != "" && $city != "") {
            pais = obj[$country];
            if (pais != undefined) {
                var centinela = false;
                cuidad = pais.cities[$city];
                if (cuidad != undefined) {
                    centinela = true;
                    options_map.zoom = 11;
                    options_map["center"] = new google.maps.LatLng(cuidad.lat, cuidad.lng);
                    var stores = cuidad.stores;
                    for (var name_store in stores) {
                        var store = stores[name_store];
                        stores_arr.push([name_store, store.lng, store.lat, 
                            { 
                                name: name_store, 
                                lat: store.lat, 
                                lng: store.lng, 
                                phone: store.phone, 
                                email: store.email, 
                                whatsapp: store.whatsapp, 
                                address: store.address, 
                                schedules: store.schedules 
                            }]);
                    }
                }
                if (centinela == false) {
                    options_map["center"] = new google.maps.LatLng(pais.lat, pais.lng);
                    var cudades = pais.cities;
                    for (var name in cudades) {
                        var stores = cudades[name].stores;
                        for (var name_store in stores) {
                            var store = stores[name_store];
                            stores_arr.push([name_store, store.lng, store.lat, 
                            { 
                                name: name_store, 
                                lat: store.lat, 
                                lng: store.lng, 
                                phone: store.phone, 
                                email: store.email, 
                                whatsapp: store.whatsapp, 
                                address: store.address, 
                                schedules: store.schedules 
                            }]);
                        }
                    }
                }
  
            } else {
                var centinela = false;
                for (name in obj) {
                    var city = obj[name].cities[$city];
                    if (city != undefined) {
                        centinela = true;
                        options_map.zoom = 11;
                        options_map["center"] = new google.maps.LatLng(city.lat, city.lng);
                        var stores = city.stores;
                        for (var name_store in stores) {
                            var store = stores[name_store];
                            stores_arr.push([name_store, store.lng, store.lat, { 
                                name: name_store, 
                                lat: store.lat, 
                                lng: store.lng, 
                                phone: store.phone, 
                                email: store.email, 
                                whatsapp: store.whatsapp, 
                                address: store.address, 
                                schedules: store.schedules 
                            }]);
                        }
                    }
                }
                if (centinela == false) {
                    centinela_global = true;
                    this.loadMapDefault();
                }
            }
        }

        if (centinela_global == false) {
            var map = this.createMap(options_map);
            this.paintStores(map, stores_arr, function() {
                self.addMarker(map);
            });
        }
    }//detectedStoresPaint

    storeInMap( $position ){
        const self = this;
        //document.getElementById("storeContent").innerHTML = this.contentHTML(marker.content, marker.content.name);

        $(document).on('click', '.single-store', function(e){
            let positionIndex = $(e.currentTarget).attr('store-index');

            // console.log('storeInMap', self.markers);

            const marker = self.markers[positionIndex];
                marker.map.setZoom(15);
                marker.map.setCenter(marker.getPosition());
            
            console.log('marker', marker);
    
            if (self.infowindow.content != undefined) {
                self.infowindow.close();
            }
            self.infowindow = new google.maps.InfoWindow({
                content: self.contentHTML(marker.content, marker.content.name)
            });

            $(e.currentTarget).siblings().removeClass('active');
            $(e.currentTarget).toggleClass('active');
    
            self.infowindow.open(marker.map, marker);
        })        

    }//storeInMap

    loadMapDefault(){
        console.log("Load default Map, default:", this.defaultCountry);
        var options_map = { zoom: 5, mapTypeId: google.maps.MapTypeId.ROADMAP };
        var obj = this.storesMapData;
        var countries = obj;
        var cities = "";
        var stores_arr = [];
        var self = this;

        options_map["center"] = new google.maps.LatLng(this.defaultLat, this.defaultLng);
        cities = obj[this.defaultCountry].cities;

        console.log('cities', cities);

        for (var country in obj) {
            cities = obj[country].cities;

            for (var name in cities) {
                var stores = cities[name].stores;

                for (var name_store in stores) {
                    var store = stores[name_store];
                    stores_arr.push([name_store, Number(store.lng), Number(store.lat),
                        { 
                            name: name_store, 
                            lat: store.lat, 
                            lng: store.lng, 
                            phone: store.phone, 
                            email: store.email, 
                            whatsapp: store.whatsapp, 
                            address: store.address, 
                            schedules: store.schedules 
                        }
                    ]);
                }
            }
        }
        var map = this.createMap(options_map);
  
        this.paintStores(map, stores_arr, function() {
            self.addMarker(map);
        });
    }//loadMapDefault

    getOption( $id ){
        let option_selected = document.getElementById($id);
            option_selected = option_selected.options[option_selected.selectedIndex];
        return option_selected;
    }//getOption

    getURLParam( $name ){
        var value = decodeURIComponent((new RegExp('[?|&]' + $name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [, ""])[1].replace(/\+/g, '%20')) || null;
        if (value == null) {
            return '';
        } else {
            return value;
        }
    }//getURLParam

    fullList( $list ){
        if ($list == "country") {
            var options = `<option value="NULL">${ this.translations( this.storeLanguage, 'select_country' ) }</option>`;
            for (name in this.storesMapData) {
                options += '<option country="' + name + '" value="' + String(this.storesMapData[name].lat) + ',' + String(this.storesMapData[name].lng) + '">' + (this.storeLanguage == 'es' ? name.replace('United States', 'Estados Unidos') : name) + '</option>';
            }
            document.getElementById("countries").innerHTML = options;
  
  
        } else {
            var options = `<option value="NULL">${ this.translations( this.storeLanguage, 'select_city' ) }</option>`;
            var option_selected = this.getOption("countries").getAttribute('country');
            for (name in this.storesMapData) {
                if (option_selected == name) {
                    var city = this.storesMapData[name].cities;

                    for (var name_atri in city) {
                        options += '<option value="' + String(city[name_atri].lat) + ',' + String(city[name_atri].lng) + '">' + name_atri + '</option>';
                    }
                }
            }
            document.getElementById("cities").innerHTML = options;
        }
    }//fullList

    translations( languageISO, key ){
        const locatorTexts = {
            "en": {
                select_country: "Select Country",
                select_city: "Select City",
                see_all: "See all",

                address: "Address",
                phone: "Phone",
                email: "Email",
                whatsapp: "Talk via Whatsapp",
                get_directions: "Get directions",
                view_in: "View in",
                contact_line: "Contact",

                monday: "Monday",
                tuesday: "Tuesday",
                wednesday: "Wednesday",
                thursday: "Thursday",
                friday: "Friday",
                saturday: "Saturday",
                sunday: "Sunday",

                todays_schedule: "Today's Hours",
                store_hours: "Store Hours"
            },
            "es": {
                select_country: "Seleccionar país",
                select_city: "Seleccionar ciudad",
                see_all: "Ver todo",

                address: "Dirección",
                phone: "Teléfono",
                email: "Email",
                whatsapp: "Hablar via Whatsapp",
                get_directions: "Link al mapa",
                view_in: "Ver en",
                contact_line: "Contacto",

                monday: "Lunes",
                tuesday: "Martes",
                wednesday: "Miércoles",
                thursday: "Jueves",
                friday: "Viernes",
                saturday: "Sábado",
                sunday: "Domingo",

                todays_schedule: "Horario para hoy",
                store_hours: "Horarios de la tienda"
            }
        }

        if (locatorTexts[languageISO] && locatorTexts[languageISO][key]) {
            return locatorTexts[languageISO][key];
        } else {
            console.log(`Translation not found for key: "${key}" in language: "${languageISO}"`);
            return null;
        }

    }//translations


}

new storeLocator( '.map-container', '.location-options-container' );