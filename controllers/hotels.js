var express = require('express');
var router = express.Router();
var Q = require("q");
var geo = require("geoip-lite")

var HotelHelper = require('./hotel-helpers.js');

/**
 * Simple function to return the client IP
 * @param   {Object}   req The requisition body
 * @returns {[[Type]]} The IP address of the requisition
 */
var getClientIp = function (req) {
    return (req.headers["X-Forwarded-For"] ||
            req.headers["x-forwarded-for"] ||
            '').split(',')[0] ||
        req.client.remoteAddress;
};


/**
 * Main route for /hotels
 */
router.get('/', function (req, res) {
    //res.render('hotels-main');

    console.log(req.connection.remoteAddress);

    var clientIp = getClientIp(req);

    if (clientIp == "::ffff:127.0.0.1") {
        //If it is local, uses the location of Auckland for initial data
        var Coordinates = {
            Lat: "-36.8666700",
            Long: "174.7666700"
        }
    } else {
        //If not, gets the coordinates from the GeoIP plugin
        var geoLookup = geo.lookup(getClientIp(req));

        if (geoLookup) {

            var Coordinates = {
                Lat: geoLookup.ll[0],
                Long: geoLookup.ll[1]
            }
        } else {
            var Coordinates = {
                Lat: "-36.8666700",
                Long: "174.7666700"
            }
        }

    }
    //For the home page, shows hotels from Brisbane city.
    HotelHelper.getHotelsByLocation(Coordinates.Lat, Coordinates.Long, function (error, body) {

        var firstFour = body.HotelInfoList.HotelInfo.slice(0, 4); //Sends only the first 4 instead of the whole array of results

        res.render('hotels-main', {
            hotels: firstFour,
            partials: {
                header: "partials/header.partial",
                footer: "partials/footer.partial"
            }
        });

    });

});





router.get('/info/:id?', function (req, res) {

    var HotelInfo;
    var HotelReviews;
    var YelpData;

    HotelHelper.getHotelInfo(req.params.id)
        .then(
            function (body) {
                HotelInfo = body;
                return HotelHelper.getHotelReviews(HotelInfo);
            })
        .then(
            function (BusinessData) {
                HotelReviews = BusinessData.reviews;
                YelpData = BusinessData;

                return HotelHelper.getForecast(HotelInfo.Location.City, HotelInfo.Location.Province);
            })
        .then(
            function renderBody(body) {

                console.log(JSON.stringify(body));

                res.render('hotel-info', {
                    Hotel: HotelInfo,
                    Reviews: HotelReviews,
                    YelpID: YelpData.id,
                    Forecast: body.channel.item.description,
                    partials: {
                        header: "partials/header.partial",
                        footer: "partials/footer.partial"
                    }
                });

            })
        .catch(function (err) {

            res.render("error", {
                error: JSON.stringify(err)
            });

        });


});

router.post('/search', function (req, res) {
    var DestLat = req.body.DestLat;
    var DestLong = req.body.DestLong;

    if (DestLat && DestLong) {

        HotelHelper.getHotelsByLocation(DestLat, DestLong, function (error, body) {
            if (error) {
                res.render('error', {
                    error: 'No hotels matching the search criteria were found.'
                });
            } else {


                res.render('hotels-search', {
                    hotels: body.HotelInfoList.HotelInfo,
                    partials: {
                        header: "partials/header.partial",
                        footer: "partials/footer.partial"
                    }
                });
            }

        });
    } else {
        res.status('404').render('error');
    }
});




router.get('/ip', function (req, res) {

    res.send(geo.lookup(getClientIp(req)) || getClientIp(req));
});



router.get('*', function (req, res) {
    res.status(404).send('potato');

});




module.exports = router;
