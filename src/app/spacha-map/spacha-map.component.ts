import { Component, OnInit } from '@angular/core'
import { Http } from "@angular/http"
import * as mapboxgl from "mapbox-gl"
import { Map, GeolocateControl, LngLat } from "mapbox-gl"
import { SpachaMapService } from "./spacha-map.service";
import { GeoJson, FeatureCollection, Address } from "../map";

import { Subject } from "rxjs/Subject";
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
    style: string  = 'mapbox://styles/mapbox/dark-v9'
    lat:number     = 0.0
    lng:number     = 0.0
    message:string = "Hello msg"

    // data
    source: any
    markers: any

    // Search
    private searchTerms:Subject<string> = new Subject<string>()
    searchResults:Observable<Address[]>
    pickupLocation:string = ''
    destinationLocation:string = ''
    pickupAddress:Address = null
    destinationAddress:Address = null

    constructor(private mapService:SpachaMapService, private http:Http) {}

    ngOnInit() {
        this.markers       = this.mapService.getMarkers()
        
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
        
        this.map = this.mapService.map = new Map({
            container: 'spacha-map',
            style: this.style,
            zoom: 13,
            center: [this.lng, this.lat]
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

        // Add realtime firebase data on map load
        this.map.on('load', (e) => {
            this.map.addControl(geolocateControl)
            
            // register the source
            this.map.addSource('firebase', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: []
                }
            })
            
            // create map layers with realtime data
            this.map.addLayer({
                id: 'firebase',
                source: 'firebase',
                type: 'symbol',
                layout: {
                    'text-field': '{message}',
                    'text-size': 24,
                    'text-transform': 'uppercase',
                    'icon-image': 'rocket-15',
                    'text-offset': [0, 1.5]
                },
                paint: {
                    'text-color': '#f16624',
                    'text-halo-color': '#fff',
                    'text-halo-width': 2
                }
            })

            // Add Marker on Click
            this.map.on('click', (event) => {
                const coordinates = [event.lngLat.lng, event.lngLat.lat]
                const newMarker = new GeoJson(coordinates, { message: this.message })
                this.mapService.createMarkers(newMarker)
            })
        
            // get source
            this.source = this.map.getSource('firebase')
            
            // subscribe to realtime database set and source
            this.markers.subscribe(marks => {
                let data = new FeatureCollection(marks)
                this.source.setData(data)
            })    
        }) // END Map.on('load', ...)

        geolocateControl.on('geolocate', (event) => {
            this.flyTo(new GeoJson([event.coords.longitude, event.coords.latitude], { message: 'You' }))
        })
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
            this.searchResults = Observable.of<Address[]>([])
        } else {
            this.pickupAddress = address
            this.pickupLocation = address.formattedAddress            
        }

        // const coordinates = [address.geocodes.longitude, address.geocodes.latitude]
        // const newMarker = new GeoJson(coordinates, { message: address.formattedAddress })
        // let data = new FeatureCollection(newMarker)
        // this.source.setData(data)
    }

    unsetAddress(address:Address):void {
        address = null
    }

    buttonState() {
        console.log('Reserve btn clicked')
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
