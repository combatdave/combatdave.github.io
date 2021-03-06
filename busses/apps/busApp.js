function RouteInfo(route, numBusses){
	this.route = route;
	this.numBusses = numBusses;
};


function BusInfo(route, busInfo){
	this.route = route;
	this.x = busInfo.x;
	this.y = busInfo.y;
	this.from = busInfo.from;
	this.to = busInfo.to;
	this.routeText = "Unknown";
	if (this.from.length > 1 && this.to.length > 1)
	{
		this.routeText = "From " + this.from + " to " + this.to;
	}
};


var app = angular.module("myApp", ["ngResource"]);


app.controller("myController", [
	"$scope",
	"BusListing",
	"$http",
	"$interval",
	function($scope, BusListing, $http, $interval) {
		$scope.firstname = "Conchita";
		$scope.surname = "Best";
		$scope.busses = [1, 2, 3, 14];
		$scope.jsonthing = "nothing yet";
		$scope.routes = []
		$scope.bussesByRoute = {};
		var markers = [];


		$scope.ViewBus = function(bus) {
			map.panTo(new google.maps.LatLng(bus.x, bus.y));
			map.setZoom(16);
		};


		$scope.BusClicked = function(bus) {
			$scope.ViewBus(bus);
			$("#collapse" + bus.route).collapse(true);
		}


		$scope.UpdateBusses = function() { 
			BusListing.GetBusses().then(function(bussesByRoute) {
				$scope.jsonthing = "";
				$scope.routes = Object.keys(bussesByRoute);
				var oldBussesByRoute = $scope.bussesByRoute;
				$scope.bussesByRoute = bussesByRoute;
				$scope.CreateMarkers(bussesByRoute, oldBussesByRoute);
			});
		};


		function CreateMarker(bus) {
			var marker = new google.maps.Marker({
				position: new google.maps.LatLng(bus.x, bus.y),
				title: "Route " + bus.route.toString() + ", from " + bus.from + " to " + bus.to + ".",
				bus: bus
			});

			google.maps.event.addListener(marker, 'click', function() {
				$scope.BusClicked(marker.bus);
			});

			marker.setMap(map);

			return marker;
		}


		$scope.CreateMarkers = function(bussesByRoute, oldBussesByRoute) {
			for (var i = 0; i < markers.length; i++) {
				markers[i].setMap(null);
			}
			markers = [];

			console.log("Updatemap")
			var routeIDs = Object.keys(bussesByRoute);
			for (var i = 0; i < routeIDs.length; i++)
			{
				var routeID = routeIDs[i];
				var bussesOnRoute = bussesByRoute[routeID];
				for (var j = 0; j < bussesOnRoute.length; j++)
				{
					var bus = bussesOnRoute[j];
					markers.push(CreateMarker(bus));
				}
			}
		};


		var updateMapLoop;
		$scope.StartUpdatingMap = function() {
			// Don't start a new fight if we are already fighting
			if (angular.isDefined(updateMapLoop)) return;

			$scope.UpdateBusses();

			updateMapLoop = $interval(function() {
				$scope.UpdateBusses();
			}, 5000);
		};

		$scope.StopUpdatingMap = function() {
			if (angular.isDefined(updateMapLoop)) {
				$interval.cancel(updateMapLoop);
				updateMapLoop = undefined;
			}
		};

		$scope.$on('$destroy', function() {
			// Make sure that the interval nis destroyed too
			$scope.StopUpdatingMap();
		});

	}
]);


app.factory("BusListing", [
	"$http",
	function($http) {
		return {
			GetRoutes: function(data) {
				return $http.get("http://apis.is/bus/realtime", {}).then(
					function(response) {
						var results = response["data"]["results"];

						busses = [];

						for (var i=0; i < results.length; i++)
						{
							var result = results[i];
							var route = result["busNr"];
							var bussesOnRoute = result["busses"];
							busses.push(new RouteInfo(route, bussesOnRoute.length));
						}

						return busses;
					}
				);
			},


			GetBusses: function(data) {
				return $http.get("http://apis.is/bus/realtime", {}).then(
					function(response) {
						var results = response["data"]["results"];

						bussesByRoute = {};

						for (var i = 0; i < results.length; i++)
						{
							var result = results[i];
							var route = result["busNr"];
							var bussesOnRoute = result["busses"];

							bussesByRoute[route] = [];

							for (var j = 0; j < bussesOnRoute.length; j++)
							{
								bussesByRoute[route].push(new BusInfo(route, bussesOnRoute[j]));
							}
						}

						return bussesByRoute;
					}
				);
			}
		}
	}
]);

