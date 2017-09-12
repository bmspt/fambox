import { Component, OnInit } from '@angular/core'
import { Http } from "@angular/http"
import * as mapboxgl from "mapbox-gl"
import { Map, GeolocateControl, LngLat } from "mapbox-gl"
import { SpachaMapService } from "./spacha-map.service";
import { GeoJson, FeatureCollection, Address } from "../map";

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
                    'text-size': 12,
                    'text-transform': 'uppercase',
                    'icon-image': 'car-15',
                    'text-offset': [0, 1.5]
                },
                paint: {
                    'text-color': '#f404b8',
                    // 'text-halo-color': '#fff',
                    // 'icon-halo-color': '#f404b8',
                    'text-halo-width': 2
                }
            })

            // get source
            this.source = this.map.getSource('firebase')
            
            // subscribe to realtime database set and source
            this.markers.subscribe(markers => {
                let data = new FeatureCollection(markers)
                this.source.setData(data)
            })

            geolocateControl.on('geolocate', (event) => {
                this.flyTo(new GeoJson([event.coords.longitude, event.coords.latitude], { message: 'You' }))
                this.populateUserLocation([event.coords.longitude, event.coords.latitude])
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
        // const coordinates = [address.geocodes.longitude, address.geocodes.latitude]
        // const newMarker = new GeoJson(coordinates, { message: address.formattedAddress })
        // let data = new FeatureCollection(newMarker)
        // this.source.setData(data)
    }

    Search(address:string, type?:string) {
        // type == 'pickup' ? this.editingPickup = true : this.editingPickup = false
    }

    unsetAddress(address:string):void {
        this.pickupAddress = null
        this.pickupLocation = null            
            // console.log(address, 'address was clicked');
        
    }

    buttonState() {
        console.log('Reserve btn clicked')
    }

    private populateUserLocation(coordinates:[number]):void {
        let coords = { longitude:coordinates[0], latitude:coordinates[1] }
        this.mapService.reverse([coords.longitude, coords.latitude])
        .subscribe(a => {
            this.pickupAddress = a
            this.pickupLocation = a.formattedAddress
        })
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
