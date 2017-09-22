import { Component, OnInit } from '@angular/core'
import { Http } from "@angular/http"
import * as mapboxgl from "mapbox-gl"
import { Map, GeolocateControl, LngLat, LngLatBounds } from "mapbox-gl"
import { SpachaMapService } from "./spacha-map.service";
import { GeoJson, FeatureCollection, Address } from "../map";
import { EstimateService, Price, EstimateParams } from "../services/estimate.service";

import { Subject } from "rxjs/Subject";
// import { ReplaySubject } from "rxjs/ReplaySubject";
import { Observable } from "rxjs/Observable";

// Observable class extension
import 'rxjs/add/observable/of'

// Observable operators
import 'rxjs/add/operator/catch'
import 'rxjs/add/operator/switchMap'
import 'rxjs/add/operator/debounceTime'
import 'rxjs/add/operator/distinctUntilChanged'


@Component({
  selector: 'app-spacha-map',
  templateUrl: './spacha-map.component.html',
  styleUrls: ['./spacha-map.component.css']
})
export class SpachaMapComponent implements OnInit {

    // default settings
    map: Map
    lat:number = 0.0
    lng:number = 0.0
    message:string = "Hello msg"

    // data
    vehiclesLocations: any
    directions: any
    markers: any
    private estimateParams:EstimateParams = null

    // Search
    private searchTerms:Subject<string> = new Subject<string>()
    searchResults:Observable<Address[]>
    prices:Observable<Price[]>
    pickupLocation:string = ''
    destinationLocation:string = ''
    pickupAddress:Address = null
    destinationAddress:Address = null

    constructor(private mapService:SpachaMapService, private estimateService:EstimateService, private http:Http) {}

    ngOnInit() {
        this.markers = this.mapService.getMarkers()
        
        this.initializeMap()
        this.searchResults = this.searchTerms
            .debounceTime(300)
            .distinctUntilChanged()
            .switchMap(term => term
                ? this.mapService.search(term)
                : Observable.of<Address[]>([])
            )
            .catch(error => {
                console.log(error)
                return Observable.of<Address[]>([])
            })
        
    }

    initializeMap() {
        // locate the visitor
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                this.lat = position.coords.latitude
                this.lng = position.coords.longitude
                this.map.flyTo({
                    center: [this.lng, this.lat]
                })
            })
        }

        this.map = new mapboxgl.Map({
            container: 'spacha-map',
            zoom: 13,
            center: [this.lng, this.lat],
            style: 'mapbox://styles/mapbox/dark-v9'
            // style: 'mapbox://styles/mapbox/navigation-preview-night-v2'
        })

        this.buildMap()    
    }

    buildMap() {
        // Add map controls
        // this.map.addControl(new mapboxgl.control())
        let geolocateControl = new GeolocateControl({
            positionOptions: { enableHighAccuracy: true },
            watchPosition: false
        })

        // Add Marker on Click
        this.map.on('click', (event) => {
            const coordinates = [event.lngLat.lng, event.lngLat.lat]
            const newMarker = new GeoJson(coordinates, { message: this.message })
            this.mapService.createMarkers(newMarker)
        }) 

        // Add realtime vehicles from firebase data on map load
        this.map.on('load', (e) => {
            this.map.addControl(geolocateControl)
            
            // register the source
            this.map.addSource('vehicles', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: []
                }
            })

            this.map.addSource('directions', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: []
                }
            })
            
            // create map layers with realtime data
            this.map.addLayer({
                id: 'vehicles',
                source: 'vehicles',
                type: 'symbol',
                layout: {
                    // 'text-field': '{message}',
                    // 'text-size': 12,
                    // 'text-transform': 'uppercase',
                    'icon-image': 'car-15'
                    // 'icon-image': '{icon}-15'
                    // 'text-offset': [0, 1.5]
                },
                paint: {
                    'text-color': '#f404b8',
                    // 'text-halo-color': '#fff',
                    // 'icon-halo-color': '#f404b8',
                    'text-halo-width': 2
                }
            })

            // get source
            this.vehiclesLocations = this.map.getSource('vehicles')
            
            // subscribe to realtime database set and source
            this.markers.subscribe(markers => {
                let data = new FeatureCollection(markers)
                this.vehiclesLocations.setData(data)
            })

            this.map.addLayer({
                id: 'directions',
                source: 'directions',
                type: 'line',
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                paint: {
                    'line-color': '#f404b8',
                    'line-width': 4
                }
            })

            // get source
            this.directions = this.map.getSource('directions')

            geolocateControl.on('geolocate', (event) => {
                this.flyTo(new GeoJson([event.coords.longitude, event.coords.latitude], { message: 'You' }))
                this.populatePickupLocation([event.coords.longitude, event.coords.latitude])
            })
        }) // END Map.on('load', ...)
    }

    // Helpers
    removeMarker(marker) {
        this.mapService.removeMarker(marker.$key)
    }

    flyTo(data:GeoJson) {
        this.map.flyTo({
            center: data.geometry.coordinates,
            zoom: 13
        })
    }

    // Search implementation
    search(term:string) {
        if (term.length >= 3) this.searchTerms.next(term)
    }

    setAddress(address:Address):void {
        if (this.pickupAddress) {
            this.destinationAddress = address
            this.destinationLocation = address.formattedAddress
        } else {
            this.pickupAddress = address
            this.pickupLocation = address.formattedAddress            
        }

        this.searchTerms.next() 

        if (this.pickupAddress && this.destinationAddress) {
            this.getPrices()
            this.getDirections()        
        }
        // const coordinates = [address.geocodes.longitude, address.geocodes.latitude]
        // const newMarker = new GeoJson(coordinates, { message: address.formattedAddress })
        // let data = new FeatureCollection(newMarker)
        // this.vehiclesLocations.setData(data)
    }

    resetFields():void {
        this.pickupAddress = this.destinationAddress = null
        this.pickupLocation = this.destinationLocation = ''
        this.prices = Observable.of<Price[]>([])
        this.searchTerms.next()
    }

    showModal():void {
        document.getElementById('appStoreModal').classList.toggle('is-active')
    }

    private populatePickupLocation(coordinates:[number]):void {
        let coords = { longitude:coordinates[0], latitude:coordinates[1] }
        this.mapService.reverse([coords.longitude, coords.latitude])
        .subscribe(a => {
            this.pickupAddress = a
            this.pickupLocation = a.formattedAddress
        })
    }

    private getPrices():void {
        
        this.estimateParams = {
            start_latitude:  this.pickupAddress.geocodes.latitude,
            start_longitude: this.pickupAddress.geocodes.longitude,
            end_latitude:    this.destinationAddress.geocodes.latitude,
            end_longitude:   this.destinationAddress.geocodes.longitude
        }

        this.prices = this.estimateService.estimate(this.estimateParams)
    }

    private getDirections():void {
        let coordinates:string = `${this.estimateParams.start_longitude},${this.estimateParams.start_latitude};${this.estimateParams.end_longitude},${this.estimateParams.end_latitude}`
        this.mapService.getDirections(coordinates).subscribe( directions => {
            this.showRoute(directions)
        })
    }

    private showRoute(directions:any[]):void {
        let data = new FeatureCollection(directions)
        this.directions.setData(data)

        let coordinates = directions[0].geometry.coordinates
        let bounds = coordinates.reduce((bound, coord) => {
            return bound.extend(coord)
        }, new LngLatBounds(coordinates[0], coordinates[1]))

        this.map.fitBounds(bounds, { padding: 60 })
    }
}

// interface IRide {
//   pickupAddress: IAddress
//   destinationAddress: IAddress
//   price: IPrice
// }

// interface IPrice {
//   name: string
//   amount: string
//   eta: string
// }

// interface IAddress {
//   formattedName: string
//   latitude: number
//   longitude: number
// }

// class Ride implements IRide {
//   pickupAddress:IAddress
//   destinationAddress:IAddress
//   price:IPrice
// }

// let ride:Ride           = new Ride()
// ride.pickupAddress      = { formattedName: 'iewugefdsvsd', latitude: 12345, longitude: -0.1234565778 }
// ride.destinationAddress = { formattedName: 'iewugefdsvsd', latitude: 12345, longitude: -0.1234565778 }
// ride.price              = { name: 'iewugefdsvsd', amount: '12345', eta: '1234565778' }