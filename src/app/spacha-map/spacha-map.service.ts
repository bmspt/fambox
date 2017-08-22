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


@Injectable()
export class SpachaMapService {
  map:Map
  
  constructor(public db: AngularFireDatabase, private http:Http) {
    (mapboxgl as any).accessToken = environment.mapbox.accessToken
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

  search(address:string):Observable<Address[]> {
    // return this.http.get('api/addresses/search')
    return this.http
    .get(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&region=gb`)
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

  reverse(address:LngLat):Observable<Address> {
    // return this.http.get('api/addresses/reverse')
      return this.http
          .get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${address.latitude},${address.longitude}`)
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
