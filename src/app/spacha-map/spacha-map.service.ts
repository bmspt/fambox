import { Injectable }   from '@angular/core'
import { Http }         from '@angular/http'
import { environment }  from "../../environments/environment"
import { 
  AngularFireDatabase, 
  FirebaseListObservable
} from "angularfire2/database"

import { GeoJson, Address } from "../map"
import * as mapboxgl    from "mapbox-gl"
import { Map, Marker, LngLat }  from "mapbox-gl"

import { Observable } from "rxjs/Observable"
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/toPromise'


@Injectable()
export class SpachaMapService {
    map:Map
    // directions:MapboxDirections

    constructor(public db: AngularFireDatabase, private http:Http) {
        (mapboxgl as any).accessToken = environment.mapbox.accessToken

        // this.directions = new mapboxgl.Directions({
        //     // accessToken: mapboxgl.accessToken,
        //     unit: 'metric',
        //     profile: 'mapbox/driving-traffic'
        //     // , proximity: [lng, lat]
        // })
    }

    getMarkers(): FirebaseListObservable<any> {
        return this.db.list('/markers')
    }

    createMarkers(data:GeoJson) {
        return this.db.list('/markers')
                    .push(data)
    }
  
    removeMarker($key:string) {
        return this.db.object('/markers/' + $key).remove()
    }

    getDirections(geocodes:string):Observable<any> {
        // Semicolon-separated list of {longitude},{latitude};{longitude},{latitude} coordinate pairs
        let directionsUrl:string = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/`
        let options              = `geometries=geojson&overview=full&access_token=${mapboxgl.accessToken}`
        return this.http.get(`${ directionsUrl }${geocodes}?${options}`)
                        .map(directions => directions.json().routes)
    }


    search(address:string):Observable<Address[]> {
        // return this.http.get('api/addresses/search')
        return this.http
        .get(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&components=country:GB`)
        .map(res => res.json().results)
        .map(results => {
            let addresses: Address[] = []
            
            for (var i = 0; i < results.length; i++) {
                let address = new Address()
                let found = results[i]

                address.formattedAddress = found.formatted_address,
                address.geocodes = {
                    latitude: found.geometry.location.lat, 
                    longitude: found.geometry.location.lng 
                } // location: {lat: 42.5641201, lng: -71.0239323}
                // address.geocodes.longitude = found.geometry.location.lng // location: {lat: 42.5641201, lng: -71.0239323}
                addresses.push(address)
            }
            return addresses
        })
    }

    reverse(address:[number]):Observable<Address> {
        // address:LngLat ====> address.toArray()
        // return this.http.get('api/addresses/reverse')
        
        return this.http
            .get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${address[1]},${address[0]}`)
            .map(res => res.json().results)
            .map(results => {
                let address = new Address()
                let found = results[0]

                address.formattedAddress = found.formatted_address,
                address.geocodes = {
                    latitude: found.geometry.location.lat, 
                    longitude: found.geometry.location.lng 
                } 
                return address
            })
    }
  
}
