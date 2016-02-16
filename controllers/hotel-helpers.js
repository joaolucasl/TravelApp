var apiKeys = require('../config/api-keys.json');
var request = require('request');
var yelp = require("yelp").createClient(apiKeys.yelp);
var YQL = require("yql");
var Q = require('q');

exports.getHotelsByLocation =
    /**
     * Retrieves the hotels near a given coordinate from the Expedia Database
     * @param {[[Type]]} lat      The latitude to search for hotels at
     * @param {[[Type]]} long     The longitude to search for hotels at
     * @param {[[Type]]} callback The callback function
     */
    function getHotelsByLocation(lat, long, callback) {

        request('http://terminal2.expedia.com/x/hotels?location=' + lat + ',' + long + '&radius=5km&apikey=' + apiKeys.expedia.key,

            function returnsHotelsJSON(error, response, body) {
                if (error) {
                    callback(error, null);
                } else {
                    var HotelFeed = JSON.parse(body);

                    if (HotelFeed.MatchingHotelCount > 0) {


                        HotelFeed.HotelInfoList.HotelInfo.map(exports.updateThumbnailLink);

                        callback(null, HotelFeed);
                    } else {
                        callback("No hotel found.", null)
                    }
                }
            })
    };



exports.updateThumbnailLink =
    /**
     * This function updates the ThumbnailLink to a bigger file size version.
     * Its meant to receive its parameters from the <code>Array.prototype.map()</code> method
     * @param {Object}   curr  The current element being processed in the array.
     * @param {[[Type]]} index The index of the current element being processed in the array.
     * @param {[[Type]]} array The original array was called upon.
     */
    function updateThumbnailLink(curr, index, array) {
        var currLink = String(curr.ThumbnailUrl);

        curr.ThumbnailUrl = currLink.substring(0, currLink.length - 5);
    };

exports.getHotelInfoCB =
    /**
     * This function returns information from a single hotel, based on the HotelID parameter
     * @param {[[Type]]} HotelId  The ID of the Hotel
     * @param {[[Type]]} callback The callback function
     */
    function getHotelInfo(HotelId, callback) {
        request('http://terminal2.expedia.com/x/hotels?hotelids=' + HotelId + '&apikey=' + apiKeys.expedia.key,

            function returnsHotelJSON(error, response, body) {

                if (error) {

                    callback(error);
                } else {
                    var body = JSON.parse(body);

                    callback(body.HotelInfoList.HotelInfo);
                }
            })
    }


exports.getHotelInfo =
    /**
     * This function returns information from a single hotel, based on the HotelID parameter
     * @param {[[Type]]} HotelId  The ID of the Hotel
     */
    function getHotelInfo(HotelId) {

        var deferred = Q.defer();

        request('http://terminal2.expedia.com/x/hotels?hotelids=' + HotelId + '&apikey=' + apiKeys.expedia.key,

            function returnsHotelJSON(error, response, body) {

                if (error) {

                    deferred.reject(error);
                } else {

                    var HotelFeed = JSON.parse(body);
                    var curr = HotelFeed.HotelInfoList.HotelInfo.ThumbnailUrl;

                    console.log(curr);
                    HotelFeed.HotelInfoList.HotelInfo.ThumbnailUrl = curr.substring(0, curr.length - 5);
                    deferred.resolve(HotelFeed.HotelInfoList.HotelInfo);
                }
            })

        return deferred.promise;
    }



exports.getHotelReviews =
    function getHotelReviews(Hotel) {

        var deferred = Q.defer();


        yelp.search({
                term: Hotel.Name,
                location: Hotel.Location.City,
                limit: '1'
            },
            function (err, data) {
                if (err) {
                    if (err.statusCode == 400) {
                        deferred.resolve("Yelp unavailable for this region.");
                    }
                    deferred.reject(err);
                } else {
                    if (data.total < 1) {
                        deferred.resolve("No reviews were found");
                        return;
                    }
                    var HotelID = data.businesses[0].id;
                    yelp.business(HotelID,
                        function (error, businessData) {
                            if (error) {
                                deferred.reject(err);
                            } else {
                                deferred.resolve(businessData);
                            }
                        });
                }

            });

        return deferred.promise;

    }

exports.getForecast =
    function getForecast(cityName, provinceName) {
        var deferred = Q.defer();

        var query = new YQL('select * from weather.forecast where woeid in (select woeid from geo.places where text="' + cityName + ',' + provinceName + '") and u = "c" limit 1');

        query.exec(function (error, response) {
            if (error) {
                deferred.reject(error);
            } else {
                deferred.resolve(response.query.results);
            }
        });

        return deferred.promise;
    }
