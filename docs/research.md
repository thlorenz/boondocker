# boondocker resources

boondocker app listing all dispersed camp sites and close by cities + libraries/coffee shops

## Data API

Can download all data here:
[https://ridb.recreation.gov/index.cfm?action=datadownload](https://ridb.recreation.gov/index.cfm?action=datadownload),
so may need API only for JSONP requests of serverless app.

- [https://ridb.recreation.gov/](https://ridb.recreation.gov/)
- [https://ridb.recreation.gov/index.cfm?action=advsearch](https://ridb.recreation.gov/index.cfm?action=advsearch])
- [RIDB API](http://usda.github.io/RIDB/) (API methods - other ones - ridb.recreation.gov - about to be deprecated)

### Campsites

#### Get All

Gets 50 records at a time, at this point there are a total of 97219. Seems to not include any GPS info.
However Campsite IDs seem to roughly match the index of the campsite (last two IDs are 98778 and 98779)

- https://ridb.recreation.gov/api/v1/campsites.json?apikey={{apikey}}&query=overnight&offset={{offset}}

#### Get a Campsite

- https://ridb.recreation.gov/api/v1/campsites/{{id}}.json?apikey={{apikey}}

## Google Maps API:  

- [admin](https://console.developers.google.com/iam-admin)

## Phone Apps

- [react-native google maps](https://github.com/lelandrichardson/react-native-maps)
- [react-native mapview](https://facebook.github.io/react-native/docs/mapview.html#mapview)
- [react-native mapbox](https://github.com/mapbox/react-native-mapbox-gl)
- [maps.me offline OSM](https://github.com/mapsme/omim) .. allows building offline maps for use on native platforms
- [maps.me offline maps](https://github.com/mapsme/api-android)
