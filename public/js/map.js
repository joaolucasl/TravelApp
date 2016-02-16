$(document).ready(function () {



    function geoLocate() {
        $.get("http://ipinfo.io", function (response) {
            console.log(response.ip, response.country);
        }, "jsonp");
    }

    /**
     * This function is a frankestein which
     * initialises the Map with the data from
     * the Lat and Long hidden fields in the page
     */
    function initialize() {
        var mapCanvas = document.getElementById('HotelMap');
        var Lat = $('#HotelLat').val();
        var Long = $('#HotelLong').val();

        geoLocate();

        var mapOptions = {
            center: new google.maps.LatLng(Lat, Long),
            zoom: 18,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        }
        var map = new google.maps.Map(mapCanvas, mapOptions);
    }

    /**
     * This adds a listener to perform the function
     * above once the page is loaded (load the map)
     */

    google.maps.event.addDomListener(window, 'load', initialize);



});
